import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "../../components/legal-layout";

export const metadata: Metadata = {
  title: "Data Deletion | Zeexco",
  description: "Learn how to request deletion of your Zeexco account and associated personal information.",
  alternates: { canonical: "/data-deletion" },
};

export default function DataDeletionPage() {
  return (
    <LegalLayout
      eyebrow="Data Deletion"
      title="Delete Your Zeexco Data"
      description="You can request deletion of your Zeexco account and associated personal information."
    >
      <section>
        <h2>How to Submit a Data Deletion Request</h2>
        <p>
          Zeexco does not currently provide an automated account-deletion control. To request data deletion,
          follow these steps:
        </p>
        <ol>
          <li>Email <a href="mailto:admin@zeexco.com?subject=Data%20Deletion%20Request">admin@zeexco.com</a>.</li>
          <li>Use the subject <strong>Data Deletion Request</strong>.</li>
          <li>Where possible, send the request from the email address associated with your Zeexco account.</li>
          <li>Include your name, business name, and the phone or WhatsApp number associated with the account so we can identify the correct records.</li>
          <li>Zeexco may ask for limited additional information to verify account ownership before processing the request.</li>
        </ol>

        <div className="security-notice" role="note">
          <strong>Keep your credentials private.</strong>
          <p>Zeexco will never ask you to send your password, authentication tokens, Meta tokens, or WhatsApp verification codes in a data deletion request.</p>
        </div>
      </section>

      <section>
        <h2>What the Request Generally Covers</h2>
        <p>After verification, a deletion request generally covers information associated with your Zeexco use, where applicable, including:</p>
        <ul>
          <li>Zeexco account information;</li>
          <li>business profile and membership information;</li>
          <li>linked WhatsApp identity and integration information; and</li>
          <li>associated personal information held within Zeexco.</li>
        </ul>
        <p>
          If your business has supplied information about customers or transactions, we will evaluate that
          information as part of the request while considering the rights of other people and any legitimate
          record-keeping obligations.
        </p>
      </section>

      <section>
        <h2>Verification and Processing</h2>
        <p>
          Because the current process is manual, Zeexco may need to verify that the requester controls the
          relevant account before deletion begins. We will process verified requests without unreasonable
          delay. We do not promise immediate deletion or a fixed processing period that has not been formally
          established.
        </p>
      </section>

      <section>
        <h2>Information That May Be Retained</h2>
        <p>
          Limited information may be retained where reasonably necessary for security, fraud prevention,
          legal obligations, or dispute resolution. Any retained information will be limited to what is needed
          for those purposes and will not be kept indefinitely without a legitimate reason.
        </p>
      </section>

      <section>
        <h2>Privacy Questions</h2>
        <p>
          For more information about how Zeexco handles personal information, read the <Link href="/privacy">Zeexco Privacy Policy</Link> or email <a href="mailto:admin@zeexco.com">admin@zeexco.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
