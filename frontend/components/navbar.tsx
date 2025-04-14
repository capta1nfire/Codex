import Link from "next/link";
import { Home, BarChart2, Code, Settings } from "lucide-react";

export const navItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Generador",
    href: "/generator",
    icon: Code,
  },
  {
    title: "Dashboard",
    href: "/dashboard/metrics",
    icon: BarChart2,
  },
  {
    title: "Configuración",
    href: "/settings",
    icon: Settings,
  }
];

export function Navbar() {
  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl">Codex</span>
        </Link>
        <nav className="flex items-center space-x-4 lg:space-x-6">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex items-center text-sm font-medium transition-colors hover:text-primary"
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;