"use client";

import { useState } from "react";
import { QuestionMark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Ayuda() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <QuestionMark className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ayuda</DialogTitle>
          <DialogDescription>
            Esta aplicación te permite generar códigos de barras y códigos QR
            personalizados. Selecciona el tipo de código, introduce los datos
            necesarios y utiliza las opciones de personalización para ajustar la
            apariencia.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}