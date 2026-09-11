import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Pricing | Regulation-as-Code Compiler",
  description:
    "Four subscription plans for turning regulation into a reviewed obligation register, priced by frameworks, document volume and team size.",
  openGraph: {
    title: "Pricing | Regulation-as-Code Compiler",
    description: "Plans priced by frameworks, document volume and team size.",
  },
};

const plans = [
  {
    name: "Starter",
    price: "$390",
    cadence: "per month, billed annually",
    for: "One team compiling a single framework.",
    cta: "Start subscription",
    href: "/contact?plan=Starter",
  },
  {
    name: "Team",
    price: "$1,450",
    cadence: "per month, billed annually",
    for: "Compliance and engineering working the same rule set.",
    cta: "Start subscription",
    href: "/contact?plan=Team",
  },
  {
    name: "Business",
    price: "$4,200",
    cadence: "per month, billed annually",
    for: "Multiple frameworks under continuous monitoring.",
    cta: "Start subscription",
    href: "/contact?plan=Business",
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual agreement",
    for: "Regulated groups with procurement, residency and audit obligations.",
    cta: "Contact sales",
    href: "/contact?plan=Enterprise",
  },
];

const rows: [string, string, string, string, string][] = [
  ["Frameworks included", "GDPR", "GDPR + 2", "Up to 6", "Unlimited"],
  ["Regulation pages ingested / month", "1,500", "8,000", "40,000", "Negotiated"],
  ["Obligations stored", "5,000", "50,000", "Unlimited", "Unlimited"],
  ["Seats", "5", "25", "100", "Unlimited"],
  ["Evidence storage", "25 GB", "250 GB", "2 TB", "Negotiated"],
  ["Version history and change diffs", "Yes", "Yes", "Yes", "Yes"],
  ["Human review workflow", "Single reviewer", "Reviewer roles", "Reviewer roles + approvals", "Custom approval chains"],
  ["Regulatory change monitoring", "Not included", "Weekly", "Daily", "Daily, with alert routing"],
  ["Compliance impact analysis", "Not included", "Not included", "Included", "Included"],
  ["Report exports", "JSON, CSV", "JSON, CSV, PDF", "JSON, CSV, PDF, evidence packs", "All, plus custom templates"],
  ["Single sign-on and RBAC", "Not included", "SSO", "SSO + RBAC", "SSO, RBAC, SCIM"],
  ["Data residency options", "EU or US", "EU or US", "EU, US, UK", "Any supported region"],
  ["Support", "Email, 2 business days", "Email, 1 business day", "Priority, 4 hours", "Named engineer, contractual SLA"],
];

const faqs = [
  [
    "How is document volume counted?",
    "By pages successfully parsed during ingestion. Re-ingesting an amended regulation only counts the pages that changed against your allowance.",
  ],
  [
    "What happens when a regulation is amended?",
    "The amended text is ingested as a new version, rules are re-compiled, and you receive a diff showing which rules were added, changed or retired, along with the systems mapped to them.",
  ],
  [
    "Can we move between plans?",
    "Yes, at any point in the term. Upgrades are prorated to the day; downgrades apply at renewal so that stored rules and history are never dropped mid-term.",
  ],
  [
    "Is there a trial?",
    "Every plan includes a 14 day evaluation against one regulation of your choice, set up by our team, with no card required.",
  ],
];

export default function PricingPage() {
  return (
    <main>
      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <p className="label">Subscription plans</p>
          <h1 className="mt-4 max-w-2xl font-serif text-3xl leading-tight md:text-4xl">
            Priced by frameworks, document volume and the size of your team.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            All plans include the full compilation pipeline, source traceability and versioned
            rule history. Annual billing shown; monthly billing is 20 percent higher.
          </p>
        </div>
      </section>

      <section id="plans" className="border-b border-rule bg-paper scroll-mt-20">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <article key={p.name} className="flex flex-col bg-background p-6">
                <h2 className="font-serif text-xl">{p.name}</h2>
                <p className="mt-4 font-serif text-2xl">{p.price}</p>
                <p className="mt-1 label">{p.cadence}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {p.for}
                </p>
                <Link
                  href={p.href}
                  className={p.name === "Business" ? "btn-primary mt-6 text-center" : "btn-outline mt-6 text-center"}
                >
                  {p.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-serif text-2xl">Plan comparison</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-3xl border-collapse text-sm">
              <thead>
                <tr className="rule-top border-b border-rule">
                  <th className="py-3 pr-4 text-left label">Included</th>
                  {plans.map((p) => (
                    <th key={p.name} className="py-3 pr-4 text-left label">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row[0]} className="border-b border-border align-top">
                    <th className="py-3 pr-4 text-left font-normal">{row[0]}</th>
                    {row.slice(1).map((cell, i) => (
                      <td key={i} className="py-3 pr-4 text-muted-foreground">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-serif text-2xl">Questions before you subscribe</h2>
          <dl className="mt-8 divide-y divide-border border-y border-border">
            {faqs.map(([q, a]) => (
              <div key={q} className="grid gap-2 py-5 md:grid-cols-[16rem_1fr] md:gap-8">
                <dt className="font-serif text-base font-bold">{q}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 text-sm">
            Still deciding?{" "}
            <Link href="/platform" className="text-accent underline font-medium">
              Read how the compiler works
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
