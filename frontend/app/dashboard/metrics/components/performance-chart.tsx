"use client";

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface PerformanceChartProps {
  metrics: any; // Tipo simple por ahora
}

export default function PerformanceChart({ metrics }: PerformanceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !metrics) return;

    // Limpiar gráfico anterior si existe
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Preparar datos para el gráfico
    const barcodeTypes = Object.keys(metrics.by_barcode_type);
    const hitRateData = barcodeTypes.map(type => metrics.by_barcode_type[type].cache_hit_rate_percent);
    const avgGenTimeData = barcodeTypes.map(type => metrics.by_barcode_type[type].avg_generation_ms);
    const avgHitTimeData = barcodeTypes.map(type => metrics.by_barcode_type[type].avg_cache_hit_ms);

    // Crear gráfico
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: barcodeTypes,
        datasets: [
          {
            label: 'Tasa de Cache Hit (%)',
            data: hitRateData,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            yAxisID: 'y-axis-percent',
          },
          {
            label: 'Tiempo Prom. Generación (ms)',
            data: avgGenTimeData,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            yAxisID: 'y-axis-time',
          },
          {
            label: 'Tiempo Prom. Cache Hit (ms)',
            data: avgHitTimeData,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            yAxisID: 'y-axis-time',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Rendimiento por Tipo de Código',
            font: {
              size: 16
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Tipo de Código'
            }
          },
          'y-axis-percent': {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Tasa de Cache Hit (%)'
            },
            min: 0,
            max: 100,
          },
          'y-axis-time': {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Tiempo (ms)'
            },
            min: 0,
            grid: {
              drawOnChartArea: false,
            },
          }
        }
      }
    });

    // Limpiar al desmontar
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [metrics]);

  return (
    <div className="w-full" style={{ height: '400px' }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}