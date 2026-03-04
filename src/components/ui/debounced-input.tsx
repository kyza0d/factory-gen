"use client";

import React, { useState, useEffect, useRef } from "react";
import { TextArea } from "ui-lab-components";

interface DebouncedInputProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  debounceTimeout?: number;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value: controlledValue,
  onChange,
  debounceTimeout = 500,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(controlledValue);
  const debouncedChangeRef = useRef(onChange);
  const isTypingRef = useRef(false); // To track if user is actively typing

  // Sync internal value with controlled value from parent when not typing
  useEffect(() => {
    if (!isTypingRef.current) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Update the ref whenever the onChange prop changes
  useEffect(() => {
    debouncedChangeRef.current = onChange;
  }, [onChange]);



  // Debounce internal value changes
  useEffect(() => {
    // Skip if value hasn't changed from controlled value
    if (internalValue === controlledValue) {
      return;
    }

    const handler = setTimeout(() => {
      isTypingRef.current = false; // Reset typing status after debounce
      debouncedChangeRef.current(internalValue);
    }, debounceTimeout);

    return () => {
      clearTimeout(handler);
    };
  }, [internalValue, debounceTimeout, controlledValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    isTypingRef.current = true; // User is typing
    setInternalValue(e.target.value);
  };

  const handleBlur = () => {
    isTypingRef.current = false; // Reset typing status on blur
    debouncedChangeRef.current(internalValue); // Ensure latest value is sent
  };

  return (
    <TextArea
      {...props}
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};