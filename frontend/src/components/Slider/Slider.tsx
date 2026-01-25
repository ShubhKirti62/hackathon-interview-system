import React, { useState, useRef, useEffect } from 'react';

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  showValue?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  marks?: { value: number; label: string }[];
}

const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  showValue = true,
  color = 'primary',
  size = 'medium',
  disabled = false,
  marks = []
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getColorClasses = () => {
    const colors = {
      primary: {
        track: 'bg-gradient-to-r from-blue-200 to-blue-500',
        thumb: 'bg-blue-500 hover:bg-blue-600 shadow-blue-400',
        value: 'text-blue-600 bg-blue-50'
      },
      success: {
        track: 'bg-gradient-to-r from-green-200 to-green-500',
        thumb: 'bg-green-500 hover:bg-green-600 shadow-green-400',
        value: 'text-green-600 bg-green-50'
      },
      warning: {
        track: 'bg-gradient-to-r from-yellow-200 to-yellow-500',
        thumb: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-400',
        value: 'text-yellow-600 bg-yellow-50'
      },
      error: {
        track: 'bg-gradient-to-r from-red-200 to-red-500',
        thumb: 'bg-red-500 hover:bg-red-600 shadow-red-400',
        value: 'text-red-600 bg-red-50'
      }
    };
    return colors[color];
  };

  const getSizeClasses = () => {
    const sizes = {
      small: {
        track: 'h-2',
        thumb: 'w-4 h-4',
        value: 'text-xs px-2 py-1'
      },
      medium: {
        track: 'h-3',
        thumb: 'w-5 h-5',
        value: 'text-sm px-3 py-1'
      },
      large: {
        track: 'h-4',
        thumb: 'w-6 h-6',
        value: 'text-base px-4 py-2'
      }
    };
    return sizes[size];
  };

  const colorClasses = getColorClasses();
  const sizeClasses = getSizeClasses();
  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;
    updateValue(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateValue = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newValue = Math.round(min + percentage * (max - min) / step) * step;
    
    setDisplayValue(newValue);
    onChange(newValue);
  };

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || disabled) return;
      
      if (sliderRef.current) {
        const rect = sliderRef.current.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newValue = Math.round(min + percentage * (max - min) / step) * step;
        
        setDisplayValue(newValue);
        onChange(newValue);
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, disabled, min, max, step, onChange]);

  return (
    <div className={`w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {label}
          </label>
          {showValue && (
            <span className={`${colorClasses.value} ${sizeClasses.value} rounded-full font-semibold`}>
              {displayValue}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        {/* Hidden input for accessibility */}
        <input
          ref={inputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="sr-only"
          aria-label={label || 'Slider'}
        />
        
        {/* Track */}
        <div
          ref={sliderRef}
          className={`relative ${sizeClasses.track} rounded-full cursor-pointer transition-all duration-200 ${
            disabled ? 'bg-gray-200' : colorClasses.track
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Progress fill */}
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-200 ${
              disabled ? 'bg-gray-300' : colorClasses.track
            }`}
            style={{ width: `${percentage}%` }}
          />
          
          {/* Thumb */}
          <div
            className={`absolute top-1/2 transform -translate-y-1/2 ${sizeClasses.thumb} rounded-full shadow-lg transition-all duration-200 ${
              disabled 
                ? 'bg-gray-400 cursor-not-allowed' 
                : `${colorClasses.thumb} cursor-pointer hover:scale-110 active:scale-95`
            } ${isDragging ? 'scale-125' : ''}`}
            style={{ left: `calc(${percentage}% - ${parseInt(sizeClasses.thumb.split(' ')[0]) / 2}px)` }}
          />
        </div>
        
        {/* Marks */}
        {marks.length > 0 && (
          <div className="relative mt-2">
            {marks.map((mark) => {
              const markPercentage = ((mark.value - min) / (max - min)) * 100;
              return (
                <div
                  key={mark.value}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${markPercentage}%` }}
                >
                  <div className="w-1 h-1 bg-gray-400 rounded-full mb-1" />
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {mark.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Slider;
