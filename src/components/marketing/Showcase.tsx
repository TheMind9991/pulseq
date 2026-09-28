// A static, illustrative mock of the tutor-mode question screen (Section 4.3's "Showcase") — not
// a screenshot (no design reference file exists to capture one from) and not real question
// content, just enough of the real app's visual language (see OptionRow.tsx) to show what
// practising actually looks like.
export function Showcase() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold text-primary sm:text-3xl">
            An explanation for every answer, right or wrong
          </h2>
          <p className="mt-4 text-secondary">
            Tutor mode reveals the correct option and a full explanation the moment you answer —
            so every question teaches you something, not just tests you.
          </p>
        </div>

        <div className="rounded-lg border border-subtle bg-surface p-6 shadow-md" aria-hidden="true">
          <p className="mb-4 text-sm text-primary">
            A 55-year-old man presents with crushing central chest pain radiating to the left arm.
            ECG shows ST-elevation in leads II, III and aVF. Which artery is most likely occluded?
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 rounded-md border border-subtle bg-surface px-3 py-2 opacity-60">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-subtle text-xs text-secondary">
                A
              </span>
              <span className="text-primary">Left anterior descending artery</span>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-success bg-success/10 px-3 py-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-success text-xs text-success">
                B
              </span>
              <span className="text-primary">Right coronary artery</span>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-subtle bg-surface px-3 py-2 opacity-60">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-subtle text-xs text-secondary">
                C
              </span>
              <span className="text-primary">Left circumflex artery</span>
            </div>
          </div>
          <div className="mt-4 rounded-md border border-success bg-success/10 p-3">
            <p className="mb-1 text-sm font-medium text-success">Correct</p>
            <p className="text-sm text-primary">
              An inferior STEMI (II, III, aVF) is caused by the right coronary artery in most
              people.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
