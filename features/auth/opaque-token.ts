export function singleOpaqueToken(value?: string | string[]): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
