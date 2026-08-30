import { Text, Theme } from "@radix-ui/themes";
import { Input } from "../../components/ui/input";
import { gridRadixTheme } from "../../theme/radixTheme";
import { validateText } from "../text/textValidation";
import type { EditorProps } from "./createCustomCell";
import type { TextCellData } from "./textCell";

/**
 * The overlay editor for a `dg:text` cell.
 *
 * Its own file so `textCell.tsx` exports no component: a module that mixes a
 * component with plain exports cannot be hot-reloaded on its own.
 *
 * It reads the column's rules off `value.options`, not off a closure, which is
 * why one editor serves every text column in the app.
 */
export const TextCellEditor = ({ value, onChange, isValid }: EditorProps<TextCellData>) => {
  const text = value.value ?? "";
  const options = value.options;

  const result = validateText(text, options);
  const error = result.valid ? null : result.error;

  const invalid = isValid === false;

  return (
    <Theme {...gridRadixTheme()}>
      <div style={{ padding: 8, minWidth: 240 }}>
        <Input
          value={text}
          maxLength={options.maxLength}
          onChange={(e) =>
            onChange({ ...value, value: e.target.value === "" ? null : e.target.value })
          }
          autoFocus
          style={invalid ? { borderColor: "var(--red-9)" } : undefined}
        />
        {invalid && error && (
          <Text size="1" color="red" style={{ display: "block", marginTop: 4 }}>
            {error}
          </Text>
        )}
      </div>
    </Theme>
  );
};
