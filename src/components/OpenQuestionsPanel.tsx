'use client';

interface Props {
  questions: string[];
}

export function OpenQuestionsPanel({ questions }: Props) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
        What&apos;s missing
      </h3>
      {questions.length === 0 ? (
        <p className="text-sm text-zinc-400">No gaps flagged.</p>
      ) : (
        <ul className="space-y-1.5">
          {questions.map((q, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-600">
              <span className="mt-0.5 shrink-0 text-amber-400">?</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
