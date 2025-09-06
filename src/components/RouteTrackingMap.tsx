import React, { useEffect, useState } from 'react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';

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
  const [mapUrl, setMapUrl] = useState<string>('');
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
              console.log('🏫 Escola carregada:', school.name);
            } else {
              console.log('⚠️ Escola cadastrada sem coordenadas');
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar escola:', error);
      }
    };

    loadSchoolData();
  }, []);

  // Limpar histórico quando uma nova rota é iniciada
  useEffect(() => {
    if (activeRoute && activeRoute.id !== currentRouteId) {
      setLocationHistory([]);
      setCurrentRouteId(activeRoute.id);
      console.log(`🆕 Nova rota detectada (${activeRoute.id}), histórico de navegação limpo`);
    }
  }, [activeRoute, currentRouteId]);

  // Carregar dados do estudante (casa)
  useEffect(() => {
    const loadStudentHome = () => {
      try {
        const savedStudents = localStorage.getItem('students');
        if (savedStudents) {
          const students = JSON.parse(savedStudents);
          if (students.length > 0) {
            const student = students[0]; // Primeiro estudante
            if (student.lat && student.lng) {
              setStudentHome({
                lat: student.lat,
                lng: student.lng,
                name: student.name || 'Casa do Aluno'
              });
              console.log('🏠 Casa do aluno carregada:', student.name);
            } else {
              console.log('⚠️ Estudante cadastrado sem coordenadas');
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar casa do aluno:', error);
      }
    };

    loadStudentHome();
  }, []);

  // Capturar histórico de localizações do motorista para navegação em tempo real
  useEffect(() => {
    if (!driverLocation || !isRealTimeEnabled) return;

    const newLocation: LocationHistory = {
      lat: driverLocation.lat,
      lng: driverLocation.lng,
      timestamp: driverLocation.timestamp
    };

    setLocationHistory(prev => {
      // Evitar duplicatas baseadas em coordenadas muito próximas
      const lastLocation = prev[prev.length - 1];
      if (lastLocation) {
        const distance = Math.sqrt(
          Math.pow(lastLocation.lat - newLocation.lat, 2) + 
          Math.pow(lastLocation.lng - newLocation.lng, 2)
        );
        // Só adicionar se a distância for maior que ~10 metros (0.0001 graus)
        if (distance < 0.0001) {
          return prev;
        }
      }

      // Manter apenas os últimos 50 pontos para performance
      const updatedHistory = [...prev, newLocation].slice(-50);
      console.log(`🗺️ Navegação em tempo real: ${updatedHistory.length} pontos no rastro`);
      return updatedHistory;
    });
  }, [driverLocation, isRealTimeEnabled]);

  // Determinar fase atual da rota baseada no status dos estudantes
  useEffect(() => {
    if (!activeRoute.studentPickups) return;

    const hasPickedUpStudents = activeRoute.studentPickups.some(s => s.status === 'picked_up');
    const allStudentsPickedUp = activeRoute.studentPickups.every(s => s.status !== 'pending');

    if (hasPickedUpStudents || allStudentsPickedUp) {
      setCurrentPhase('to_school');
      console.log('📚 Fase: Indo para escola');
    } else {
      setCurrentPhase('to_student');
      console.log('🏠 Fase: Indo buscar aluno');
    }
  }, [activeRoute.studentPickups]);

  // Sistema de navegação automática centrada no motorista
  useEffect(() => {
    if (!driverLocation || !studentHome || !schoolLocation) return;

    const driverLat = driverLocation.lat;
    const driverLng = driverLocation.lng;
    const studentLat = studentHome.lat;
    const studentLng = studentHome.lng;
    const schoolLat = schoolLocation.lat;
    const schoolLng = schoolLocation.lng;

    // Calcular área de visualização centrada no motorista com zoom automático
    const calculateDriverCenteredBounds = () => {
      const zoomLevel = 0.008; // Zoom mais próximo para focar no motorista
      return {
        minLat: driverLat - zoomLevel,
        maxLat: driverLat + zoomLevel,
        minLng: driverLng - zoomLevel,
        maxLng: driverLng + zoomLevel
      };
    };

    // Gerar rota automática baseada na fase atual
    const generateAutomaticRoute = () => {
      let routeMarkers = [];
      let routeDescription = '';

      if (currentPhase === 'to_student') {
        // Rota: Motorista → Estudante
        routeMarkers = [
          `marker=${driverLat},${driverLng}`, // Posição atual do motorista (vermelho)
          `marker=${studentLat},${studentLng}` // Casa do estudante (azul)
        ];
        routeDescription = `Rota Automática: Van → Casa do ${activeRoute.studentPickups[0]?.studentName || 'Estudante'}`;
      } else {
        // Rota: Motorista → Escola (com estudante embarcado)
        routeMarkers = [
          `marker=${driverLat},${driverLng}`, // Posição atual do motorista (vermelho)
          `marker=${schoolLat},${schoolLng}` // Escola (verde)
        ];
        routeDescription = `Rota Automática: Van → Escola (${activeRoute.studentPickups.filter(s => s.status === 'picked_up').length} estudante(s) embarcado(s))`;
      }

      // Adicionar rastro de navegação se ativo
      if (isRealTimeEnabled && locationHistory.length > 1) {
        const historyMarkers = locationHistory.slice(0, -1).map(location => 
          `marker=${location.lat},${location.lng}`
        );
        routeMarkers = [...historyMarkers, ...routeMarkers];
      }

      return { routeMarkers, routeDescription };
    };

    const bounds = calculateDriverCenteredBounds();
    const { routeMarkers, routeDescription } = generateAutomaticRoute();
    
    // Construir URL do mapa centrada no motorista usando MapBox
    const bbox = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;
    const markersStr = routeMarkers.join('&');
    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${markersStr}/${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}/600x400?access_token=${process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}`;

    setMapUrl(mapUrl);
    
    console.log(`🚐 ${routeDescription}`);
    console.log(`📍 Motorista centralizado em: ${driverLat.toFixed(6)}, ${driverLng.toFixed(6)}`);
    if (locationHistory.length > 0) {
      console.log(`🛣️ Rastro da van: ${locationHistory.length} pontos registrados`);
    }
  }, [driverLocation, studentHome, schoolLocation, currentPhase, locationHistory, isRealTimeEnabled, activeRoute]);

  if (!driverLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Obtendo localização do motorista...</p>
        </div>
      </div>
    );
  }

  if (!studentHome || !schoolLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Carregando dados da rota...</p>
        </div>
      </div>
    );
  }

  if (!mapUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Carregando trajeto...</p>
        </div>
      </div>
    );
  }

  // Função para limpar histórico de navegação
  const clearNavigationHistory = () => {
    setLocationHistory([]);
    console.log('🧹 Histórico de navegação limpo');
  };

  // Função para calcular distância entre dois pontos
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    return Math.sqrt(
      Math.pow((lat2 - lat1) * 111000, 2) + // 1 grau lat ≈ 111km
      Math.pow((lng2 - lng1) * 111000 * Math.cos(lat1 * Math.PI / 180), 2)
    );
  };

  // Calcular estatísticas de navegação
  const getNavigationStats = () => {
    if (locationHistory.length < 2) return null;

    // Calcular distância total percorrida (aproximada)
    let totalDistance = 0;
    for (let i = 1; i < locationHistory.length; i++) {
      const prev = locationHistory[i - 1];
      const curr = locationHistory[i];
      totalDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    }

    // Calcular tempo total
    const startTime = new Date(locationHistory[0].timestamp);
    const endTime = new Date(locationHistory[locationHistory.length - 1].timestamp);
    const totalTimeMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    // Calcular velocidade média
    const avgSpeed = totalTimeMinutes > 0 ? (totalDistance / 1000) / (totalTimeMinutes / 60) : 0;

    return {
      distance: totalDistance,
      timeMinutes: totalTimeMinutes,
      avgSpeed
    };
  };

  // Função para calcular estimativa de chegada
  const getNextDestinationInfo = () => {
    if (!driverLocation) return null;

    let nextDestination = null;
    let destinationName = '';
    let destinationType = '';

    if (currentPhase === 'to_student') {
      const nextStudent = activeRoute.studentPickups.find(s => s.status === 'pending');
      if (nextStudent && studentHome) {
        nextDestination = { lat: studentHome.lat, lng: studentHome.lng };
        destinationName = nextStudent.studentName;
        destinationType = 'Estudante';
      }
    } else {
      if (schoolLocation) {
        nextDestination = { lat: schoolLocation.lat, lng: schoolLocation.lng };
        destinationName = 'Escola';
        destinationType = 'Escola';
      }
    }

    if (!nextDestination) return null;

    const distance = calculateDistance(
      driverLocation.lat,
      driverLocation.lng,
      nextDestination.lat,
      nextDestination.lng
    );

    const navigationStats = getNavigationStats();
    const estimatedSpeed = navigationStats?.avgSpeed || 30; // 30 km/h como padrão
    const estimatedTimeMinutes = (distance / 1000) / (estimatedSpeed / 60);

    return {
      destinationName,
      destinationType,
      distance,
      estimatedTimeMinutes
    };
  };

  const navigationStats = getNavigationStats();
  const nextDestinationInfo = getNextDestinationInfo();

  return (
    <div className="w-full h-full relative">
      {/* Painel de Informações da Rota Automática */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-3 max-w-xs">
        {/* Status da Rota Atual */}
        <div className="bg-blue-50 p-2 rounded border-l-4 border-blue-400">
          <div className="text-sm font-semibold text-blue-800">
            {currentPhase === 'to_student' ? '🏠 Indo buscar estudante' : '🏫 Indo para escola'}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {currentPhase === 'to_student' 
              ? `Destino: ${activeRoute.studentPickups.find(s => s.status === 'pending')?.studentName || 'Estudante'}`
              : `${activeRoute.studentPickups.filter(s => s.status === 'picked_up').length} estudante(s) embarcado(s)`
            }
          </div>
        </div>

        {/* Controles de Navegação */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isRealTimeEnabled 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {isRealTimeEnabled ? '🟢 Rastro ON' : '⚫ Rastro OFF'}
          </button>
          {locationHistory.length > 0 && (
            <button
              onClick={clearNavigationHistory}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors"
              title="Limpar histórico de navegação"
            >
              🧹
            </button>
          )}
        </div>
        
        {/* Próxima Parada e ETA */}
        {nextDestinationInfo && (
          <div className="bg-blue-50 p-2 rounded border-l-4 border-blue-400">
            <div className="text-sm font-semibold text-blue-800">
              🎯 Próxima Parada: {nextDestinationInfo.destinationName}
            </div>
            <div className="text-xs text-blue-600 mt-1 space-y-1">
              <div className="flex items-center space-x-1">
                <span>📏</span>
                <span>
                  {nextDestinationInfo.distance >= 1000 
                    ? `${(nextDestinationInfo.distance / 1000).toFixed(1)}km de distância`
                    : `${Math.round(nextDestinationInfo.distance)}m de distância`
                  }
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>⏰</span>
                <span>ETA: ~{Math.round(nextDestinationInfo.estimatedTimeMinutes)}min</span>
              </div>
            </div>
          </div>
        )}

        {/* Informações do Rastro */}
        {isRealTimeEnabled && locationHistory.length > 0 && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded space-y-1">
            <div className="flex items-center space-x-1">
              <span>📍</span>
              <span>{locationHistory.length} pontos no rastro</span>
            </div>
            
            {navigationStats && (
              <>
                <div className="flex items-center space-x-1">
                  <span>⏱️</span>
                  <span>{Math.round(navigationStats.timeMinutes)}min de navegação</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <span>📏</span>
                  <span>
                    {navigationStats.distance >= 1000 
                      ? `${(navigationStats.distance / 1000).toFixed(1)}km percorridos`
                      : `${Math.round(navigationStats.distance)}m percorridos`
                    }
                  </span>
                </div>
                
                {navigationStats.avgSpeed > 0 && (
                  <div className="flex items-center space-x-1">
                    <span>🚗</span>
                    <span>{navigationStats.avgSpeed.toFixed(1)}km/h média</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Indicador de Status da Navegação e Progresso */}
      <div className="absolute bottom-4 left-4 z-10 space-y-2">
        {/* Status da Navegação */}
        {isRealTimeEnabled && (
          <div className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Van em Movimento</span>
          </div>
        )}
        
        {/* Progresso da Rota */}
        <div className="bg-white rounded-lg shadow-lg p-3">
          <div className="text-sm font-semibold text-gray-800 mb-2">
            🚐 Progresso da Rota
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Estudantes coletados:</span>
              <span className="font-medium">
                {activeRoute.studentPickups.filter(s => s.status === 'picked_up').length} / {activeRoute.studentPickups.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(activeRoute.studentPickups.filter(s => s.status === 'picked_up').length / activeRoute.studentPickups.length) * 100}%`
                }}
              ></div>
            </div>
            {navigationStats && (
              <div className="text-xs text-gray-600 mt-2">
                <div>⏱️ {Math.round(navigationStats.timeMinutes)}min em rota</div>
                <div>📏 {navigationStats.distance >= 1000 ? `${(navigationStats.distance / 1000).toFixed(1)}km` : `${Math.round(navigationStats.distance)}m`} percorridos</div>
                {navigationStats.avgSpeed > 0 && (
                  <div className="flex items-center space-x-1">
                    <span>🚗</span>
                    <span>{navigationStats.avgSpeed.toFixed(1)}km/h média</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mapa com trajeto dinâmico */}
      <iframe
        src={mapUrl}
        className="w-full h-full border-0"
        title={`Navegação em Tempo Real: ${currentPhase === 'to_student' ? 'Buscando Aluno' : 'Indo para Escola'}${isRealTimeEnabled && locationHistory.length > 0 ? ` (${locationHistory.length} pontos)` : ''}`}
        loading="lazy"
        style={{ 
          border: 'none',
          outline: 'none'
        }}
      />
    </div>
  );
};
