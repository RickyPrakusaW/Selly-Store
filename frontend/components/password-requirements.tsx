"use client";

import { CircleCheck, CircleX } from "lucide-react";

export const passwordRules = [
  { key: "length", label: "Minimal 10 karakter", test: (value: string) => value.length >= 10 },
  { key: "uppercase", label: "Mengandung huruf kapital (A–Z)", test: (value: string) => /[A-Z]/.test(value) },
  { key: "lowercase", label: "Mengandung huruf kecil (a–z)", test: (value: string) => /[a-z]/.test(value) },
  { key: "number", label: "Mengandung angka (0–9)", test: (value: string) => /\d/.test(value) },
  { key: "symbol", label: "Mengandung simbol, contoh !@#$%", test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
] as const;

export function isStrongPassword(password: string): boolean {
  return passwordRules.every((rule) => rule.test(password));
}

export function PasswordRequirements({
  password,
  confirmPassword,
}: Readonly<{ password: string; confirmPassword?: string }>) {
  return (
    <div className="password-requirements" aria-live="polite" aria-label="Syarat password">
      <strong>Password harus memenuhi:</strong>
      <ul>
        {passwordRules.map((rule) => {
          const passed = rule.test(password);
          return (
            <li key={rule.key} className={passed ? "passed" : "missing"}>
              {passed ? <CircleCheck size={15} aria-hidden="true" /> : <CircleX size={15} aria-hidden="true" />}
              <span>{rule.label}</span>
            </li>
          );
        })}
        {confirmPassword !== undefined && (
          <li className={confirmPassword.length > 0 && password === confirmPassword ? "passed" : "missing"}>
            {confirmPassword.length > 0 && password === confirmPassword ? (
              <CircleCheck size={15} aria-hidden="true" />
            ) : (
              <CircleX size={15} aria-hidden="true" />
            )}
            <span>Konfirmasi password sama</span>
          </li>
        )}
      </ul>
    </div>
  );
}
