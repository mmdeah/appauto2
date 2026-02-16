'use client';

import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CurrencyInput({ 
  value, 
  onChange, 
  placeholder = "0", 
  disabled = false,
  className 
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // Format the number with thousands separators
    if (value === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(value.toLocaleString('es-CO'));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-numeric characters
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    
    // Convert to number
    const numValue = rawValue === '' ? 0 : parseInt(rawValue, 10);
    
    // Update parent component
    onChange(numValue);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        $
      </span>
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`pl-7 ${className}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        COP
      </span>
    </div>
  );
}
