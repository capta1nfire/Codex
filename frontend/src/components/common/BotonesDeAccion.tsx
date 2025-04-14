import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Share2, XCircle } from 'lucide-react';
import { useStore } from '@/zustand/use-store';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

const BotonesDeAccion: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const svgString = useStore((state) => state.svgString);
  const setSvgString = useStore((state) => state.setSvgString);
  const selectedCodeType = useStore((state) => state.selectedCodeType);
  const formValues = useStore((state) => state.formValues);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const { toast } = useToast();
  const lastGeneratedSvg = useStore((state) => state.lastGeneratedSvg);
  const setLastGeneratedSvg = useStore((state) => state.setLastGeneratedSvg);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode_type: selectedCodeType,
          data: formValues[selectedCodeType]?.data,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar el código');
      }

      const result = await response.json();
      const newSvg = result.svgString;
      setSvgString(newSvg);
      setLastGeneratedSvg({
        type: selectedCodeType, data: formValues[selectedCodeType]?.data, svg: newSvg
      });
    } catch (error) {
      console.error('Error al generar el código:', error);
      // TODO: Handle error state in UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!svgString) return;

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codigo-${selectedCodeType}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    // In a real app, this would involve uploading the SVG to a storage service
    // and generating a shareable link.  For this example, we'll just create a
    // dummy link.
    const dummyLink = `https://example.com/share/${Date.now()}`;
    setShareLink(dummyLink);
    toast({
      title: 'Enlace de Compartir Generado',
      description: (
        <div>
          <a href={dummyLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{dummyLink}</a>
        </div>
      ),
    });
  };

  const handleClear = () => {
    setSvgString('');
    // TODO: Clear form values in Zustand
  };

  const generateCode = async () => {
    if (
      lastGeneratedSvg &&
      lastGeneratedSvg.type === selectedCodeType &&
      lastGeneratedSvg.data === formValues[selectedCodeType]?.data
    ) {
      setSvgString(lastGeneratedSvg.svg);
    } else {
      await handleGenerate();
    }
  };

  const handleGenerateClick = async () => {
    await generateCode();
  };


  return (
    <div className="flex flex-wrap gap-4 mt-6 justify-center">
      <Button
        onClick={handleGenerate}
        disabled={isLoading}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Generando...' : 'Generar'}
      </Button>

      <Button
        onClick={handleDownload}
        variant="secondary"
        className="gap-2"
        disabled={!svgString}
      >
        <Download className="h-4 w-4" />
        Descargar
      </Button>

      <Button
        onClick={handleShare}
        variant="outline"
        className="gap-2"
        disabled={!svgString}
      >
        <Share2 className="h-4 w-4" />
        Compartir
      </Button>

      {shareLink && (
        <Button
          onClick={() => navigator.clipboard.writeText(shareLink)}
          variant="ghost"
          className="gap-2"
        >
          Copiar Enlace
        </Button>
      )}



      <Button onClick={handleClear} variant="destructive" className="gap-2">
        <XCircle className="h-4 w-4" />
        Limpiar
      </Button>
    </div>
  );
};

export default BotonesDeAccion;