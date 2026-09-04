// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import HelixBackground from '@/components/HelixBackground';
import Button from '@/components/Button';
import MilestoneModal from '@/components/MilestoneModal';
import Image from 'next/image';

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
    if (selectedMilestone === null) {
      return;
    }

    const idleTimer = setTimeout(() => {
      handleClosePopup();
    }, 90000);

    return () => clearTimeout(idleTimer);
  }, [selectedMilestone]);

  return (
    <main
      className="helix-container w-full h-full relative"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Image src="/merck-logo.svg" className="merck-logo" width={205} height={60} fetchPriority="high" loading="eager" alt="Merck Logo" />

      <HelixBackground key={animationKey} paused={selectedMilestone !== null}>
        <div className="absolute inset-0 z-20 pointer-events-none">
          {MILESTONES.map((m, i) => (
            <Button
              key={m.year}
              year={m.year}
              x={m.x}
              y={m.y}
              delay={1200 + i * 240}
              onClick={() => handleOpenPopup(m.year)}
            />
          ))}
        </div>

        <MilestoneModal
          selectedMilestone={selectedMilestone}
          onClose={handleClosePopup}
        />
      </HelixBackground>
    </main>
  );
}