import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Barcode, Package, Codepen, Database, ScanBarcode } from 'lucide-react';

interface CodeType {
  value: string;
  label: string;
  icon: React.ComponentType;
}

const codeTypes: CodeType[] = [
  { value: 'qrcode', label: 'QR Code', icon: QrCode },
  { value: 'code128', label: 'Code 128', icon: Barcode },
  { value: 'ean13', label: 'EAN-13', icon: Package },
  { value: 'upca', label: 'UPC-A', icon: ScanBarcode },
  { value: 'code39', label: 'Code 39', icon: Database },
  { value: 'datamatrix', label: 'Data Matrix', icon: Codepen },
  { value: 'pdf417', label: 'PDF417', icon: Database},
];

import { useStore } from '@/zustand/use-store';

const SelectorDeTipoDeCodigo: React.FC = () => {
  const { currentLanguage, setCurrentLanguage, selectedCodeType, setSelectedCodeType } = useStore();

  const handleTypeChange = (value: string) => {
    if (setSelectedCodeType) {
      setSelectedCodeType(value);
    }
  };

  return (
    <Tabs defaultValue={selectedType} className="w-full" onValueChange={handleTypeChange}>
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        {codeTypes.map((codeType) => (
          <TabsTrigger key={codeType.value} value={codeType.value} className="flex flex-col items-center gap-2">
            <codeType.icon className="w-6 h-6" />
            {codeType.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default SelectorDeTipoDeCodigo;