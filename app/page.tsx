// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import HelixBackground from '@/components/HelixBackground';
import Button from '@/components/Button';

const MILESTONES = [
  { year: 1906, x: '62%', y: '17%' },
  { year: 1979, x: '36%', y: '49%' },
  { year: 2020, x: '76%', y: '59%' },
  { year: 'Today', x: '56%', y: '80%' },
];

export default function HelixPage() {
  const [selectedMilestone, setSelectedMilestone] = useState<string | number | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const handleOpenPopup = (year: string | number) => {
    setSelectedMilestone(year);
  };

  const handleClosePopup = () => {
    setSelectedMilestone(null);
    setAnimationKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (selectedMilestone === null) return;
    const idleTimer = setTimeout(() => {
      handleClosePopup();
    }, 35000);

    return () => clearTimeout(idleTimer);
  }, [selectedMilestone]);

  return (
    <main className="helix-container w-full h-full relative">
      <HelixBackground key={animationKey} paused={selectedMilestone !== null}>
        {/* Layer now positions strictly inside .stage */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {MILESTONES.map((m, i) => (
            <Button
              key={m.year}
              year={m.year}
              x={m.x}
              y={m.y}
              delay={1200 + i * 280}
              onClick={() => handleOpenPopup(m.year)}
            />
          ))}
        </div>
      </HelixBackground>

      {/* Touch Popup Modal */}
      {selectedMilestone !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-lg shadow-2xl text-slate-800">
            <h2 className="text-2xl font-bold mb-2">Milestone Details</h2>
            <p className="text-slate-600 mb-6">
              Interactive display content goes here.
            </p>
            <button
              onClick={handleClosePopup}
              className="px-6 py-2 bg-[#00857C] text-white rounded-lg cursor-pointer"
            >
              Close & Reset
            </button>
          </div>
        </div>
      )}
    </main>
  );
}