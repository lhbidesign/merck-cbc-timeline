// components/Button.tsx
interface ButtonProps {
  year: number | string;
  x: string;
  y: string;
  onClick?: () => void;
  delay?: number;
}

export default function Button({ year, x, y, onClick, delay = 0 }: ButtonProps) {
  return (
    <div
      className="absolute -translate-x-1/2 translate-y-1/2 pointer-events-none"
      style={{ left: x, bottom: y }}
    >
      <div
        className="year-button-wrapper"
        style={{ animationDelay: `${delay}ms` }}
        onAnimationEnd={(e) => {
          (e.currentTarget as HTMLDivElement).style.willChange = 'auto';
        }}
      >
        <button
          onClick={onClick}
          className="year-button flex items-center justify-center font-bold text-white rounded-full shadow-xl cursor-pointer transition-transform select-none pointer-events-auto active:scale-95"
        >
          {year}
        </button>
      </div>
    </div>
  );
}