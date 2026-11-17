import Link from "next/link";

export function RegistrationTerms() {
  return (
    <p className="mt-5 text-xs leading-5 text-[#69778e]">
      By creating an account, you agree to Zico&apos;s{" "}
      <Link href="/terms" className="font-medium text-[#1f5bd8]">
        Terms
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="font-medium text-[#1f5bd8]">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
