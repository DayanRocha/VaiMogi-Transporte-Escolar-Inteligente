
import React, { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Driver, Van, Student, Trip } from '@/types/driver';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { FullScreenMap } from '@/components/FullScreenMap';

interface GuardianMapViewProps {
  driver: Driver;
  van: Van;
  students: Student[];
  activeTrip: Trip | null;
}

export const GuardianMapView = React.memo(({ driver, van, students, activeTrip }: GuardianMapViewProps) => {
  const { 
    hasActiveRoute, 
    activeRoute, 
    driverLocation, 
    nextDestination, 
    isLoading 
  } = useRouteTracking();
  
  const { realtimeData, isCapturing } = useRealtimeData();

  // Bloquear scroll do body quando há rota ativa
  useEffect(() => {
    if (hasActiveRoute) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [hasActiveRoute]);

  // Debug: verificar mudanças no estado da rota
  useEffect(() => {
    console.log('🔍 GuardianMapView - Estado da rota:', {
      hasActiveRoute,
      hasDriverLocation: !!driverLocation,
      hasNextDestination: !!nextDestination
    });
  }, [hasActiveRoute, driverLocation, nextDestination]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'picked_up': return 'bg-blue-100 text-blue-800';
      case 'dropped_off': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Aguardando';
      case 'picked_up': return 'Embarcado';
      case 'dropped_off': return 'Desembarcado';
      default: return 'Desconhecido';
    }
  };

  const getTripStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTripStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconhecida';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-600">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Carregando informações da rota...</p>
        </div>
      </div>
    );
  }

  if (!hasActiveRoute) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🚌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Nenhuma rota ativa
          </h2>
          <p className="text-gray-600">
            Aguardando o início de uma viagem...
          </p>
        </div>
      </div>
    );
  }

  return (
    <FullScreenMap
      driverLocation={driverLocation}
      studentPickups={activeRoute?.studentPickups || []}
      isOpen={false} // Modo container para o painel do responsável
      onClose={() => {}} // Não permite fechar no painel do responsável
    />
  );
});

export default GuardianMapView;
