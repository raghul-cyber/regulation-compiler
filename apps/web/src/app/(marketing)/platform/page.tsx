import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Product | Regulation-as-Code Compiler",
  description:
    "The obligation register, review workflow, ownership mapping, change monitoring and audit reporting that make up the Regulation-as-Code product.",
  openGraph: {
    title: "Product | Regulation-as-Code Compiler",
    description: "Obligation register, review workflow, ownership, change monitoring and reporting.",
  },
};

const modules: [string, string, string[]][] = [
  [
    "Obligation register",
    "The single list of everything the organisation is required to do, derived article by article from the source text.",
    [
      "Obligations, prohibitions and permissions kept apart rather than flattened into tasks",
      "Deadlines, thresholds and responsible entities captured where the text states them",
      "Severity assigned so the register can be worked in priority order",
      "Full-text search across frameworks, owners and evidence status",
    ],
  ],
  [
    "Review and approval",
    "Nothing in the register is operative until a person in your organisation says it is.",
    [
      "Draft, in review, approved and retired states with named reviewers",
      "Low-confidence interpretations flagged for counsel instead of passing silently",
      "Approval chains configurable per framework on higher plans",
      "Every approval recorded with author, timestamp and comment",
    ],
  ],
  [
    "Ownership mapping",
    "An obligation with no owner is a finding waiting to happen, so ownership is part of the record.",
    [
      "Owners assigned by person, team, product line or business entity",
      "Coverage view showing unowned and overloaded areas",
      "Reminders routed to owners ahead of recurring deadlines",
      "Handover when people or teams change, with history preserved",
    ],
  ],
  [
    "Change monitoring",
    "Regulation moves. The register moves with it, and you are told what that costs you.",
    [
      "Monitoring of maintained frameworks for amendments and new guidance",
      "Plain-language diff of what was added, changed or retired",
      "Impact view listing affected obligations, owners and products",
      "Alert routing to the people who own the affected areas",
    ],
  ],
  [
    "Evidence and audit reporting",
    "The proof lives next to the requirement, so an audit is an export rather than a project.",
    [
      "Evidence requirements defined on each obligation",
      "Freshness tracking that surfaces stale or missing proof",
      "Executive summaries, control checklists and gap analysis",
      "Read-only auditor access scoped to what they are entitled to see",
    ],
  ],
  [
    "Administration and access",
    "Built for organisations where access itself has to be defensible.",
    [
      "Single sign-on and role-based access control",
      "Per-organisation isolation with encryption in transit and at rest",
      "Complete activity log of who read, changed and approved what",
      "Data residency in the EU, UK or US depending on plan",
    ],
  ],
];

const roles: [string, string][] = [
  [
    "Heads of compliance",
    "A register you can defend line by line, instead of a document that ages the moment it is signed off.",
  ],
  [
    "In-house counsel",
    "Interpretations arrive as proposals with the source article attached, so review is verification rather than re-reading the statute.",
  ],
  [
    "Engineering and product leaders",
    "Obligations arrive as owned, scoped work with a deadline, not as a forwarded PDF three weeks before an audit.",
  ],
  [
    "Internal audit and risk",
    "Immutable history and evidence freshness in one place, with scoped read-only access for external auditors.",
  ],
];

const commitments: [string, string][] = [
  [
    "Nothing is enforceable until a person says so",
    "Interpretation output is always a proposal. A reviewer in your organisation promotes it before it appears in the operative register.",
  ],
  [
    "History is immutable",
    "Approved versions are retained, never overwritten, so you can reconstruct exactly what you believed on any past date.",
  ],
  [
    "Your documents stay yours",
    "Uploaded material is isolated per organisation, is never shared between customers, and is never used to train shared models.",
  ],
  [
    "Migration is not a trap",
    "The full register, history and evidence index export in open formats at any time, including after cancellation.",
  ],
];

export default function PlatformPage() {
  return (
    <main>
      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <p className="label">Product</p>
          <h1 className="mt-4 max-w-3xl font-serif text-3xl leading-tight md:text-4xl">
            From published legal text to an obligation somebody owns.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Six parts of one product. Together they hold the requirement, the interpretation, the
            approval, the owner and the proof in a single record.
          </p>
        </div>
      </section>

      <section className="border-b border-rule bg-paper">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <div className="grid gap-px border border-border bg-border md:grid-cols-2">
            {modules.map(([title, intro, points]) => (
              <article key={title} className="bg-background p-6">
                <h2 className="font-serif text-lg">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{intro}</p>
                <ul className="mt-4 divide-y divide-border border-t border-border">
                  {points.map((p) => (
                    <li key={p} className="py-2 text-sm leading-relaxed">
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-serif text-2xl">Who works in it</h2>
          <dl className="mt-8 divide-y divide-border border-y border-border">
            {roles.map(([role, body]) => (
              <div key={role} className="grid gap-1 py-5 md:grid-cols-[18rem_1fr] md:gap-8">
                <dt className="font-serif text-base font-bold">{role}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b border-rule bg-paper">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-serif text-2xl">Operating commitments</h2>
          <div className="mt-8 grid gap-px border border-border bg-border md:grid-cols-2">
            {commitments.map(([title, body]) => (
              <article key={title} className="bg-background p-6">
                <h3 className="font-serif text-lg">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-6 px-5 py-14">
          <h2 className="font-serif text-2xl">See it against a regulation you care about.</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="btn-outline">
              Book a walkthrough
            </Link>
            <Link href="/pricing" className="btn-primary">
              See plans
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
