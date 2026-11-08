import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "../../components/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service | Zeexco",
  description: "Read the terms that govern the use of Zeexco services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Terms of Service"
      title="Zeexco Terms of Service"
      description="These terms explain the rules that apply when you access or use Zeexco services."
    >
      <section>
        <h2>1. About Zeexco</h2>
        <p>
          Zeexco is software being built to help people running businesses organize products, customer
          conversations, follow-ups, and orders. The initial experience is designed around the way many
          businesses already communicate and sell through WhatsApp. Zeexco is in pre-launch and early-access
          development, so availability and features may change.
        </p>
      </section>

      <section>
        <h2>2. Eligibility and Accounts</h2>
        <p>
          You must be legally able to use the service and provide accurate registration and business
          information. You are responsible for keeping your credentials secure and for activity carried out
          through your account. Notify Zeexco promptly if you believe your account has been accessed without
          permission.
        </p>
      </section>

      <section>
        <h2>3. Using Zeexco</h2>
        <p>You must not use Zeexco to:</p>
        <ul>
          <li>carry out unlawful, fraudulent, deceptive, or abusive activity;</li>
          <li>impersonate another person or business;</li>
          <li>access accounts, systems, or information without authorization;</li>
          <li>send malicious code or interfere with the service;</li>
          <li>violate another person&apos;s privacy, intellectual property, or other rights; or</li>
          <li>use communications in a way that violates applicable platform rules or law.</li>
        </ul>
      </section>

      <section>
        <h2>4. Business and Product Information</h2>
        <p>
          You remain responsible for the accuracy, legality, and presentation of your products, prices,
          claims, customer interactions, and the goods or services you offer. Zeexco helps organize business
          information and activity; Zeexco is not the seller of your products and does not become a party to
          transactions between you and your customers.
        </p>
      </section>

      <section>
        <h2>5. AI-Assisted Features</h2>
        <p>
          Some Zeexco features may use artificial intelligence to assist with organizing information,
          preparing content, supporting conversations, suggesting follow-ups, or presenting products. AI-
          assisted output can be incomplete or inaccurate and may not reflect the latest information. You are
          responsible for reviewing important output before using it with customers or making business
          decisions. Zeexco does not guarantee that AI-assisted output will always be accurate or appropriate.
        </p>
      </section>

      <section>
        <h2>6. Third-Party Services</h2>
        <p>
          Zeexco may connect to or rely on third-party services. This can include WhatsApp functionality
          provided through Meta&apos;s platform. WhatsApp and Meta are third-party services, and their own terms
          and policies may apply to your use of those services. Zeexco does not control the availability or
          policies of third-party services and does not imply endorsement or partnership merely by supporting
          an integration.
        </p>
      </section>

      <section>
        <h2>7. Availability and Changes</h2>
        <p>
          Zeexco is under active development. Features may be added, changed, suspended, or removed, and
          interruptions may occur. We aim to communicate material changes where reasonably practical, but we
          do not guarantee uninterrupted access or that every early-access feature will become generally
          available.
        </p>
      </section>

      <section>
        <h2>8. Intellectual Property</h2>
        <p>
          Zeexco and its licensors retain rights in the Zeexco software, branding, design, and related
          materials. You retain ownership of the business, product, customer, and other content you provide,
          subject to any rights held by others. You grant Zeexco the limited permission needed to host,
          process, and display that content to provide and secure the service.
        </p>
      </section>

      <section>
        <h2>9. Suspension and Termination</h2>
        <p>
          Zeexco may restrict or suspend access where reasonably necessary to address serious abuse, a
          security threat, unlawful use, non-payment for an applicable paid service, or a material violation of
          these terms. You may stop using Zeexco and may request deletion of your account as described on our
          <Link href="/data-deletion"> Data Deletion page</Link>.
        </p>
      </section>

      <section>
        <h2>10. Disclaimers</h2>
        <p>
          Zeexco is provided on an “as available” basis to the extent permitted by applicable law. We do not
          guarantee that the service will always be uninterrupted, error-free, or suitable for every business
          purpose. Nothing in these terms excludes rights or obligations that cannot lawfully be excluded.
        </p>
      </section>

      <section>
        <h2>11. Limitation of Liability</h2>
        {/* TODO(legal): founder/legal counsel should review the liability language before a paid general release. */}
        <p>
          To the extent permitted by applicable law, Zeexco will not be responsible for indirect,
          consequential, or special losses arising from use of the service, including lost profits, lost
          opportunities, or loss of data. Any responsibility Zeexco has will be limited fairly in light of the
          nature of the service and the circumstances giving rise to the claim. These terms do not limit
          liability where doing so would be unlawful.
        </p>
      </section>

      <section>
        <h2>12. Changes to These Terms</h2>
        <p>
          We may update these terms as Zeexco develops. The current version will be published on this page
          with an updated date. Where a change materially affects existing users, we will take reasonable
          steps to provide notice.
        </p>
      </section>

      <section>
        <h2>13. Contact</h2>
        <p>
          Questions about these terms can be sent to <a href="mailto:admin@zeexco.com">admin@zeexco.com</a>.
          For information about how Zeexco handles personal information, read our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </LegalLayout>
  );
}
