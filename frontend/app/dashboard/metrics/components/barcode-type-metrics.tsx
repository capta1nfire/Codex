"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BarcodeTypeMetricsProps {
  metrics: any; // Tipo simple por ahora
}

export default function BarcodeTypeMetrics({ metrics }: BarcodeTypeMetricsProps) {
  const barcodeTypes = Object.keys(metrics.by_barcode_type);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-medium">Tipo de Código</TableHead>
            <TableHead className="font-medium">Solicitudes</TableHead>
            <TableHead className="font-medium">Hit Rate</TableHead>
            <TableHead className="font-medium">T. Prom. Hit</TableHead>
            <TableHead className="font-medium">T. Prom. Gen.</TableHead>
            <TableHead className="font-medium">Tamaño Prom.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {barcodeTypes.map((type) => {
            const data = metrics.by_barcode_type[type];
            const totalRequests = data.hit_count + data.miss_count;
            
            return (
              <TableRow key={type}>
                <TableCell className="font-medium">{type}</TableCell>
                <TableCell>{totalRequests}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${data.cache_hit_rate_percent}%` }}
                      ></div>
                    </div>
                    <span>{data.cache_hit_rate_percent.toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell>{data.avg_cache_hit_ms.toFixed(2)} ms</TableCell>
                <TableCell>{data.avg_generation_ms.toFixed(2)} ms</TableCell>
                <TableCell>{data.avg_data_size} bytes</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}