interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
      {children}
    </div>
  );
}

const FEATURES: Feature[] = [
  {
    title: 'Curriculum-mapped question bank',
    description:
      'Every question is tagged subject → topic → subtopic against the Kasr Al Ainy syllabus, so revision time goes exactly where it counts.',
    icon: (
      <IconWrap>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z" />
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        </svg>
      </IconWrap>
    ),
  },
  {
    title: 'Tutor mode, instant explanations',
    description: 'Answer at your own pace and see a full explanation the moment you submit — right or wrong.',
    icon: (
      <IconWrap>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </IconWrap>
    ),
  },
  {
    title: 'Timed mock exams',
    description: 'Configurable question count and duration, no feedback until you submit — mimics the real exam format.',
    icon: (
      <IconWrap>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      </IconWrap>
    ),
  },
  {
    title: 'See exactly where you’re weak',
    description: 'Accuracy by subject and topic, with a one-tap button to practise your weakest areas.',
    icon: (
      <IconWrap>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19V5M4 19h16M8 19v-6M13 19V9M18 19v-9" />
        </svg>
      </IconWrap>
    ),
  },
  {
    title: 'Reviewed by a second editor',
    description: 'No question goes live until someone other than its author checks it — a real quality bar, not a promise.',
    icon: (
      <IconWrap>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </IconWrap>
    ),
  },
  {
    title: 'Resume anywhere',
    description: 'Every answer is saved as you go, so an interrupted session picks up right where you left it.',
    icon: (
      <IconWrap>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v4h4" />
        </svg>
      </IconWrap>
    ),
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-lg border border-subtle bg-surface p-6">
            {feature.icon}
            <h3 className="mt-4 text-base font-semibold text-primary">{feature.title}</h3>
            <p className="mt-2 text-sm text-secondary">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
