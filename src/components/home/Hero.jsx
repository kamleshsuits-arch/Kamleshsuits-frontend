// src/components/Hero.jsx — Mobile: honey-gold gradient banner
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { HiArrowRight, HiSparkles, HiTag, HiTruck } from "react-icons/hi";
import LocationBar from "../common/LocationBar";
import hero1 from "../../assets/hero1.webp";
import hero2 from "../../assets/hero2.jpg";
import rustic from "../../assets/Rustic.jpeg";
import naviBlue from "../../assets/Navi_blue.jpeg";
import brown from "../../assets/Brown.jpeg";
import { fetchPublicBanners, fetchPublicHeroImages } from "../../api/banners";

gsap.registerPlugin(ScrollTrigger);

const cleanBannerText = value => {
  const text = String(value ?? '').trim();
  return ['null', 'undefined'].includes(text.toLowerCase()) ? '' : text;
};

const rgbaFromHex = (hex = '#000000', alpha = 1) => {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : '000000';
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const getBannerOverlay = banner => {
  const opacity = Math.min(95, Math.max(20, Number(banner.overlay_opacity) || 78)) / 100;
  const color = banner.overlay_color || '#000000';
  return `linear-gradient(to top, ${rgbaFromHex(color, opacity)} 0%, ${rgbaFromHex(color, opacity * 0.48)} 48%, ${rgbaFromHex(color, 0.04)} 100%)`;
};

const DEFAULT_HERO_IMAGES = [
  { src: rustic, alt: "Rustic Suit", lineOne: "Featured piece", lineTwo: "Rustic Suit", lineOneColor: "#FDE68A", lineTwoColor: "#FFFFFF" },
  { src: naviBlue, alt: "Navi Blue Suit", lineOne: "Featured piece", lineTwo: "Navi Blue Suit", lineOneColor: "#FDE68A", lineTwoColor: "#FFFFFF" },
  { src: brown, alt: "Brown Suit", lineOne: "Featured piece", lineTwo: "Brown Suit", lineOneColor: "#FDE68A", lineTwoColor: "#FFFFFF" },
  { src: hero1, alt: "Elegant Suit", lineOne: "Featured piece", lineTwo: "Elegant Suit", lineOneColor: "#FDE68A", lineTwoColor: "#FFFFFF" },
  { src: hero2, alt: "Cotton Suit", lineOne: "Featured piece", lineTwo: "Cotton Suit", lineOneColor: "#FDE68A", lineTwoColor: "#FFFFFF" },
];

const Hero = () => {
  const { user } = useAuth();
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const imageRef = useRef(null);
  const mobileHeroRef = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);
  const [liveBanners, setLiveBanners] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [images, setImages] = useState(DEFAULT_HERO_IMAGES);

  useEffect(() => {
    let active = true;
    const loadBanners = async () => {
      try {
        const data = await fetchPublicBanners();
        if (active) {
          setLiveBanners(data || []);
          setBannerIdx(current => (data?.length ? current % data.length : 0));
        }
      } catch (error) {
        console.error('Home banners unavailable; using the default hero.', error);
      }
    };
    loadBanners();
    const refresh = setInterval(loadBanners, 60000);
    return () => { active = false; clearInterval(refresh); };
  }, []);

  useEffect(() => {
    let active = true;
    const loadHeroImages = async () => {
      try {
        const data = await fetchPublicHeroImages();
        if (!active || !Array.isArray(data)) return;
        const uploaded = data.map(item => ({
          src: item.image,
          alt: cleanBannerText(item.alt_text) || cleanBannerText(item.line_two) || 'Featured suit',
          lineOne: cleanBannerText(item.line_one),
          lineTwo: cleanBannerText(item.line_two),
          lineOneColor: item.line_one_color || '#FDE68A',
          lineTwoColor: item.line_two_color || '#FFFFFF',
        })).filter(item => item.src);
        const nextImages = [...DEFAULT_HERO_IMAGES, ...uploaded];
        setImages(nextImages);
        setCurrentIdx(current => current % nextImages.length);
        setPrevIdx(current => current % nextImages.length);
      } catch (error) {
        console.error('Custom hero images unavailable; using the built-in carousel.', error);
      }
    };
    loadHeroImages();
    const refresh = setInterval(loadHeroImages, 60000);
    return () => { active = false; clearInterval(refresh); };
  }, []);

  useEffect(() => {
    if (liveBanners.length < 2) return undefined;
    const timer = setInterval(() => setBannerIdx(current => (current + 1) % liveBanners.length), 6000);
    return () => clearInterval(timer);
  }, [liveBanners.length]);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setPrevIdx(currentIdx);
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(timer);
  }, [currentIdx, images.length]);

  // Handle image transitions with GSAP (Clean fade, no blur)
  useEffect(() => {
    const imagesToFade = heroRef.current?.querySelectorAll('.image-overlay');
    if (imagesToFade?.length) {
      gsap.fromTo(imagesToFade,
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 1.2, ease: "sine.inOut" }
      );
    }
  }, [currentIdx]);

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

  if (liveBanners.length > 0) {
    const banner = liveBanners[bannerIdx] || liveBanners[0];
    const bannerLink = cleanBannerText(banner.link_url);
    const actionLabel = cleanBannerText(banner.cta_label) || (bannerLink ? 'Explore collection' : '');
    return (
      <section className="relative overflow-hidden bg-stone-900">
        <div className="relative md:hidden">
          <div role="img" aria-label={banner.alt_text || banner.title} className="aspect-[4/5] max-h-[680px] w-full bg-cover bg-center" style={{ backgroundImage: `url(${banner.mobile_image || banner.desktop_image})` }} />
          <BannerOverlay banner={banner} actionLabel={actionLabel} bannerLink={bannerLink} compact />
          <BannerDots banners={liveBanners} current={bannerIdx} onSelect={setBannerIdx} />
          <div className="bg-white rounded-t-[2.5rem] -mt-5 relative z-20 overflow-hidden"><div className="pt-4 pb-1"><LocationBar className="!border-none" /></div></div>
        </div>
        <div className="relative hidden md:block">
          <div role="img" aria-label={banner.alt_text || banner.title} className="aspect-[8/3] min-h-[430px] max-h-[680px] w-full bg-cover bg-center" style={{ backgroundImage: `url(${banner.desktop_image})` }} />
          <BannerOverlay banner={banner} actionLabel={actionLabel} bannerLink={bannerLink} />
          <BannerDots banners={liveBanners} current={bannerIdx} onSelect={setBannerIdx} />
        </div>
      </section>
    );
  }

  return (
    <section ref={heroRef} className="relative overflow-hidden">

      {/* ===== MOBILE HERO — Product-first premium edit ===== */}
      <div className="md:hidden relative overflow-hidden theme-animated-gradient">
        <div className="theme-blob-1 absolute -right-24 top-4 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />
        <div className="theme-blob-2 absolute -left-28 bottom-16 h-64 w-64 rounded-full bg-rose-300/20 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '22px 22px'
        }} />
        <div className="absolute inset-x-0 top-14 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />

        <div ref={mobileHeroRef} className="relative z-10 px-4 pt-[4.5rem] pb-5 min-[380px]:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200/25 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-amber-100 backdrop-blur-md">
                <HiSparkles size={13} /> New season edit
              </div>
              {user && (
                <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-amber-100/80">
                  Namaste, {user.name?.split(' ')[0] || user.email?.split('@')[0]}
                </p>
              )}
              <h1 className="font-serif text-[1.75rem] leading-[1.05] text-white drop-shadow-sm min-[380px]:text-[2rem]">
                Your statement look,
                <span className="mt-1 block italic text-amber-200">beautifully curated.</span>
              </h1>
            </div>
            <span className="shrink-0 rounded-full border border-white/15 bg-black/15 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-white/75 backdrop-blur-sm">
              Premium suits
            </span>
          </div>

          {/* Product gallery: the active item is the main hero highlight. */}
          <div className="relative mt-4 h-[278px] min-[380px]:h-[300px]" aria-roledescription="carousel" aria-label="Featured suit collection">
            <div className="absolute left-0 top-6 h-[176px] w-[31%] -rotate-6 overflow-hidden rounded-[1.4rem] border border-white/35 bg-white/10 shadow-2xl">
              <img src={images[(currentIdx + images.length - 1) % images.length].src} alt={images[(currentIdx + images.length - 1) % images.length].alt} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#260914]/45 to-transparent" />
            </div>

            <div className="absolute right-0 top-10 h-[166px] w-[29%] rotate-6 overflow-hidden rounded-[1.4rem] border border-white/35 bg-white/10 shadow-2xl">
              <img src={images[(currentIdx + 1) % images.length].src} alt={images[(currentIdx + 1) % images.length].alt} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#260914]/45 to-transparent" />
            </div>

            <div className="absolute left-1/2 top-0 z-10 h-[252px] w-[61%] max-w-[230px] -translate-x-1/2 overflow-hidden rounded-[2rem] border-[3px] border-white/70 bg-stone-100 shadow-[0_24px_55px_rgba(12,3,8,0.55)] min-[380px]:h-[274px]">
              <img src={images[prevIdx].src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
              <img src={images[currentIdx].src} alt={images[currentIdx].alt} className="image-overlay absolute inset-0 h-full w-full object-cover opacity-0" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-4 pb-4 pt-14 text-white">
                <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: images[currentIdx].lineOneColor }}>{images[currentIdx].lineOne}</p>
                <p className="mt-0.5 font-serif text-base font-bold" style={{ color: images[currentIdx].lineTwoColor }}>{images[currentIdx].lineTwo}</p>
              </div>
              <div className="absolute right-3 top-3 rounded-full border border-white/30 bg-black/25 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                0{currentIdx + 1} / 0{images.length}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-1.5">
              {images.map((image, idx) => (
                <button
                  key={image.alt}
                  type="button"
                  onClick={() => { setPrevIdx(currentIdx); setCurrentIdx(idx); }}
                  aria-label={`Show ${image.alt}`}
                  className={`h-1.5 rounded-full transition-all ${idx === currentIdx ? 'w-7 bg-amber-200' : 'w-1.5 bg-white/35'}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Link to="/new-arrivals" className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-[10px] font-black uppercase tracking-wide text-[#681f3b] shadow-xl transition active:scale-[0.98]">
              Explore new <HiArrowRight size={15} />
            </Link>
            <Link to="/sale" className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-amber-200/35 bg-amber-200/15 px-3 text-[10px] font-black uppercase tracking-wide text-amber-100 backdrop-blur-md transition active:scale-[0.98]">
              <HiTag size={15} /> Shop offers
            </Link>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/15 bg-black/10 px-3 py-2.5 text-white/90 backdrop-blur-sm">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-200/15 text-amber-200"><HiTruck size={18} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wide">Complimentary shipping</p>
              <p className="text-[9px] text-amber-100/75">Automatically applied on orders above ₹5,000</p>
            </div>
            <span className="rounded-full bg-white/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider">Auto</span>
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
                onClick={() => document.getElementById('collection-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="bg-gray-800 text-white px-10 py-4 rounded-none uppercase tracking-widest text-sm hover:bg-accent transition shadow-xl"
              >
                Our Collection
              </button>
            </div>
          </div>
          <div ref={imageRef} className="relative h-[600px] hidden md:block">
            {/* Slot 1: Desktop Main stack */}
            <div className="absolute top-10 right-10 w-80 h-[500px] overflow-hidden shadow-2xl z-20 bg-muted">
              <img 
                src={images[prevIdx].src} 
                alt={images[prevIdx].alt} 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <img 
                src={images[currentIdx].src} 
                alt={images[currentIdx].alt} 
                className="absolute inset-0 w-full h-full object-cover image-overlay opacity-0"
              />
            </div>
            {/* Slot 2: Desktop Sub stack */}
            <div className="absolute bottom-10 left-10 w-72 h-[400px] overflow-hidden shadow-xl z-10 border-4 border-white bg-muted">
              <img 
                src={images[(prevIdx + 1) % images.length].src} 
                alt={images[(prevIdx + 1) % images.length].alt} 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <img 
                src={images[(currentIdx + 1) % images.length].src} 
                alt={images[(currentIdx + 1) % images.length].alt} 
                className="absolute inset-0 w-full h-full object-cover image-overlay opacity-0"
              />
            </div>

            {/* Subtle Carousel Indicators */}
            <div className="absolute bottom-0 right-10 flex gap-2 z-30">
              {images.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1 transition-all duration-300 ${idx === currentIdx ? 'w-8 bg-amber-600' : 'w-4 bg-gray-300'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

    </section>
  );
};

const BannerOverlay = ({ banner, actionLabel, bannerLink, compact = false }) => (
  <div className="absolute inset-0 flex items-end md:items-center" style={{ background: getBannerOverlay(banner) }}>
    <div className={`mx-auto w-full max-w-7xl px-5 text-white sm:px-8 lg:px-12 ${compact ? 'pb-14' : 'pb-10 md:pb-0'}`}>
      <div className="max-w-xl">
        <span className="inline-flex rounded-full border border-white/30 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">{cleanBannerText(banner.banner_kind || 'featured').replace('-', ' ')}</span>
        {(cleanBannerText(banner.headline) || cleanBannerText(banner.headline_suffix) || (Array.isArray(banner.animated_words) && banner.animated_words.some(cleanBannerText))) && <RotatingBannerHeadline key={banner.suitId} banner={banner} compact={compact} />}
        {cleanBannerText(banner.subheading) && <p style={{ color: banner.subheading_color || '#FFFFFF' }} className={`mt-3 max-w-lg font-medium drop-shadow ${compact ? 'text-sm' : 'text-lg'}`}>{cleanBannerText(banner.subheading)}</p>}
        {actionLabel && bannerLink && <BannerAction to={bannerLink} label={actionLabel} backgroundColor={banner.cta_background_color} textColor={banner.cta_text_color} />}
      </div>
    </div>
  </div>
);

const RotatingBannerHeadline = ({ banner, compact }) => {
  const words = Array.isArray(banner.animated_words) ? banner.animated_words.map(cleanBannerText).filter(Boolean) : [];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (words.length < 2) return undefined;
    const timer = setInterval(() => setWordIndex(current => (current + 1) % words.length), 3000);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <h1 className={`mt-3 max-w-3xl font-serif font-bold leading-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.8)] ${compact ? 'text-3xl' : 'text-5xl lg:text-6xl'}`}>
      {cleanBannerText(banner.headline) && <span style={{ color: banner.headline_color || '#FFFFFF' }}>{cleanBannerText(banner.headline)} </span>}
      {words.length > 0 && <span key={`${banner.suitId}-${wordIndex}`} aria-live="polite" style={{ color: banner.animated_word_color || '#FCD34D' }} className="inline-block animate-in fade-in slide-in-from-bottom-2 duration-500">{words[wordIndex]}</span>}
      {cleanBannerText(banner.headline_suffix) && <span style={{ color: banner.headline_suffix_color || '#FFFFFF' }}> {cleanBannerText(banner.headline_suffix)}</span>}
    </h1>
  );
};

const BannerAction = ({ to, label, backgroundColor, textColor }) => {
  const classes = "mt-5 mb-8 inline-flex min-h-11 items-center rounded-full px-6 py-3 text-sm font-black shadow-xl transition hover:-translate-y-0.5 hover:brightness-95 md:mb-4";
  const style = { backgroundColor: backgroundColor || '#FFFFFF', color: textColor || '#1C1917' };
  return to.startsWith('/') ? <Link to={to} style={style} className={classes}>{label}</Link> : <a href={to} style={style} className={classes}>{label}</a>;
};

const BannerDots = ({ banners, current, onSelect }) => banners.length > 1 && (
  <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:bottom-6">
    {banners.map((banner, index) => <button key={banner.suitId} onClick={() => onSelect(index)} aria-label={`Show banner ${index + 1}`} className={`h-2 rounded-full shadow transition-all ${index === current ? 'w-8 bg-white' : 'w-2 bg-white/55 hover:bg-white'}`} />)}
  </div>
);

export default Hero;
