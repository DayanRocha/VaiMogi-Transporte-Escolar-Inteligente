
import { useState, useEffect } from 'react';
import { routeTrackingService, ActiveRoute } from '@/services/routeTrackingService';

export const useRouteTracking = () => {
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicialização com verificação de persistência robusta
  useEffect(() => {
    console.log('🔍 useRouteTracking inicializando - verificando persistência...');
    
    const initializeRoute = () => {
      const route = routeTrackingService.getActiveRoute();
      console.log('🔍 Rota encontrada no service:', route ? 'SIM' : 'NÃO');
      console.log('Debug: Route details:', route ? { isActive: route.isActive, driverName: route.driverName, id: route.id } : 'null');
      console.log('Debug: Driver encontrado:', route ? !!route.driverName : false);
      console.log('Debug: Conteúdo de activeRoute no localStorage:', localStorage.getItem('activeRoute'));
      console.log('Debug: Flag de persistência:', localStorage.getItem('routePersistenceFlag'));
      console.log('Debug: Tempo desde o início da rota:', route ? `${Math.floor((Date.now() - new Date(route.startTime).getTime()) / (1000 * 60))}min` : 'N/A');
      
      setActiveRoute(route);
      setIsLoading(false);
      
      if (route && route.isActive) {
        console.log('✅ Rota ativa restaurada no hook:', {
          id: route.id,
          driverName: route.driverName,
          studentsCount: route.studentPickups?.length || 0,
          hasLocation: !!route.currentLocation,
          startTime: route.startTime,
          persistenceFlag: localStorage.getItem('routePersistenceFlag'),
          currentLocation: route.currentLocation ? 
            `${route.currentLocation.lat.toFixed(4)}, ${route.currentLocation.lng.toFixed(4)}` : 
            'Não disponível'
        });
      } else {
        console.log('ℹ️ Nenhuma rota ativa encontrada no hook');
        
        // Debug adicional
        const storedRoute = localStorage.getItem('activeRoute');
        if (storedRoute) {
          try {
            const parsed = JSON.parse(storedRoute);
            console.log('🔍 Rota no localStorage encontrada:', {
              id: parsed.id,
              isActive: parsed.isActive,
              driverName: parsed.driverName
            });
          } catch (e) {
            console.error('❌ Erro ao parsear rota do localStorage:', e);
          }
        } else {
          console.log('ℹ️ Nenhuma rota no localStorage');
        }
      }
    };

    // Verificar múltiplas vezes para garantir que não perdemos a rota
    initializeRoute();
    
    // Verificação adicional após pequeno delay
    const timeoutId = setTimeout(initializeRoute, 500);
    
    // Verificação adicional após delay maior
    const timeoutId2 = setTimeout(initializeRoute, 2000);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, []);

  // Listener para mudanças na rota com máxima confiabilidade
  useEffect(() => {
    const handleRouteChange = (route: ActiveRoute | null) => {
      console.log('🔄 Mudança na rota detectada pelo listener:', route ? 'Rota ativa' : 'Sem rota');
      
      setActiveRoute(route);
      
      if (route === null) {
        console.log('🔴 Rota foi explicitamente finalizada');
      } else if (route) {
        console.log('🟢 Rota ativa confirmada pelo listener:', {
          driverName: route.driverName,
          hasLocation: !!route.currentLocation,
          nextStudent: route.studentPickups.find(s => s.status === 'pending')?.studentName || 'Nenhum',
          isActive: route.isActive,
          persistenceCheck: routeTrackingService.hasPersistentRoute()
        });
      }
    };

    // Registrar listener
    routeTrackingService.addListener(handleRouteChange);

    return () => {
      routeTrackingService.removeListener(handleRouteChange);
    };
  }, []);

  // Verificação contínua de sincronização (mais conservadora)
  useEffect(() => {
    const syncCheck = setInterval(() => {
      const currentStoredRoute = routeTrackingService.getActiveRoute();
      
      // Se há uma rota no storage mas não temos uma localmente
      if (currentStoredRoute && currentStoredRoute.isActive && !activeRoute) {
        console.log('🔄 Sincronizando: rota ativa encontrada no storage, restaurando...');
        setActiveRoute(currentStoredRoute);
      }
      
      // Se nossa rota local não está mais no storage
      if (activeRoute && activeRoute.isActive && !currentStoredRoute) {
        console.log('⚠️ Rota local não encontrada no storage - pode ter sido limpa');
        setActiveRoute(null);
      }
      
      // Verificação de consistência
      if (activeRoute && currentStoredRoute && activeRoute.id !== currentStoredRoute.id) {
        console.log('🔄 IDs de rota diferentes, sincronizando...');
        setActiveRoute(currentStoredRoute);
      }
      
    }, 15000); // Verificar a cada 15 segundos

    return () => clearInterval(syncCheck);
  }, [activeRoute]);

  // Log de debug periódico mais informativo
  useEffect(() => {
    const debugInterval = setInterval(() => {
      const hasRoute = activeRoute !== null && activeRoute?.isActive;
      const storedRoute = routeTrackingService.getActiveRoute();
      const hasPersistentFlag = localStorage.getItem('routePersistenceFlag') === 'true';
      
      if (hasRoute || storedRoute) {
        console.log('🐛 Debug - Estado da persistência de rota:', {
          hasActiveRouteInHook: hasRoute,
          hasStoredRoute: !!storedRoute,
          hasPersistenceFlag: hasPersistentFlag,
          routeIds: {
            hook: activeRoute?.id || 'N/A',
            stored: storedRoute?.id || 'N/A'
          },
          driverLocation: activeRoute?.currentLocation ? 
            `${activeRoute.currentLocation.lat.toFixed(4)}, ${activeRoute.currentLocation.lng.toFixed(4)}` : 
            'Não disponível',
          nextDestination: activeRoute?.studentPickups.find(s => s.status === 'pending')?.studentName || 'Nenhum',
          progress: activeRoute ? 
            `${((activeRoute.studentPickups.filter(s => s.status !== 'pending').length / activeRoute.studentPickups.length) * 100).toFixed(1)}%` : 
            '0%',
          elapsedTime: activeRoute ? 
            `${Math.floor((Date.now() - new Date(activeRoute.startTime).getTime()) / (1000 * 60))}min` : 
            'N/A'
        });
      }
    }, 20000); // Log a cada 20 segundos

    return () => clearInterval(debugInterval);
  }, [activeRoute]);

  // Calculadores e utilidades (sem mudanças significativas)
  const hasActiveRoute = activeRoute !== null && activeRoute.isActive === true;
  const driverLocation = activeRoute?.currentLocation;
  const nextDestination = activeRoute?.studentPickups.find(student => student.status === 'pending');
  const routeProgress = activeRoute ? 
    (activeRoute.studentPickups.filter(s => s.status !== 'pending').length / activeRoute.studentPickups.length) * 100 : 0;

  const getElapsedTime = (): string => {
    if (!activeRoute) return '0min';
    
    const start = new Date(activeRoute.startTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  };

  const getDistanceToNext = (): string | null => {
    if (!driverLocation || !nextDestination || !nextDestination.lat || !nextDestination.lng) {
      return null;
    }

    const distance = routeTrackingService.calculateDistance(
      driverLocation.lat,
      driverLocation.lng,
      nextDestination.lat,
      nextDestination.lng
    );

    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  return {
    activeRoute,
    hasActiveRoute,
    driverLocation,
    nextDestination,
    routeProgress,
    isLoading,
    elapsedTime: getElapsedTime(),
    distanceToNext: getDistanceToNext(),
    // Utilitário adicional para verificar persistência
    isPersistent: routeTrackingService.hasPersistentRoute()
  };
};
