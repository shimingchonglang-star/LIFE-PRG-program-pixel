
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

  const bgStyle = isDay 
    ? 'bg-gradient-to-b from-blue-300 via-blue-200 to-green-100' 
    : 'bg-gradient-to-b from-indigo-900 via-purple-900 to-black';

  return (
    <div className={`min-h-screen w-full transition-colors duration-1000 ${bgStyle} relative overflow-hidden`}>
      {/* Decorative Elements */}
      {isDay ? (
        <>
          <div className="cloud top-10" style={{ left: '10%' }}>☁️</div>
          <div className="cloud top-40" style={{ left: '60%', animationDelay: '15s' }}>☁️</div>
          <div className="absolute top-10 right-10 text-6xl animate-pulse">☀️</div>
        </>
      ) : (
        <>
          <div className="absolute top-10 left-10 text-white text-xs pixel-font opacity-40">★</div>
          <div className="absolute top-20 right-40 text-white text-xs pixel-font opacity-20">★</div>
          <div className="absolute top-40 left-1/2 text-white text-xs pixel-font opacity-60">★</div>
          <div className="absolute top-10 right-20 text-5xl">🌙</div>
          <div className="absolute bottom-0 w-full h-32 bg-black/20 backdrop-blur-[2px]"></div>
        </>
      )}

      <div className="relative z-10 max-w-md mx-auto min-h-screen pt-10 pb-20 px-4">
        {children}
      </div>
    </div>
  );
};

export default Background;
