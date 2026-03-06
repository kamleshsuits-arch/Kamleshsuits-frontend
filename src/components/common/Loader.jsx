import React from 'react';

const Loader = ({ message = 'Loading...' }) => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-stone-50/50">
        <div className="relative w-20 h-20">
            {/* Outer Ring */}
            <div className="absolute inset-0 border-4 border-stone-100 rounded-full" />
            
            {/* Spinning Arc */}
            <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin" />
            
            {/* Inner Counter-Spinning Ring */}
            <div className="absolute inset-2 border-2 border-primary rounded-full border-b-transparent animate-[spin_1.5s_linear_infinite]" />
            
            {/* Center Pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            </div>
        </div>
        
        {/* Text & Dots */}
        <div className="text-center">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-1 animate-pulse">
                {message}
            </p>
            <div className="flex items-center justify-center gap-1">
                <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
            </div>
        </div>
    </div>
);

export default Loader;
