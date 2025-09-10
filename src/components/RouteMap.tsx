import React, { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, AlertCircle } from 'lucide-react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';
import { MapboxMap } from './maps/MapboxMap';
import { useMapbox } from '../hooks/useMapbox';
import mapboxgl from 'mapbox-gl';

interface RouteMapProps {
  activeRoute: ActiveRoute;
  driverLocation?: RouteLocation;
  nextDestination?: {
    studentId: string;
    studentName: string;
    address: string;
    lat?: number;
    lng: number;
    status: 'pending' | 'picked_up' | 'dropped_off';
  };
}

export const RouteMap: React.FC<RouteMapProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const { getRoute, isLoading: mapboxLoading, error: mapboxError } = useMapbox();
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [markers, setMarkers] = useState<Array<{
    id: string;
    coordinates: [number, number];
    popup?: string;
    color?: string;
  }>>([]);
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Atualizar marcadores baseado nos dados da rota
  useEffect(() => {
    const newMarkers = [];

    // Adicionar marcador do motorista
    if (driverLocation) {
      newMarkers.push({
        id: 'driver',
        coordinates: [driverLocation.lng, driverLocation.lat] as [number, number],
        popup: `
          <div class="p-3">
            <h3 class="font-bold text-sm mb-1">🚐 ${activeRoute.driverName}</h3>
            <p class="text-xs text-gray-600">Motorista da Van</p>
            <p class="text-xs mt-1">Última atualização: ${new Date(driverLocation.timestamp).toLocaleTimeString()}</p>
          </div>
        `,
        color: '#3b82f6'
      });
    }

    // Adicionar marcadores dos estudantes
    if (activeRoute.studentPickups) {
      activeRoute.studentPickups.forEach((student, index) => {
        if (student.lat && student.lng) {
          const isNext = nextDestination?.studentId === student.studentId;
          const statusColors = {
            pending: isNext ? '#f59e0b' : '#ef4444',
            picked_up: '#3b82f6',
            dropped_off: '#10b981'
          };

          const statusText = {
            pending: 'Aguardando',
            picked_up: 'Na Van',
            dropped_off: 'Entregue'
          };

          newMarkers.push({
            id: student.studentId,
            coordinates: [student.lng, student.lat] as [number, number],
            popup: `
              <div class="p-3 min-w-[200px]">
                <h3 class="font-bold text-sm mb-1">${student.studentName}</h3>
                <p class="text-xs text-gray-600 mb-1">${student.address}</p>
                <p class="text-xs">
                  <span class="inline-block w-2 h-2 rounded-full mr-1" style="background-color: ${statusColors[student.status]}"></span>
                  ${statusText[student.status]}
                </p>
                ${isNext ? '<p class="text-xs mt-1 font-bold text-yellow-600">⭐ Próximo destino</p>' : ''}
              </div>
            `,
            color: statusColors[student.status]
          });
        }
      });
    }

    setMarkers(newMarkers);
    setIsLoading(false);
  }, [activeRoute, driverLocation, nextDestination]);

  // Calcular rota quando necessário
  useEffect(() => {
    if (!driverLocation || !activeRoute.studentPickups) return;

    const calculateRoute = async () => {
      const pendingStudents = activeRoute.studentPickups
        .filter(student => student.status === 'pending' && student.lat && student.lng);
      
      if (pendingStudents.length === 0) return;

      // Rota simples: conectar pontos em sequência
      const routePoints: Array<[number, number]> = [
        [driverLocation.lng, driverLocation.lat]
      ];

      pendingStudents.forEach(student => {
        routePoints.push([student.lng, student.lat!]);
      });

      // Para uma implementação mais avançada, você pode usar a API de rotas do MapBox
      // Por enquanto, vamos apenas conectar os pontos
      setRoute(routePoints);
    };

    calculateRoute();
  }, [driverLocation, activeRoute.studentPickups, getRoute]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-600">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Carregando mapa em tempo real...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <MapboxMap
        center={driverLocation ? [driverLocation.lng, driverLocation.lat] : undefined}
        markers={markers}
        route={route}
        onMapLoad={setMap}
        className="w-full h-full"
      />
      
      {/* Legenda */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs z-[1000]">
        <h4 className="font-semibold text-sm mb-2">Legenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">🚐</div>
            <span>Motorista (Van)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full text-white text-xs flex items-center justify-center font-bold">⭐</div>
            <span>Próximo destino</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">P</div>
            <span>Aguardando</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full text-white text-xs flex items-center justify-center font-bold">✓</div>
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500" style={{ borderStyle: 'dashed' }}></div>
            <span>Rota</span>
          </div>
        </div>
      </div>

      {/* Informações da rota */}
      {nextDestination && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-sm">Próximo: {nextDestination.studentName}</span>
          </div>
          <p className="text-xs text-gray-600">{nextDestination.address}</p>
        </div>
      )}

      {/* Indicador de carregamento */}
      {(isLoading || mapboxLoading) && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Carregando mapa...</span>
          </div>
        </div>
      )}

      {/* Indicador de erro */}
      {mapboxError && (
        <div className="absolute bottom-4 left-4 bg-red-50 border border-red-200 rounded-lg shadow-md p-3 max-w-xs">
          <p className="text-red-800 text-sm font-medium">Erro no Mapa</p>
          <p className="text-red-600 text-xs mt-1">{mapboxError}</p>
        </div>
      )}
    </div>
  );
};