import Navbar from '../../components/navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-6">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
}