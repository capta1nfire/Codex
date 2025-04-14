"use client";

import { useState } from 'react';
import { useTranslations } from '@/hooks/use-translations';

const LanguageSelector = () => {
  const { changeLanguage, language } = useTranslations();

  const handleLanguageChange = (newLanguage: string) => {
    changeLanguage(newLanguage);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleLanguageChange('es')}
        className={`px-2 py-1 rounded-md text-sm focus:outline-none ${
          language === 'es'
            ? 'bg-gray-200 font-semibold'
            : 'hover:bg-gray-100'
        }`}
      >
        <span role="img" aria-label="Spanish Flag">
          🇪🇸
        </span>
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-2 py-1 rounded-md text-sm focus:outline-none ${
          language === 'en'
            ? 'bg-gray-200 font-semibold'
            : 'hover:bg-gray-100'
        }`}
      >
        <span role="img" aria-label="English Flag">
          🇺🇸
        </span>
      </button>
    </div>
  );
};

export default LanguageSelector;