import { useState, useEffect, useCallback } from 'react';

type Translations = {
  [key: string]: string;
};

type Language = 'en' | 'es';

const useTranslations = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>({});

  const changeLanguage = useCallback((newLanguage: Language) => {
    setLanguage(newLanguage);
  }, []);

  const t = useCallback(
    (key: string) => {
      return translations[key] || key;
    },
    [translations]
  );

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}.json`);
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error('Error fetching translations:', error);
      }
    };

    fetchTranslations();
  }, [language]);

  return { t, changeLanguage, language };
};

export default useTranslations;