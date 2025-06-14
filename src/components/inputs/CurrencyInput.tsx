
import React from "react";
import { Input } from "@/components/ui/input";

// Simple INR currency formatting using built-in Intl
const formatINR = (value: string) => {
  const num = Number(value.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return "";
  return num.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
};

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...rest }, ref) => {
    return (
      <Input
        ref={ref}
        inputMode="decimal"
        value={value}
        onChange={onChange}
        {...rest}
        // Show "₹ 0.00" if empty for clarity
        placeholder="₹ 0.00"
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
