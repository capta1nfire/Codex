import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "@/hooks/use-translations";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InputNumber } from "@/components/ui/input-number";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface FormularioProps {

  selectedCodeType: string;
  onDataChange: (data: any) => void;
}


const Formulario: React.FC<FormularioProps> = ({ selectedCodeType, onDataChange }) => {
  const { t } = useTranslations(); // Translation hook

  // State for form data and personalization options
  const [formData, setFormData] = useState<any>({
    color: '#000000', // Default code color
    backgroundColor: '#FFFFFF', // Default background color
    size: 100, // Default size
    format: 'svg', // Default format
    errorCorrection: 'M', // Default error correction (for QR codes)
    compact: false, // Default compact mode (for PDF417 and DataMatrix)
    columns: 0, // Default columns (for PDF417)
    rows: 0, // Default rows (for PDF417)
    includeChecksum: false, // Default checksum (for Code39)
    csvData: null, // CSV data
  });

  const [errors, setErrors] = useState<any>({}); // State for form validation errors

  useEffect(() => {
    // Define initial form data based on selectedCodeType
    switch (selectedCodeType) {
      case 'qrcode':
        setFormData({ data: '', errorCorrection: 'M' });
        break;
      case 'ean13':
        setFormData({ data: ''});
        break;
      case 'code128':
        setFormData({ data: '' });
        break;
      case 'pdf417':
        setFormData({ data: '', compact: false, columns: 0, rows: 0, errorCorrection: 'level0' });
        break;
      case 'upca':
        setFormData({ data: '' });
        break;
      case 'code39':
        setFormData({ data: '', includeChecksum: false });
        break;
      case 'datamatrix':
        setFormData({ data: '', compact: false });
        break;
      default:
        setFormData({});
    }
    setErrors({}); // Clear errors when the code type changes
  }, [selectedCodeType]);

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    validateField(name, type === 'checkbox' ? checked : value);
  };

  const handleNumberChange = (name: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string;
          const parsedData = parseCSV(csvText);
          setFormData(prev => ({
            ...prev,
            csvData: parsedData,
          }));
          toast.success(t('form.csvUploaded'));
        } catch (error) {
          toast.error(t('form.csvError'));
        }
      };
      reader.readAsText(file);
    } else if (file) {
      toast.error(t('form.invalidFile'));
    }
  };

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    return lines.map(line =>
      line.split(',').map(value => value.trim())
    );
  };

  // Function to validate individual fields
  const validateField = (name: string, value: any) => {
    let errorMessage = '';

    switch (selectedCodeType) {
      case 'qrcode':
        if (name === 'data' && !value) {
          errorMessage = t('validation.required');
        }
        break;
      case 'ean13':
        if (name === 'data') {
          if (!/^\d{12}$/.test(value)) {
            errorMessage = t('validation.ean13');
          }
        }
        break;
      case 'code128':
        if (name === 'data' && !value) {
          errorMessage = t('validation.required');
        }
        break;
      case 'pdf417':
        if (name === 'data' && !value) {
          errorMessage = t('validation.required');
        }
        break;
      case 'upca':
        if (name === 'data') {
          if (!/^\d{11}$/.test(value)) {
            errorMessage = t('validation.upca');
          }
        }
        break;
      case 'code39':
        if (name === 'data' && !value) {
          errorMessage = t('validation.required');
        }
        break;
      case 'datamatrix':
        if (name === 'data' && !value) {
          errorMessage = t('validation.required');
        }
        break;
      default:
        break;
    }

    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: errorMessage,
    }));
  };

  useEffect(() => { // Effect to trigger validation on form data changes
    // Trigger validation for all fields when formData changes
    for (const key in formData) {
      validateField(key, formData[key]);
    }
  }, [formData, selectedCodeType, t]);

  const hasErrors = Object.values(errors).some(error => error !== '');

  return ( // Main return statement with the form structure
    <div className="grid gap-4">
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTitle>{t('validation.title')}</AlertTitle>
          <AlertDescription>
            {Object.values(errors).map((error, index) => (
              error !== '' ? <p key={index}>{error}</p> : null
            ))}
          </AlertDescription>
        </Alert>
      )}
      {selectedCodeType === 'qrcode' && ( // Form fields for QR Code
        <>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="data">Datos</Label>
            <Input id="data" name="data" value={formData.data || ''} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="errorCorrection">Corrección de Errores</Label>
            <Select name="errorCorrection" value={formData.errorCorrection || 'M'} onValueChange={(value) => handleChange({ target: { name: 'errorCorrection', value } } as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecciona el nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Bajo (7%)</SelectItem>
                <SelectItem value="M">Medio (15%)</SelectItem>
                <SelectItem value="Q">Cuartil (25%)</SelectItem>
                <SelectItem value="H">Alto (30%)</SelectItem>
              </SelectContent>
            </Select>
          </div >
          {/* Personalization Options for QR Code */}
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="color">{t('form.color')}</Label>
            <Input type="color" id="color" name="color" value={formData.color} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="backgroundColor">{t('form.backgroundColor')}</Label>
            <Input type="color" id="backgroundColor" name="backgroundColor" value={formData.backgroundColor} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="size">{t('form.size')}</Label>
            <Slider
              min={50}
              max={500}
              step={10}
              value={[formData.size]}
              onValueChange={(value) => handleNumberChange('size', value[0])}
            />
            <InputNumber
              min={50}
              max={500}
              step={10}
              value={formData.size}
              onValueChange={(value) => handleNumberChange('size', value)}
            />
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="format">{t('form.format')}</Label>
            <Select name="format" value={formData.format} onValueChange={(value) => handleChange({ target: { name: 'format', value } } as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('form.selectFormat')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="svg">SVG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="logo">{t('form.logo')}</Label>
            <Input type="file" id="logo" name="logo" onChange={handleChange} />
          </div>
        </>
      )}
      {/* CSV Upload for all code types */}
      {['qrcode', 'ean13', 'code128', 'pdf417', 'upca', 'code39', 'datamatrix'].includes(selectedCodeType) && (
        <Input type="file" accept=".csv" onChange={handleFileChange} className="mt-4" />
      )}

      {selectedCodeType === 'ean13' && (
        <div className="grid grid-cols-2 items-center gap-4">
          <Label htmlFor="data">Datos (12 dígitos)</Label>
          <Input id="data" name="data" value={formData.data || ''} onChange={handleChange} />
        </div>
      )}
      {selectedCodeType === 'ean13' && (
        <div className="grid grid-cols-2 items-center gap-4">
          <Label htmlFor="color">{t('form.color')}</Label>
          <Input type="color" id="color" name="color" value={formData.color} onChange={handleChange} />
        </div>
      )}

      {selectedCodeType === 'code128' && (
        <div className="grid grid-cols-2 items-center gap-4">
          <Label htmlFor="data">{t('form.data')}</Label>
          <Input id="data" name="data" value={formData.data || ''} onChange={handleChange} />
        </div>
      )}

      {selectedCodeType === 'code128' && (
        <div className="grid grid-cols-2 items-center gap-4">
          <Label htmlFor="data">Datos</Label>
          <Input id="data" name="data" value={formData.data || ''} onChange={handleChange} />
        </div>
      )}

      {selectedCodeType === 'pdf417' && (
        <>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="data">Datos</Label>
            <Input id="data" name="data" value={formData.data || ''} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="compact">Compacto</Label>
            <Checkbox id="compact" name="compact" checked={formData.compact || false} onCheckedChange={(checked) => handleChange({ target: { name: 'compact', checked } } as any)} />
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="columns">Columnas (0 para automático)</Label>
            <Input id="columns" name="columns" type="number" value={formData.columns || 0} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="rows">Filas (0 para automático)</Label>
            <Input id="rows" name="rows" type="number" value={formData.rows || 0} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="errorCorrection">Nivel de Corrección</Label>
            <Select name="errorCorrection" value={formData.errorCorrection || 'level0'} onValueChange={(value) => handleChange({ target: { name: 'errorCorrection', value } } as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecciona el nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="level0">Nivel 0</SelectItem>
                <SelectItem value="level1">Nivel 1</SelectItem>
                <SelectItem value="level2">Nivel 2</SelectItem>
                <SelectItem value="level3">Nivel 3</SelectItem>
                <SelectItem value="level4">Nivel 4</SelectItem>
                <SelectItem value="level5">Nivel 5</SelectItem>
                <SelectItem value="level6">Nivel 6</SelectItem>
                <SelectItem value="level7">Nivel 7</SelectItem>
                <SelectItem value="level8">Nivel 8</SelectItem</SelectContent>
            </Select>
          </div>
        </>
      )}

      {selectedCodeType === 'upca' && (
        <div className="grid grid-cols-2 items-center gap-4">
          <Label htmlFor="data">Datos (11 dígitos)</Label>
          <Input id="data" name="data" value={formData.data || ''} onChange={handleChange} />
        </div>
      )}

      {selectedCodeType === 'code39' && (
        <>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="data">Datos</Label>
            <Input id="data" name="data" value={formData.data || ''} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="includeChecksum">Incluir Checksum</Label>
            <Checkbox id="includeChecksum" name="includeChecksum" checked={formData.includeChecksum || false} onCheckedChange={(checked) => handleChange({ target: { name: 'includeChecksum', checked } } as any)} />
          </div>
        </>
      )}

      {selectedCodeType === 'datamatrix' && (
        <>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="data">Datos</Label>
            <Input id="data" name="data" value={formData.data || ''} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="compact">Compacto</Label>
            <Checkbox id="compact" name="compact" checked={formData.compact || false} onCheckedChange={(checked) => handleChange({ target: { name: 'compact', checked } } as any)} />
          </div>
        </>
      )}
    </div>
  );
};

export default Formulario;
