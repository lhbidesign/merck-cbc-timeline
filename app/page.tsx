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
      <div className="intro-heading">
        <h1 className="font-bold text-[1.4vw] leading-tight tracking-tight text-merck-teal">
          How Clinical Trial Protections, Transparency, and Inclusion Have Progressed
        </h1>
        <p className="mt-[0.6vw] font-normal text-[0.85vw] leading-relaxed text-modal-body">
          Historical events and policy changes have shaped the ethical principles, participant protections, and inclusion practices that continue to influence clinical research today.
        </p>
        <div className="inline-block mt-[0.8vw] px-[1vw] py-[0.5vw] rounded-full border border-merck-mint bg-merck-mint/50 text-[0.7vw] font-bold tracking-wide text-merck-teal">
          Tap an era to the right to explore
        </div>
      </div>

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