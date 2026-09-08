// components/MilestoneModal.tsx
'use client';

import Image from 'next/image';

interface MilestoneDetail {
  yearRange: string;
  title: string;
  description: string;
  bullets: string[];
  commitment?: string;
  sources?: string;
}

const MILESTONE_DATA: Record<string | number, MilestoneDetail> = {
  1906: {
    yearRange: '1906-1974',
    title: 'Early Lessons Shaped Stronger Protections',
    description:
      "Clinical trials date back centuries. However, some historical clinical research did not provide the participant consent and protections that are required today. Notable cases (The Tuskegee Syphilis Study, in which Black men were denied treatment and information; the use of Henrietta Lacks's cells without her knowledge; early oral contraceptive trials on women in Puerto Rico without informed consent; and sterilization procedures on American Indian women at Indian Health Service facilities without consistent consent protections) helped drive the push for stronger participant protections.",
    bullets: [
      '<strong>The Pure Food and Drugs Act (1906)</strong> established federal oversight of drug safety and helped lay the foundation for the U.S. Food and Drug Administration (FDA).',
      '<strong>The Nuremberg Code (1947)</strong> established the principle of voluntary, informed consent.',
      '<strong>The Kefauver-Harris Amendments (1962)</strong> required drugs to be proven safe and effective before approval and formalized informed consent as a requirement in clinical trials.',
      '<strong>The Declaration of Helsinki (1964)</strong> introduced ethical principles for medical research involving human participants.',
      '<strong>The National Research Act (1974)</strong> established Institutional Review Boards, requiring independent oversight to help protect the rights and welfare of research participants.',
    ],
    commitment:
      'Merck is committed to reducing barriers and increasing access to clinical trials for communities that have historically been underrepresented in research.',
    sources: 'Sources: FDA; NIH; HHS; WMA; CDC; GAO',
  },
  1979: {
    yearRange: '1979-2016',
    title: 'Participant Rights and Representation in Clinical Research Continue to Advance',
    description:
      'New standards and policies strengthened participant protections and placed greater focus on who is included in clinical research. Until the early 1990s, women and many racial and ethnic minority populations were underrepresented in medical research.',
    bullets: [
      '<strong>The Belmont Report (1979)</strong> established three core principles for research involving human participants: respect for persons, beneficence, and justice.',
      '<strong>The National Institutes of Health (NIH) Revitalization Act (1993)</strong> helped ensure women and members of minority groups were included in all NIH-funded research.',
      '<strong>FDA guidance (2016)</strong> helped improve how race and ethnicity data are collected in clinical research.',
    ],
    commitment:
      'Merck is committed to reducing barriers and increasing access to clinical trials for communities that have historically been underrepresented in research.',
    sources: 'Sources: NIH; FDA; HHS; Belmont Report',
  },
  2020: {
    yearRange: '2020-2022',
    title: 'Protections, Safety, and Inclusion Become Expectations',
    description:
      'The FDA and federal legislation like FDORA outlined ways for clinical trials to better reflect the populations they aim to serve.',
    bullets: [
      '<strong>FDA guidance (2020)</strong> encouraged sponsors to proactively plan for more representative enrollment across race, ethnicity, sex, and age, and to monitor participation throughout a trial.',
      '<strong>Diversity Action Plans (2022)</strong> formalized the expectation that sponsors outline specific strategies for reaching underrepresented communities before a trial begins.',
      '<strong>The Food and Drug Omnibus Reform Act, or FDORA (2022)</strong>, passed by Congress, made diversity action plans a legal requirement for most late-stage trials.',
    ],
    commitment:
      'Merck is committed to reducing barriers and increasing access to clinical trials for communities that have historically been underrepresented in research.',
    sources: 'Sources: FDA; FDORA',
  },
  Today: {
    yearRange: 'Today',
    title: 'Increasing Representation in Clinical Trials.',
    description:
      'Efforts continue to make clinical trials more accessible for all communities. This includes:',
    bullets: [
      'Reducing barriers that may make participation difficult.',
      'Supporting informed decision-making through education and resources.',
      'Designing studies with participant needs and experiences in mind.',
    ],
    commitment:
      'Merck is committed to reducing barriers and increasing access to clinical trials for communities that have historically been underrepresented in research.',
  },
};

interface MilestoneModalProps {
  selectedMilestone: string | number | null;
  onClose: () => void;
}

export default function MilestoneModal({ selectedMilestone, onClose }: MilestoneModalProps) {
  if (selectedMilestone === null) {
    return null;
  }

  const data = MILESTONE_DATA[selectedMilestone] || MILESTONE_DATA[1906];

  return (
    <div
      className="fixed inset-[-100vmax] z-50 flex items-center justify-center p-modal-32 bg-modal-backdrop pointer-events-auto select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex flex-col md:flex-row gap-modal-40 w-modal-1120 max-h-modal-card p-modal-44 overflow-hidden rounded-modal-36 bg-modal-radial shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kiosk Touch Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-modal-28 right-modal-28 z-10 flex items-center justify-center w-modal-48 h-modal-48 text-modal-20 font-bold text-merck-teal bg-merck-mint-light rounded-full shadow-sm cursor-pointer transition-transform hover:bg-merck-mint-hover active:scale-95"
        >
          ✕
        </button>

        {/* Left Column: Image Banner */}
        <div className="relative shrink-0 w-modal-440 min-h-modal-540 overflow-hidden rounded-modal-26 bg-slate-100">
          <Image
            src={`/${selectedMilestone.toString().toLowerCase()}.webp`}
            alt={data.title}
            fill
            sizes="40vw"
            priority
            className="object-cover object-center"
          />
        </div>

        {/* Right Column: Typography & Milestone Details */}
        <div className="flex flex-col justify-between flex-1 pr-modal-16 overflow-y-auto touch-pan-y">
          <div>
            <div className="pb-modal-12 mb-modal-16 border-b border-modal-divider">
              <h1 className="text-modal-72 font-extrabold text-merck-teal tracking-tight leading-none">
                {data.yearRange}
              </h1>
            </div>

            <h2 className="mb-modal-12 text-modal-24 font-bold text-modal-title leading-snug">
              {data.title}
            </h2>

            <p className="mb-modal-24 text-modal-14 font-normal text-modal-body leading-relaxed">
              {data.description}
            </p>

            {/* Mint Badge Checklist */}
            <ul className="flex flex-col gap-modal-14 mb-modal-24">
              {data.bullets.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-modal-14 text-modal-14 leading-snug text-modal-body"
                >
                  <span className="flex items-center justify-center shrink-0 w-modal-20 h-modal-20 mt-modal-2 text-modal-11 font-bold text-merck-teal rounded-full bg-merck-mint/70">
                    ✓
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer Metadata */}
          <div className="pt-modal-16 mt-modal-8">
            {data.commitment && (
              <p className="mb-modal-6 text-modal-12 text-modal-muted leading-normal">
                {data.commitment}
              </p>
            )}
            {data.sources && (
              <p className="text-modal-12 font-medium text-modal-source">
                {data.sources}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}