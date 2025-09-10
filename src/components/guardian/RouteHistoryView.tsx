import React, { useState, useMemo } from 'react';
import { MapboxMap } from '@/components/maps/MapboxMap';
import { VehiclePosition } from '@/services/vehicleTrackingService';

interface RouteHistoryViewProps {
  /** Histórico de posições do veículo */
  positionHistory: VehiclePosition[];
  /** Callback quando o componente é fechado */
  onClose: () => void;
  /** Título do modal */
  title?: string;
}

/**
 * Componente para visualizar o histórico completo da rota percorrida
 */
export const RouteHistoryView: React.FC<RouteHistoryViewProps> = ({
  positionHistory,
  onClose,
  title = "📍 Histórico da Rota"
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | '1h' | '30min' | '15min'>('all');
  const [showSpeedColors, setShowSpeedColors] = useState(true);
  const [showTimeMarkers, setShowTimeMarkers] = useState(false);

  // Filtrar posições por intervalo de tempo
  const filteredPositions = useMemo(() => {
    if (selectedTimeRange === 'all') return positionHistory;

    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '30min': 30 * 60 * 1000,
      '15min': 15 * 60 * 1000
    };

    const cutoffTime = now - timeRanges[selectedTimeRange];
    return positionHistory.filter(pos => pos.timestamp >= cutoffTime);
  }, [positionHistory, selectedTimeRange]);

  // Preparar dados do mapa
  const mapData = useMemo(() => {
    if (filteredPositions.length === 0) return { markers: [], routes: [] };

    const markers = [];
    const routes = [];

    // Marcador de início
    if (filteredPositions.length > 0) {
      const firstPos = filteredPositions[0];
      markers.push({
        id: 'start',
        position: [firstPos.longitude, firstPos.latitude] as [number, number],
        type: 'start' as const,
        popup: {
          title: '🚩 Início',
          content: `Horário: ${new Date(firstPos.timestamp).toLocaleTimeString()}\nVelocidade: ${firstPos.speed ? (firstPos.speed * 3.6).toFixed(1) + ' km/h' : 'N/A'}`
        }
      });
    }

    // Marcador de fim (posição atual)
    if (filteredPositions.length > 1) {
      const lastPos = filteredPositions[filteredPositions.length - 1];
      markers.push({
        id: 'end',
        position: [lastPos.longitude, lastPos.latitude] as [number, number],
        type: 'driver' as const,
        popup: {
          title: '🏁 Posição Atual',
          content: `Horário: ${new Date(lastPos.timestamp).toLocaleTimeString()}\nVelocidade: ${lastPos.speed ? (lastPos.speed * 3.6).toFixed(1) + ' km/h' : 'N/A'}`
        }
      });
    }

    // Marcadores de tempo (a cada 10 minutos)
    if (showTimeMarkers && filteredPositions.length > 2) {
      const timeInterval = 10 * 60 * 1000; // 10 minutos
      let lastMarkerTime = 0;

      filteredPositions.forEach((pos, index) => {
        if (pos.timestamp - lastMarkerTime >= timeInterval) {
          markers.push({
            id: `time-${index}`,
            position: [pos.longitude, pos.latitude] as [number, number],
            type: 'waypoint' as const,
            popup: {
              title: '⏰ Marcador de Tempo',
              content: `${new Date(pos.timestamp).toLocaleTimeString()}\nVelocidade: ${pos.speed ? (pos.speed * 3.6).toFixed(1) + ' km/h' : 'N/A'}`
            }
          });
          lastMarkerTime = pos.timestamp;
        }
      });
    }

    // Criar rota com cores baseadas na velocidade
    if (filteredPositions.length > 1) {
      const coordinates = filteredPositions.map(pos => [pos.longitude, pos.latitude]);
      
      if (showSpeedColors) {
        // Dividir rota em segmentos coloridos por velocidade
        const segments = [];
        for (let i = 0; i < filteredPositions.length - 1; i++) {
          const currentPos = filteredPositions[i];
          const nextPos = filteredPositions[i + 1];
          
          const speed = currentPos.speed || 0;
          const speedKmh = speed * 3.6;
          
          let color = '#10B981'; // Verde (baixa velocidade)
          if (speedKmh > 60) color = '#F59E0B'; // Amarelo (velocidade média)
          if (speedKmh > 80) color = '#EF4444'; // Vermelho (alta velocidade)
          
          segments.push({
            id: `segment-${i}`,
            coordinates: [
              [currentPos.longitude, currentPos.latitude],
              [nextPos.longitude, nextPos.latitude]
            ],
            color,
            width: 4
          });
        }
        routes.push(...segments);
      } else {
        // Rota única com cor padrão
        routes.push({
          id: 'full-route',
          coordinates,
          color: '#3B82F6',
          width: 4
        });
      }
    }

    return { markers, routes };
  }, [filteredPositions, showSpeedColors, showTimeMarkers]);

  // Calcular centro do mapa
  const mapCenter = useMemo(() => {
    if (filteredPositions.length === 0) return [-46.6333, -23.5505];
    
    const avgLat = filteredPositions.reduce((sum, pos) => sum + pos.latitude, 0) / filteredPositions.length;
    const avgLng = filteredPositions.reduce((sum, pos) => sum + pos.longitude, 0) / filteredPositions.length;
    
    return [avgLng, avgLat];
  }, [filteredPositions]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (filteredPositions.length < 2) return null;

    const totalDistance = filteredPositions.reduce((total, pos, index) => {
      if (index === 0) return 0;
      const prevPos = filteredPositions[index - 1];
      const distance = calculateDistance(
        prevPos.latitude, prevPos.longitude,
        pos.latitude, pos.longitude
      );
      return total + distance;
    }, 0);

    const speeds = filteredPositions.filter(pos => pos.speed).map(pos => pos.speed!);
    const avgSpeed = speeds.length > 0 ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

    const duration = filteredPositions[filteredPositions.length - 1].timestamp - filteredPositions[0].timestamp;

    return {
      totalDistance: totalDistance / 1000, // em km
      avgSpeed: avgSpeed * 3.6, // em km/h
      maxSpeed: maxSpeed * 3.6, // em km/h
      duration: duration / (1000 * 60), // em minutos
      totalPoints: filteredPositions.length
    };
  }, [filteredPositions]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Controles */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Filtro de tempo */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Período:</label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todo o histórico</option>
                <option value="1h">Última 1 hora</option>
                <option value="30min">Últimos 30 min</option>
                <option value="15min">Últimos 15 min</option>
              </select>
            </div>

            {/* Opções de visualização */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showSpeedColors}
                  onChange={(e) => setShowSpeedColors(e.target.checked)}
                  className="rounded"
                />
                Cores por velocidade
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showTimeMarkers}
                  onChange={(e) => setShowTimeMarkers(e.target.checked)}
                  className="rounded"
                />
                Marcadores de tempo
              </label>
            </div>
          </div>

          {/* Estatísticas */}
          {stats && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-blue-600">📏 Distância</div>
                <div className="text-gray-800">{stats.totalDistance.toFixed(2)} km</div>
              </div>
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-green-600">⚡ Vel. Média</div>
                <div className="text-gray-800">{stats.avgSpeed.toFixed(1)} km/h</div>
              </div>
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-orange-600">🏃 Vel. Máxima</div>
                <div className="text-gray-800">{stats.maxSpeed.toFixed(1)} km/h</div>
              </div>
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-purple-600">⏱️ Duração</div>
                <div className="text-gray-800">{Math.round(stats.duration)} min</div>
              </div>
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-600">📍 Pontos</div>
                <div className="text-gray-800">{stats.totalPoints}</div>
              </div>
            </div>
          )}
        </div>

        {/* Mapa */}
        <div className="flex-1 relative">
          {filteredPositions.length > 0 ? (
            <MapboxMap
              markers={mapData.markers}
              routes={mapData.routes}
              center={mapCenter}
              zoom={14}
              className="w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📍</div>
                <div>Nenhum dado de posição disponível para o período selecionado</div>
              </div>
            </div>
          )}

          {/* Legenda de cores */}
          {showSpeedColors && (
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm">
              <div className="font-medium mb-2">Legenda de Velocidade:</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-green-500 rounded"></div>
                  <span>0-60 km/h</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-yellow-500 rounded"></div>
                  <span>60-80 km/h</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 bg-red-500 rounded"></div>
                  <span>80+ km/h</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Raio da Terra em metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default RouteHistoryView;