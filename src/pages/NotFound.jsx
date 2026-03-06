import React from 'react';
import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';
import logo from '../assets/K_suit.png';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                {/* Decorative Element */}
                <div className="mb-8 relative inline-block">
                    <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl scale-150 animate-pulse" />
                    <img 
                        src={logo} 
                        alt="Kamlesh Suits" 
                        className="h-20 w-auto relative z-10 mx-auto opacity-20 grayscale"
                    />
                </div>

                <h1 className="text-[12rem] font-black text-stone-200 leading-none select-none tracking-tighter">
                    404
                </h1>
                
                <div className="relative -mt-16 z-10">
                    <h2 className="text-3xl font-serif text-primary mb-4 tracking-tight">Piece Not Found</h2>
                    <p className="text-secondary font-light mb-10 leading-relaxed">
                        The collection you are looking for has been moved or no longer exists. 
                        Let's get you back to our latest designs.
                    </p>

                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/20 hover:bg-accent transition-all hover:scale-105 active:scale-95"
                    >
                        <HiArrowLeft size={16} />
                        Return to Store
                    </Link>
                </div>

                <div className="mt-20 border-t border-stone-200 pt-8 flex justify-center gap-8">
                    <Link to="/new-arrivals" className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-primary transition">New Arrival</Link>
                    <Link to="/sale" className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-primary transition">On Sale</Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
