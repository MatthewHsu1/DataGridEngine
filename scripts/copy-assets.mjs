// tsup emits JS and types; the stylesheet is a plain file that just needs to
// land beside them, because `exports["./datagrid.css"]` points into dist/.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });
copyFileSync("src/datagrid.css", "dist/datagrid.css");

console.log("copied src/datagrid.css -> dist/datagrid.css");
