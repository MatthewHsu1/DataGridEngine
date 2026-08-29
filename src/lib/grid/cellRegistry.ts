import {
  GridCellKind,
  type CustomCell,
  type CustomRenderer,
  type GridCell,
} from "@glideapps/glide-data-grid";
import { dateCellDef } from "./dateCell";
import { enumCellDef } from "./enumCell";
import { glideCellDefs } from "./glideCells";
import { numberCellDef } from "./numberCell";
import { phoneCellDef } from "./phoneCell";
import { textCellDef } from "./textCell";

/**
 * What a cell maker knows about the column it is drawing, beyond the raw value.
 *
 * `options` is the column's own `options` object, typed `unknown` because only
 * the cell type it belongs to knows its shape. A built-in cell casts it to its
 * own options interface; a custom cell casts it to whatever that cell defined.
 */
export interface CellContext {
  editable: boolean;
  options: unknown;
}

/**
 * One cell type. `type` keys the column→cell dispatch; `kind` (for custom cells)
 * is the runtime `cell.data.kind` used to route validation. A def wrapping one
 * of glide's own kinds omits `kind`, `renderer`, and `validate`.
 */
export interface CellTypeDef {
  type: string;
  kind?: string;
  make: (raw: unknown, ctx: CellContext) => GridCell;
  renderer?: CustomRenderer;
  validate?: (cell: CustomCell<{ kind: string }>) => boolean;
}

export interface CellRegistry {
  makeCell: (type: string, raw: unknown, ctx: CellContext) => GridCell;
  customRenderers: CustomRenderer[];
  validateCell: (cell: GridCell) => boolean;
}

/**
 * Every cell type a grid understands without being told: the five this package
 * draws, prefixed `dg:`, plus glide's own kinds under glide's own names.
 */
export const builtinCellDefs: CellTypeDef[] = [
  textCellDef,
  numberCellDef,
  dateCellDef,
  enumCellDef,
  phoneCellDef,
  ...glideCellDefs,
];

/**
 * Build a registry from cell-type defs. Derives the three things a grid needs
 * from one source of truth: a type→maker dispatch, the custom-renderer list, and
 * a kind→validator router.
 */
export function createCellRegistry(defs: CellTypeDef[]): CellRegistry {
  const byType = new Map(defs.map((d) => [d.type, d]));
  const validators = new Map<string, NonNullable<CellTypeDef["validate"]>>();

  for (const d of defs) {
    if (d.kind && d.validate) {
      validators.set(d.kind, d.validate);
    }
  }

  return {
    makeCell(type, raw, ctx) {
      const def = byType.get(type);

      if (!def) {
        throw new Error(`Unknown cell type "${type}"`);
      }

      return def.make(raw, ctx);
    },

    customRenderers: defs
      .map((d) => d.renderer)
      .filter((r): r is CustomRenderer => r !== undefined),

    validateCell(cell) {
      if (cell.kind !== GridCellKind.Custom) {
        return true;
      }

      const data = (cell as CustomCell<{ kind: string }>).data;
      const v = validators.get(data.kind);

      return v ? v(cell as CustomCell<{ kind: string }>) : true;
    },
  };
}

/**
 * The registry one grid runs on: the built-ins, with the descriptor's own cell
 * types laid over them.
 *
 * A host def whose `type` matches a built-in WINS. That is deliberate and is the
 * only way a host can change how, say, `dg:date` draws without forking the
 * package — and it is the same order the rest of the engine reads in: the
 * consumer's answer beats ours, ours beats glide's default.
 */
export function resolveCellRegistry(custom: readonly CellTypeDef[] = []): CellRegistry {
  const byType = new Map<string, CellTypeDef>();

  for (const def of builtinCellDefs) byType.set(def.type, def);
  for (const def of custom) byType.set(def.type, def);

  return createCellRegistry([...byType.values()]);
}
