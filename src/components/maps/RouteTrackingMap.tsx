
import React, { useEffect, useState, useCallback } from 'react';
import { MapboxMap } from './MapboxMap';
import { useMapbox } from '../../hooks/useMapbox';
import mapboxgl from 'mapbox-gl';
import { Button } from '../ui/button';
import { RefreshCw, Navigation, MapPin } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  pickupPoint: {
    address: string;
    coordinates?: [number, number];
  };
  dropoffLocation: 'home' | 'school';
  status: 'waiting' | 'picked_up' | 'dropped_off';
}

interface RouteTrackingMapProps {
  students: Student[];
  driverLocation?: [number, number];
  schoolLocation?: [number, number];
  onStudentClick?: (student: Student) => void;
  className?: string;
}

export const RouteTrackingMap: React.FC<RouteTrackingMapProps> = ({
  students,
  driverLocation,
  schoolLocation,
  onStudentClick,
  className
}) => {
  const { getRoute, getCurrentLocation, geocodeAddress, isLoading, error } = useMapbox();
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [markers, setMarkers] = useState<Array<{
    id: string;
    coordinates: [number, number];
    popup?: string;
    color?: string;
  }>>([]);
  const [currentDriverLocation, setCurrentDriverLocation] = useState<[number, number] | null>(driverLocation || null);

  // Geocodificar endereços dos estudantes
  const geocodeStudents = useCallback(async () => {
    const geocodedStudents = await Promise.all(
      students.map(async (student) => {
        if (student.pickupPoint.coordinates) {
          return { ...student, coordinates: student.pickupPoint.coordinates };
        }
        
        const coordinates = await geocodeAddress(student.pickupPoint.address);
        return {
          ...student,
          coordinates: coordinates || undefined
        };
      })
    );

    return geocodedStudents.filter(student => student.coordinates);
  }, [students, geocodeAddress]);

  // Atualizar marcadores
  useEffect(() => {
    const updateMarkers = async () => {
      const geocodedStudents = await geocodeStudents();
      const newMarkers = [];

      // Adicionar marcador da escola
      newMarkers.push({
        id: 'school',
        coordinates: schoolLocation,
        popup: '<div class="p-2"><strong>🏫 Escola</strong></div>',
        color: '#10b981' // verde
      });

      // Adicionar marcadores dos estudantes
      geocodedStudents.forEach((student) => {
        if (student.coordinates) {
          const statusColors = {
            waiting: '#f59e0b', // amarelo
            picked_up: '#3b82f6', // azul
            dropped_off: '#6b7280' // cinza
          };

          const statusText = {
            waiting: 'Aguardando',
            picked_up: 'Embarcado',
            dropped_off: 'Desembarcado'
          };

          newMarkers.push({
            id: student.id,
            coordinates: student.coordinates,
            popup: `
              <div class="p-3 min-w-[200px]">
                <h3 class="font-bold text-sm mb-1">${student.name}</h3>
                <p class="text-xs text-gray-600 mb-1">${student.pickupPoint.address}</p>
                <p class="text-xs">
                  <span class="inline-block w-2 h-2 rounded-full mr-1" style="background-color: ${statusColors[student.status]}"></span>
                  ${statusText[student.status]}
                </p>
                <p class="text-xs mt-1">
                  ${student.dropoffLocation === 'home' ? '🏠 Casa' : '🏫 Escola'}
                </p>
              </div>
            `,
            color: statusColors[student.status]
          });
        }
      });

      // Adicionar marcador do motorista
      if (currentDriverLocation) {
        newMarkers.push({
          id: 'driver',
          coordinates: currentDriverLocation,
          popup: '<div class="p-2"><strong>🚐 Motorista</strong></div>',
          color: '#dc2626' // vermelho
        });
      }

      setMarkers(newMarkers);
    };

    updateMarkers();
  }, [students, currentDriverLocation, schoolLocation, geocodeStudents]);

  // Calcular rota otimizada
  const calculateOptimizedRoute = useCallback(async () => {
    if (!currentDriverLocation) return;

    const geocodedStudents = await geocodeStudents();
    const waitingStudents = geocodedStudents.filter(s => s.status === 'waiting' && s.coordinates);
    
    if (waitingStudents.length === 0) return;

    // Rota simples: motorista -> estudantes -> escola
    const routePoints = [
      currentDriverLocation,
      ...waitingStudents.map(s => s.coordinates!),
      schoolLocation
    ];

    // Para uma rota mais complexa, você pode usar a API de otimização do Mapbox
    // Por enquanto, vamos conectar os pontos em sequência
    const routeCoordinates: Array<[number, number]> = [];
    
    for (let i = 0; i < routePoints.length - 1; i++) {
      const routeData = await getRoute(routePoints[i], routePoints[i + 1]);
      if (routeData && routeData.routes[0]) {
        routeCoordinates.push(...routeData.routes[0].geometry.coordinates);
      }
    }

    setRoute(routeCoordinates);
  }, [currentDriverLocation, schoolLocation, geocodeStudents, getRoute]);

  // Atualizar localização do motorista
  const updateDriverLocation = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location) {
      setCurrentDriverLocation(location);
    }
  }, [getCurrentLocation]);

  // Ajustar visualização do mapa
  const fitMapToMarkers = useCallback(() => {
    if (!map || markers.length === 0) return;

    const coordinates = markers.map(marker => marker.coordinates);
    const bounds = new mapboxgl.LngLatBounds();
    
    coordinates.forEach(coord => bounds.extend(coord));
    
    map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15
    });
  }, [map, markers]);

  useEffect(() => {
    if (map && markers.length > 0) {
      fitMapToMarkers();
    }
  }, [map, markers, fitMapToMarkers]);

  return (
    <div className={`relative ${className || 'w-full h-96'}`}>
      <MapboxMap
        markers={markers}
        route={route}
        onMapLoad={setMap}
        className="w-full h-full"
      />
      
      {/* Controles do mapa */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={updateDriverLocation}
          disabled={isLoading}
          className="bg-white shadow-md"
        >
          <Navigation className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="secondary"
          onClick={calculateOptimizedRoute}
          disabled={isLoading || !currentDriverLocation}
          className="bg-white shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        
        <Button
          size="sm"
          variant="secondary"
          onClick={fitMapToMarkers}
          disabled={markers.length === 0}
          className="bg-white shadow-md"
        >
          <MapPin className="w-4 h-4" />
        </Button>
      </div>

      {/* Indicador de carregamento */}
      {isLoading && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2">
          <div className="flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Carregando...</span>
          </div>
        </div>
      )}

      {/* Indicador de erro */}
      {error && (
        <div className="absolute bottom-4 left-4 bg-red-50 border border-red-200 rounded-lg shadow-md p-3 max-w-xs">
          <p className="text-red-800 text-sm font-medium">Erro</p>
          <p className="text-red-600 text-xs mt-1">{error}</p>
        </div>
      )}
    </div>
  );
};

export default RouteTrackingMap;
