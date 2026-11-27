import { z } from "zod";

const requiredName = (label: string, max: number) =>
  z
    .string()
    .transform((value) => value.trim().replace(/\s+/gu, " "))
    .pipe(
      z
        .string()
        .min(1, label + " is required")
        .refine(
          (value) => Array.from(value).length <= max,
          label + " must be at most " + max + " characters",
        ),
    );

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .refine(
    (value) => Array.from(value).length >= 8,
    "Password must be at least 8 characters",
  )
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Password must be at most 72 UTF-8 bytes",
  )
  .refine(
    (value) => /\p{L}/u.test(value),
    "Password must contain at least one letter",
  )
  .refine(
    (value) => /\p{Nd}/u.test(value),
    "Password must contain at least one number",
  )
  .refine(
    (value) => /[\p{P}\p{S}]/u.test(value),
    "Password must contain at least one symbol",
  );

export const webRegistrationSchema = z.object({
  first_name: requiredName("First name", 100),
  last_name: requiredName("Last name", 100),
  business_name: requiredName("Business name", 200),
  email: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(
      z
        .string()
        .refine(
          (value) => !value || z.string().email().safeParse(value).success,
          "Please enter a valid email address",
        )
        .refine(
          (value) => new TextEncoder().encode(value).length <= 255,
          "Email must be at most 255 bytes",
        ),
    ),
});
export const whatsappRegistrationSchema = webRegistrationSchema;
export type WebRegistrationFormData = z.infer<typeof webRegistrationSchema>;
export type RegistrationFormData = WebRegistrationFormData;
export type WhatsAppRegistrationFormData = WebRegistrationFormData;
