import React, { useState, useRef, useEffect } from 'react';

interface EnhancedSliderProps {
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

const EnhancedSlider: React.FC<EnhancedSliderProps> = ({
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

  const getColorStyles = () => {
    const colors = {
      primary: {
        track: 'linear-gradient(to right, var(--primary-light, #dbeafe) 0%, var(--primary, #3b82f6) 100%)',
        thumb: 'var(--primary)',
        valueBg: 'rgba(59, 130, 246, 0.1)',
        valueColor: 'var(--primary)',
        shadow: 'rgba(59, 130, 246, 0.4)'
      },
      success: {
        track: 'linear-gradient(to right, var(--success-light, #d1fae5) 0%, var(--success, #10b981) 100%)',
        thumb: 'var(--success)',
        valueBg: 'rgba(16, 185, 129, 0.1)',
        valueColor: 'var(--success)',
        shadow: 'rgba(16, 185, 129, 0.4)'
      },
      warning: {
        track: 'linear-gradient(to right, var(--warning-light, #fef3c7) 0%, var(--warning, #f59e0b) 100%)',
        thumb: 'var(--warning)',
        valueBg: 'rgba(245, 158, 11, 0.1)',
        valueColor: 'var(--warning)',
        shadow: 'rgba(245, 158, 11, 0.4)'
      },
      error: {
        track: 'linear-gradient(to right, var(--error-light, #fee2e2) 0%, var(--error, #ef4444) 100%)',
        thumb: 'var(--error)',
        valueBg: 'rgba(239, 68, 68, 0.1)',
        valueColor: 'var(--error)',
        shadow: 'rgba(239, 68, 68, 0.4)'
      }
    };
    return colors[color];
  };

  const getSizeStyles = () => {
    const sizes = {
      small: {
        trackHeight: '6px',
        thumbSize: '16px',
        valuePadding: '4px 8px',
        valueFontSize: '0.75rem'
      },
      medium: {
        trackHeight: '8px',
        thumbSize: '20px',
        valuePadding: '6px 12px',
        valueFontSize: '0.875rem'
      },
      large: {
        trackHeight: '10px',
        thumbSize: '20px',
        valuePadding: '8px 16px',
        valueFontSize: '1rem'
      }
    };
    return sizes[size];
  };

  const colorStyles = getColorStyles();
  const sizeStyles = getSizeStyles();
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
    <div style={{ 
      width: '100%', 
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'default'
    }}>
      {label && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '0.5rem'
        }}>
          <label style={{ 
            fontWeight: '500',
            color: disabled ? 'var(--text-secondary)' : 'var(--text-primary)'
          }}>
            {label}
          </label>
          {showValue && (
            <span style={{
              backgroundColor: colorStyles.valueBg,
              color: colorStyles.valueColor,
              padding: sizeStyles.valuePadding,
              borderRadius: '1rem',
              fontSize: sizeStyles.valueFontSize,
              fontWeight: 'bold'
            }}>
              {displayValue}
            </span>
          )}
        </div>
      )}
      
      <div style={{ position: 'relative' }}>
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
          style={{
            position: 'absolute',
            opacity: 0,
            width: '100%',
            height: '100%',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
          aria-label={label || 'Slider'}
        />
        
        {/* Track Background */}
        <div
          ref={sliderRef}
          style={{
            position: 'relative',
            height: sizeStyles.trackHeight,
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: `${parseInt(sizeStyles.trackHeight) / 2}px`,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Progress Fill */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${percentage}%`,
              background: colorStyles.track,
              borderRadius: `${parseInt(sizeStyles.trackHeight) / 2}px`,
              transition: 'all 0.2s ease'
            }}
          />
          
          {/* Thumb */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              width: sizeStyles.thumbSize,
              height: sizeStyles.thumbSize,
              backgroundColor: disabled ? 'var(--border-color)' : colorStyles.thumb,
              borderRadius: '50%',
              boxShadow: disabled ? 'none' : `0 2px 8px ${colorStyles.shadow}`,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              left: `${percentage}%`,
              ...(isDragging ? { transform: 'translate(-50%, -50%) scale(1.2)' } : { transform: 'translate(-50%, -50%) scale(1)' })
            }}
          />
        </div>
        
        {/* Marks */}
        {marks.length > 0 && (
          <div style={{ 
            position: 'relative', 
            marginTop: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            {marks.map((mark) => {
              const markPercentage = ((mark.value - min) / (max - min)) * 100;
              return (
                <div
                  key={mark.value}
                  style={{
                    position: 'absolute',
                    left: `${markPercentage}%`,
                    transform: 'translateX(-50%)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '4px',
                    height: '4px',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '50%',
                    margin: '0 auto 4px'
                  }} />
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap'
                  }}>
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

export default EnhancedSlider;
