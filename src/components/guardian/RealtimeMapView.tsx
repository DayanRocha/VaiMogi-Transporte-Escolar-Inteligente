import React, { useEffect, useState } from 'react';
import { MapboxMap } from '@/components/maps/MapboxMap';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { RefreshCw } from 'lucide-react';

interface RealtimeMapViewProps {
  guardianId: string;
  className?: string;
}

interface MapMarker {
  id: string;
  coordinates: [number, number];
  type: 'driver' | 'student' | 'school';
  title: string;
  description?: string;
  color?: string;
}

export const RealtimeMapView: React.FC<RealtimeMapViewProps> = ({
  guardianId,
  className = ''
}) => {
  const {
    realtimeData,
    isCapturing,
    error,
    startCapture
  } = useRealtimeData();

  const [mapError, setMapError] = useState<string | null>(null);
  
  // Importar hook para verificar se há rota ativa
  const { hasActiveRoute } = useRouteTracking();

  // Preparar dados do mapa
  const mapData = React.useMemo(() => {
    if (!realtimeData) return null;

    const markers = [];
    const routes = [];

    // Marcador do motorista com informações avançadas
    if (realtimeData.driverLocation) {
      const speed = realtimeData.driverLocation.speed 
        ? `${(realtimeData.driverLocation.speed * 3.6).toFixed(1)} km/h` 
        : 'N/A';
      
      const heading = realtimeData.driverLocation.heading 
        ? `${realtimeData.driverLocation.heading.toFixed(0)}°` 
        : 'N/A';

      markers.push({
        id: 'driver',
        coordinates: [realtimeData.driverLocation.lng, realtimeData.driverLocation.lat],
        popup: `🚗 Motorista\nLocalização atual\nVelocidade: ${speed}\nDireção: ${heading}\nPrecisão: ${realtimeData.driverLocation.accuracy?.toFixed(1)}m`,
        color: '#3B82F6'
      });
    }

    // Marcadores dos estudantes
    realtimeData.studentAddresses.forEach((student, index) => {
      if (student.coordinates) {
        markers.push({
          id: `student-${index}`,
          coordinates: [student.coordinates.lng, student.coordinates.lat],
          popup: `👨‍🎓 ${student.studentName}\n${student.address}\nTipo: ${student.type || 'Residência'}`,
          color: '#10B981'
        });
      }
    });

    // Marcador da escola
    if (realtimeData.schoolAddress.coordinates) {
      markers.push({
        id: 'school',
        coordinates: [realtimeData.schoolAddress.coordinates[0], realtimeData.schoolAddress.coordinates[1]],
        popup: `🏫 Escola\n${realtimeData.schoolAddress.address}`,
        color: '#F59E0B'
      });
    }

    // Rota calculada
    if (realtimeData.routeCoordinates && realtimeData.routeCoordinates.length > 0) {
      routes.push({
        id: 'main-route',
        coordinates: realtimeData.routeCoordinates,
        color: '#3B82F6',
        width: 4
      });
    }

    return { markers, routes };
  }, [realtimeData]);

  // Coordenadas da rota para exibição
  const routeCoordinates = React.useMemo(() => {
    return realtimeData?.routeCoordinates || [];
  }, [realtimeData]);

  // Centro do mapa baseado na posição do motorista ou primeira coordenada disponível
  const mapCenter = React.useMemo((): [number, number] => {
    if (realtimeData?.driverLocation) {
      return [realtimeData.driverLocation.lng, realtimeData.driverLocation.lat];
    }
    
    if (mapData?.markers && mapData.markers.length > 0) {
      return mapData.markers[0].position;
    }
    
    // Coordenadas padrão (centro de São Paulo)
    return [-46.6333, -23.5505];
  }, [realtimeData, mapData]);

  // Iniciar captura automática quando componente monta
  useEffect(() => {
    if (!isCapturing) {
      startCapture();
    }
  }, [isCapturing, startCapture]);



  // Verificar se há rota ativa antes de exibir o mapa
  if (!hasActiveRoute) {
    return (
      <div className={`${className} h-full w-full flex items-center justify-center bg-gray-50 rounded-lg`}>
        <div className="text-center text-gray-600">
          <div className="mb-4">
            <svg className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
            </svg>
          </div>
          <p className="font-medium text-lg mb-2">Nenhuma Rota Ativa</p>
          <p className="text-sm text-gray-500">O mapa será exibido quando o motorista iniciar uma rota</p>
        </div>
      </div>
    );
  }

  // Renderizar erros
  if (error || mapError) {
    return (
      <div className={`${className} h-full w-full flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center text-red-600">
          <p className="font-medium">Erro no Mapa em Tempo Real</p>
          <p className="text-sm mt-1">{error || mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} h-full w-full relative`}>
      <MapboxMap
        center={mapCenter}
        zoom={13}
        markers={mapData?.markers || []}
        route={routeCoordinates}
        onError={setMapError}
        className="h-full w-full"
      />
      
      {/* Overlay de loading quando não há dados */}
      {!realtimeData && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando dados da rota...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeMapView;