// src/components/Hero.jsx
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "../../context/AuthContext";
import hero1 from "../../assets/hero1.webp";
import hero2 from "../../assets/hero2.jpg";

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const { user } = useAuth();
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Text Animation
      if (textRef.current) {
        gsap.fromTo(
          textRef.current.children,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out",
          }
        );
      }

      // Image Animation
      if (imageRef.current) {
        gsap.fromTo(
          imageRef.current,
          { scale: 1.1, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 1.5,
            ease: "power2.out",
          }
        );
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[40vh] md:min-h-[90vh] flex items-center bg-background overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-muted/30 -skew-x-12 transform origin-top-right z-0 hidden md:block" />
      
      {/* Mobile Banner Image (Visible only on mobile) */}
      <div className="absolute inset-0 md:hidden z-0">
        <img 
          src={hero1} 
          alt="Mobile Banner" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-black/20" /> {/* Overlay for text readability */}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full">
        
        {/* Text Content */}
        <div ref={textRef} className="text-center md:text-left space-y-4 md:space-y-6 py-10 md:py-0">
          <div className="flex flex-col gap-1">
            {user && (
              <p className="text-accent font-black uppercase tracking-[0.3em] text-[10px] mb-1">
                Namaste, {user.name || user.email?.split('@')[0]}
              </p>
            )}
            <span className="inline-block text-white md:text-accent tracking-widest uppercase text-xs md:text-sm font-bold border-b border-white md:border-accent pb-1 shadow-sm md:shadow-none self-center md:self-start w-fit">
              New Collection {new Date().getFullYear()}
            </span>
          </div>

          <h1 className="text-4xl md:text-7xl font-serif text-white md:text-primary leading-tight drop-shadow-md md:drop-shadow-none">
            Elegance in <br />
            <span className="italic text-white md:text-secondary">Every Stitch</span>
          </h1>

          <p className="text-sm md:text-lg text-white md:text-secondary max-w-md mx-auto md:mx-0 font-light leading-relaxed drop-shadow-sm md:drop-shadow-none">
            Discover our exclusive range of premium suits and ethnic wear.
          </p>

          <div className="pt-4">
            <button 
              onClick={() => {
                document.getElementById('collection-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-primary md:bg-gray-800 md:text-white px-8 py-3 md:px-10 md:py-4 rounded-none uppercase tracking-widest text-xs md:text-sm hover:bg-accent hover:text-white transition duration-300 ease-in-out shadow-xl hover:shadow-2xl"
            >
              Our Collection
            </button>
          </div>
        </div>

        {/* Hero Images (Desktop Only) */}
        <div ref={imageRef} className="relative h-[600px] hidden md:block">
          <div className="absolute top-10 right-10 w-80 h-[500px] overflow-hidden shadow-2xl z-20">
            <img
              src={hero1}
              alt="Elegant Magenta Suit"
              className="w-full h-full object-cover hover:scale-105 transition duration-700"
            />
          </div>
          <div className="absolute bottom-10 left-10 w-72 h-[400px] overflow-hidden shadow-xl z-10 border-4 border-white">
            <img
              src={hero2}
              alt="Sky Blue Cotton Suit"
              className="w-full h-full object-cover hover:scale-105 transition duration-700"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
