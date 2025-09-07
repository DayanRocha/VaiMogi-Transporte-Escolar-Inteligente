
import React, { useState, useMemo } from 'react';
import { MapPin, AlertCircle, Navigation } from 'lucide-react';
import { Driver, Van, Student, Trip } from '@/types/driver';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { MapboxMap } from '@/components/maps/MapboxMap';
import { RealtimeMapView } from '@/components/guardian/RealtimeMapView';

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
  const [mapError, setMapError] = useState(false);
  const [useRealtimeMode, setUseRealtimeMode] = useState(true);

  // Memoizar dados do mapa para evitar recriações desnecessárias - SEMPRE executar hooks
  const mapData = useMemo(() => {
    try {
      // Usar localização do motorista ou localização padrão de São Paulo
      const defaultLocation = {
        lat: -23.5505,
        lng: -46.6333
      };
      
      const currentDriverLocation = driverLocation || defaultLocation;
      
      // Validar coordenadas antes de usar
      const isValidCoordinate = (lat: number, lng: number) => {
        return typeof lat === 'number' && typeof lng === 'number' &&
               !isNaN(lat) && !isNaN(lng) && 
               lat >= -90 && lat <= 90 && 
               lng >= -180 && lng <= 180;
      };
      
      const markers = [];
      
      if (isValidCoordinate(currentDriverLocation.lat, currentDriverLocation.lng)) {
        markers.push({
          id: 'driver',
          coordinates: [currentDriverLocation.lng, currentDriverLocation.lat] as [number, number],
          popup: `<div class="p-2"><strong>${driver?.name || 'Motorista'} - ${van?.plate || 'Veículo'}</strong><br/>Localização ${driverLocation ? 'atual' : 'padrão'} do motorista</div>`,
          color: '#10B981' // Verde para o motorista
        });
      }
      
      // Adicionar marcador do próximo destino se disponível
      if (nextDestination && 
          typeof nextDestination.lng === 'number' && 
          typeof nextDestination.lat === 'number' && 
          isValidCoordinate(nextDestination.lat, nextDestination.lng)) {
        markers.push({
          id: 'next-destination',
          coordinates: [nextDestination.lng, nextDestination.lat] as [number, number],
          popup: `<div class="p-2"><strong>Próximo Destino</strong><br/>${nextDestination.address || nextDestination.studentName || 'Destino da rota'}</div>`,
          color: '#F59E0B' // Laranja para o destino
        });
      }
      
      // Preparar dados da rota se disponível
      const routeCoordinates = (activeRoute && activeRoute.coordinates && Array.isArray(activeRoute.coordinates)) ? 
        activeRoute.coordinates.filter(coord => Array.isArray(coord) && coord.length === 2 && 
          typeof coord[0] === 'number' && typeof coord[1] === 'number') : [];
      
      // Determinar centro do mapa
      const mapCenter: [number, number] = [currentDriverLocation.lng, currentDriverLocation.lat];
      
      return {
        markers,
        routeCoordinates,
        mapCenter,
        currentDriverLocation,
        isValid: true
      };
    } catch (error) {
      console.error('Erro ao processar dados do mapa:', error);
      return {
        markers: [],
        routeCoordinates: [],
        mapCenter: [-46.6333, -23.5505] as [number, number],
        currentDriverLocation: { lat: -23.5505, lng: -46.6333 },
        isValid: false
      };
    }
  }, [driverLocation, nextDestination, activeRoute, driver?.name, van?.plate]);

  // Renderização condicional APÓS todos os hooks
  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm">Verificando rota ativa...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se há rota ativa e modo tempo real está habilitado, usar o componente de tempo real
  if (hasActiveRoute && useRealtimeMode && (realtimeData || isCapturing)) {
    return (
      <div className="w-full h-full relative">
        <RealtimeMapView 
          guardianId={driver?.id || 'unknown'} 
          className="w-full h-full"
        />
        
        {/* Toggle para modo clássico */}
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => setUseRealtimeMode(false)}
            className="bg-white rounded-lg shadow-lg p-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2 text-sm"
            title="Alternar para modo clássico"
          >
            <MapPin className="w-4 h-4" />
            Modo Clássico
          </button>
        </div>
      </div>
    );
  }

  // Se não há rota ativa, mostrar tela de aguardo
  if (!hasActiveRoute || !activeRoute) {
    return (
      <div className="relative w-full h-full bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center text-gray-600 max-w-md mx-auto px-6">
            <div className="mb-6">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              Aguardando Rota
            </h3>
            <p className="text-gray-500 mb-4">
              O mapa será exibido quando o motorista <strong>{driver.name}</strong> iniciar uma rota.
            </p>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Motorista:</span>
                <span className="font-medium text-gray-800">{driver.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Veículo:</span>
                <span className="font-medium text-gray-800">{van.licensePlate}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Status:</span>
                <span className="text-orange-600 font-medium">Aguardando início da rota</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback se houver erro no mapa
  if (mapError) {
    return (
      <div className="w-full h-full bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center text-gray-600 max-w-md mx-auto px-6">
            <div className="mb-6">
              <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              Rota Ativa - Modo Simplificado
            </h3>
            <p className="text-gray-500 mb-4">
              O mapa não pôde ser carregado, mas a rota está ativa.
            </p>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-800">Rota em Andamento</span>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Motorista:</span>
                  <span className="font-medium text-gray-800">{driver.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Veículo:</span>
                  <span className="font-medium text-gray-800">{van.licensePlate}</span>
                </div>
                {nextDestination && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Próximo:</span>
                    <span className="font-medium text-gray-800">{nextDestination.studentName || 'Destino'}</span>
                  </div>
                )}
                {mapData.currentDriverLocation && driverLocation && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Localização: {mapData.currentDriverLocation.lat.toFixed(4)}, {mapData.currentDriverLocation.lng.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se os dados do mapa não são válidos, mostrar modo simplificado
  if (!mapData.isValid) {
    return (
      <div className="w-full h-full bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center text-gray-600 max-w-md mx-auto px-6">
            <div className="mb-6">
              <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              Rota Ativa - Carregando Dados
            </h3>
            <p className="text-gray-500 mb-4">
              Aguardando dados válidos do mapa...
            </p>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-800">Rota em Andamento</span>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Motorista:</span>
                  <span className="font-medium text-gray-800">{driver?.name || 'Carregando...'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Veículo:</span>
                  <span className="font-medium text-gray-800">{van?.plate || 'Carregando...'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="relative w-full h-full">
        <MapboxMap
          center={mapData.mapCenter}
          markers={mapData.markers}
          route={mapData.routeCoordinates}
          className="w-full h-full"
          zoom={15}
          onMapLoad={() => setMapError(false)}
          onError={(error) => {
            console.error('Erro no mapa do responsável:', error);
            setMapError(true);
          }}
        />
        
        {/* Overlay com informações da rota ativa */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-800">Rota Ativa</span>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Motorista: <span className="font-medium">{driver?.name || 'N/A'}</span></div>
            <div>Veículo: <span className="font-medium">{van?.plate || 'N/A'}</span></div>
            {nextDestination && (
              <div>Próximo: <span className="font-medium">{nextDestination.studentName || 'Destino'}</span></div>
            )}
          </div>
        </div>
        
        {/* Controles do mapa */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {/* Toggle para modo tempo real */}
          {hasActiveRoute && (
            <button
              onClick={() => setUseRealtimeMode(true)}
              className="bg-white rounded-lg shadow-lg p-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2 text-sm"
              title="Alternar para modo tempo real"
            >
              <Navigation className="w-4 h-4" />
              Tempo Real
            </button>
          )}
          
          {/* Botão para modo simplificado */}
          <button
            onClick={() => setMapError(true)}
            className="bg-white rounded-lg shadow-lg p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Modo simplificado"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

GuardianMapView.displayName = 'GuardianMapView';
