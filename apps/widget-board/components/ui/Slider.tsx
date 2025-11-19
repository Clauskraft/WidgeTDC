import React from 'react';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: [number];
  onValueChange: (value: [number]) => void;
}

export const Slider: React.FC<SliderProps> = ({ value, onValueChange, className = '', ...props }) => {
  return (
    <input
      type="range"
      value={value[0]}
      onChange={(event) => onValueChange([Number(event.target.value)])}
      className={`w-full accent-blue-500 ${className}`}
      {...props}
    />
  );
};
