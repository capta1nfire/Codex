import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard/metrics", label: "Metrics" },
    { href: "/dashboard/user/profile", label: "Profile" },
    { href: "/dashboard/user/generated-codes", label: "Generated Codes" },
    { href: "/dashboard/user/plans", label: "Plans" },
    { href: "/dashboard/user/api-tokens", label: "API" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Mobile Menu (Sheet) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" className="md:hidden">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="px-4 py-6">
            <SheetTitle>Dashboard Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4">
            {menuItems.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "py-2 px-4 rounded-md hover:bg-gray-100",
                    pathname === item.href ? "bg-gray-100" : ""
                  )}
                >
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline" className="w-full">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r">
        <div className="p-4">
          <h2 className="text-xl font-bold">Dashboard Menu</h2>
        </div>
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "py-2 px-4 rounded-md hover:bg-gray-100",
                pathname === item.href ? "bg-gray-100" : ""
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;