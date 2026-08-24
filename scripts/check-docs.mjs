/**
 * Typechecks every ```ts / ```tsx block in the docs against the real package.
 *
 * The markdown is the SOURCE OF TRUTH — there is no second copy of these
 * examples to drift from. Each block is written to its own module beside
 * `docs/examples/shared.ts` (so a block's `./shared` import resolves exactly as
 * it reads), then `tsc` runs over the whole set in one pass.
 *
 * Blocks are separate modules on purpose: two blocks may both declare
 * `orderGrid` without colliding, which is what lets each one stand alone.
 *
 * Opt a block out with an info string of `ts no-check` — for a snippet that is
 * deliberately illustrative rather than complete.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLES_DIR = join(ROOT, "docs", "examples");
const DOCS = [join(ROOT, "docs", "examples", "configuration.md")];

/** A fenced block plus the 1-based line its fence opens on, for the error map. */
function extractBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split("\n");

  let open = null;

  for (let i = 0; i < lines.length; i += 1) {
    const fence = /^```(.*)$/.exec(lines[i]);
    if (!fence) continue;

    if (open) {
      const info = open.info.trim().split(/\s+/);
      const lang = info[0];
      if ((lang === "ts" || lang === "tsx") && !info.includes("no-check")) {
        blocks.push({ lang, line: open.line, code: lines.slice(open.line, i).join("\n") });
      }
      open = null;
      continue;
    }

    // A fence with no info string closes; one with an info string opens.
    open = { info: fence[1], line: i + 1 };
  }

  return blocks;
}

const written = [];
let failed = false;
const origin = new Map();

// Written INTO docs/examples so `./shared` resolves the way the block reads it.
// The `.check-` prefix is gitignored.
const stamp = basename(mkdtempSync(join(EXAMPLES_DIR, ".check-")));
const tmpDir = join(EXAMPLES_DIR, stamp);

try {
  for (const doc of DOCS) {
    const markdown = readFileSync(doc, "utf8");
    const blocks = extractBlocks(markdown);

    blocks.forEach((block, index) => {
      const name = `block-${String(index + 1).padStart(2, "0")}.${block.lang}`;
      const file = join(tmpDir, name);
      // `./shared` from one directory deeper is `../shared`.
      writeFileSync(file, block.code.replaceAll('from "./shared"', 'from "../shared"'));
      written.push(file);
      origin.set(join(stamp, name), { doc: relative(ROOT, doc), fence: block.line });
    });
  }

  if (written.length === 0) {
    // `process.exitCode`, never `process.exit()`: the latter terminates before
    // the `finally` below runs, which would leak the scratch directory.
    console.error("check-docs: no ts blocks found — the extractor is broken, not the docs.");
    process.exitCode = 1;
    failed = true;
  }

  if (!failed) {
    // `tsc --project` refuses source files on the same command line, so the file
    // set is handed over as a generated project that extends the real one.
    const projectFile = join(ROOT, `tsconfig.${stamp}.json`);
    writeFileSync(
      projectFile,
      JSON.stringify(
        {
          extends: "./tsconfig.json",
          compilerOptions: { noEmit: true, tsBuildInfoFile: null },
          // `files`, not `include`: TypeScript's include globs skip any
          // dot-prefixed directory, and the scratch dir is one.
          files: [...written.map((f) => relative(ROOT, f)), "docs/examples/shared.ts"],
        },
        null,
        2,
      ),
    );

    try {
      execFileSync("npx", ["tsc", "--noEmit", "--project", projectFile], {
        cwd: ROOT,
        stdio: "pipe",
        encoding: "utf8",
      });
    } catch (error) {
      const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
      // Rewrite every temp-file coordinate into the markdown line it came from,
      // so the failure names a place the reader can actually open. The block's
      // own line 1 sits one line below its opening fence.
      let mapped = output;
      for (const [tmpName, { doc, fence }] of origin) {
        const path = join("docs", "examples", tmpName).replaceAll("\\", "\\\\");
        const pattern = new RegExp(
          `${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\((\\d+),(\\d+)\\)`,
          "g",
        );
        mapped = mapped.replaceAll(
          pattern,
          (_m, line, col) => `${doc}:${fence + Number(line)}:${col}`,
        );
      }
      console.error(mapped.trim());
      console.error(`\ncheck-docs: ${written.length} block(s) — FAILED`);
      process.exitCode = 1;
      failed = true;
    } finally {
      rmSync(projectFile, { force: true });
    }
  }

  if (!failed) {
    console.log(`check-docs: ${written.length} block(s) typechecked`);
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
