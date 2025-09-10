import React from 'react';
import { Clock, MapPin, Navigation, Users, CheckCircle } from 'lucide-react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';

interface GuardianRouteInfoProps {
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

export const GuardianRouteInfo: React.FC<GuardianRouteInfoProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const getElapsedTime = (): string => {
    const start = new Date(activeRoute.startTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  };

  const getRouteProgress = (): number => {
    const completed = activeRoute.studentPickups.filter(s => s.status !== 'pending').length;
    return (completed / activeRoute.studentPickups.length) * 100;
  };

  const getDirectionText = (): string => {
    return activeRoute.direction === 'to_school' ? 'Indo para a escola' : 'Voltando para casa';
  };

  return (
    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm z-10">
      {/* Header da Rota */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
          🚐
        </div>
        <div>
          <h3 className="font-semibold text-sm">{activeRoute.driverName}</h3>
          <p className="text-xs text-gray-600">{getDirectionText()}</p>
        </div>
      </div>

      {/* Informações da Rota */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>Tempo ativo: {getElapsedTime()}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <Users className="w-4 h-4 text-gray-400" />
          <span>
            {activeRoute.studentPickups.filter(s => s.status !== 'pending').length} de {activeRoute.studentPickups.length} estudantes
          </span>
        </div>

        {driverLocation && (
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>
              Última atualização: {new Date(driverLocation.timestamp).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}
      </div>

      {/* Progresso da Rota */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium">Progresso</span>
          <span className="text-xs text-gray-600">{Math.round(getRouteProgress())}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getRouteProgress()}%` }}
          ></div>
        </div>
      </div>

      {/* Próximo Destino */}
      {nextDestination && (
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold">Próximo Destino</span>
          </div>
          <div className="bg-blue-50 rounded-lg p-2">
            <p className="text-sm font-medium text-blue-900">{nextDestination.studentName}</p>
            <p className="text-xs text-blue-700">{nextDestination.address}</p>
          </div>
        </div>
      )}

      {/* Lista de Estudantes */}
      <div className="border-t pt-3 mt-3">
        <h4 className="text-xs font-semibold mb-2">Estudantes na Rota</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {activeRoute.studentPickups.map((student, index) => (
            <div key={student.studentId} className="flex items-center gap-2 text-xs">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                student.status === 'pending' ? 
                  (nextDestination?.studentId === student.studentId ? 'bg-yellow-500' : 'bg-red-500') :
                  student.status === 'picked_up' ? 'bg-blue-500' : 'bg-green-500'
              }`}>
                {student.status === 'dropped_off' ? '✓' : index + 1}
              </div>
              <span className={`flex-1 ${student.status === 'dropped_off' ? 'line-through text-gray-500' : ''}`}>
                {student.studentName}
              </span>
              {student.status === 'picked_up' && (
                <CheckCircle className="w-3 h-3 text-blue-500" />
              )}
              {student.status === 'dropped_off' && (
                <CheckCircle className="w-3 h-3 text-green-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};