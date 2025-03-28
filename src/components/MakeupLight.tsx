
import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

type LightColor = 'white' | 'pink' | 'warm' | 'cool' | 'gold' | 'off';

interface MakeupLightProps {
  className?: string;
  onColorChange?: (color: LightColor) => void;
}

const MakeupLight: React.FC<MakeupLightProps> = ({ className, onColorChange }) => {
  const [currentColor, setCurrentColor] = useState<LightColor>('white');
  
  const colors: Record<LightColor, { bg: string, glow: string, icon: string }> = {
    white: { 
      bg: 'bg-white/20', 
      glow: 'shadow-[0_0_40px_25px_rgba(255,255,255,0.4)]',
      icon: 'text-white' 
    },
    pink: { 
      bg: 'bg-pink-300/20', 
      glow: 'shadow-[0_0_40px_25px_rgba(249,168,212,0.4)]',
      icon: 'text-pink-300' 
    },
    warm: { 
      bg: 'bg-amber-200/20', 
      glow: 'shadow-[0_0_40px_25px_rgba(253,230,138,0.4)]',
      icon: 'text-amber-200' 
    },
    cool: { 
      bg: 'bg-blue-200/20', 
      glow: 'shadow-[0_0_40px_25px_rgba(191,219,254,0.4)]',
      icon: 'text-blue-200' 
    },
    gold: { 
      bg: 'bg-idol-gold/20', 
      glow: 'shadow-[0_0_40px_25px_rgba(255,215,0,0.4)]',
      icon: 'text-idol-gold' 
    },
    off: { 
      bg: 'bg-gray-800/40', 
      glow: 'shadow-none',
      icon: 'text-gray-500' 
    }
  };
  
  const toggleLight = () => {
    // Cycle through colors including off
    const colorOrder: LightColor[] = ['white', 'pink', 'warm', 'cool', 'gold', 'off'];
    const currentIndex = colorOrder.indexOf(currentColor);
    const nextIndex = (currentIndex + 1) % colorOrder.length;
    const nextColor = colorOrder[nextIndex];
    
    setCurrentColor(nextColor);
    if (onColorChange) {
      onColorChange(nextColor);
    }
  };
  
  const isOn = currentColor !== 'off';
  
  return (
    <div 
      onClick={toggleLight}
      className={cn(
        "cursor-pointer transition-all duration-300 flex items-center justify-center",
        className
      )}
    >
      {/* Light circle */}
      <div 
        className={cn(
          "rounded-full transition-all duration-300 transform",
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
    </div>
  );
};

export default MakeupLight;
