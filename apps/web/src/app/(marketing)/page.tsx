import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Regulation-as-Code Compiler | Turn regulation into working policy",
  description:
    "Compliance software that turns GDPR, HIPAA and EU AI Act text into reviewed, versioned obligations your teams can actually act on, with evidence ready for audit.",
  openGraph: {
    title: "Regulation-as-Code Compiler",
    description: "Turn regulatory text into reviewed, versioned obligations with audit-ready evidence.",
  },
};

const problems: [string, string][] = [
  [
    "The law arrives as prose",
    "A regulation lands as a few hundred pages of text. Someone has to read it, decide what applies to your business, and turn that into work. Today that person is a lawyer with a spreadsheet.",
  ],
  [
    "Nobody knows what changed",
    "Amendments and guidance land continuously. Without a record of what you believed and when, the only way to answer an auditor is to re-read the statute.",
  ],
  [
    "Evidence is assembled in a panic",
    "The obligations live in one document, the proof lives in ticketing systems and inboxes, and the two are only reconciled the week before an audit.",
  ],
];

const stages: [string, string][] = [
  [
    "Bring the regulation in",
    "Upload the published text, or pick a framework we already maintain. Scanned pages and annexes are handled, so nothing is quietly skipped.",
  ],
  [
    "See it broken into obligations",
    "Each article is separated into what you must do, must not do, and may do, with deadlines, who is responsible, and what happens if you fail.",
  ],
  [
    "Review before anything counts",
    "Every interpretation is a proposal until someone in your organisation approves it. Low-confidence readings are flagged for counsel rather than buried.",
  ],
  [
    "Assign it to the business",
    "Approved obligations are mapped to owners, teams, products and systems, so an obligation has a name attached rather than sitting in a document.",
  ],
  [
    "Prove it on demand",
    "Evidence requirements sit on the obligation itself. Reports, checklists and audit packs are produced from the same record your teams work against.",
  ],
];

const capabilities: [string, string][] = [
  [
    "Every obligation traces to its source",
    "You can open any obligation and read the exact article it came from, together with who approved the interpretation and when. Counsel verifies rather than trusts.",
  ],
  [
    "Versioned regulatory history",
    "Obligations are versioned against the text they came from. Superseded versions are kept, so you can reconstruct your position at any date in the past.",
  ],
  [
    "Change monitoring with impact",
    "When an article is amended, you see which obligations moved, which owners are affected and which products are exposed, before an auditor finds it.",
  ],
  [
    "Gap analysis you can act on",
    "Obligations without an owner, without evidence, or with stale evidence surface as a worklist rather than as a finding in someone else's report.",
  ],
  [
    "Roles that match how teams work",
    "Compliance drafts, counsel approves, engineering owns delivery, and an auditor gets read-only access scoped to what they are entitled to see.",
  ],
  [
    "Audit packs in one export",
    "Executive summaries, control checklists and evidence bundles export in the formats auditors and boards ask for, generated from live data.",
  ],
];

const frameworks = [
  "GDPR",
  "UK GDPR",
  "HIPAA",
  "EU AI Act",
  "DORA",
  "NIS2",
  "SOC 2",
  "ISO 27001",
  "PCI DSS",
  "CCPA",
];

const outcomes: [string, string][] = [
  ["Weeks to days", "Typical time from receiving a new framework to an approved obligation register."],
  ["One record", "Obligations, owners and evidence held together instead of across four systems."],
  ["Full history", "Every interpretation retained with its author, date and source article."],
];

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-16 md:py-24">
          <p className="label">Compliance operations software</p>
          <h1 className="mt-4 max-w-3xl font-serif text-3xl leading-tight md:text-5xl">
            Regulation arrives as prose. Your teams need obligations, owners and evidence.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Regulation-as-Code reads published regulatory text and turns it into a reviewed,
            versioned register of what your organisation must do, who owns it and what proves it.
            Your counsel approves every interpretation before it counts.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/pricing" className="btn-primary">
              See plans
            </Link>
            <Link href="/contact" className="btn-outline">
              Book a walkthrough
            </Link>
            <Link href="/regulations" className="btn-outline">
              Launch Compiler
            </Link>
          </div>
          <div className="mt-14 grid gap-px border border-border bg-border md:grid-cols-3">
            {outcomes.map(([k, v]) => (
              <div key={k} className="bg-paper p-6">
                <p className="font-serif text-xl">{k}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-rule bg-paper">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-serif text-2xl">Why compliance work stays manual</h2>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {problems.map(([title, body]) => (
              <div key={title} className="grid gap-2 py-5 md:grid-cols-[18rem_1fr] md:gap-8">
                <p className="font-serif text-base font-bold">{title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-serif text-2xl">How it works</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Five steps, from a published document to something your organisation can be held to.
          </p>
          <ol className="mt-8 divide-y divide-border border-y border-border">
            {stages.map(([name, body], i) => (
              <li key={name} className="grid gap-2 py-5 md:grid-cols-[3rem_15rem_1fr] md:gap-6">
                <span className="label">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-serif text-base font-bold">{name}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-rule bg-paper">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-serif text-2xl">What you get</h2>
          <div className="mt-8 grid gap-px border border-border bg-border md:grid-cols-2">
            {capabilities.map(([title, body]) => (
              <article key={title} className="bg-background p-6">
                <h3 className="font-serif text-lg">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-serif text-2xl">Frameworks we maintain</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Maintained frameworks are kept current by our regulatory team. Any other published
            regulation, standard or internal policy can be brought in as your own document.
          </p>
          <ul className="mt-8 flex flex-wrap gap-px border border-border bg-border">
            {frameworks.map((f) => (
              <li key={f} className="bg-paper px-5 py-3 font-mono text-xs">
                {f}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-6 px-5 py-14">
          <div>
            <h2 className="font-serif text-2xl">Start with one framework. Add the rest later.</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every plan includes a fourteen day evaluation against a regulation of your choice,
              set up by us and handed over the same working day.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/pricing" className="btn-primary">
              View pricing
            </Link>
            <Link href="/regulations" className="btn-outline">
              Launch Compiler
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
