'use client';

import { useState } from 'react';
import Link from 'next/link';

const routes: [string, string, string, string][] = [
  [
    "Walkthrough",
    "See the product against a regulation you actually care about, using your own obligations.",
    "45 minutes, with a compliance lead and an engineer on our side.",
    "mailto:sales@regcode.dev?subject=Product%20walkthrough",
  ],
  [
    "Evaluation",
    "Run the 14 day evaluation on one framework with your team, no card required.",
    "We set up the workspace and hand it over the same working day.",
    "mailto:sales@regcode.dev?subject=Evaluation%20access",
  ],
  [
    "Procurement and security review",
    "Security questionnaires, data processing agreements, residency and subprocessor lists.",
    "Standard pack returned within two business days.",
    "mailto:legal@regcode.dev?subject=Security%20review",
  ],
  [
    "Existing customers",
    "Support for workspaces already on a subscription.",
    "Response times follow the service level on your plan.",
    "mailto:support@regcode.dev?subject=Support%20request",
  ],
];

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    inquiryType: 'Walkthrough',
    framework: 'GDPR',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <main>
      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <p className="label">Contact</p>
          <h1 className="mt-4 max-w-2xl font-serif text-3xl leading-tight md:text-4xl">
            Talk to the people who build and run the product.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            No qualification form and no sales sequence. Pick the conversation you need and you
            will get a reply from a named person.
          </p>
        </div>
      </section>

      <section className="border-b border-rule bg-paper">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <div className="grid gap-px border border-border bg-border md:grid-cols-2">
            {routes.map(([title, body, note, href]) => (
              <article key={title} className="flex flex-col bg-background p-6">
                <h2 className="font-serif text-lg">{title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
                <p className="mt-3 label">{note}</p>
                <a href={href} className="btn-outline mt-6 text-center">
                  Get in touch
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Inquiry Form */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-3xl px-5 py-14">
          <h2 className="font-serif text-2xl">Send a direct message</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Or fill in your details below and our team will get back to you within one business day.
          </p>

          {formSubmitted ? (
            <div className="mt-8 border border-rule bg-paper p-8 text-center">
              <h3 className="font-serif text-xl">Thank you for reaching out</h3>
              <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
                We have received your inquiry for <strong>{formData.company || formData.name}</strong>. A compliance engineer will reach out at <strong>{formData.email}</strong> shortly.
              </p>
              <button
                onClick={() => setFormSubmitted(false)}
                className="btn-outline mt-6"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block label mb-2">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-paper border border-border px-3 py-2 text-sm text-[var(--saas-foreground)] focus:outline-none focus:border-rule"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block label mb-2">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-paper border border-border px-3 py-2 text-sm text-[var(--saas-foreground)] focus:outline-none focus:border-rule"
                    placeholder="jane@company.com"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block label mb-2">Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-paper border border-border px-3 py-2 text-sm text-[var(--saas-foreground)] focus:outline-none focus:border-rule"
                    placeholder="Acme Financial Corp"
                  />
                </div>
                <div>
                  <label className="block label mb-2">Topic</label>
                  <select
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                    className="w-full bg-paper border border-border px-3 py-2 text-sm text-[var(--saas-foreground)] focus:outline-none focus:border-rule"
                  >
                    <option value="Walkthrough">Product Walkthrough</option>
                    <option value="Evaluation">14-Day Evaluation</option>
                    <option value="Procurement">Procurement & Security</option>
                    <option value="General">General Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block label mb-2">Primary Regulatory Framework</label>
                <select
                  value={formData.framework}
                  onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                  className="w-full bg-paper border border-border px-3 py-2 text-sm text-[var(--saas-foreground)] focus:outline-none focus:border-rule"
                >
                  <option value="GDPR">GDPR / UK GDPR</option>
                  <option value="EU AI Act">EU AI Act</option>
                  <option value="HIPAA">HIPAA Security & Privacy</option>
                  <option value="DORA">DORA (Digital Operational Resilience)</option>
                  <option value="NIS2">NIS2 Directive</option>
                  <option value="SOC 2">SOC 2 / ISO 27001</option>
                  <option value="Other">Other Custom Standard</option>
                </select>
              </div>

              <div>
                <label className="block label mb-2">Notes / Message</label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-paper border border-border px-3 py-2 text-sm text-[var(--saas-foreground)] focus:outline-none focus:border-rule"
                  placeholder="Tell us about the obligations or documents you want to compile..."
                />
              </div>

              <button type="submit" className="btn-primary w-full md:w-auto">
                Submit Request
              </button>
            </form>
          )}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-serif text-2xl">Company details</h2>
          <dl className="mt-8 divide-y divide-border border-y border-border">
            {[
              ["Sales", "sales@regcode.dev"],
              ["Support", "support@regcode.dev"],
              ["Legal and privacy", "legal@regcode.dev"],
              ["Registered office", "Regulation-as-Code Ltd, 42 Kingsway, London WC2B 6EX, United Kingdom"],
              ["Company number", "14892203"],
              ["Hours", "09:00 to 18:00 UK time, Monday to Friday"],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 py-4 md:grid-cols-[14rem_1fr] md:gap-8">
                <dt className="label">{k}</dt>
                <dd className="text-sm leading-relaxed">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}
