import { useState, useCallback } from 'react';

interface BarcodeType {
  id: string;
  name: string;
  category: string;
  color: string;
  icon: string;
}

const initialPopularTypes: BarcodeType[] = [
  { id: 'qrcode', name: 'QR Code', category: '2d', color: 'blue', icon: '⬛' },
  { id: 'code128', name: 'Code 128', category: 'lineales', color: 'green', icon: '📊' },
  { id: 'ean13', name: 'EAN-13', category: 'ean', color: 'orange', icon: '🛒' },
  { id: 'pdf417', name: 'PDF417', category: '2d', color: 'blue', icon: '⬛' },
  { id: 'code39', name: 'Code 39', category: 'lineales', color: 'green', icon: '📊' },
];

const initialAdditionalTypes: BarcodeType[] = [
  { id: 'datamatrix', name: 'Data Matrix', category: '2d', color: 'blue', icon: '⬛' },
  { id: 'aztec', name: 'Aztec', category: '2d', color: 'blue', icon: '⬛' },
  { id: 'code93', name: 'Code 93', category: 'lineales', color: 'green', icon: '📊' },
  { id: 'codabar', name: 'Codabar', category: 'lineales', color: 'green', icon: '📊' },
  { id: 'ean8', name: 'EAN-8', category: 'ean', color: 'orange', icon: '🛒' },
  { id: 'upca', name: 'UPC-A', category: 'ean', color: 'orange', icon: '🛒' },
  { id: 'upce', name: 'UPC-E', category: 'ean', color: 'orange', icon: '🛒' },
  { id: 'itf', name: 'ITF-14', category: 'especializados', color: 'purple', icon: '📦' },
];

export const useBarcodeTypes = () => {
  const [popularTypes, setPopularTypes] = useState<BarcodeType[]>(initialPopularTypes);
  const [additionalTypes, setAdditionalTypes] = useState<BarcodeType[]>(initialAdditionalTypes);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const moveToPopular = useCallback((selectedTypeId: string) => {
    const selectedTypeObj = additionalTypes.find(type => type.id === selectedTypeId);
    if (!selectedTypeObj) return;

    // Remover el tipo seleccionado de additionalTypes
    const newAdditionalTypes = additionalTypes.filter(type => type.id !== selectedTypeId);
    
    // El tipo seleccionado pasa al primer lugar
    // Todos los elementos de popularTypes se desplazan una posición a la derecha
    // El último elemento de popularTypes se mueve al dropdown
    const lastPopular = popularTypes[popularTypes.length - 1];
    const newPopularTypes = [selectedTypeObj, ...popularTypes.slice(0, -1)];
    
    // Agregar el último elemento de popular al inicio de additionalTypes
    const updatedAdditionalTypes = [lastPopular, ...newAdditionalTypes];

    // Actualizar ambos estados
    setPopularTypes(newPopularTypes);
    setAdditionalTypes(updatedAdditionalTypes);
  }, [popularTypes, additionalTypes]);

  const getTypeColors = (color: string, isSelected: boolean) => {
    const colors = {
      blue: {
        bg: isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-blue-900/10',
        border: isSelected ? 'border-blue-500 dark:border-blue-400' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600',
        text: isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400',
        textSelected: 'text-blue-700 dark:text-blue-300'
      },
      green: {
        bg: isSelected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-slate-900 hover:bg-green-50/50 dark:hover:bg-green-900/10',
        border: isSelected ? 'border-green-500 dark:border-green-400' : 'border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600',
        text: isSelected ? 'text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-400',
        textSelected: 'text-green-700 dark:text-green-300'
      },
      orange: {
        bg: isSelected ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-white dark:bg-slate-900 hover:bg-orange-50/50 dark:hover:bg-orange-900/10',
        border: isSelected ? 'border-orange-500 dark:border-orange-400' : 'border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600',
        text: isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-slate-600 dark:text-slate-400',
        textSelected: 'text-orange-700 dark:text-orange-300'
      },
      purple: {
        bg: isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-white dark:bg-slate-900 hover:bg-purple-50/50 dark:hover:bg-purple-900/10',
        border: isSelected ? 'border-purple-500 dark:border-purple-400' : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600',
        text: isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400',
        textSelected: 'text-purple-700 dark:text-purple-300'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const isBarcodeQR = useCallback((type: string) => {
    return type === 'qrcode' || type === 'qr';
  }, []);

  return {
    popularTypes,
    additionalTypes,
    isDropdownOpen,
    setIsDropdownOpen,
    moveToPopular,
    getTypeColors,
    isBarcodeQR,
  };
};