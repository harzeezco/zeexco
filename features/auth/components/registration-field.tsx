import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegistrationField({ label, error, ...inputProps }: ComponentProps<typeof Input> & { label: string; error?: string }) {
  const errorId = `${inputProps.id}-error`;
  return (
    <div className="grid gap-2">
      <Label htmlFor={inputProps.id} className="text-sm font-semibold text-[#40251b]">{label}</Label>
      <Input {...inputProps} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} className="h-12 border-[#d8c4b8] bg-white text-base text-[#2a1710] placeholder:text-[#9b8175]" />
      {error ? <p id={errorId} className="m-0 text-sm text-[#b42318]">{error}</p> : null}
    </div>
  );
}
