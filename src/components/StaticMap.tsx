import React from 'react';
import { Navigation, MapPin, Car, Users, Clock } from 'lucide-react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';

interface StaticMapProps {
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

export const StaticMap: React.FC<StaticMapProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  // Calcular progresso da rota
  const routeProgress = activeRoute.studentPickups 
    ? (activeRoute.studentPickups.filter(s => s.status !== 'pending').length / activeRoute.studentPickups.length) * 100 
    : 0;

  // Calcular tempo decorrido
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

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header da Rota */}
      <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            {activeRoute.driverName}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{getElapsedTime()}</span>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-3">
          {activeRoute.direction === 'to_school' ? '🏫 Rota para Escola' : '🏠 Rota para Casa'}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progresso da Rota</span>
            <span>{Math.round(routeProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${routeProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Área Central - Representação Visual da Rota */}
      <div className="absolute inset-0 flex items-center justify-center pt-32 pb-32">
        <div className="max-w-2xl w-full px-8">
          
          {/* Localização do Motorista */}
          {driverLocation && (
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full text-2xl mb-4 shadow-lg">
                🚐
              </div>
              <div className="bg-white/90 rounded-lg p-4 shadow-md">
                <h4 className="font-semibold text-gray-800 mb-2">Localização Atual</h4>
                <div className="text-sm text-gray-600">
                  <p>Lat: {driverLocation.lat.toFixed(6)}</p>
                  <p>Lng: {driverLocation.lng.toFixed(6)}</p>
                  <p className="text-xs mt-1">
                    Atualizado: {new Date(driverLocation.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seta indicando direção */}
          {nextDestination && (
            <div className="text-center mb-8">
              <div className="text-4xl text-blue-500 animate-bounce">
                ⬇️
              </div>
              <p className="text-sm text-gray-600 mt-2">Indo para</p>
            </div>
          )}

          {/* Próximo Destino */}
          {nextDestination && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-500 text-white rounded-full text-lg mb-4 shadow-lg font-bold">
                {activeRoute.studentPickups?.findIndex(s => s.studentId === nextDestination.studentId) + 1 || '?'}
              </div>
              <div className="bg-white/90 rounded-lg p-4 shadow-md">
                <h4 className="font-semibold text-gray-800 mb-2">📍 Próximo Destino</h4>
                <p className="font-medium text-lg text-gray-900">{nextDestination.studentName}</p>
                <p className="text-sm text-gray-600 mt-1">{nextDestination.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Estudantes - Bottom */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
          <Users className="w-4 h-4" />
          <span>Estudantes ({activeRoute.studentPickups?.length || 0})</span>
        </div>
        
        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
          {activeRoute.studentPickups?.map((student, index) => (
            <div key={student.studentId} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  student.status === 'pending' ? (nextDestination?.studentId === student.studentId ? 'bg-yellow-500' : 'bg-red-500') :
                  student.status === 'picked_up' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{student.studentName}</p>
                  <p className="text-xs text-gray-500">{student.address}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                student.status === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {student.status === 'pending' ? 'Aguardando' :
                 student.status === 'picked_up' ? 'Na Van' : 'Entregue'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Indicador de Status */}
      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
        🟢 ATIVO
      </div>
    </div>
  );
};