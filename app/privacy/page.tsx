import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "../../components/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy | Zeexco",
  description: "Learn how Zeexco collects, uses, protects and handles information when you use Zeexco services.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Privacy Policy"
      title="Zeexco Privacy Policy"
      description="This policy explains what information Zeexco handles, why we use it, and the choices available to you."
    >
      <section>
        <h2>1. Introduction</h2>
        <p>
          This Privacy Policy describes how Zeexco handles personal information when people use our website,
          account services, and connected features for organizing products, customer communications,
          follow-ups, and orders. Zeexco is currently being developed and some features are available only
          during testing or early access.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <h3>Account information</h3>
        <p>
          When you register or join the waitlist, we may collect information you provide, such as your name,
          email address, phone or WhatsApp number, and account authentication information. Passwords are
          protected using cryptographic hashing; Zeexco does not store plaintext passwords.
        </p>

        <h3>Business information</h3>
        <p>
          We may collect a business name, information about what a business sells, product details, business
          preferences, configuration, team membership, and other information supplied to set up or operate a
          Zeexco business account.
        </p>

        <h3>WhatsApp and communication information</h3>
        <p>
          If a business uses WhatsApp-related functionality with Zeexco, we may process information made
          available through that integration or interaction. Depending on the feature, this can include
          WhatsApp identifiers, phone-number-related identifiers, message identifiers, message type and
          content sent to Zeexco, conversation information, timestamps, and message delivery or status
          information. Zeexco does not claim to collect every WhatsApp conversation on a person&apos;s device.
        </p>

        <h3>Product, customer, and order information</h3>
        <p>
          Businesses may provide information about products, customers, customer enquiries, conversations,
          follow-ups, and orders. This may include personal information about customers where a business uses
          Zeexco to organize a customer interaction. The business is responsible for providing that information
          lawfully and using it appropriately.
        </p>

        <h3>Technical and security information</h3>
        <p>
          Zeexco and its infrastructure providers may process timestamps, application logs, authentication
          events, audit records, and information needed to operate and secure the service. IP address and
          device or browser information may also be received where it is made available by hosting,
          networking, or security systems.
        </p>
      </section>

      <section>
        <h2>3. How Zeexco Uses Information</h2>
        <p>We use information where reasonably necessary to:</p>
        <ul>
          <li>create and maintain Zeexco accounts and business profiles;</li>
          <li>provide the features a business requests;</li>
          <li>organize products, customer activity, follow-ups, and orders;</li>
          <li>enable and support WhatsApp-related functionality;</li>
          <li>authenticate users and protect account security;</li>
          <li>detect abuse, investigate incidents, and maintain audit records;</li>
          <li>troubleshoot problems and improve service reliability; and</li>
          <li>communicate important service and account information.</li>
        </ul>
        <p>Zeexco does not sell personal information.</p>
      </section>

      <section>
        <h2>4. WhatsApp and Meta</h2>
        <p>
          Some Zeexco functionality may use the WhatsApp Business Platform provided by Meta. When someone
          interacts with Zeexco through WhatsApp, relevant information may be processed by both Zeexco and
          the applicable third-party platform under their respective terms and privacy policies. WhatsApp and
          Meta are third-party services. References to them do not imply that Zeexco is owned, endorsed,
          certified, or formally partnered by Meta.
        </p>
      </section>

      <section>
        <h2>5. How Information Is Shared</h2>
        <p>
          We may share or make information available to service providers that help us operate Zeexco,
          including infrastructure and hosting providers, communication platforms, and security or monitoring
          providers. We may also disclose information when required by applicable law, to respond to valid
          legal process, or where reasonably necessary to protect Zeexco, its users, or others from harm,
          fraud, abuse, or security threats. We do not give service providers permission to use information
          for unrelated purposes.
        </p>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>
          Zeexco retains information only for as long as reasonably necessary to provide the service, maintain
          account and business records, protect security, resolve disputes, and comply with applicable
          obligations. Retention depends on the type of information and why it is needed. After a deletion
          request, limited records may be retained where reasonably necessary for security, fraud prevention,
          legal obligations, or dispute resolution. We do not use those reasons to keep information
          indefinitely when it is no longer needed.
        </p>
      </section>

      <section>
        <h2>7. Data Security</h2>
        <p>
          We use reasonable technical and operational safeguards designed to protect information, including
          access controls, authentication, cryptographic protection for credentials and sessions, and audit or
          security records. No internet service can guarantee absolute security, and we cannot promise that
          unauthorized access will never occur.
        </p>
      </section>

      <section>
        <h2>8. Your Choices and Rights</h2>
        <p>
          You may contact Zeexco about access to, correction of, or deletion of your personal information, or
          with account-related privacy questions. We may need to verify your identity before completing a
          request. To begin a deletion request, see <Link href="/data-deletion">Request deletion of your Zeexco data</Link>.
        </p>
      </section>

      <section>
        <h2>9. Children</h2>
        <p>
          Zeexco is intended for people and business operators who are legally able to use the service. It is
          not designed to intentionally collect children&apos;s personal information. If you believe a child has
          provided personal information to Zeexco, please contact us.
        </p>
      </section>

      <section>
        <h2>10. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy as Zeexco develops or as our legal and operational requirements
          change. The current version will be published on this page with an updated date.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>
          For privacy questions or requests, email <a href="mailto:admin@zeexco.com">admin@zeexco.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
