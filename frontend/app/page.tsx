import SelectorDeTipoDeCodigo from "@/components/common/SelectorDeTipoDeCodigo";
import Formulario from "@/components/common/Formulario";
import VistaPrevia from "@/components/common/VistaPrevia";
import BotonesDeAccion from "@/components/common/BotonesDeAccion";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Generador de Códigos
      </h1>
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SelectorDeTipoDeCodigo />
          <Formulario />
        </div>
        <div className="flex flex-col">
          <VistaPrevia />
          <BotonesDeAccion />
        </div>
      </div>
    </div>
  );
}