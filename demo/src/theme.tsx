import { Theme } from "@radix-ui/themes";
import { useEffect, type ReactNode } from "react";
import { useSelector } from "react-redux";
import { DEMO_ACCENT } from "./appearance";
import type { RootState } from "./store";

/**
 * Radix Themes root for the demo. The grid's cell popups portal out of this
 * tree and mount their own <Theme>, which is why `configureGridTheme` in
 * main.tsx has to be told the same accent.
 */
export function DemoTheme({ children }: { children: ReactNode }) {
  const appearance = useSelector((s: RootState) => s.appearance.appearance);

  useEffect(() => {
    document.documentElement.style.colorScheme = appearance;
  }, [appearance]);

  return (
    <Theme appearance={appearance} accentColor={DEMO_ACCENT} grayColor="slate" radius="medium">
      {children}
    </Theme>
  );
}
