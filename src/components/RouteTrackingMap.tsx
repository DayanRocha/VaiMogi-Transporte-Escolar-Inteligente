import React, { useEffect, useState } from 'react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';
import { Navigation, MapPin, Clock, Users, School, Home, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RouteTrackingMapProps {
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

interface LocationHistory {
  lat: number;
  lng: number;
  timestamp: string;
}

export const RouteTrackingMap: React.FC<RouteTrackingMapProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const [studentHome, setStudentHome] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [schoolLocation, setSchoolLocation] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'to_student' | 'to_school'>('to_student');
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState<boolean>(true);
  const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);

  // Carregar dados da escola
  useEffect(() => {
    const loadSchoolData = () => {
      try {
        const savedSchools = localStorage.getItem('schools');
        if (savedSchools) {
          const schools = JSON.parse(savedSchools);
          if (schools.length > 0) {
            const school = schools[0];
            if (school.lat && school.lng) {
              setSchoolLocation({
                lat: school.lat,
                lng: school.lng,
                name: school.name || 'Escola Municipal'
              });
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados da escola:', error);
      }
    };

    loadSchoolData();
  }, []);

  // Atualizar histórico de localização
  useEffect(() => {
    if (driverLocation && isRealTimeEnabled) {
      setLocationHistory(prev => {
        const newHistory = [...prev, {
          lat: driverLocation.lat,
          lng: driverLocation.lng,
          timestamp: driverLocation.timestamp
        }];
        // Manter apenas os últimos 50 pontos
        return newHistory.slice(-50);
      });
    }
  }, [driverLocation, isRealTimeEnabled]);

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

  const toggleRealTime = () => {
    setIsRealTimeEnabled(!isRealTimeEnabled);
  };

  const clearHistory = () => {
    setLocationHistory([]);
  };

  return (
    <div className="space-y-4">
      {/* Controles de Rastreamento */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Navigation className="w-5 h-5 text-blue-600" />
            Rastreamento em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status do Rastreamento:</span>
            <Badge className={isRealTimeEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {isRealTimeEnabled ? 'Ativo' : 'Pausado'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={toggleRealTime} 
              variant={isRealTimeEnabled ? 'destructive' : 'default'}
              size="sm"
            >
              {isRealTimeEnabled ? 'Pausar' : 'Ativar'} Rastreamento
            </Button>
            <Button onClick={clearHistory} variant="outline" size="sm">
              Limpar Histórico
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Localização Atual */}
      {driverLocation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-red-600" />
              Localização Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Motorista:</span>
              <span className="text-sm">{activeRoute.driverName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Coordenadas:</span>
              <span className="text-sm font-mono">
                {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Última atualização:</span>
              <span className="text-sm">{formatTime(driverLocation.timestamp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pontos no histórico:</span>
              <span className="text-sm">{locationHistory.length}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Destinos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Escola */}
        {schoolLocation && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <School className="w-5 h-5 text-purple-600" />
                Escola
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm font-medium">{schoolLocation.name}</div>
              <div className="text-xs text-gray-600 font-mono">
                {schoolLocation.lat.toFixed(6)}, {schoolLocation.lng.toFixed(6)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Próximo Destino */}
        {nextDestination && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="w-5 h-5 text-orange-600" />
                Próximo Destino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm font-medium">{nextDestination.studentName}</div>
              <div className="text-xs text-gray-600">{nextDestination.address}</div>
              {nextDestination.lat && (
                <div className="text-xs text-gray-600 font-mono">
                  {nextDestination.lat.toFixed(6)}, {nextDestination.lng.toFixed(6)}
                </div>
              )}
              <Badge className={getStatusColor(nextDestination.status)}>
                {getStatusText(nextDestination.status)}
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>

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
                  {student.lat && student.lng && (
                    <div className="text-xs text-gray-500 font-mono">
                      {student.lat.toFixed(6)}, {student.lng.toFixed(6)}
                    </div>
                  )}
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

      {/* Histórico de Localização */}
      {locationHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-indigo-600" />
              Histórico de Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {locationHistory.slice(-10).reverse().map((location, index) => (
                <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                  <span className="font-mono">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </span>
                  <span className="text-gray-500">
                    {formatTime(location.timestamp)}
                  </span>
                </div>
              ))}
            </div>
            {locationHistory.length > 10 && (
              <div className="text-xs text-gray-500 mt-2 text-center">
                Mostrando os últimos 10 de {locationHistory.length} pontos
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
              Visualização de mapa foi removida. Use as coordenadas e informações acima para rastreamento.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteTrackingMap;
