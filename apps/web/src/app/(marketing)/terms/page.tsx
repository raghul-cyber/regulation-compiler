import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Terms of service | Regulation-as-Code Compiler",
  description:
    "Subscription terms, billing and renewal, acceptable use, limits of liability and termination for the Regulation-as-Code Compiler service.",
  openGraph: {
    title: "Terms of service | Regulation-as-Code Compiler",
    description: "Subscription, billing, liability and termination terms.",
  },
};

const sections: [string, string[]][] = [
  [
    "1. Agreement",
    [
      "These terms govern use of the Regulation-as-Code Compiler service by the organisation named on the order form and by every user that organisation invites. Where a signed enterprise agreement exists, that agreement takes precedence over these terms.",
      "By creating a workspace or using the service, the organisation accepts these terms on behalf of all of its users.",
    ],
  ],
  [
    "2. Subscriptions, billing and renewal",
    [
      "Subscriptions are billed in advance for the agreed term. Annual plans renew automatically for a further year unless cancelled at least thirty days before the renewal date. Monthly plans renew monthly and can be cancelled before the next billing date.",
      "Upgrades take effect immediately and are prorated. Downgrades take effect at renewal so that stored rules and history are never removed mid-term. Fees are exclusive of VAT and other applicable taxes.",
      "Evaluation workspaces are free for fourteen days and convert to a paid subscription only if the organisation explicitly chooses a plan.",
    ],
  ],
  [
    "3. Acceptable use",
    [
      "The service may not be used to store unlawful content, to attempt to gain access to another organisation's workspace, or to resell access without written permission.",
      "Usage allowances on each plan are contractual limits. Sustained use above the purchased allowance may be throttled after notice, and we will offer an appropriate plan rather than suspend a workspace without warning.",
    ],
  ],
  [
    "4. Customer content and ownership",
    [
      "The organisation retains ownership of the documents it uploads and of the reviewed policy content produced in its workspace. We claim no licence over that content beyond what is required to operate the service for that organisation.",
      "We retain ownership of the software, interfaces and underlying models used to deliver the service.",
    ],
  ],
  [
    "5. Nature of the output",
    [
      "The service produces structured interpretations of regulatory text for review by qualified people inside the organisation. It is not legal advice and does not replace counsel sign-off.",
      "Nothing produced by the service becomes operative until a reviewer in the organisation approves it. Responsibility for that approval, and for the resulting compliance posture, rests with the organisation.",
    ],
  ],
  [
    "6. Availability and support",
    [
      "We target 99.9 percent monthly availability, excluding scheduled maintenance announced at least five days in advance. Support response times follow the plan purchased.",
      "If monthly availability falls below the target, the organisation may claim a service credit against the following invoice by writing to support within thirty days.",
    ],
  ],
  [
    "7. Liability",
    [
      "Neither party excludes liability for death, personal injury, fraud or anything else that cannot lawfully be excluded.",
      "Subject to that, total aggregate liability in any twelve month period is limited to the fees paid in that period, and neither party is liable for indirect or consequential loss, including loss of profit, regulatory fines or loss of goodwill.",
    ],
  ],
  [
    "8. Termination",
    [
      "Either party may terminate for material breach that remains uncured thirty days after written notice. On termination the organisation may export its content for ninety days, after which workspace data is deleted in line with the privacy policy.",
    ],
  ],
  [
    "9. Changes and governing law",
    [
      "Material changes to these terms are notified at least thirty days before they take effect, and an organisation that objects may terminate without penalty at the end of the current term.",
      "These terms are governed by the laws of England and Wales, with exclusive jurisdiction in the courts of London.",
    ],
  ],
];

export default function TermsPage() {
  return (
    <main>
      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <p className="label">Legal</p>
          <h1 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">Terms of service</h1>
          <p className="mt-4 label">Version 3.1, effective 1 March 2026</p>
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
            Questions about these terms:{" "}
            <a href="mailto:legal@regcode.dev" className="text-accent underline font-medium">
              legal@regcode.dev
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
