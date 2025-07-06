'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { Input } from './input';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  id?: string;
}

export function Autocomplete({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  required,
  id,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = id ? `${id}-autocomplete-listbox` : 'autocomplete-listbox';

  useEffect(() => {
    if (value.length > 0) {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      setIsOpen(false);
    }
    setActiveSuggestion(-1);
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((prev: number) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((prev: number) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0 && activeSuggestion < filteredSuggestions.length) {
        onChange(filteredSuggestions[activeSuggestion]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveSuggestion(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      role="combobox"
      aria-haspopup="listbox"
      aria-owns={listboxId}
      aria-expanded={isOpen}
      aria-controls={listboxId}
    >
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto dark:bg-gray-800 dark:border-gray-700 dark:shadow-black"
          role="listbox"
          id={listboxId}
        >
          {filteredSuggestions.map((suggestion: string, index: number) => (
            <div
              key={suggestion}
              role="option"
              aria-selected={index === activeSuggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                'px-3 py-2 cursor-pointer text-sm',
                index === activeSuggestion ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100',
              )}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
