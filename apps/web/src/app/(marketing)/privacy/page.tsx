import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Privacy policy | Regulation-as-Code Compiler",
  description:
    "What personal data we process, why we process it, how long we keep it, where it is stored, and the rights available to individuals.",
  openGraph: {
    title: "Privacy policy | Regulation-as-Code Compiler",
    description: "Data we process, retention, residency and your rights.",
  },
};

const sections: [string, string[]][] = [
  [
    "1. Who we are",
    [
      "Regulation-as-Code Ltd, 42 Kingsway, London WC2B 6EX, is the controller for personal data relating to visitors of this website and to the account holders of our customers. For content uploaded into a customer workspace, we act as processor on that customer's instructions.",
    ],
  ],
  [
    "2. What we process and why",
    [
      "Account data such as name, work email, organisation and role, so that we can create workspaces, authenticate users and apply permissions.",
      "Billing data such as company details, billing address and payment references, so that we can invoice and meet accounting obligations. Card details are handled by our payment provider and never reach our systems.",
      "Usage records such as sign-in times, workspace activity and review approvals, so that customers have an audit trail and so that we can secure and support the service.",
      "Support correspondence, so that we can answer and improve on recurring issues.",
    ],
  ],
  [
    "3. Legal bases",
    [
      "We rely on contract for providing the service, legitimate interests for securing it and for limited direct communication with existing customers, and legal obligation for accounting and tax records. Where consent applies, it can be withdrawn at any time.",
    ],
  ],
  [
    "4. Customer uploaded content",
    [
      "Documents uploaded into a workspace are processed only to deliver the service to that customer. They are isolated per organisation, are not used to train shared models, and are not disclosed to other customers under any circumstances.",
    ],
  ],
  [
    "5. Retention",
    [
      "Account and usage data are kept for the life of the subscription and for twelve months afterwards. Workspace content is retained for ninety days after termination to allow export, then deleted. Invoices and accounting records are kept for seven years as required by law.",
    ],
  ],
  [
    "6. Location and transfers",
    [
      "Data is stored in the region chosen by the customer, from the European Union, the United Kingdom or the United States. Where a transfer outside the chosen region is unavoidable for support, it is covered by standard contractual clauses and carried out under access controls with logging.",
    ],
  ],
  [
    "7. Subprocessors",
    [
      "We use a small number of subprocessors for hosting, error monitoring, email delivery and payment processing. The current list, with locations and purposes, is available on request and customers are notified before a new subprocessor is added.",
    ],
  ],
  [
    "8. Security",
    [
      "Encryption in transit and at rest, role based access control, per organisation isolation, least privilege internal access with logging, and regular third party penetration testing. Confirmed personal data breaches are reported to affected customers without undue delay.",
    ],
  ],
  [
    "9. Your rights",
    [
      "Individuals may request access, correction, deletion, restriction, portability, or object to processing based on legitimate interests. Requests should be sent to legal@regcode.dev and are answered within one month.",
      "Complaints can also be made to the Information Commissioner's Office in the United Kingdom or to the relevant supervisory authority in the European Union.",
    ],
  ],
  [
    "10. Cookies",
    [
      "This website uses strictly necessary cookies for session handling and security only. There is no advertising, no cross-site tracking and no third party analytics profiling.",
    ],
  ],
];

export default function PrivacyPage() {
  return (
    <main>
      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <p className="label">Legal</p>
          <h1 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">Privacy policy</h1>
          <p className="mt-4 label">Version 2.4, effective 1 March 2026</p>
        </div>
      </section>
      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-5 py-14">
          {sections.map(([heading, paras]) => (
            <article key={heading} className="mb-10">
              <h2 className="font-serif text-lg">{heading}</h2>
              {paras.map((p) => (
                <p key={p} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </article>
          ))}
          <p className="rule-top border-t border-rule pt-6 text-sm leading-relaxed">
            Data protection enquiries:{" "}
            <a href="mailto:legal@regcode.dev" className="text-accent underline font-medium">
              legal@regcode.dev
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
