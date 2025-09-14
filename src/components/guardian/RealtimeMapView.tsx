import React, { useEffect, useState } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { RefreshCw, MapPin, AlertCircle, Navigation, Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RealtimeMapViewProps {
  guardianId: string;
  className?: string;
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

  const [refreshing, setRefreshing] = useState(false);
  
  // Importar hook para verificar se há rota ativa
  const { hasActiveRoute, activeRoute, driverLocation } = useRouteTracking();

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatSpeed = (speed?: number) => {
    if (!speed) return 'N/A';
    return `${(speed * 3.6).toFixed(1)} km/h`;
  };

  const formatHeading = (heading?: number) => {
    if (heading === undefined || heading === null) return 'N/A';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return `${directions[index]} (${heading.toFixed(0)}°)`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (!isCapturing) {
        await startCapture();
      }
    } catch (err) {
      console.error('Erro ao atualizar dados:', err);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Ativo' : 'Inativo';
  };

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Erro ao carregar dados em tempo real: {error}
              </span>
            </div>
            <Button 
              onClick={handleRefresh}
              className="mt-3 bg-red-600 hover:bg-red-700"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasActiveRoute) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Nenhuma rota ativa. O rastreamento em tempo real aparecerá quando uma rota for iniciada.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status do Rastreamento */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Rastreamento em Tempo Real
            </div>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={getStatusColor(isCapturing)}>
              {getStatusText(isCapturing)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Guardian ID:</span>
            <span className="text-sm font-mono">{guardianId}</span>
          </div>
          {realtimeData && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Última atualização:</span>
              <span className="text-sm">{formatTime(realtimeData.timestamp || new Date().toISOString())}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Localização do Motorista */}
      {(driverLocation || realtimeData?.driverLocation) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-red-600" />
              Localização do Motorista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const location = realtimeData?.driverLocation || driverLocation;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Coordenadas:</span>
                    <span className="text-sm font-mono">
                      {location.lat?.toFixed(6)}, {location.lng?.toFixed(6)}
                    </span>
                  </div>
                  {location.speed !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Velocidade:</span>
                      <span className="text-sm">{formatSpeed(location.speed)}</span>
                    </div>
                  )}
                  {location.heading !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Direção:</span>
                      <span className="text-sm">{formatHeading(location.heading)}</span>
                    </div>
                  )}
                  {location.accuracy && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Precisão:</span>
                      <span className="text-sm">{location.accuracy.toFixed(1)}m</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Timestamp:</span>
                    <span className="text-sm">{formatTime(location.timestamp)}</span>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Informações da Rota */}
      {activeRoute && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Navigation className="w-5 h-5 text-green-600" />
              Rota Ativa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Direção:</span>
              <Badge variant="outline">
                {activeRoute.direction === 'to_school' ? 'Para Escola' : 'Para Casa'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Início:</span>
              <span className="text-sm">{formatTime(activeRoute.startTime)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estudantes:</span>
              <span className="text-sm">{activeRoute.studentPickups?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Dados */}
      {realtimeData?.locationHistory && realtimeData.locationHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-indigo-600" />
              Histórico de Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {realtimeData.locationHistory.slice(-10).reverse().map((location, index) => (
                <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-mono">
                      {location.lat?.toFixed(6)}, {location.lng?.toFixed(6)}
                    </div>
                    {location.speed && (
                      <div className="text-gray-500">
                        {formatSpeed(location.speed)}
                      </div>
                    )}
                  </div>
                  <div className="text-gray-500">
                    {formatTime(location.timestamp)}
                  </div>
                </div>
              ))}
            </div>
            {realtimeData.locationHistory.length > 10 && (
              <div className="text-xs text-gray-500 mt-2 text-center">
                Mostrando os últimos 10 de {realtimeData.locationHistory.length} registros
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Aviso sobre Mapa */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-blue-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Visualização de mapa foi removida. Use as coordenadas e informações acima para acompanhar o rastreamento em tempo real.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeMapView;