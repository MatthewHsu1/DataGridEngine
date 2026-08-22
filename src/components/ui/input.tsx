import { forwardRef, type InputHTMLAttributes } from "react";
import { cx } from "../../lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input ref={ref} type={type} className={cx("dg-input", className)} {...props} />
  ),
);
Input.displayName = "Input";
