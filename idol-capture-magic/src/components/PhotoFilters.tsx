
import React from 'react';

interface FilterOption {
  name: string;
  className: string;
}

interface PhotoFiltersProps {
  onSelectFilter: (filter: string) => void;
  selectedFilter: string;
}

const PhotoFilters: React.FC<PhotoFiltersProps> = ({ onSelectFilter, selectedFilter }) => {
  const filters: FilterOption[] = [
    { name: 'Normal', className: '' },
    { name: 'Warm', className: 'sepia-[0.3] brightness-105' },
    { name: 'Cool', className: 'brightness-110 contrast-110 saturate-125 hue-rotate-[-10deg]' },
    { name: 'Vintage', className: 'sepia-[0.5] brightness-90 contrast-110' },
    { name: 'B&W', className: 'grayscale' },
    { name: 'Dramatic', className: 'contrast-125 brightness-90' },
    { name: 'Vivid', className: 'saturate-150 contrast-110 brightness-105' },
    { name: 'Muted', className: 'saturate-50 brightness-110' }
  ];

  return (
    <div className="overflow-x-auto py-4">
      <div className="flex gap-4 min-w-max">
        {filters.map((filter) => (
          <button
            key={filter.name}
            onClick={() => onSelectFilter(filter.name)}
            className={`flex flex-col items-center gap-2 transition-all ${
              selectedFilter === filter.name 
                ? 'scale-105 opacity-100' 
                : 'opacity-70 hover:opacity-90'
            }`}
          >
            <div className={`w-16 h-16 overflow-hidden rounded-lg border-2 ${
              selectedFilter === filter.name 
                ? 'border-idol-gold' 
                : 'border-transparent'
            }`}>
              <div className={`w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 ${filter.className}`} />
            </div>
            <span className="text-xs font-medium">
              {filter.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PhotoFilters;
