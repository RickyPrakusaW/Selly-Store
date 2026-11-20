"use client";

import PhoneInput, { type Value } from "react-phone-number-input";
import { normalizeWhatsAppNumber } from "@/lib/phone-number";

type PhoneNumberFieldProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
  autoComplete?: string;
  inputClassName?: string;
}>;

function toInternationalValue(value: string): Value {
  const normalized = normalizeWhatsAppNumber(value);
  return normalized ? (`+${normalized}` as Value) : ("" as Value);
}

export function PhoneNumberField({
  value,
  onChange,
  id,
  required,
  autoComplete = "tel",
  inputClassName,
}: PhoneNumberFieldProps) {
  return (
    <PhoneInput
      id={id}
      className="phone-number-field"
      defaultCountry="ID"
      international
      countryCallingCodeEditable={false}
      limitMaxLength
      value={toInternationalValue(value)}
      onChange={(nextValue) =>
        onChange(normalizeWhatsAppNumber(nextValue ?? ""))
      }
      numberInputProps={{
        required,
        autoComplete,
        className: inputClassName,
      }}
    />
  );
}

