import React from 'react';
import { Navigation, MapPin, AlertCircle, Clock, Users } from 'lucide-react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

  return (
    <div className="space-y-4">
      {/* Informações do Motorista */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Navigation className="w-5 h-5 text-blue-600" />
            Informações da Rota
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Motorista:</span>
            <span className="text-sm">{activeRoute.driverName}</span>
          </div>
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
          {driverLocation && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Última localização:</span>
              <span className="text-sm">{formatTime(driverLocation.timestamp)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximo Destino */}
      {nextDestination && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-red-600" />
              Próximo Destino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estudante:</span>
                <span className="text-sm">{nextDestination.studentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Endereço:</span>
                <span className="text-sm text-right max-w-48 truncate" title={nextDestination.address}>
                  {nextDestination.address}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={getStatusColor(nextDestination.status)}>
                  {getStatusText(nextDestination.status)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Estudantes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-green-600" />
            Estudantes da Rota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeRoute.studentPickups.map((student, index) => (
              <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{student.studentName}</div>
                  <div className="text-xs text-gray-600 truncate max-w-48" title={student.address}>
                    {student.address}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                  <Badge className={getStatusColor(student.status)}>
                    {getStatusText(student.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Aviso sobre Mapa */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-blue-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Visualização de mapa foi removida. Use as informações acima para acompanhar a rota.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteMap;