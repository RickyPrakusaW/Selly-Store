"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyVoucherButton({ code }: Readonly<{ code: string }>) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" onClick={copyCode} aria-live="polite">
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "Tersalin" : "Salin kode"}
    </button>
  );
}
