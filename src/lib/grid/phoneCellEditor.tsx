import { Text, Theme } from "@radix-ui/themes";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { gridRadixTheme } from "../../theme/radixTheme";
import type { EditorProps } from "./createCustomCell";
import { DEFAULT_PHONE_COUNTRY } from "../phone/phoneUtils";
import type { PhoneCellData } from "./phoneCell";

/**
 * The overlay editor for a `dg:phone` cell.
 *
 * Its own file so `phoneCell.tsx` exports no component.
 */
export const PhoneCellEditor = ({ value, onChange, isValid }: EditorProps<PhoneCellData>) => {
  const handleChange = (next?: string) => {
    // PhoneInput emits E.164 (or undefined when cleared). Live-sync to glide;
    // glide commits this value on overlay close, gated by validateCell.
    onChange({ ...value, value: next ?? null });
  };

  const invalid = isValid === false;

  return (
    <Theme {...gridRadixTheme()}>
      <div style={{ padding: 8, minWidth: 240 }}>
        <div
          style={{
            border: `1px solid ${invalid ? "var(--red-9)" : "transparent"}`,
            borderRadius: 6,
            padding: 4,
          }}
        >
          <PhoneInput
            defaultCountry={value.options.defaultCountry ?? DEFAULT_PHONE_COUNTRY}
            international
            value={value.value ?? undefined}
            onChange={handleChange}
            autoFocus
          />
        </div>
        {invalid && (
          <Text size="1" color="red" style={{ display: "block", marginTop: 4 }}>
            Invalid phone number
          </Text>
        )}
      </div>
    </Theme>
  );
};
