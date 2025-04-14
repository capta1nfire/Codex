import React from 'react';

interface PerformanceChartProps {
  metrics: any;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ metrics }) => {
  return (
    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Performance Chart Placeholder</p>
    </div>
  );
};

export default PerformanceChart;