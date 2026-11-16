import Link from "next/link";

export function AccountSwitch({ page }: { page: "register" | "login" }) {
  const registering = page === "register";
  return (
    <nav aria-label="Account access" className="mb-8 flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1 text-sm leading-6 text-[#69778e]">
      <span>{registering ? "Already have an account?" : "New to Zico?"}</span>
      <Link href={registering ? "/login" : "/register"} className="rounded-sm font-semibold text-[#1f5bd8] underline decoration-transparent underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1f5bd8]">
        {registering ? "Log in" : "Create an account"}
      </Link>
    </nav>
  );
}
