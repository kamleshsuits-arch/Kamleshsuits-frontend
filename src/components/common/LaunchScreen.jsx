import React, { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import logo from '../../assets/K_suit.png';

const LaunchScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }
    });

    // 1. Particle entrance
    tl.fromTo('.vibrant-particle', 
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 0.6, duration: 1, stagger: 0.05, ease: 'back.out(2)' }
    );

    // 2. Logo Glow & Scale
    tl.fromTo('.launch-logo-container',
      { scale: 0.8, opacity: 0, filter: 'blur(10px)' },
      { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power4.out' },
      '-=0.8'
    );

    // 3. Text Reveal with Letter Stagger
    tl.fromTo('.launch-title span',
      { y: 40, opacity: 0, rotationX: -90 },
      { y: 0, opacity: 1, rotationX: 0, duration: 0.8, stagger: 0.03, ease: 'power2.out' },
      '-=0.6'
    );

    tl.fromTo('.launch-tagline',
      { opacity: 0, letterSpacing: '0.1em' },
      { opacity: 1, letterSpacing: '0.3em', duration: 1.2, ease: 'power2.out' },
      '-=0.4'
    );

    // 4. Captivating Exit
    tl.to('.launch-logo-container', {
      scale: 1.1,
      opacity: 0,
      duration: 1,
      ease: 'power4.inOut'
    }, '+=0.5');

    tl.to('.launch-screen', {
      clipPath: 'circle(0% at 50% 50%)',
      duration: 1.2,
      ease: 'expo.inOut'
    }, '-=0.5');

  }, [onComplete]);

  if (!isVisible) return null;

  const title = "Kamlesh Suits";

  return (
    <div className="launch-screen fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Dynamic Vibrant Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#CFB53B]/30 via-white to-amber-100/40 animate-gradient-xy" />
      
      {/* Decorative Floating Blobs */}
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-[#CFB53B]/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-blue-200/20 blur-[120px] rounded-full animate-pulse-slow" />

      {/* Scattered Particles */}
      {[...Array(12)].map((_, i) => (
        <div 
          key={i}
          className="vibrant-particle absolute w-2 h-2 rounded-full bg-gradient-to-r from-accent to-highlight"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0
          }}
        />
      ))}

      <div className="relative z-10 space-y-12">
        <div className="launch-logo-container relative">
          {/* Animated Rings */}
          <div className="absolute inset-[-40px] rounded-full border-2 border-dashed border-[#CFB53B]/30 animate-spin-slow" />
          <div className="absolute inset-[-20px] rounded-full border border-[#CFB53B]/10 animate-spin-reverse" />
          
          <div className="relative p-6 bg-white/40 backdrop-blur-md rounded-full shadow-[0_0_50px_rgba(207,181,59,0.2)]">
            <img src={logo} alt="Kamlesh Suits" className="w-32 md:w-48 h-auto mix-blend-multiply" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="launch-title text-3xl md:text-5xl font-serif text-primary tracking-tight perspective-1000">
            {title.split("").map((char, i) => (
              <span key={i} className="inline-block whitespace-pre">{char}</span>
            ))}
          </h2>
          <p className="launch-tagline text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#CFB53B] opacity-0">
            Elegance in Every Stitch
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
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
