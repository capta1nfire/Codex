import React from 'react';
import { cn } from '@/lib/utils';
import { useBarcodeTypes } from '@/hooks/useBarcodeTypes';

interface BarcodeTypeTabsProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export const BarcodeTypeTabs: React.FC<BarcodeTypeTabsProps> = ({ 
  selectedType, 
  onTypeChange 
}) => {
  const { 
    popularTypes, 
    additionalTypes, 
    isDropdownOpen, 
    setIsDropdownOpen, 
    moveToPopular, 
    getTypeColors 
  } = useBarcodeTypes();

  const handleDropdownSelection = (selectedTypeId: string) => {
    moveToPopular(selectedTypeId);
    onTypeChange(selectedTypeId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1 w-full">
        {/* Contenedor de tabs principales distribuidos uniformemente */}
        <div className="flex items-center justify-between flex-1 gap-2">
          {popularTypes.map((type) => {
            const isSelected = selectedType === type.id;
            const colors = getTypeColors(type.color, isSelected);
            
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onTypeChange(type.id)}
                className={cn(
                  // Material Design Tab Button
                  "flex items-center gap-2 px-4 py-3",
                  "rounded-lg transition-all duration-200",
                  "relative overflow-hidden flex-1",
                  "min-w-0 justify-center",
                  // Default state
                  "bg-gray-100/50 dark:bg-gray-800/50",
                  "hover:bg-gray-200/70 dark:hover:bg-gray-700/70",
                  // Selected state with elevation
                  isSelected && [
                    "bg-white dark:bg-gray-900",
                    "shadow-md",
                    "border-b-2 border-blue-600 dark:border-blue-400"
                  ],
                  // Ripple effect
                  "before:absolute before:inset-0",
                  "before:bg-current before:opacity-0",
                  "before:transition-opacity before:duration-200",
                  "active:before:opacity-10"
                )}
              >
                <span className={cn(
                  "font-medium text-sm whitespace-nowrap",
                  isSelected 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-700 dark:text-gray-300"
                )}>
                  {type.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dropdown solo con flecha - Sin texto */}
        <div className="relative dropdown-container">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              // Material Design Icon Button
              "flex items-center justify-center w-12 h-12",
              "rounded-full transition-all duration-200",
              "bg-gray-100/50 dark:bg-gray-800/50",
              "hover:bg-gray-200/70 dark:hover:bg-gray-700/70",
              "relative overflow-hidden",
              // Ripple effect
              "before:absolute before:inset-0",
              "before:bg-current before:opacity-0",
              "before:transition-opacity before:duration-200",
              "active:before:opacity-10"
            )}
          >
            <svg 
              className={cn(
                "w-5 h-5 transition-transform duration-200 text-gray-600 dark:text-gray-400",
                isDropdownOpen && "rotate-180"
              )}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown content */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="py-2">
                {additionalTypes.map((type) => {
                  const isSelected = selectedType === type.id;
                  
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleDropdownSelection(type.id)}
                      className={cn(
                        // Material Design List Item
                        "w-full flex items-center gap-3 px-4 py-3",
                        "transition-all duration-200 text-left",
                        "relative overflow-hidden",
                        // States
                        isSelected 
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
                        // Ripple effect
                        "before:absolute before:inset-0",
                        "before:bg-current before:opacity-0",
                        "before:transition-opacity before:duration-200",
                        "active:before:opacity-10"
                      )}
                    >
                      <span className="font-medium text-sm">
                        {type.name}
                      </span>
                      {isSelected && (
                        <svg className="w-5 h-5 ml-auto text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};