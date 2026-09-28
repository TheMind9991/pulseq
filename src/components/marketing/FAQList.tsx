const FAQS = [
  {
    question: 'Is the question bank actually free?',
    answer:
      'Yes. Every subject, every topic, tutor mode and timed exams are free for every registered user. The only limit on a free account is 100 answered questions and 60 minutes of exam mode per day — content is never behind a paywall.',
  },
  {
    question: 'Why is there a daily limit at all?',
    answer:
      '100 questions covers most single study sessions. It resets every day at midnight, and it only applies to volume — not to which subjects or question types you can access. Going unlimited removes it entirely.',
  },
  {
    question: 'Is the content reviewed, or can anyone submit questions?',
    answer:
      'Every published question is written or checked by an editor and reviewed by a second person before it goes live — the same person can never write and approve their own question. Found something wrong anyway? You can report it from any question.',
  },
  {
    question: 'What payment methods do you support for the paid upgrade?',
    answer:
      'Cards and Egyptian mobile wallets through our local payment partner, so you’re not stuck needing an international card.',
  },
  {
    question: 'Do you support Arabic?',
    answer: 'Full Arabic content and right-to-left layout support is on our roadmap.',
  },
  {
    question: 'Can I cancel the paid plan anytime?',
    answer: 'Yes, from Settings, with no notice period.',
  },
];

export function FAQList() {
  return (
    <section className="border-y border-subtle bg-surface">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold text-primary sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-8 divide-y divide-subtle">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-medium text-primary">
                {faq.question}
                <span className="ms-4 text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-secondary">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
