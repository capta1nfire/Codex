import React, { useState } from "react";
import { useStore } from "@/zustand/use-store";


const VistaPrevia: React.FC = () => {
  const selectedCodeType = useStore((state) => state.selectedCodeType);
  const formData = useStore((state) => state.formData);
  const svgString = useStore((state) => state.svgString);
  const scanCount = useStore((state) => state.scanCount);
  const isLoading = useStore((state) => state.isLoading);

  const getPreviewContent = () => {
    const { color, backgroundColor, size } = useStore((state) => state.personalization);

    return (
      <div className="bg-white dark:bg-gray-900 p-6 border rounded-lg shadow-md flex flex-col items-center justify-center h-full min-h-[320px] print:border-none print:shadow-none print:p-0">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 print:hidden">Previsualización</h2>
        {isLoading ? (
          <p className="text-blue-600 dark:text-blue-400 animate-pulse print:hidden">Generando código...</p>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400 print:hidden">Error al generar el código.</div>
        ) : svgString ? (
          <div className="flex flex-col items-center w-full">
            <div
              dangerouslySetInnerHTML={{ __html: applyStylesToSvg(svgString, color, backgroundColor, size) }}
              className="w-full"
            />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 print:hidden">
              {`Código escaneado ${scanCount} veces`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 print:hidden">
            <p className="text-gray-700 dark:text-gray-300 mb-2">Aquí aparecerá el código generado...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Selecciona un tipo, introduce datos y haz clic en "Generar Código"
            </p>
          </div>
        )}
      </div>
    );
  };

  const applyStylesToSvg = (svg: string, color: string, backgroundColor: string, size: number) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgElement = doc.querySelector("svg");
    if (svgElement) {
      svgElement.setAttribute("width", size.toString());
      svgElement.setAttribute("height", size.toString());
      svgElement.setAttribute("fill", color);
      svgElement.style.backgroundColor = backgroundColor;
    }
    return svgElement?.outerHTML || "";
  };

  return <div>{getPreviewContent()}</div>;
};

export default VistaPrevia;