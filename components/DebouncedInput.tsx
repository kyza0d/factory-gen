"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { TextArea } from "ui-lab-components";

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  debounceTimeout?: number;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value: initialValue,
  onChange,
  debounceTimeout = 500,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);
  const lastValueSent = useRef(initialValue); // Tracks the value that was last sent via onChange, or initialized from initialValue.

  // Effect to synchronize internal 'value' with external 'initialValue' prop.
  useEffect(() => {
    // Only update internal 'value' state if 'initialValue' from parent has changed
    // AND if this new 'initialValue' is different from what was last sent.
    // This prevents overriding user's local input that hasn't been debounced yet
    // and also prevents setting state if it's already in sync.
    if (initialValue !== lastValueSent.current) {
      setValue(initialValue);
    }
  }, [initialValue]); // Depend only on initialValue

  const triggerChange = useCallback((val: string) => {
    if (val !== lastValueSent.current) {
      lastValueSent.current = val;
      onChange(val);
    }
  }, [onChange]);

  // Effect to debounce internal 'value' changes and propagate them.
  useEffect(() => {
    const timeout = setTimeout(() => {
      triggerChange(value);
    }, debounceTimeout);

    return () => clearTimeout(timeout);
  }, [value, debounceTimeout, triggerChange]);

  const handleBlur = () => {
    triggerChange(value);
  };

  return (
    <TextArea
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
    />
  );
};
