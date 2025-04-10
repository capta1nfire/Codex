import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-4xl font-bold mb-6">Codex</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        Plataforma avanzada para generación de códigos de barras y QR
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/generator">Ir al Generador</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/metrics">Ver Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}