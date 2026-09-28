const STEPS = [
  {
    step: '1',
    title: 'Tell us your faculty, year and modules',
    description: 'A two-minute setup tailors the question bank to what you’re actually studying.',
  },
  {
    step: '2',
    title: 'Practise or sit a mock exam',
    description: 'Untimed tutor mode for daily revision, or a timed exam that mirrors the real format.',
  },
  {
    step: '3',
    title: 'See your weak topics',
    description: 'Accuracy breaks down by subject and topic the moment you finish a session.',
  },
  {
    step: '4',
    title: 'Keep going, free',
    description: '100 questions and 60 minutes of exam mode a day, on the house — upgrade only if you want more.',
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-subtle bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold text-primary sm:text-3xl">How it works</h2>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => (
            <div key={item.step}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg">
                {item.step}
              </div>
              <h3 className="mt-3 text-base font-semibold text-primary">{item.title}</h3>
              <p className="mt-1.5 text-sm text-secondary">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
