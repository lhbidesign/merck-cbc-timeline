// components/HelixBackground.tsx
'use client';

import { useEffect, useRef } from 'react';

interface HelixBackgroundProps {
  children?: React.ReactNode;
  paused?: boolean;
}

export default function HelixBackground({ children, paused = false }: HelixBackgroundProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;

    if (paused) {
      stageRef.current?.classList.remove('active-periodic-glow');
    }
  }, [paused]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let animationFrameId: number;

    // DNA Entrance Sequence
    const mainShapes = Array.from(stage.querySelectorAll<SVGPathElement>('.main-shape'))
      .sort((a, b) => (+a.dataset.seq!) - (+b.dataset.seq!));

    const rungGroups = Array.from(stage.querySelectorAll<SVGGElement>('.rung-group'))
      .sort((a, b) => (+b.dataset.seq!) - (+a.dataset.seq!));

    mainShapes.forEach((el) => {
      const seq = +el.dataset.seq!;
      const delay = seq === 0 ? 60 : seq === 1 ? 120 : 160 + (seq - 2) * 55;

      timeouts.push(
        setTimeout(() => {
          el.style.willChange = 'opacity, transform';
          el.classList.add('in');
          el.addEventListener('transitionend', () => {
            el.style.willChange = 'auto';
          }, { once: true });
        }, delay)
      );
    });

    const rungBaseDelay = 820;
    const rungGroupGap = 190;

    rungGroups.forEach((group, gi) => {
      const paths = Array.from(group.querySelectorAll('path'));

      paths.forEach((path, pi) => {
        const len = path.getTotalLength() || 100;

        path.style.strokeDasharray = `${len}`;
        path.style.strokeDashoffset = `${len}`;

        const delay = rungBaseDelay + gi * rungGroupGap + pi * 35;

        timeouts.push(
          setTimeout(() => {
            path.style.willChange = 'stroke-dashoffset, opacity';
            path.classList.add('primed');

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                path.style.strokeDashoffset = '0';
              });
            });

            const handleTransitionEnd = (e: TransitionEvent) => {
              if (e.propertyName === 'stroke-dashoffset') {
                path.style.willChange = 'auto';
                path.removeEventListener('transitionend', handleTransitionEnd);
              }
            };

            path.addEventListener('transitionend', handleTransitionEnd);
          }, delay)
        );
      });
    });

    const totalEntranceDuration = rungBaseDelay + rungGroups.length * rungGroupGap + 900;

    timeouts.push(
      setTimeout(() => {
        if (!pausedRef.current) {
          stage.classList.add('active-periodic-glow');
        }
      }, totalEntranceDuration)
    );

    // Bubble Canvas Engine ---
    const FIGMA_W = 1366;
    const BUBBLE_BOX = {
      left: 168,
      top: 147,
      width: 1162,
      height: 611,
      svgW: 1171,
      svgH: 619,
    };

    const scaleX = BUBBLE_BOX.width / BUBBLE_BOX.svgW;
    const scaleY = BUBBLE_BOX.height / BUBBLE_BOX.svgH;

    const rawBubbleDefs = [
      { cx: 32, cy: 27, r: 23, fill: '#B2E8DF', fillOpacity: 0.42, isStroke: false, blur: 0, delay: 350, speed: 1.2, amp: 7 },
      { cx: 77, cy: 318, r: 25, stroke: '#B2E8DF', strokeWidth: 3.5, isStroke: true, fillOpacity: 0.55, blur: 0, delay: 850, speed: 0.9, amp: 10 },
      { cx: 1157.5, cy: 310.5, r: 10, stroke: '#B2E8DF', strokeWidth: 2.5, isStroke: true, fillOpacity: 0.48, blur: 0, delay: 1450, speed: 1.4, amp: 6 },
      { cx: 19, cy: 347, r: 15, fill: '#B2E8DF', fillOpacity: 0.38, isStroke: false, blur: 0, delay: 600, speed: 1.1, amp: 8 },
      { cx: 815, cy: 102, r: 42, fill: '#B2E8DF', fillOpacity: 0.32, isStroke: false, blur: 0, delay: 1100, speed: 0.7, amp: 12 },
      { cx: 845, cy: 607, r: 8, fill: '#B2E8DF', fillOpacity: 0.48, isStroke: false, blur: 0, delay: 1750, speed: 1.6, amp: 5 }
    ];

    let canvasW = 0;
    let canvasH = 0;
    let currentStageScale = 1;

    class AnimatedBubble {
      def: typeof rawBubbleDefs[0];
      figmaX: number;
      figmaY: number;
      figmaR: number;
      figmaStrokeWidth: number;
      figmaBlur: number;
      currentYOffset: number;
      alpha: number;
      phase: number;
      targetAlpha: number;
      arrived: boolean;
      hoverTime: number;
      startTime: number;

      constructor(def: typeof rawBubbleDefs[0]) {
        this.def = def;
        this.figmaX = BUBBLE_BOX.left + def.cx * scaleX;
        this.figmaY = BUBBLE_BOX.top + def.cy * scaleY;
        this.figmaR = def.r * scaleX;
        this.figmaStrokeWidth = def.strokeWidth ? def.strokeWidth * scaleX : 0;
        this.figmaBlur = def.blur * scaleX;
        this.currentYOffset = 70;
        this.alpha = 0;
        this.phase = Math.random() * Math.PI * 2;
        this.targetAlpha = def.fillOpacity || 1;
        this.arrived = false;
        this.hoverTime = 0;
        this.startTime = performance.now() + def.delay;
      }

      update(now: number) {
        if (now < this.startTime) {
          return;
        }

        if (!this.arrived) {
          this.currentYOffset += (0 - this.currentYOffset) * 0.042;
          this.alpha += (this.targetAlpha - this.alpha) * 0.042;

          if (Math.abs(this.currentYOffset) < 0.2 && this.targetAlpha - this.alpha < 0.02) {
            this.currentYOffset = 0;
            this.alpha = this.targetAlpha;
            this.arrived = true;
          }
        }

        this.hoverTime += 0.018 * this.def.speed;
      }

      draw(context: CanvasRenderingContext2D) {
        if (this.alpha <= 0.001) {
          return;
        }

        const baseX = this.figmaX * currentStageScale;
        const hover = Math.sin(this.hoverTime + this.phase) * (this.def.amp * currentStageScale);
        const baseY = (this.figmaY + this.currentYOffset) * currentStageScale + hover;
        const radius = Math.max(1, this.figmaR * currentStageScale);

        context.save();
        context.globalAlpha = this.alpha;

        // if (this.figmaBlur > 0) {
        //   context.shadowColor = '#B2E8DF';
        //   context.shadowBlur = this.figmaBlur * currentStageScale * 2.5;
        // }

        context.beginPath();
        context.arc(baseX, baseY, radius, 0, Math.PI * 2);

        if (this.def.isStroke) {
          context.strokeStyle = this.def.stroke!;
          context.lineWidth = Math.max(1, this.figmaStrokeWidth * currentStageScale);
          context.stroke();
        } else {
          context.fillStyle = this.def.fill!;
          context.fill();
        }

        context.restore();
      }
    }

    const bubbles = rawBubbleDefs.map((def) => new AnimatedBubble(def));

    function resize() {
      if (!canvas) {
        return;
      }

      // const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const dpr = 1;
      const rect = canvas.getBoundingClientRect();

      canvasW = rect.width;
      canvasH = rect.height;
      canvas.width = Math.round(canvasW * dpr);
      canvas.height = Math.round(canvasH * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      currentStageScale = canvasW / FIGMA_W;
    }

    function loop(now: number) {
      if (!ctx) {
        return;
      }

      if (pausedRef.current) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      ctx.clearRect(0, 0, canvasW, canvasH);

      for (let i = 0; i < bubbles.length; i++) {
        bubbles[i].update(now);
        bubbles[i].draw(ctx);
      }

      animationFrameId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);

    resize();

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      timeouts.forEach(clearTimeout);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="stage" id="stage" ref={stageRef}>
      <div className="veil" />

      <canvas id="bubbleCanvas" ref={canvasRef} />

      <div className="dna-glow" />

      <svg className="dna-svg" width="1044" height="821" viewBox="0 0 1044 821" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_244_42443)">
          {/* LAYER 1: BASE-PAIR LINKS */}
          <mask id="mask0_244_42443" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="58" y="554" width="620" height="270">
            <path d="M521.406 562.752C521.406 562.752 671.086 646.242 672.792 689.725C672.792 689.725 711.477 759.685 559.461 823.411H58.7509C58.7509 823.411 53.6444 739.294 193.973 659.283C193.973 659.283 318.846 593.186 465.628 566.222L519.991 554.34L521.406 562.744V562.752Z" fill="white" />
          </mask>
          <g mask="url(#mask0_244_42443)" className="rung-group" data-seq="6">
            <path d="M434.188 579.237L528.013 589.76" stroke="url(#paint0_linear_244_42443)" strokeWidth="15.57" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M528.013 589.76L621.847 600.282" stroke="url(#paint1_linear_244_42443)" strokeWidth="15.57" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M229.795 617.395L447.401 641.804" stroke="url(#paint2_linear_244_42443)" strokeWidth="21.43" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M447.401 641.804L665.008 666.214" stroke="url(#paint3_linear_244_42443)" strokeWidth="21.43" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M25.4099 655.552L366.79 693.849" stroke="url(#paint4_linear_244_42443)" strokeWidth="27.29" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M366.79 693.849L708.17 732.146" stroke="url(#paint5_linear_244_42443)" strokeWidth="27.29" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-178.983 693.709L286.17 745.893" stroke="url(#paint6_linear_244_42443)" strokeWidth="33.15" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M286.17 745.893L751.323 798.069" stroke="url(#paint7_linear_244_42443)" strokeWidth="33.15" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-383.376 731.867L205.558 797.938" stroke="url(#paint8_linear_244_42443)" strokeWidth="39.01" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M205.558 797.938L794.485 864.001" stroke="url(#paint9_linear_244_42443)" strokeWidth="39.01" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          <mask id="mask1_244_42443" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="534" y="300" width="428" height="205">
            <path d="M928.215 300.106C928.215 300.106 856.205 321.063 806.88 332.039C806.88 332.039 710.497 353.45 674.207 369.107C674.207 369.107 489.941 417.228 544.372 483.326L567.526 504.78C567.526 504.78 781.433 465.777 815.959 446.99C815.959 446.99 984.505 394.501 958.913 339.475C958.913 339.475 946.927 312.276 928.215 300.106Z" fill="white" />
          </mask>
          <g mask="url(#mask1_244_42443)" className="rung-group" data-seq="5">
            <path d="M885.215 307.159L920.969 310.053" stroke="url(#paint10_linear_244_42443)" strokeWidth="9.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M920.969 310.053L956.731 312.956" stroke="url(#paint11_linear_244_42443)" strokeWidth="9.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M525.575 464.373L609.46 473.78" stroke="url(#paint12_linear_244_42443)" strokeWidth="14.72" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M609.46 473.78L693.345 483.195" stroke="url(#paint13_linear_244_42443)" strokeWidth="14.72" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M528.917 424.359L663.414 439.449" stroke="url(#paint14_linear_244_42443)" strokeWidth="18.64" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M663.414 439.45L797.911 454.531" stroke="url(#paint15_linear_244_42443)" strokeWidth="18.64" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M579.341 397.788L723.327 413.942" stroke="url(#paint16_linear_244_42443)" strokeWidth="19.29" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M723.327 413.942L867.304 430.095" stroke="url(#paint17_linear_244_42443)" strokeWidth="19.29" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M648.257 374.049L783.726 389.253" stroke="url(#paint18_linear_244_42443)" strokeWidth="13.23" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M783.726 389.253L919.195 404.448" stroke="url(#paint19_linear_244_42443)" strokeWidth="13.23" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M699.909 351.462L830.766 366.143" stroke="url(#paint20_linear_244_42443)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M830.766 366.143L961.624 380.823" stroke="url(#paint21_linear_244_42443)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M748.825 332.745L874.832 346.876" stroke="url(#paint22_linear_244_42443)" strokeWidth="14.66" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M874.832 346.876L1000.83 361.017" stroke="url(#paint23_linear_244_42443)" strokeWidth="14.66" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M785.678 317.542L904.882 327.209" stroke="url(#paint24_linear_244_42443)" strokeWidth="14.12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M904.882 327.209L1024.09 336.877" stroke="url(#paint25_linear_244_42443)" strokeWidth="14.12" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          <mask id="mask2_244_42443" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="873" y="178" width="122" height="86">
            <path d="M917.439 178.643C917.439 178.643 989.731 194.587 991.717 216.329C991.717 216.329 1012.13 241.262 933.031 263.875C933.031 263.875 854.219 240.974 877.747 212.276C877.747 212.276 884.269 195.459 917.439 178.651V178.643Z" fill="white" />
          </mask>
          <g mask="url(#mask2_244_42443)" className="rung-group" data-seq="4">
            <path d="M893.714 247.478L937.174 248.393" stroke="url(#paint26_linear_244_42443)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M937.174 248.393L980.634 249.299" stroke="url(#paint27_linear_244_42443)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M878.225 235.273L937.805 235.125" stroke="url(#paint28_linear_244_42443)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M937.805 235.124L997.386 234.976" stroke="url(#paint29_linear_244_42443)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M874.712 220.74L937.183 220.584" stroke="url(#paint30_linear_244_42443)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M937.183 220.583L999.653 220.427" stroke="url(#paint31_linear_244_42443)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M871.814 207.097L934.284 206.94" stroke="url(#paint32_linear_244_42443)" strokeWidth="6.36" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M934.284 206.94L996.755 206.783" stroke="url(#paint33_linear_244_42443)" strokeWidth="6.36" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M869.853 195.816L932.324 195.66" stroke="url(#paint34_linear_244_42443)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M932.324 195.659L994.803 195.511" stroke="url(#paint35_linear_244_42443)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M907.891 187.256L927.124 186.689" stroke="url(#paint36_linear_244_42443)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M927.124 186.689L946.364 186.122" stroke="url(#paint37_linear_244_42443)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          <mask id="mask3_244_42443" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="685" y="96" width="219" height="64">
            <path d="M712.569 97.5683C712.569 97.5683 761.706 110.715 786.087 113.417C819.863 117.166 853.988 126.258 885.974 137.853C894.294 140.869 910.355 148.541 900.807 159.996C900.807 159.996 829.198 155.863 788.168 145.786C788.168 145.786 726.174 136.231 693.106 117.863C693.106 117.863 666.645 109.163 710.685 96.217L712.577 97.5683H712.569Z" fill="white" />
          </mask>
          <g mask="url(#mask3_244_42443)" className="rung-group" data-seq="3">
            <path d="M849.283 158.156L878.276 156.448" stroke="url(#paint38_linear_244_42443)" strokeWidth="4.14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M878.276 156.448L905.641 154.826" stroke="url(#paint39_linear_244_42443)" strokeWidth="4.14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M812.949 153.946L860.621 150.633" stroke="url(#paint40_linear_244_42443)" strokeWidth="5.31" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M860.621 150.633L905.607 147.503" stroke="url(#paint41_linear_244_42443)" strokeWidth="5.31" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M785.985 149.282L846.589 143.633" stroke="url(#paint42_linear_244_42443)" strokeWidth="5.99" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M846.589 143.633L903.774 138.306" stroke="url(#paint43_linear_244_42443)" strokeWidth="5.99" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M754.579 144.234L822.523 138.123" stroke="url(#paint44_linear_244_42443)" strokeWidth="4.67" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M822.523 138.123L886.622 132.343" stroke="url(#paint45_linear_244_42443)" strokeWidth="4.67" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M730.352 136.824L799.523 132.238" stroke="url(#paint46_linear_244_42443)" strokeWidth="4.64" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M799.523 132.238L864.789 127.915" stroke="url(#paint47_linear_244_42443)" strokeWidth="4.64" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M707.13 128.778L777.29 125.151" stroke="url(#paint48_linear_244_42443)" strokeWidth="6.44" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M777.29 125.151L843.494 121.734" stroke="url(#paint49_linear_244_42443)" strokeWidth="6.44" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M687.727 121.019L756.267 118.299" stroke="url(#paint50_linear_244_42443)" strokeWidth="4.03" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M756.267 118.299L820.937 115.736" stroke="url(#paint51_linear_244_42443)" strokeWidth="4.03" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M669.1 113.6L732.781 111.926" stroke="url(#paint52_linear_244_42443)" strokeWidth="3.35" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M732.781 111.926L792.856 110.331" stroke="url(#paint53_linear_244_42443)" strokeWidth="3.35" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M664.394 107.062L715.834 105.719" stroke="url(#paint54_linear_244_42443)" strokeWidth="3.04" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M715.834 105.719L764.357 104.455" stroke="url(#paint55_linear_244_42443)" strokeWidth="3.04" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M692.706 99.9569L709.44 99.5908" stroke="url(#paint56_linear_244_42443)" strokeWidth="1.88" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M709.44 99.5908L725.237 99.2508" stroke="url(#paint57_linear_244_42443)" strokeWidth="1.88" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          <mask id="mask4_244_42443" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="660" y="56" width="87" height="35">
            <path d="M681.845 56.7782C683.712 56.63 685.894 58.8966 687.557 59.6289C690.259 60.8145 693.004 61.9042 695.792 62.8806C702.782 65.339 710.054 67.0564 717.257 68.6866C724.461 70.3168 731.588 72.627 738.425 75.5561C740.786 76.5674 747.205 80.0806 746.02 83.5154C745.125 86.1045 740.94 87.0373 738.655 87.5168L718.809 90.8033C718.809 90.8033 681.871 89.4783 661.922 73.7952C661.922 73.7952 653.508 59.1407 681.845 56.7782Z" fill="white" />
          </mask>
          <g mask="url(#mask4_244_42443)" className="rung-group" data-seq="2">
            <path d="M703.362 85.9912L724.41 85.5379" stroke="url(#paint58_linear_244_42443)" strokeWidth="2.38" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M724.41 85.5379L744.273 85.102" stroke="url(#paint59_linear_244_42443)" strokeWidth="2.38" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M689.62 81.5888L720.395 80.9088" stroke="url(#paint60_linear_244_42443)" strokeWidth="3.45" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M720.395 80.9088L749.439 80.2724" stroke="url(#paint61_linear_244_42443)" strokeWidth="3.45" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M669.373 76.7592L704.922 75.8874" stroke="url(#paint62_linear_244_42443)" strokeWidth="2.98" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M704.922 75.8874L738.467 75.0679" stroke="url(#paint63_linear_244_42443)" strokeWidth="2.98" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M659.348 71.5547L694.897 70.683" stroke="url(#paint64_linear_244_42443)" strokeWidth="2.98" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M694.897 70.683L728.442 69.8635" stroke="url(#paint65_linear_244_42443)" strokeWidth="2.98" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M654.514 65.6528L686.193 65.6699" stroke="url(#paint66_linear_244_42443)" strokeWidth="1.93" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M686.193 65.6702L716.089 65.6787" stroke="url(#paint67_linear_244_42443)" strokeWidth="1.93" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M661.505 61.8694L685.059 61.9035" stroke="url(#paint68_linear_244_42443)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M685.059 61.9043L707.283 61.9299" stroke="url(#paint69_linear_244_42443)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M669.919 58.4869L683.422 58.5296" stroke="url(#paint70_linear_244_42443)" strokeWidth="1.31" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M683.422 58.5304L696.175 58.5645" stroke="url(#paint71_linear_244_42443)" strokeWidth="1.31" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          <mask id="mask5_244_42443" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="670" y="35" width="49" height="19">
            <path d="M690.506 35.8645L706.806 36.5881C706.806 36.5881 722.961 42.2372 717.581 48.0431C714.998 48.9759 712.211 49.839 709.218 50.58C699.227 53.0645 689.867 55.1655 682.894 52.9599C678.358 51.5215 674.616 50.4056 671.692 47.7206C670.933 47.4939 669.313 43.6581 671.231 41.4526C673.175 39.9095 675.878 37.9742 690.506 35.8733V35.8645Z" fill="white" />
          </mask>
          <g mask="url(#mask5_244_42443)" className="rung-group" data-seq="1">
            <path d="M666.645 51.2861L683.448 51.2946" stroke="url(#paint72_linear_244_42443)" strokeWidth="1.03" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M683.448 51.2946H706.857" stroke="url(#paint73_linear_244_42443)" strokeWidth="1.03" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M662.331 48.6621H686.465" stroke="url(#paint74_linear_244_42443)" strokeWidth="1.24" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M686.465 48.6621H717.811" stroke="url(#paint75_linear_244_42443)" strokeWidth="1.24" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M658.214 46.1509L689.969 46.1338" stroke="url(#paint76_linear_244_42443)" strokeWidth="1.42" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M689.969 46.1338L719.926 46.1252" stroke="url(#paint77_linear_244_42443)" strokeWidth="1.42" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M659.97 43.6232L691.725 43.6147" stroke="url(#paint78_linear_244_42443)" strokeWidth="1.42" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M691.725 43.6142L721.69 43.5971" stroke="url(#paint79_linear_244_42443)" strokeWidth="1.42" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M662.033 41.1033L693.788 41.0863" stroke="url(#paint80_linear_244_42443)" strokeWidth="1.42" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M693.788 41.0862L723.745 41.0777" stroke="url(#paint81_linear_244_42443)" strokeWidth="1.42" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M665.818 38.5757L697.573 38.5671" stroke="url(#paint82_linear_244_42443)" strokeWidth="1.42" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M697.573 38.5666L727.53 38.5496" stroke="url(#paint83_linear_244_42443)" strokeWidth="1.42" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          <mask id="mask6_244_42443" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="670" y="13" width="45" height="20">
            <path d="M679.952 13.0504C680.992 13.8175 682.953 15.1601 685.621 16.3195C690.071 18.2548 695.084 18.5164 699.875 19.0045C704.231 19.4492 710.429 19.8589 713.583 23.3634C714.06 23.8864 714.444 24.5577 714.418 25.2813C714.342 27.5566 711.205 29.0386 709.44 29.6401C705.766 30.8955 701.827 31.4185 697.991 31.8021C697.002 31.898 696.005 31.9765 695.007 32.0636C690.685 32.4211 686.355 32.6041 682.024 32.7087C682.024 32.7087 674.914 34.7051 670.797 26.5889C670.797 25.9525 670.831 25.2638 670.941 24.5403C671.419 21.2711 672.979 18.8651 674.104 17.4528C676.048 15.9795 678 14.5149 679.944 13.0417L679.952 13.0504Z" fill="white" />
          </mask>
          <g mask="url(#mask6_244_42443)" className="rung-group" data-seq="0">
            <path d="M670.012 30.5987L692.305 30.5902" stroke="url(#paint84_linear_244_42443)" strokeWidth="0.92" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M692.305 30.5901L713.344 30.5816" stroke="url(#paint85_linear_244_42443)" strokeWidth="0.92" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M669.237 28.5673L693.192 28.5502" stroke="url(#paint86_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M693.192 28.5502L715.8 28.5417" stroke="url(#paint87_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M668.759 26.5274L692.714 26.5103" stroke="url(#paint88_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M692.714 26.5103L715.322 26.5017" stroke="url(#paint89_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M667.907 24.4874L691.87 24.4704" stroke="url(#paint90_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M691.87 24.4703L714.47 24.4618" stroke="url(#paint91_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M667.813 22.4475L691.776 22.4304" stroke="url(#paint92_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M691.776 22.4304L714.376 22.4219" stroke="url(#paint93_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M667.625 20.408L691.58 20.3995" stroke="url(#paint94_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M691.58 20.399L714.188 20.3819" stroke="url(#paint95_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M665.076 18.3681L689.031 18.3596" stroke="url(#paint96_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M689.031 18.3591L711.639 18.342" stroke="url(#paint97_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M665.076 16.3282L689.031 16.3196" stroke="url(#paint98_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M689.031 16.3191L711.639 16.3021" stroke="url(#paint99_linear_244_42443)" strokeWidth="0.96" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* LAYER 2: SOLID RIBBON STRANDS */}
          <path d="M-289.082 806.272C-289.082 806.272 17.0812 519.269 507.519 504.78C507.519 504.78 711.034 505.39 884.26 420.149C884.26 420.149 942.17 397.517 961.556 362.734C961.556 362.734 991.401 331.429 933.722 294.902C933.722 294.902 864.142 258.95 858.473 258.375C858.473 258.375 771.629 227.191 834.662 195.18C843.622 191.004 852.497 186.593 861.294 182.069C869.239 177.989 877.116 173.752 884.806 169.167C889.571 166.325 894.465 163.674 898.949 160.379C902.589 157.694 906.715 153.789 904.371 148.82C901.813 143.388 894.379 140.616 889.333 138.297C881.174 134.566 872.24 132.177 863.639 129.684C847.868 125.099 831.849 121.655 815.848 118.046C815.848 118.046 683.277 92.5643 665.136 84.4394C658.597 81.519 649.766 79.3047 645.614 72.8101C639.527 63.2816 660.737 57.9813 666.082 56.5603C674.215 54.3983 682.715 52.8553 691.129 51.7481C699.884 50.5974 709.397 52.4717 717.394 47.7642C723.216 44.3381 714.947 39.7613 711.921 38.506C702.987 34.7748 693.643 37.5122 684.428 36.0738C680.617 35.4722 676.918 34.1907 673.431 32.4995C671.828 31.7236 670.208 30.817 669.134 29.3699C666.594 25.9525 668.009 21.2275 670.387 18.1764C672.476 15.5 675.758 12.3268 679.006 11.2458C680.541 10.7315 682.339 10.7838 683.644 11.7514C683.09 11.3417 678.87 14.6457 678.281 15.1164C676.048 16.8949 673.542 19.362 672.425 22.0557C668.819 30.7647 681.888 32.8569 687.361 33.7548C691.478 34.4348 695.664 34.8184 699.824 34.8969C704.675 34.9928 709.611 34.7748 714.393 35.8122C718.459 36.6927 724.077 38.8808 725.356 43.4576C726.14 46.2647 724.887 48.6882 722.509 50.2051C720.036 51.783 716.899 52.3932 714.078 52.986C700.557 55.828 686.747 55.8803 673.201 58.4259C667.975 59.411 660.439 62.2791 662.221 69.1573C663.354 73.5249 668.52 76.271 672.127 78.1104C683.26 83.803 695.868 86.8019 707.991 89.4085C727.453 93.593 747.077 96.9755 766.779 99.739C778.185 101.334 789.583 103.392 800.963 105.301C811.73 107.114 822.489 108.962 833.247 110.819C849.155 113.565 865.071 116.268 880.978 119.005C882.598 119.284 884.218 119.563 885.829 119.842C901.302 122.544 917.175 125.456 929.314 136.519C946.322 152.01 934.625 170.378 917.431 178.651C816.317 229.58 918.582 258.915 918.582 258.915C1036.52 305.842 1031.39 339.493 1031.39 339.493C1032.53 449.597 766.046 504.788 766.046 504.788C712.748 525.083 421.324 559.867 421.324 559.867C-10.7101 643.356 46.8331 843.68 46.8331 843.68" fill="url(#paint100_linear_244_42443)" className="main-shape" data-seq="0" />

          <path d="M559.461 823.42C583.732 818.259 607.695 807.859 628.692 794.538C648.973 781.68 666.713 764.314 678.946 743.269C691.18 722.225 700.352 692.07 695.314 666.658C692.629 653.137 681.086 641.56 671.99 632.041C649.953 608.991 622.784 591.085 595.658 575.01C578.924 565.089 561.797 555.874 544.44 547.157C524.825 537.306 503.973 529.625 486.983 515.363C477.98 507.805 469.532 499.427 462.38 490.003C445.628 467.956 438.595 440.217 455.355 415.86C468.671 396.515 490.358 383.988 510.912 374.311C510.912 374.311 611.455 327.924 787.221 297.779C813.026 294.126 838.712 289.061 864.124 283.264C904.328 274.093 947.779 263.753 982.919 240.87C995.885 232.422 999.381 216.983 988.341 205.293C980.268 196.749 968.589 191.885 957.822 188.084C936.066 180.421 912.981 176.62 890.219 173.7C890.219 173.7 765.082 159.202 703.481 138.332C689.654 133.651 671.052 129.248 661.539 117.052C652.732 105.763 668.495 97.8996 677.19 95.0751C694.087 89.583 712.517 90.5332 729.985 89.025C733.335 88.7374 736.703 88.3887 739.959 87.4995C742.602 86.7759 747.086 85.259 746.617 81.6499C746.276 79.052 743.778 77.0731 741.698 75.8701C737.606 73.5163 732.704 72.1738 728.229 70.7789C721.733 68.7564 715.143 67.1001 708.57 65.3827C696.022 62.0961 683.337 58.5393 672.058 51.818C669.288 50.1703 666.56 48.2786 664.701 45.611C663.926 44.5039 663.295 43.1962 663.346 41.8362C663.457 39.3081 665.792 37.521 668.026 36.4226C680.336 30.3376 694.931 33.2145 708.434 31.0002C710.207 30.7125 712.023 30.3028 713.481 29.2392C714.939 28.1756 715.979 26.3013 715.578 24.5142C715.075 22.2563 712.662 21.0795 710.497 20.4169C703.149 18.1765 695.306 18.1765 687.872 16.2324C680.438 14.2971 672.885 9.65057 670.814 2.09234C670.592 1.29032 670.635 0.139584 671.436 -0.0260524C671.785 -0.0957938 672.135 0.0785598 672.433 0.279066C674.343 1.55185 675.366 3.79229 676.704 5.68403C680.839 11.5249 688.094 14.0792 695.041 15.3345C701.989 16.5898 709.21 16.9386 715.663 19.8328C717.777 20.7743 719.84 22.0471 721.153 23.9824C722.466 25.9178 722.875 28.6377 721.656 30.634C720.787 32.0637 719.252 32.9181 717.735 33.5719C704.734 39.2035 689.424 34.7488 675.946 39.0292C673.669 39.7527 671.155 41.0952 670.754 43.5013C670.234 46.6048 673.49 48.8714 676.304 50.1442C689.142 55.9589 702.833 59.507 716.533 62.6366C726.208 64.8509 735.927 66.8647 745.611 69.0093C748.646 69.6805 751.741 70.3866 754.434 71.9645C757.128 73.5424 759.43 76.149 759.907 79.2874C760.717 84.6662 755.381 87.6215 751.323 89.4609C746.515 91.6404 741.28 92.8434 736.114 93.7675C720.914 96.4961 705.621 95.2582 691.282 102.023C680.515 107.106 685.707 113.365 693.106 117.811C717.573 132.509 747.708 138.559 775.15 144.356C815.711 152.926 856.648 157.842 897.687 163.099C926.817 166.83 955.648 173.656 983.644 182.67C1000.43 188.075 1018.69 194.291 1032.69 205.65C1039.11 210.855 1044.47 217.044 1042.33 225.814C1040.45 233.521 1035.74 240.329 1030.05 245.612C1012.86 261.618 987.65 270.309 965.963 277.92C927.925 291.266 888.599 300.83 849.274 309.225C829.087 313.531 803.044 319.555 783.07 324.803C672.698 353.79 603.902 376.595 603.902 376.595C575.931 386.481 517.672 407.22 522.429 447.54C525.438 473.013 551.644 491.782 571.123 504.257C597.508 521.152 626.74 532.764 655.818 543.792C685.374 555.002 713.532 568.131 741.281 583.535C777.767 603.787 814.902 627.752 841.559 660.905C870.68 697.118 876.937 741.491 849.854 780.66C835.788 801.007 815.993 818.233 794.757 830.42C794.672 830.472 794.578 830.516 794.493 830.568" fill="url(#paint101_linear_244_42443)" className="main-shape" data-seq="1" />

          {/* Accent Facets */}
          <path d="M542.667 542.466C535.268 544.053 523.776 545.936 516.385 547.523L520.485 562.752C558.455 582.847 596.246 605.469 629.868 632.52C652.221 650.505 673.226 676.248 678.009 705.748C682.595 734.055 666.193 758.055 645.716 775.176C634.31 784.713 621.727 792.847 608.872 800.178C601.719 804.258 594.43 808.077 587.082 811.773C580.978 814.833 573.203 820.473 566.537 821.763C586.272 817.945 628.07 806.717 661.888 769.945C686.687 742.982 708.076 704.763 695.655 666.868C685.161 634.865 656.364 609.296 630.244 590.431C603.168 570.877 573.331 555.229 542.667 542.466Z" fill="url(#paint102_linear_244_42443)" className="main-shape" data-seq="2" />
          <path d="M519.991 554.349V547.226C519.991 547.226 399.457 555.953 285.948 594.432C285.948 594.432 132.986 637.646 75.8859 727.464C75.8859 727.464 33.0653 786.064 44.3523 823.42H74.3515C74.3515 823.42 94.1975 708.285 285.266 635.231C285.266 635.231 446.898 577.163 526.845 566.144L519.999 554.349H519.991Z" fill="url(#paint103_linear_244_42443)" className="main-shape" data-seq="3" />
          <path d="M1031.4 339.484C1031.4 339.484 1033.74 387.082 1031.43 399.261C1027.46 420.297 1007.67 438.316 992.254 450.791C925.086 505.189 833.273 527.603 751.374 545.125C729.448 549.815 707.556 554.026 685.221 555.831L626.297 532.232C626.297 532.232 834.569 504.37 951.982 437.898C951.982 437.898 1033.67 395.669 1031.4 339.484Z" fill="url(#paint104_linear_244_42443)" className="main-shape" data-seq="4" />
          <path d="M925.58 290.708L928.53 292.225L928.215 300.115C928.215 300.115 735.441 349.579 626.297 384.859C626.297 384.859 506.377 427.097 541.533 477.537C541.533 477.537 522.429 473.762 522.625 437.096C522.625 437.096 513.827 388.608 690.08 347.086L925.572 290.717L925.58 290.708Z" fill="url(#paint105_linear_244_42443)" className="main-shape" data-seq="5" />
          <path d="M928.53 292.217V300.106C928.53 300.926 933.747 304.482 934.378 305.066C939.161 309.469 943.594 314.316 947.481 319.564C953.627 327.855 960.311 338.307 960.686 349.065C961.121 361.304 951.096 370.998 942.903 378.565C930.082 390.413 915.427 400.142 900.398 408.763C874.985 423.331 847.902 434.794 820.451 444.671C778.517 459.762 735.339 471.121 691.879 480.527C667.949 485.706 643.9 490.265 619.766 494.336C619.766 494.336 722.952 499.567 876.042 427.28C876.042 427.28 1047.9 358.148 928.522 292.217H928.53Z" fill="url(#paint106_linear_244_42443)" className="main-shape" data-seq="6" />
          <path d="M811.773 221.255L811.227 246.475C811.227 246.475 810.656 252.56 817.084 256.814L858.225 284.597L895.905 275.679L835.08 247.251C835.08 247.251 812.694 235.935 811.764 221.246L811.773 221.255Z" fill="url(#paint107_linear_244_42443)" className="main-shape" data-seq="7" />
          <path d="M1042.81 221.255C1043.06 225.108 1043.31 228.961 1043.57 232.814C1044.16 241.924 1045.18 248.637 1038.42 255.751C1023.39 271.582 1002.27 283.647 981.282 288.512L961.547 277.928C961.547 277.928 1037.48 258.941 1042.8 221.255H1042.81Z" fill="url(#paint108_linear_244_42443)" className="main-shape" data-seq="8" />
          <path d="M879.29 172.366L847.518 188.999C834.159 186.166 820.809 183.333 807.451 180.508C777.656 174.188 747.725 168.452 718.493 159.673C703.626 155.201 688.682 150.223 674.53 143.72C669.1 141.261 663.422 138.707 659.237 134.252C656.1 130.913 654.403 126.659 654.079 122.056C653.542 114.611 656.389 106.199 663.184 102.572C663.184 102.572 651.965 116.712 675.698 128.115C675.698 128.115 710.514 144.548 768.91 154.791C768.91 154.791 870.339 173.647 879.29 172.383V172.366Z" fill="url(#paint109_linear_244_42443)" className="main-shape" data-seq="9" />
          <path d="M644.608 68.521C644.608 68.521 642.281 78.9386 643.372 85.3984C643.704 87.386 645.077 89.0337 646.952 89.6613L670.703 97.6903C670.703 97.6903 680.242 93.0787 691.188 91.8669C691.188 91.8669 658.862 84.2825 649.714 77.1079C649.714 77.1079 644.31 73.2983 644.608 68.521Z" fill="url(#paint110_linear_244_42443)" className="main-shape" data-seq="10" />
          <path d="M759.635 77.7443C761.629 83.5938 763.701 96.1822 754.903 97.6903L732.943 94.3253C732.943 94.3253 749.243 91.7797 756.139 86.7496C756.139 86.7496 761.902 84.4046 759.635 77.7443Z" fill="url(#paint111_linear_244_42443)" className="main-shape" data-seq="11" />
          <path d="M725.356 43.4402C725.356 43.4402 726.328 49.0457 725.356 51.5128C724.205 54.4245 719.38 56.1506 716.729 56.9526C712.373 58.269 704.76 60.0125 700.242 58.6438L691.674 56.0024C691.674 56.0024 713.2 53.9973 716.55 52.4368C716.55 52.4368 726.609 50.6672 725.347 43.4489L725.356 43.4402Z" fill="url(#paint112_linear_244_42443)" className="main-shape" data-seq="12" />
        </g>

        <defs>
          <linearGradient id="paint0_linear_244_42443" x1="481.1" y1="579.237" x2="481.1" y2="589.76" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint1_linear_244_42443" x1="574.93" y1="589.76" x2="574.93" y2="600.282" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint2_linear_244_42443" x1="338.598" y1="617.395" x2="338.598" y2="641.804" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint3_linear_244_42443" x1="556.205" y1="641.804" x2="556.205" y2="666.214" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint4_linear_244_42443" x1="196.1" y1="655.552" x2="196.1" y2="693.849" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint5_linear_244_42443" x1="537.48" y1="693.849" x2="537.48" y2="732.146" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint6_linear_244_42443" x1="53.5933" y1="693.709" x2="53.5933" y2="745.893" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint7_linear_244_42443" x1="518.746" y1="745.893" x2="518.746" y2="798.069" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint8_linear_244_42443" x1="-88.9091" y1="731.867" x2="-88.9091" y2="797.938" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint9_linear_244_42443" x1="500.021" y1="797.938" x2="500.021" y2="864.001" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint10_linear_244_42443" x1="903.092" y1="307.159" x2="903.092" y2="310.053" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint11_linear_244_42443" x1="938.85" y1="310.053" x2="938.85" y2="312.956" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint12_linear_244_42443" x1="567.517" y1="464.373" x2="567.517" y2="473.78" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint13_linear_244_42443" x1="651.402" y1="473.78" x2="651.402" y2="483.195" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint14_linear_244_42443" x1="596.165" y1="424.359" x2="596.165" y2="439.449" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint15_linear_244_42443" x1="730.663" y1="439.45" x2="730.663" y2="454.531" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint16_linear_244_42443" x1="651.334" y1="397.788" x2="651.334" y2="413.942" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint17_linear_244_42443" x1="795.316" y1="413.942" x2="795.316" y2="430.095" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint18_linear_244_42443" x1="715.991" y1="374.049" x2="715.991" y2="389.253" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint19_linear_244_42443" x1="851.461" y1="389.253" x2="851.461" y2="404.448" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint20_linear_244_42443" x1="765.338" y1="351.462" x2="765.338" y2="366.143" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint21_linear_244_42443" x1="896.195" y1="366.143" x2="896.195" y2="380.823" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint22_linear_244_42443" x1="811.828" y1="332.745" x2="811.828" y2="346.876" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint23_linear_244_42443" x1="937.831" y1="346.876" x2="937.831" y2="361.017" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint24_linear_244_42443" x1="845.28" y1="317.542" x2="845.28" y2="327.209" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint25_linear_244_42443" x1="964.484" y1="327.209" x2="964.484" y2="336.877" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint26_linear_244_42443" x1="915.444" y1="247.478" x2="915.444" y2="248.393" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint27_linear_244_42443" x1="958.904" y1="248.393" x2="958.904" y2="249.299" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint28_linear_244_42443" x1="908.015" y1="235.125" x2="908.015" y2="235.273" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint29_linear_244_42443" x1="967.596" y1="234.976" x2="967.596" y2="235.124" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint30_linear_244_42443" x1="905.948" y1="220.584" x2="905.948" y2="220.74" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint31_linear_244_42443" x1="968.418" y1="220.427" x2="968.418" y2="220.583" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint32_linear_244_42443" x1="903.049" y1="206.94" x2="903.049" y2="207.097" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint33_linear_244_42443" x1="965.52" y1="206.783" x2="965.52" y2="206.94" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint34_linear_244_42443" x1="901.088" y1="195.66" x2="901.088" y2="195.816" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint35_linear_244_42443" x1="963.563" y1="195.511" x2="963.563" y2="195.659" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint36_linear_244_42443" x1="917.507" y1="186.689" x2="917.507" y2="187.256" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint37_linear_244_42443" x1="936.744" y1="186.122" x2="936.744" y2="186.689" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint38_linear_244_42443" x1="863.779" y1="156.448" x2="863.779" y2="158.156" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint39_linear_244_42443" x1="891.958" y1="154.826" x2="891.958" y2="156.448" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint40_linear_244_42443" x1="836.785" y1="150.633" x2="836.785" y2="153.946" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint41_linear_244_42443" x1="883.114" y1="147.503" x2="883.114" y2="150.633" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint42_linear_244_42443" x1="816.287" y1="143.633" x2="816.287" y2="149.282" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint43_linear_244_42443" x1="875.181" y1="138.306" x2="875.181" y2="143.633" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint44_linear_244_42443" x1="788.551" y1="138.123" x2="788.551" y2="144.234" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint45_linear_244_42443" x1="854.572" y1="132.343" x2="854.572" y2="138.123" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint46_linear_244_42443" x1="764.937" y1="132.238" x2="764.937" y2="136.824" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint47_linear_244_42443" x1="832.156" y1="127.915" x2="832.156" y2="132.238" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint48_linear_244_42443" x1="742.21" y1="125.151" x2="742.21" y2="128.778" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint49_linear_244_42443" x1="810.392" y1="121.734" x2="810.392" y2="125.151" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint50_linear_244_42443" x1="721.997" y1="118.299" x2="721.997" y2="121.019" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint51_linear_244_42443" x1="788.602" y1="115.736" x2="788.602" y2="118.299" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint52_linear_244_42443" x1="700.941" y1="111.926" x2="700.941" y2="113.6" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint53_linear_244_42443" x1="762.819" y1="110.331" x2="762.819" y2="111.926" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint54_linear_244_42443" x1="690.114" y1="105.719" x2="690.114" y2="107.062" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint55_linear_244_42443" x1="740.096" y1="104.455" x2="740.096" y2="105.719" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint56_linear_244_42443" x1="701.073" y1="99.5908" x2="701.073" y2="99.9569" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint57_linear_244_42443" x1="717.338" y1="99.2508" x2="717.338" y2="99.5908" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint58_linear_244_42443" x1="713.886" y1="85.5379" x2="713.886" y2="85.9912" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint59_linear_244_42443" x1="734.341" y1="85.102" x2="734.341" y2="85.5379" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint60_linear_244_42443" x1="705.007" y1="80.9088" x2="705.007" y2="81.5888" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint61_linear_244_42443" x1="734.917" y1="80.2724" x2="734.917" y2="80.9088" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint62_linear_244_42443" x1="687.147" y1="75.8874" x2="687.147" y2="76.7592" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint63_linear_244_42443" x1="721.695" y1="75.0679" x2="721.695" y2="75.8874" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint64_linear_244_42443" x1="677.122" y1="70.683" x2="677.122" y2="71.5547" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint65_linear_244_42443" x1="711.669" y1="69.8635" x2="711.669" y2="70.683" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint66_linear_244_42443" x1="670.353" y1="65.6528" x2="670.353" y2="65.6699" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint67_linear_244_42443" x1="701.141" y1="65.6702" x2="701.141" y2="65.6787" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint68_linear_244_42443" x1="673.282" y1="61.8694" x2="673.282" y2="61.9035" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint69_linear_244_42443" x1="696.171" y1="61.9043" x2="696.171" y2="61.9299" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint70_linear_244_42443" x1="676.67" y1="58.4869" x2="676.67" y2="58.5296" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint71_linear_244_42443" x1="689.799" y1="58.5304" x2="689.799" y2="58.5645" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint72_linear_244_42443" x1="675.046" y1="51.2861" x2="675.046" y2="51.2946" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint73_linear_244_42443" x1="695.152" y1="51.2946" x2="695.152" y2="52.2946" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint74_linear_244_42443" x1="674.398" y1="48.6621" x2="674.398" y2="49.6621" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint75_linear_244_42443" x1="702.138" y1="48.6621" x2="702.138" y2="49.6621" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint76_linear_244_42443" x1="674.091" y1="46.1338" x2="674.091" y2="46.1509" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint77_linear_244_42443" x1="704.947" y1="46.1252" x2="704.947" y2="46.1338" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint78_linear_244_42443" x1="675.848" y1="43.6147" x2="675.848" y2="43.6232" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint79_linear_244_42443" x1="706.708" y1="43.5971" x2="706.708" y2="43.6142" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint80_linear_244_42443" x1="677.911" y1="41.0863" x2="677.911" y2="41.1033" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint81_linear_244_42443" x1="708.767" y1="41.0777" x2="708.767" y2="41.0862" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint82_linear_244_42443" x1="681.696" y1="38.5671" x2="681.696" y2="38.5757" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint83_linear_244_42443" x1="712.552" y1="38.5496" x2="712.552" y2="38.5666" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint84_linear_244_42443" x1="681.159" y1="30.5902" x2="681.159" y2="30.5987" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint85_linear_244_42443" x1="702.825" y1="30.5816" x2="702.825" y2="30.5901" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint86_linear_244_42443" x1="681.214" y1="28.5502" x2="681.214" y2="28.5673" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint87_linear_244_42443" x1="704.496" y1="28.5417" x2="704.496" y2="28.5502" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint88_linear_244_42443" x1="680.737" y1="26.5103" x2="680.737" y2="26.5274" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint89_linear_244_42443" x1="704.018" y1="26.5017" x2="704.018" y2="26.5103" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint90_linear_244_42443" x1="679.888" y1="24.4704" x2="679.888" y2="24.4874" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint91_linear_244_42443" x1="703.17" y1="24.4618" x2="703.17" y2="24.4703" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint92_linear_244_42443" x1="679.795" y1="22.4304" x2="679.795" y2="22.4475" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint93_linear_244_42443" x1="703.076" y1="22.4219" x2="703.076" y2="22.4304" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint94_linear_244_42443" x1="679.603" y1="20.3995" x2="679.603" y2="20.408" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint95_linear_244_42443" x1="702.884" y1="20.3819" x2="702.884" y2="20.399" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint96_linear_244_42443" x1="677.054" y1="18.3596" x2="677.054" y2="18.3681" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint97_linear_244_42443" x1="700.335" y1="18.342" x2="700.335" y2="18.3591" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint98_linear_244_42443" x1="677.054" y1="16.3196" x2="677.054" y2="16.3282" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#AEE3E2" /></linearGradient>
          <linearGradient id="paint99_linear_244_42443" x1="700.335" y1="16.3021" x2="700.335" y2="16.3191" gradientUnits="userSpaceOnUse"><stop offset="0.307692" stopColor="#6DD2CB" /><stop offset="1" stopColor="#E8FFFD" /></linearGradient>
          <linearGradient id="paint100_linear_244_42443" x1="1463" y1="-7.1545" x2="14.0831" y2="721.425" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="#6FF2E9" /></linearGradient>
          <linearGradient id="paint101_linear_244_42443" x1="744.285" y1="-0.0417023" x2="744.285" y2="830.568" gradientUnits="userSpaceOnUse"><stop stopColor="#A6FEF8" /><stop offset="1" stopColor="#00857C" /></linearGradient>

          <linearGradient id="paint102_linear_244_42443" x1="607.839" y1="542.466" x2="607.839" y2="821.763" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3CBCA7" stopOpacity="1" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
          <linearGradient id="paint103_linear_244_42443" x1="284.651" y1="547.226" x2="284.651" y2="823.42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#33B09B" stopOpacity="1" />
            <stop offset="1" stopColor="white" />
          </linearGradient>

          <linearGradient id="paint104_linear_244_42443" x1="829.373" y1="339.484" x2="829.373" y2="555.831" gradientUnits="userSpaceOnUse"><stop stopColor="#3CBCA7" /><stop offset="1" stopColor="white" /></linearGradient>
          <linearGradient id="paint105_linear_244_42443" x1="725.541" y1="290.708" x2="725.541" y2="477.537" gradientUnits="userSpaceOnUse"><stop stopColor="#3CBCA7" /><stop offset="1" stopColor="white" /></linearGradient>
          <linearGradient id="paint106_linear_244_42443" x1="795.242" y1="292.217" x2="795.242" y2="494.42" gradientUnits="userSpaceOnUse"><stop stopColor="#3CBCA7" /><stop offset="1" stopColor="white" /></linearGradient>
          <linearGradient id="paint107_linear_244_42443" x1="853.56" y1="221.246" x2="853.56" y2="284.597" gradientUnits="userSpaceOnUse"><stop stopColor="#3CBCA7" /><stop offset="1" stopColor="white" /></linearGradient>
          <linearGradient id="paint108_linear_244_42443" x1="1002.77" y1="221.255" x2="1002.77" y2="288.512" gradientUnits="userSpaceOnUse"><stop stopColor="#3CBCA7" /><stop offset="1" stopColor="white" /></linearGradient>
          <linearGradient id="paint109_linear_244_42443" x1="766.653" y1="102.572" x2="766.653" y2="188.999" gradientUnits="userSpaceOnUse"><stop stopColor="#3CBCA7" /><stop offset="1" stopColor="white" /></linearGradient>
          <linearGradient id="paint110_linear_244_42443" x1="667.134" y1="68.521" x2="667.134" y2="97.6903" gradientUnits="userSpaceOnUse"><stop stopColor="#3CBCA7" /><stop offset="1" stopColor="white" /></linearGradient>
          <linearGradient id="paint111_linear_244_42443" x1="747.162" y1="77.7443" x2="747.162" y2="97.6903" gradientUnits="userSpaceOnUse"><stop stopColor="#3CBCA7" /><stop offset="1" stopColor="white" /></linearGradient>
          <linearGradient id="paint112_linear_244_42443" x1="708.731" y1="43.4402" x2="708.731" y2="59.1425" gradientUnits="userSpaceOnUse"><stop stopColor="#3CBCA7" /><stop offset="1" stopColor="white" /></linearGradient>
          <clipPath id="clip0_244_42443">
            <rect width="1444" height="881" fill="white" transform="translate(-400)" />
          </clipPath>
        </defs>
      </svg>

      {children}
    </div>
  );
}