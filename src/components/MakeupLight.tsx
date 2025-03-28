
import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

type LightColor = 'white' | 'pink' | 'warm' | 'cool' | 'gold';

interface MakeupLightProps {
  className?: string;
}

const MakeupLight: React.FC<MakeupLightProps> = ({ className }) => {
  const [isOn, setIsOn] = useState<boolean>(true);
  const [currentColor, setCurrentColor] = useState<LightColor>('white');
  
  const colors: Record<LightColor, { bg: string, glow: string, icon: string }> = {
    white: { 
      bg: 'bg-white/20', 
      glow: 'shadow-[0_0_30px_15px_rgba(255,255,255,0.3)]',
      icon: 'text-white' 
    },
    pink: { 
      bg: 'bg-pink-300/20', 
      glow: 'shadow-[0_0_30px_15px_rgba(249,168,212,0.3)]',
      icon: 'text-pink-300' 
    },
    warm: { 
      bg: 'bg-amber-200/20', 
      glow: 'shadow-[0_0_30px_15px_rgba(253,230,138,0.3)]',
      icon: 'text-amber-200' 
    },
    cool: { 
      bg: 'bg-blue-200/20', 
      glow: 'shadow-[0_0_30px_15px_rgba(191,219,254,0.3)]',
      icon: 'text-blue-200' 
    },
    gold: { 
      bg: 'bg-idol-gold/20', 
      glow: 'shadow-[0_0_30px_15px_rgba(255,215,0,0.3)]',
      icon: 'text-idol-gold' 
    }
  };
  
  const toggleLight = () => {
    if (!isOn) {
      setIsOn(true);
    } else {
      // Cycle through colors
      const colorOrder: LightColor[] = ['white', 'pink', 'warm', 'cool', 'gold'];
      const currentIndex = colorOrder.indexOf(currentColor);
      const nextIndex = (currentIndex + 1) % colorOrder.length;
      setCurrentColor(colorOrder[nextIndex]);
    }
  };
  
  const toggleOff = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOn(false);
  };
  
  return (
    <div 
      className={cn(
        "absolute z-10 transition-all duration-300 flex flex-col items-center", 
        className
      )}
    >
      {/* Light circle */}
      <div 
        onClick={toggleLight}
        className={cn(
          "rounded-full cursor-pointer transition-all duration-300 transform",
          isOn ? cn(colors[currentColor].bg, colors[currentColor].glow) : "bg-gray-800/40 shadow-none",
          "w-12 h-12 flex items-center justify-center"
        )}
      >
        <Lightbulb 
          className={cn(
            "w-6 h-6 transition-colors duration-300",
            isOn ? colors[currentColor].icon : "text-gray-500"
          )} 
        />
      </div>
      
      {/* Off button (tiny) */}
      {isOn && (
        <button 
          onClick={toggleOff}
          className="mt-1 text-xs rounded-full bg-gray-800/70 text-white w-4 h-4 flex items-center justify-center hover:bg-red-500/70 transition-colors"
        >
          ×
        </button>
      )}
      
      {/* Light beam effect when on */}
      {isOn && (
        <div 
          className={cn(
            "absolute light-beam -z-10 opacity-30 transition-opacity duration-300",
            `light-beam-${currentColor}`
          )}
          style={{
            width: '150vw',
            height: '150vh',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(45deg)',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};

export default MakeupLight;
