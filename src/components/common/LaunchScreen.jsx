import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import logo from '../../assets/K_suit.png';

const PARTICLES = [
  [8, 14], [19, 72], [31, 24], [43, 83], [55, 12], [68, 68],
  [78, 28], [89, 76], [13, 46], [37, 58], [63, 42], [84, 51],
];

const LaunchScreen = ({ ready, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);
  const exitStartedRef = useRef(false);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => setIntroComplete(true),
    });

    tl.fromTo('.vibrant-particle', 
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 0.55, duration: 0.7, stagger: 0.035, ease: 'back.out(2)' }
    );

    tl.fromTo('.launch-logo-container',
      { scale: 0.8, opacity: 0, filter: 'blur(10px)' },
      { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power4.out' },
      '-=0.65'
    );

    tl.fromTo('.launch-progress',
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
      '-=0.35'
    );

    return () => tl.kill();
  }, []);

  useEffect(() => {
    if (!introComplete || !ready || exitStartedRef.current) return undefined;
    exitStartedRef.current = true;

    const tl = gsap.timeline({
      onComplete: () => {
        setIsVisible(false);
        onComplete?.();
      },
    });

    tl.to('.launch-content', { y: -16, scale: 1.04, opacity: 0, duration: 0.45, ease: 'power3.in' });
    tl.to('.launch-screen', {
      clipPath: 'inset(0 0 100% 0 round 0 0 45% 45%)',
      duration: 0.85,
      ease: 'expo.inOut'
    }, '-=0.15');

    return () => tl.kill();
  }, [introComplete, onComplete, ready]);

  if (!isVisible) return null;

  return (
    <div className="launch-screen fixed inset-0 z-[1000] flex flex-col items-center justify-center overflow-hidden bg-[#fffaf0] p-6 text-center" role="status" aria-live="polite" aria-label={ready ? 'Collection ready' : 'Loading collection'}>
      {/* Dynamic Vibrant Background Gradient */}
      <div className="absolute inset-[-25%] launch-silk" aria-hidden="true" />
      
      {/* Decorative Floating Blobs */}
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-[#CFB53B]/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-amber-200/20 blur-[120px] rounded-full animate-pulse-slow" />

      {/* Scattered Particles */}
      {PARTICLES.map(([left, top], i) => (
        <div 
          key={i}
          className="vibrant-particle absolute w-2 h-2 rounded-full bg-gradient-to-r from-accent to-highlight"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            opacity: 0
          }}
        />
      ))}

      <div className="launch-content relative z-10 flex w-full max-w-lg flex-col items-center">
        <p className="mb-14 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-900/60">A little everyday elegance</p>
        <div className="launch-logo-container relative opacity-0">
          {/* Animated Rings */}
          <div className="absolute inset-[-18px] rounded-full border border-[#b99455]/30" />
          <div className="absolute inset-[-12px] rounded-full border border-[#b99455]/15" />
          
          <div className="relative overflow-hidden rounded-full bg-white/60 p-9 shadow-[0_20px_50px_rgba(110,70,32,0.15)] backdrop-blur-md">
            <img src={logo} alt="Kamlesh Suits" className="h-auto w-32 mix-blend-multiply md:w-48" />
            <span className="launch-shine absolute inset-[-50%]" aria-hidden="true" />
          </div>
        </div>

        <div className="launch-progress mt-12 w-full max-w-xs opacity-0">
          <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-amber-900/70">
            <span>{ready ? 'Collection ready' : 'Curating your collection'}</span>
            <span>{ready ? '100%' : 'Loading'}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-amber-900/10">
            <div className={`h-full rounded-full bg-gradient-to-r from-[#8A4B20] via-[#CFB53B] to-[#8A4B20] transition-all duration-700 ${ready ? 'w-full' : 'w-2/3 animate-pulse'}`} />
          </div>
          <p className="mt-5 font-serif text-base italic text-stone-600">Woven with care. Worn with love.</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .launch-silk {
          background: repeating-linear-gradient(115deg, transparent 0%, #fffaf080 10%, #c6ad8526 18%, #fffaf0aa 25%, transparent 34%), radial-gradient(ellipse at 50% 40%, #fffdf8 5%, #eddfca 75%);
          animation: silk-drape 8s ease-in-out infinite alternate;
        }
        .launch-shine { background: linear-gradient(110deg, transparent 40%, #ffffff90 50%, transparent 60%); animation: silk-shine 4s ease-in-out infinite; }
        @keyframes silk-drape { from { transform: rotate(-8deg); } to { transform: translate(3%, 2%) rotate(-5deg); } }
        @keyframes silk-shine { 0%, 20% { transform: translateX(-65%); } 80%, 100% { transform: translateX(65%); } }
        @media (prefers-reduced-motion: reduce) { .launch-silk, .launch-shine { animation: none; } .launch-shine { display: none; } }
        @keyframes gradient-xy {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        .animate-gradient-xy {
          background-size: 400% 400%;
          animation: gradient-xy 15s ease infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 20s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}} />
    </div>
  );
};

export default LaunchScreen;
