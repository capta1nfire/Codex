"use client";

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

interface CacheMetricsTableProps {
  metrics: any; // Tipo simple por ahora
}

export default function CacheMetricsTable({ metrics }: CacheMetricsTableProps) {
  const [selectedType, setSelectedType] = useState<string>("all");

  const barcodeTypes = Object.keys(metrics.by_barcode_type);
  
  // Filtrar datos según la selección
  const typeData = selectedType === "all" 
    ? barcodeTypes 
    : [selectedType];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select 
          value={selectedType} 
          onValueChange={setSelectedType}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {barcodeTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Tipo</TableHead>
              <TableHead>Cache Hits</TableHead>
              <TableHead>Cache Misses</TableHead>
              <TableHead>Tasa de Hit</TableHead>
              <TableHead>Max. Tiempo Hit</TableHead>
              <TableHead>Max. Tiempo Gen.</TableHead>
              <TableHead>Tamaño Prom.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typeData.map(type => {
              const data = metrics.by_barcode_type[type];
              return (
                <TableRow key={type}>
                  <TableCell className="font-medium">{type}</TableCell>
                  <TableCell>{data.hit_count}</TableCell>
                  <TableCell>{data.miss_count}</TableCell>
                  <TableCell>{data.cache_hit_rate_percent.toFixed(1)}%</TableCell>
                  <TableCell>{data.max_hit_ms} ms</TableCell>
                  <TableCell>{data.max_generation_ms} ms</TableCell>
                  <TableCell>{data.avg_data_size} bytes</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}