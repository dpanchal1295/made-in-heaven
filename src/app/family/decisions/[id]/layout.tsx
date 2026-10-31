import { Suspense } from 'react';

export default function DecisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-[#6B645E]">
          Loading decision ballot...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
