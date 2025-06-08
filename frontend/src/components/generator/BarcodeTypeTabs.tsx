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
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 border flex-1",
                  colors.bg,
                  colors.border,
                  "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                  "min-w-0 justify-center"
                )}
              >
                <span className="text-sm">{type.icon}</span>
                <span className={cn(
                  "font-medium text-sm whitespace-nowrap",
                  colors.text
                )}>
                  {type.name}
                </span>
                {isSelected && (
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    type.color === 'blue' && "bg-blue-500",
                    type.color === 'green' && "bg-green-500", 
                    type.color === 'orange' && "bg-orange-500",
                    type.color === 'purple' && "bg-purple-500"
                  )}></div>
                )}
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
              "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 border",
              "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
              "hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          >
            <svg 
              className={cn(
                "w-5 h-5 transition-transform duration-200 text-slate-500 dark:text-slate-400",
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
            <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
              <div className="p-2 space-y-1">
                {additionalTypes.map((type) => {
                  const isSelected = selectedType === type.id;
                  const colors = getTypeColors(type.color, isSelected);
                  
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleDropdownSelection(type.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-left",
                        isSelected 
                          ? `${colors.bg} ${colors.border.replace('hover:', '')} border`
                          : "hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <span className="text-sm">{type.icon}</span>
                      <span className={cn(
                        "font-medium text-sm",
                        isSelected ? colors.text : "text-slate-700 dark:text-slate-300"
                      )}>
                        {type.name}
                      </span>
                      {isSelected && (
                        <div className={cn(
                          "w-2 h-2 rounded-full ml-auto",
                          type.color === 'blue' && "bg-blue-500",
                          type.color === 'green' && "bg-green-500", 
                          type.color === 'orange' && "bg-orange-500",
                          type.color === 'purple' && "bg-purple-500"
                        )}></div>
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