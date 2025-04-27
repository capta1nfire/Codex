import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  // Esta función se ejecuta en el cliente cuando el componente se monta
  if (typeof window !== 'undefined') {
    // Agregar la clase para evitar scrolling
    document.documentElement.classList.add('no-scroll-needed');
    
    // Función de limpieza que se ejecuta cuando el componente se desmonta
    const cleanup = () => {
      document.documentElement.classList.remove('no-scroll-needed');
    };
    
    // Esto asegura que la limpieza ocurra solo en el cliente
    window.addEventListener('beforeunload', cleanup);
  }
  
  return <LoginForm />;
}
