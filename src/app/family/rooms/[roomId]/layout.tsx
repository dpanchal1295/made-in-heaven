import { Suspense } from 'react';

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-[#6B645E]">
          Loading discussion room...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
