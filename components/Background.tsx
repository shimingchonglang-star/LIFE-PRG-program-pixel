
import React, { useState, useEffect } from 'react';

const Background: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDay, setIsDay] = useState(true);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsDay(hour >= 8 && hour < 18);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Night-centric palette for the moody RPG look from the reference
  const bgStyle = isDay 
    ? 'bg-[#2b2b3b]' 
    : 'bg-[#1a1a2e]';

  return (
    <div className={`min-h-screen w-full transition-colors duration-1000 ${bgStyle} relative overflow-hidden`}>
      {/* Decorative Stars */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 text-white text-[8px] pixel-font animate-pulse">★</div>
        <div className="absolute top-40 right-20 text-white text-[8px] pixel-font animate-pulse delay-75">★</div>
        <div className="absolute bottom-40 left-1/4 text-white text-[8px] pixel-font animate-pulse delay-150">★</div>
        <div className="absolute top-1/2 right-1/3 text-white text-[8px] pixel-font animate-pulse delay-300">★</div>
      </div>

      <div className="relative z-10 max-w-md mx-auto min-h-screen pb-32">
        {children}
      </div>
    </div>
  );
};

export default Background;
