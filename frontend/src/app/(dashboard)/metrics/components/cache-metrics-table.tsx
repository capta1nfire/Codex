import React from 'react';

interface CacheMetrics {
  by_barcode_type: {
    [key: string]: {
      avg_cache_hit_ms: number;
      avg_generation_ms: number;
      max_hit_ms: number;
      max_generation_ms: number;
      hit_count: number;
      miss_count: number;
      avg_data_size: number;
      cache_hit_rate_percent: number;
    };
  };
  overall: {
    avg_response_ms: number;
    max_response_ms: number;
    total_requests: number;
    cache_hit_rate_percent: number;
  };
  timestamp: string;
}

const CacheMetricsTable: React.FC<{ metrics: CacheMetrics }> = ({ metrics }) => {
  if (!metrics || !metrics.by_barcode_type) {
    return <div className="text-center p-4">No hay datos de métricas disponibles.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              Tipo de Código
            </th>
            <th scope="col" className="px-6 py-3">
              Cache Hit Promedio (ms)
            </th>
            <th scope="col" className="px-6 py-3">
              Generación Promedio (ms)
            </th>
            <th scope="col" className="px-6 py-3">
              Máximo Cache Hit (ms)
            </th>
            <th scope="col" className="px-6 py-3">
              Máxima Generación (ms)
            </th>
            <th scope="col" className="px-6 py-3">
              Hits
            </th>
            <th scope="col" className="px-6 py-3">
              Misses
            </th>
            <th scope="col" className="px-6 py-3">
              Tamaño Promedio (bytes)
            </th>
            <th scope="col" className="px-6 py-3">
              Cache Hit Rate (%)
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(metrics.by_barcode_type).map(([type, data]) => (
            <tr key={type} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                {type.toUpperCase()}
              </th>
              <td className="px-6 py-4">{data.avg_cache_hit_ms.toFixed(2)}</td>
              <td className="px-6 py-4">{data.avg_generation_ms.toFixed(2)}</td>
              <td className="px-6 py-4">{data.max_hit_ms.toFixed(2)}</td>
              <td className="px-6 py-4">{data.max_generation_ms.toFixed(2)}</td>
              <td className="px-6 py-4">{data.hit_count}</td>
              <td className="px-6 py-4">{data.miss_count}</td>
              <td className="px-6 py-4">{data.avg_data_size.toFixed(2)}</td>
              <td className="px-6 py-4">{data.cache_hit_rate_percent.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CacheMetricsTable;