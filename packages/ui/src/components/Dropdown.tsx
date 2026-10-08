import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
  multiple?: boolean;
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ options, value, onChange, placeholder = 'Select...', disabled, className, searchable, multiple }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const filteredOptions = options.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);
    const displayValue = selectedOption?.label || placeholder;

    const toggleOpen = () => {
      if (!disabled) setIsOpen(!isOpen);
    };

    const handleSelect = (option: DropdownOption) => {
      if (!option.disabled) {
        onChange(option.value);
        if (!multiple) setIsOpen(false);
      }
    };

    return (
      <div ref={dropdownRef} className={clsx('relative inline-block w-full', className)}>
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleOpen}
          disabled={disabled}
          className={clsx(
            'w-full px-3 py-2 border rounded-lg shadow-sm bg-white',
            'flex items-center justify-between text-left',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'text-gray-900 border-gray-300 hover:border-gray-400'
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{displayValue}</span>
          <ChevronDown className={clsx('w-5 h-5 text-gray-400 ml-2', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {searchable && (
              <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            )}
            <ul className="py-1" role="listbox">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-gray-500 text-sm">No options found</li>
              ) : (
                filteredOptions.map((option) => (
                  <li key={option.value} role="option" aria-selected={value === option.value}>
                    <button
                      type="button"
                      onClick={() => handleSelect(option)}
                      disabled={option.disabled}
                      className={clsx(
                        'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                        value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50',
                        option.disabled && 'text-gray-400 cursor-not-allowed'
                      )}
                    >
                      {option.icon && <span>{option.icon}</span>}
                      <span className="flex-1">{option.label}</span>
                      {value === option.value && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';