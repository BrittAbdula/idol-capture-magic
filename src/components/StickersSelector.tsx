
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface StickersSelectorProps {
  selectedSticker: string | null;
  onSelectSticker: (stickerUrl: string) => void;
}

const StickersSelector: React.FC<StickersSelectorProps> = ({ 
  selectedSticker,
  onSelectSticker 
}) => {
  // For now we'll use placeholder stickers
  // In a real app, these would be actual sticker images
  // We'll create colored boxes as placeholders
  const stickers = [
    {
      id: 'sticker1',
      url: '/lovable-uploads/fcb2334a-40ac-48ae-99cb-3c57986d24fd.png',
      alt: 'Placeholder Sticker'
    },
    {
      id: 'sticker2',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FFD700" rx="10" ry="10"/><text x="50" y="50" font-family="Arial" font-size="20" text-anchor="middle" dominant-baseline="middle" fill="%23000">★</text></svg>',
      alt: 'Star Sticker'
    },
    {
      id: 'sticker3',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FF6B6B" rx="50" ry="50"/><text x="50" y="50" font-family="Arial" font-size="40" text-anchor="middle" dominant-baseline="middle" fill="%23FFF">♥</text></svg>',
      alt: 'Heart Sticker'
    },
    {
      id: 'sticker4',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%234ECDC4" rx="10" ry="10"/><text x="50" y="50" font-family="Arial" font-size="30" text-anchor="middle" dominant-baseline="middle" fill="%23FFF">✓</text></svg>',
      alt: 'Checkmark Sticker'
    }
  ];

  // Clear sticker selection
  const clearSelection = () => {
    onSelectSticker('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {stickers.map(sticker => (
          <button
            key={sticker.id}
            onClick={() => onSelectSticker(sticker.url)}
            className={`w-16 h-16 border rounded-md transition-all overflow-hidden ${
              selectedSticker === sticker.url 
                ? 'ring-2 ring-idol-gold scale-105' 
                : 'hover:scale-105'
            }`}
            title={sticker.alt}
          >
            <img 
              src={sticker.url} 
              alt={sticker.alt}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
      
      {selectedSticker && (
        <div className="mt-3 flex justify-center">
          <button 
            onClick={clearSelection}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-idol-gold"
          >
            <X size={12} />
            <span>Remove Sticker</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default StickersSelector;
