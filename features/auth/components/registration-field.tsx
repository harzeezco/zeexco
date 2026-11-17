import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function RegistrationField({ label, error, helperText, trailing, className, ...inputProps }: ComponentProps<typeof Input> & { label: string; error?: string; helperText?: string; trailing?: ReactNode }) {
  const errorId = `${inputProps.id}-error`;
  const helpId = `${inputProps.id}-help`;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={inputProps.id} className="text-xs font-semibold text-[#14233d]">{label}</Label>
      <div className="relative">
        <Input {...inputProps} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : helperText ? helpId : undefined} className={cn("h-11 rounded-md border-[#9aabc3] bg-white px-3 text-sm text-[#14233d] shadow-none placeholder:text-[#74839a] focus-visible:border-[#1f5bd8] focus-visible:ring-[#1f5bd8]/15", trailing && "pr-16", className)} />
        {trailing ? <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div> : null}
      </div>
      {error ? <p id={errorId} className="m-0 text-xs text-[#b42318]">{error}</p> : helperText ? <p id={helpId} className="m-0 text-xs text-[#64748b]">{helperText}</p> : null}
    </div>
  );
}
