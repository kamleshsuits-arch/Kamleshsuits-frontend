// src/components/Hero.jsx — Mobile: honey-gold gradient banner
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "../../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import LocationBar from "../common/LocationBar";
import hero1 from "../../assets/hero1.webp";
import hero2 from "../../assets/hero2.jpg";

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const { user } = useAuth();
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const imageRef = useRef(null);
  const mobileHeroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (textRef.current) {
        gsap.fromTo(textRef.current.children,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out" }
        );
      }
      if (imageRef.current) {
        gsap.fromTo(imageRef.current,
          { scale: 1.1, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.5, ease: "power2.out" }
        );
      }
      if (mobileHeroRef.current) {
        gsap.fromTo(mobileHeroRef.current.children,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: "power3.out" }
        );
      }
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative overflow-hidden">

      {/* ===== MOBILE HERO — Animated Theme Gradient ===== */}
      <div className="md:hidden relative overflow-hidden theme-animated-gradient">
        {/* Animated Background Layers */}
        <div className="theme-blob-1 absolute top-[-60px] right-[-40px] w-64 h-64 rounded-full bg-white/20 blur-3xl pointer-events-none" />
        <div className="theme-blob-2 absolute bottom-[-30px] left-[-40px] w-48 h-48 rounded-full bg-black/20 blur-3xl pointer-events-none" />
        
        {/* Dot pattern overlay for texture */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        <div ref={mobileHeroRef} className="relative z-10 px-5 pt-16 pb-4">
          <div className="flex items-center justify-between">
            {/* Text Side (Left) */}
            <div className="w-[55%] flex flex-col justify-center">
              {user && (
                <p className="text-yellow-100 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                  Namaste, {user.name?.split(' ')[0] || user.email?.split('@')[0]}
                </p>
              )}

              <h1 className="text-white font-serif text-2xl leading-snug mb-1 drop-shadow-sm">
                Shop Premium<br />
                <span className="text-white italic font-serif text-[22px]">Ladies Suits</span>
              </h1>
              <p className="text-yellow-100/80 text-[9px] font-semibold mb-3 tracking-widest uppercase">
                Festive &bull; Wedding
              </p>

              <div className="flex flex-col gap-2 mb-2">
                <Link
                  to="/new-arrivals"
                  className="flex items-center justify-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/40 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-inner hover:bg-white/30 transition text-center w-full max-w-[120px]"
                >
                  ✨ New Arrivals
                </Link>
                <Link
                  to="/sale"
                  className="flex items-center justify-center gap-1.5 bg-white text-amber-700 text-[10px] font-black px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition text-center w-full max-w-[120px]"
                >
                  🏷️ Sale On Now
                </Link>
              </div>
            </div>

            {/* Model Images Block (Right) */}
            <div className="w-[45%] h-[230px] relative pointer-events-none mt-4">
              {/* hero1: Larger, background layer */}
              <div className="absolute top-0 right-8 w-[115px] h-[155px] overflow-hidden rounded-xl shadow-xl z-10 border-[3px] border-white/80 rotate-[4deg]">
                <img src={hero1} alt="Elegant Suit" className="w-full h-full object-cover" />
              </div>
              {/* hero2: Smaller, top layer */}
              <div className="absolute top-[90px] right-[-10px] w-[100px] h-[135px] overflow-hidden rounded-lg shadow-2xl z-20 border-[2px] border-white/60 -rotate-[6deg]">
                <img src={hero2} alt="Cotton Suit" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Free shipping strip */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/25 flex items-center gap-3 mt-4 w-fit shadow-[0_8px_16px_rgba(0,0,0,0.1)]">
            <div className="text-xl drop-shadow-md">👗</div>
            <div className="flex-1 pr-2">
              <p className="text-white text-[10px] font-black uppercase tracking-wide">Free Shipping</p>
              <p className="text-yellow-100/90 text-[9px]">On orders over ₹5,000</p>
            </div>
            <div className="bg-white/20 text-white text-[8px] font-black px-2 py-0.5 rounded border border-white/30 uppercase tracking-widest shadow-inner">
              Auto
            </div>
          </div>
        </div>

        {/* Curved bottom edge with Location Bar integrated */}
        <div className="bg-white rounded-t-[2.5rem] mt-6 overflow-hidden">
           <div className="pt-4 pb-1">
              <LocationBar className="!border-none" />
           </div>
        </div>
      </div>

      {/* ===== DESKTOP HERO — unchanged ===== */}
      <section className="hidden md:flex relative min-h-[90vh] items-center bg-background overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-muted/30 -skew-x-12 transform origin-top-right z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full">
          <div ref={textRef} className="text-center md:text-left space-y-4 md:space-y-6 py-10 md:py-0">
            <div className="flex flex-col gap-1">
              {user && <p className="text-accent font-black uppercase tracking-[0.3em] text-[10px] mb-1">Namaste, {user.name || user.email?.split('@')[0]}</p>}
              <span className="inline-block text-accent tracking-widest uppercase text-xs md:text-sm font-bold border-b border-accent pb-1 self-center md:self-start w-fit">
                New Collection {new Date().getFullYear()}
              </span>
            </div>
            <h1 className="text-4xl md:text-7xl font-serif text-primary leading-tight">
              Elegance in <br />
              <span className="italic text-secondary">Every Stitch</span>
            </h1>
            <p className="text-sm md:text-lg text-secondary max-w-md mx-auto md:mx-0 font-light leading-relaxed">
              Discover our exclusive range of premium suits and ethnic wear.
            </p>
            <div className="pt-4">
              <button
                onClick={() => document.getElementById('collection-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gray-800 text-white px-10 py-4 rounded-none uppercase tracking-widest text-sm hover:bg-accent transition shadow-xl"
              >
                Our Collection
              </button>
            </div>
          </div>
          <div ref={imageRef} className="relative h-[600px] hidden md:block">
            <div className="absolute top-10 right-10 w-80 h-[500px] overflow-hidden shadow-2xl z-20">
              <img src={hero1} alt="Elegant Suit" className="w-full h-full object-cover hover:scale-105 transition duration-700" />
            </div>
            <div className="absolute bottom-10 left-10 w-72 h-[400px] overflow-hidden shadow-xl z-10 border-4 border-white">
              <img src={hero2} alt="Cotton Suit" className="w-full h-full object-cover hover:scale-105 transition duration-700" />
            </div>
          </div>
        </div>
      </section>

    </section>
  );
};

export default Hero;
