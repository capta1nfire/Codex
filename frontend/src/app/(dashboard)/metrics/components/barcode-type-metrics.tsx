import React from 'react';

interface BarcodeTypeMetricsProps {
  metrics: any; // Replace 'any' with a more specific type if possible
}

const BarcodeTypeMetrics: React.FC<BarcodeTypeMetricsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.by_barcode_type &&
        Object.entries(metrics.by_barcode_type).map(([barcodeType, data]) => (
          <div key={barcodeType} className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-2 capitalize">
              {barcodeType}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-gray-600">Avg. Cache Hit (ms):</div>
              <div className="text-sm font-medium">{data.avg_cache_hit_ms.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Avg. Generation (ms):</div>
              <div className="text-sm font-medium">{data.avg_generation_ms.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Max. Hit (ms):</div>
              <div className="text-sm font-medium">{data.max_hit_ms.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Max. Generation (ms):</div>
              <div className="text-sm font-medium">{data.max_generation_ms.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Hit Count:</div>
              <div className="text-sm font-medium">{data.hit_count}</div>
              <div className="text-sm text-gray-600">Miss Count:</div>
              <div className="text-sm font-medium">{data.miss_count}</div>
              <div className="text-sm text-gray-600">Avg. Data Size:</div>
              <div className="text-sm font-medium">{data.avg_data_size}</div>
              <div className="text-sm text-gray-600">Cache Hit Rate:</div>
              <div className="text-sm font-medium">{data.cache_hit_rate_percent.toFixed(1)}%</div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default BarcodeTypeMetrics;