import React from 'react';

const Plans = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Planes y Pagos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Plan 1 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Plan Básico</h3>
          <p className="text-gray-700 mb-2">Gratuito</p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>Generación de Códigos QR</li>
            <li>Descarga de imágenes</li>
          </ul>
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Seleccionar
          </button>
        </div>
        {/* Plan 2 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Plan Premium</h3>
          <p className="text-gray-700 mb-2">$9.99 / mes</p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>Generación de todo tipo de códigos</li>
            <li>Descarga de imágenes y SVG</li>
            <li>Soporte prioritario</li>
          </ul>
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Seleccionar
          </button>
        </div>
        {/* Plan 3 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Plan Empresa</h3>
          <p className="text-gray-700 mb-2">$49.99 / mes</p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>Todo lo del Plan Premium</li>
            <li>Carga masiva</li>
            <li>Seguimiento de escaneos</li>
            <li>API</li>
          </ul>
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Seleccionar
          </button>
        </div>
      </div>
      {/* Historial de pagos (ejemplo) */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold mb-4">Historial de Pagos</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">2024-08-20</td>
                <td className="px-6 py-4 whitespace-nowrap">$9.99</td>
                <td className="px-6 py-4 whitespace-nowrap">Plan Premium</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">2024-07-20</td>
                <td className="px-6 py-4 whitespace-nowrap">$9.99</td>
                <td className="px-6 py-4 whitespace-nowrap">Plan Premium</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Plans;