import { Theme } from "@radix-ui/themes";
import { NumericInput } from "../../components/ui/numericInput";
import { gridRadixTheme } from "../../theme/radixTheme";
import type { EditorProps } from "./createCustomCell";
import type { NumberCellData } from "./numberCell";

/**
 * The overlay editor for a `dg:number` cell.
 *
 * Its own file so `numberCell.tsx` exports no component. The format and the
 * range come off `value.options`, so one editor serves every number column.
 */
export const NumberCellEditor = ({ value, onChange }: EditorProps<NumberCellData>) => (
  <Theme {...gridRadixTheme()}>
    <div style={{ padding: 8, minWidth: 200 }}>
      <NumericInput
        {...value.options}
        value={value.value}
        onChange={(next) => onChange({ ...value, value: next })}
        autoFocus
      />
    </div>
  </Theme>
);
