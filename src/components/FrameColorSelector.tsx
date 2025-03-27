
import React from 'react';

interface FrameColorSelectorProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

const FrameColorSelector: React.FC<FrameColorSelectorProps> = ({ 
  selectedColor,
  onSelectColor
}) => {
  // Frame color options
  const colors = [
    { value: '#FFFFFF', name: 'White' },
    { value: '#000000', name: 'Black' },
    { value: '#FDE1D3', name: 'Soft Peach' },
    { value: '#FFDEE2', name: 'Soft Pink' },
    { value: '#D3E4FD', name: 'Soft Blue' },
    { value: '#F1F0FB', name: 'Soft Gray' },
    { value: '#FF719A', name: 'Hot Pink' },
    { value: '#1E2962', name: 'Navy' },
    { value: '#E0F7E0', name: 'Mint' },
    { value: '#FFE8C8', name: 'Cream' },
    { value: '#1A0F0F', name: 'Dark Brown' },
    { value: '#B8CBDE', name: 'Powder Blue' },
    { value: '#F0E0E0', name: 'Dusty Rose' },
    { value: '#D0E6FF', name: 'Sky Blue' },
    { value: '#FFF8A9', name: 'Pastel Yellow' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map(color => (
        <button
          key={color.value}
          onClick={() => onSelectColor(color.value)}
          className={`w-8 h-8 rounded-full transition-all ${
            selectedColor === color.value 
              ? 'ring-2 ring-offset-2 ring-idol-gold scale-110' 
              : 'hover:scale-110'
          }`}
          style={{ backgroundColor: color.value }}
          title={color.name}
          aria-label={`Select ${color.name} color`}
        />
      ))}
    </div>
  );
};

export default FrameColorSelector;
