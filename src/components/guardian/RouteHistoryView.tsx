import React, { useState, useMemo } from 'react';
import { VehiclePosition } from '@/services/vehicleTrackingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Clock, MapPin, Activity, TrendingUp, AlertCircle } from 'lucide-react';

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

  // Calcular estatísticas da rota
  const routeStats = useMemo(() => {
    if (filteredPositions.length === 0) return null;

    const speeds = filteredPositions.filter(pos => pos.speed !== undefined).map(pos => pos.speed!);
    const totalDistance = filteredPositions.reduce((acc, pos, index) => {
      if (index === 0) return 0;
      const prev = filteredPositions[index - 1];
      const distance = calculateDistance(prev.lat, prev.lng, pos.lat, pos.lng);
      return acc + distance;
    }, 0);

    const duration = filteredPositions.length > 0 
      ? (filteredPositions[filteredPositions.length - 1].timestamp - filteredPositions[0].timestamp) / (1000 * 60)
      : 0;

    return {
      totalPoints: filteredPositions.length,
      distance: totalDistance,
      duration: duration,
      avgSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
      maxSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
      minSpeed: speeds.length > 0 ? Math.min(...speeds) : 0
    };
  }, [filteredPositions]);

  // Função para calcular distância entre dois pontos
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatSpeed = (speed: number) => {
    return `${speed.toFixed(1)} km/h`;
  };

  const getSpeedColor = (speed: number) => {
    if (speed < 10) return 'text-red-600';
    if (speed < 30) return 'text-yellow-600';
    if (speed < 50) return 'text-green-600';
    return 'text-blue-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Controles de Filtro */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Período:</span>
              {(['all', '1h', '30min', '15min'] as const).map((range) => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeRange(range)}
                  className="text-xs"
                >
                  {range === 'all' ? 'Tudo' : range}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
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
                Mostrar marcadores de tempo
              </label>
            </div>
          </div>

          {/* Estatísticas da Rota */}
          {routeStats && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Estatísticas da Rota
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-blue-50 p-3 rounded border">
                    <div className="font-medium text-blue-600">📍 Pontos</div>
                    <div className="text-gray-800 font-semibold">{routeStats.totalPoints}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded border">
                    <div className="font-medium text-green-600">📏 Distância</div>
                    <div className="text-gray-800 font-semibold">{routeStats.distance.toFixed(2)} km</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded border">
                    <div className="font-medium text-purple-600">⏱️ Duração</div>
                    <div className="text-gray-800 font-semibold">{Math.round(routeStats.duration)} min</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border">
                    <div className="font-medium text-yellow-600">🚗 Vel. Média</div>
                    <div className="text-gray-800 font-semibold">{formatSpeed(routeStats.avgSpeed)}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded border">
                    <div className="font-medium text-red-600">⚡ Vel. Máx</div>
                    <div className="text-gray-800 font-semibold">{formatSpeed(routeStats.maxSpeed)}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border">
                    <div className="font-medium text-gray-600">🐌 Vel. Mín</div>
                    <div className="text-gray-800 font-semibold">{formatSpeed(routeStats.minSpeed)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Posições */}
          {filteredPositions.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Histórico de Posições ({filteredPositions.length} pontos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredPositions.map((position, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded border">
                      <div className="flex-1">
                        <div className="font-mono text-xs">
                          📍 {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                        </div>
                        {position.speed !== undefined && (
                          <div className={`text-xs ${showSpeedColors ? getSpeedColor(position.speed) : 'text-gray-600'}`}>
                            🚗 {formatSpeed(position.speed)}
                          </div>
                        )}
                        {position.accuracy && (
                          <div className="text-xs text-gray-500">
                            📡 Precisão: {position.accuracy.toFixed(1)}m
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">
                          {formatTime(position.timestamp)}
                        </div>
                        {showTimeMarkers && (
                          <Badge variant="outline" className="text-xs mt-1">
                            #{index + 1}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center text-center py-8">
                  <div>
                    <div className="text-4xl mb-2">📍</div>
                    <div className="text-gray-600">Nenhum dado de posição disponível para o período selecionado</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aviso sobre Mapa */}
          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-700">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Visualização de mapa foi removida. Use as coordenadas e estatísticas acima para analisar o histórico da rota.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RouteHistoryView;