// app/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[KIOSK ERROR]', error);

    const timer = setTimeout(() => reset(), 5000);

    return () => clearTimeout(timer);
  }, [error, reset]);

  return (
    <div className="h-dvh w-full flex items-center justify-center bg-merck-teal">
      <p className="text-white text-2xl">Restarting the experience...</p>
    </div>
  );
}