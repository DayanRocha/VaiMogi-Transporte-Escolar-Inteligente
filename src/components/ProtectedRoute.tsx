import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Verificar se há dados de autenticação no localStorage
  const hasLoggedInBefore = localStorage.getItem('hasLoggedInBefore');
  const driverData = localStorage.getItem('driverData');
  const guardianData = localStorage.getItem('guardianData');
  const guardianLoggedIn = localStorage.getItem('guardianLoggedIn');
  
  // Logs de debug para investigar o problema
  console.log('🔍 ProtectedRoute Debug:', {
    hasLoggedInBefore,
    driverData: driverData ? JSON.parse(driverData) : null,
    guardianData: guardianData ? JSON.parse(guardianData) : null,
    guardianLoggedIn,
    currentPath
  });
  
  // Verificar se o usuário está autenticado
  let isAuthenticated = false;
  
  if (currentPath === '/driver') {
    // Para rota do motorista, verificar se há dados do motorista
    isAuthenticated = !!(hasLoggedInBefore && driverData);
  } else if (currentPath === '/guardian') {
    // Para rota do responsável, verificar se há dados do responsável
    isAuthenticated = !!(guardianLoggedIn === 'true' && guardianData);
  }
  
  console.log('🔐 Autenticação:', { isAuthenticated, currentPath });
  
  if (!isAuthenticated) {
    console.log('❌ Usuário não autenticado, redirecionando para /');
    return <Navigate to="/" replace />;
  }
  
  console.log('✅ Usuário autenticado, renderizando componente');
  return <>{children}</>;
};