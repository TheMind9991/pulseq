import Link from 'next/link';
import { Arrow } from '@/components/ui/Arrow';

const CAP_MESSAGES: Record<'questions' | 'exam_time', string> = {
  questions: "You've hit today's 100-question limit — resets at midnight, or go unlimited for EGP 150/month.",
  exam_time: "You've used today's 60-minute exam-mode limit — resets at midnight, or go unlimited for EGP 150/month.",
};

// Section 7.3: a hard stop, not a generic error — distinct copy per cap, with a direct link to
// the upgrade flow (Section 7.4).
export function CapReachedNotice({ cap }: { cap: 'questions' | 'exam_time' }) {
  return (
    <div className="rounded-md border border-warning bg-warning/10 px-4 py-3 text-sm text-primary">
      <p>{CAP_MESSAGES[cap]}</p>
      <Link href="/settings" className="mt-1 inline-block font-medium text-accent hover:underline">
        Go unlimited <Arrow>→</Arrow>
      </Link>
    </div>
  );
}
