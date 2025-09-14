import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      if (!requireAuth) {
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      // Verificar se há dados de autenticação salvos
      const hasLoggedInBefore = localStorage.getItem('hasLoggedInBefore');
      const driverData = localStorage.getItem('driver');
      const guardianData = localStorage.getItem('currentGuardian');
      const guardianLoggedIn = localStorage.getItem('guardianLoggedIn');
      
      // Se o usuário já fez login antes OU há dados do motorista/responsável salvos, considerar autenticado
      if (hasLoggedInBefore === 'true' || driverData || guardianData || guardianLoggedIn === 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        // Redirecionar para login apenas se não estiver autenticado
        navigate('/login', { replace: true });
      }
      
      setIsChecking(false);
    };

    checkAuthentication();
  }, [navigate, requireAuth]);

  // Mostrar loading enquanto verifica autenticação
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, não renderizar nada (já redirecionou)
  if (!isAuthenticated) {
    return null;
  }

  // Se está autenticado, renderizar o componente filho
  return <>{children}</>;
};