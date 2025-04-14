import Link from 'next/link';
import { Instagram, Linkedin, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-8 px-4 mt-12">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p>&copy; {new Date().getFullYear()} Codex. Todos los derechos reservados.</p>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 mb-4 md:mb-0">
          <Link href="/about" className="hover:text-gray-800 dark:hover:text-gray-100">Acerca de</Link>
          <Link href="/contact" className="hover:text-gray-800 dark:hover:text-gray-100">Contacto</Link>
          <Link href="/terms" className="hover:text-gray-800 dark:hover:text-gray-100">Términos y Condiciones</Link>
          <Link href="/privacy" className="hover:text-gray-800 dark:hover:text-gray-100">Política de Privacidad</Link>
        </div>
        <div className="flex space-x-4">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 dark:hover:text-gray-100">
            <Instagram className="h-6 w-6" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 dark:hover:text-gray-100">
            <Linkedin className="h-6 w-6" />
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 dark:hover:text-gray-100">
            <Github className="h-6 w-6" />
          </a>
        </div>
      </div>
    </footer>
  );
}