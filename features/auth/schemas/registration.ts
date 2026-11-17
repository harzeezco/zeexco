import { z } from "zod";

const requiredName = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

export const passwordSchema = z.string()
  .min(1, "Password is required")
  .refine((value) => Array.from(value).length >= 8, "Password must be at least 8 characters")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "Password must be at most 72 UTF-8 bytes")
  .refine((value) => /\p{L}/u.test(value), "Password must contain at least one letter")
  .refine((value) => /\p{Nd}/u.test(value), "Password must contain at least one number")
  .refine((value) => /[\p{P}\p{S}]/u.test(value), "Password must contain at least one symbol");

export const webRegistrationSchema = z.object({
  first_name: requiredName("First name").max(100, "First name must be at most 100 characters"),
  last_name: requiredName("Last name").max(100, "Last name must be at most 100 characters"),
  business_name: requiredName("Business name").max(200, "Business name must be at most 200 characters"),
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address").max(255),
  password: passwordSchema,
});

export const whatsappRegistrationSchema = z.object({
  first_name: requiredName("First name").max(100, "First name must be at most 100 characters"),
  last_name: requiredName("Last name").max(100, "Last name must be at most 100 characters"),
  business_name: requiredName("Business name").max(200, "Business name must be at most 200 characters"),
  email: z.string().trim().refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    "Please enter a valid email address",
  ).refine((value) => value.length <= 255, "Email must be at most 255 characters"),
});

export type WebRegistrationFormData = z.infer<typeof webRegistrationSchema>;
export type WhatsAppRegistrationFormData = z.infer<typeof whatsappRegistrationSchema>;
