import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

const benefits = [
  ["Keep customer conversations organized", "Stay on top of enquiries and follow-ups."],
  ["Spend less time on repetitive work", "Keep everyday tasks simple and organized."],
  ["See what is happening in your business", "Get useful sales and customer insights."],
] as const;

export function WebRegistrationLayout({ children }: { children: ReactNode }) {
  
  return (
    <main className="registration-page min-h-dvh bg-[#e8e8e8] p-0 text-[#14233d] lg:grid ">
      <div className="registration-shell grid min-h-svh w-full overflow-hidden bg-white shadow-[0_24px_80px_rgba(29,43,67,0.08)]">
        <aside className="relative hidden overflow-hidden bg-[#eaf4fc] bg-[url('/register-abstract.png')] bg-cover bg-center lg:flex lg:flex-col lg:px-14 lg:py-2">
          <Link href="/" aria-label="Zico home">
            <Image src="/zico_logo.svg" alt="Zico" className="size-28" width={112} height={78} priority />
          </Link>
          <div className="relative z-10 max-w-[360px] mt-14">
            <p className="mb-5 text-[11px] font-bold tracking-[0.14em] text-[#1f5bd8] uppercase">Built for everyday sellers</p>
            <h2 className="m-0 max-w-[330px] text-[38px] leading-[1.08] font-bold tracking-[-0.035em] text-[#14233d]">Less busywork.<br />More time for<br />your business.</h2>
            <p className="mt-5 max-w-[340px] text-sm leading-6 text-[#61708a]">Organize your products, follow up with customers and keep track of sales — all in one place.</p>
          </div>
          <ul className="registration-benefits relative z-10 mt-14 grid list-none gap-5 p-0">
            {benefits.map(([title, description]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[#1f5bd8]"><Check className="size-3" strokeWidth={3} /></span>
                <span><strong className="block text-xs leading-5 text-[#1d2c46]">{title}</strong><span className="block text-xs leading-5 text-[#68778f]">{description}</span></span>
              </li>
            ))}
          </ul>
        </aside>
        <section className="registration-content flex min-h-svh items-center justify-center px-5 py-10 sm:px-10 lg:min-h-0 lg:px-16 lg:py-12">
          <div className="w-full max-w-[390px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
