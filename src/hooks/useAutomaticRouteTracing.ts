import { useState, useEffect, useRef, useCallback } from 'react';
import { routeTrackingService, RouteLocation } from '@/services/routeTrackingService';
import { realtimeDataService } from '@/services/realtimeDataService';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface TracedRoute {
  id: string;
  points: RoutePoint[];
  startPoint: RoutePoint;
  currentPoint: RoutePoint;
  totalDistance: number;
  estimatedDuration: number;
  geometry?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export interface AutomaticRouteTracingState {
  isTracing: boolean;
  currentRoute: TracedRoute | null;
  lastLocation: RoutePoint | null;
  error: string | null;
  totalDistance: number;
  averageSpeed: number;
}

/**
 * Hook para captura automática de localização e traçado de rota em tempo real
 * Funciona apenas quando há uma rota ativa
 */
export const useAutomaticRouteTracing = (activeTrip: any) => {
  const [state, setState] = useState<AutomaticRouteTracingState>({
    isTracing: false,
    currentRoute: null,
    lastLocation: null,
    error: null,
    totalDistance: 0,
    averageSpeed: 0
  });

  const routePointsRef = useRef<RoutePoint[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const routeIdRef = useRef<string | null>(null);

  // Função para calcular distância entre dois pontos (Haversine)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Função para calcular velocidade média
  const calculateAverageSpeed = useCallback((points: RoutePoint[]): number => {
    if (points.length < 2) return 0;

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const timeElapsed = (new Date(lastPoint.timestamp).getTime() - new Date(firstPoint.timestamp).getTime()) / 1000; // em segundos
    
    if (timeElapsed === 0) return 0;

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistance += calculateDistance(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude
      );
    }

    return (totalDistance / timeElapsed) * 3.6; // Converter m/s para km/h
  }, [calculateDistance]);

  // Função para processar nova localização
  const processNewLocation = useCallback((position: GeolocationPosition) => {
    const now = Date.now();
    
    // Throttle: só processar se passou pelo menos 5 segundos desde a última atualização
    if (now - lastUpdateRef.current < 5000) {
      return;
    }

    const newPoint: RoutePoint = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date().toISOString(),
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined
    };

    // Verificar se a nova localização é significativamente diferente da anterior
    const lastPoint = routePointsRef.current[routePointsRef.current.length - 1];
    if (lastPoint) {
      const distance = calculateDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        newPoint.latitude,
        newPoint.longitude
      );
      
      // Só adicionar se a distância for maior que 10 metros (filtrar ruído GPS)
      if (distance < 10) {
        return;
      }
    }

    routePointsRef.current.push(newPoint);
    lastUpdateRef.current = now;

    // Calcular distância total
    let totalDistance = 0;
    for (let i = 1; i < routePointsRef.current.length; i++) {
      totalDistance += calculateDistance(
        routePointsRef.current[i - 1].latitude,
        routePointsRef.current[i - 1].longitude,
        routePointsRef.current[i].latitude,
        routePointsRef.current[i].longitude
      );
    }

    // Criar geometria da rota para o mapa
    const geometry = {
      type: 'LineString' as const,
      coordinates: routePointsRef.current.map(point => [point.longitude, point.latitude] as [number, number])
    };

    const tracedRoute: TracedRoute = {
      id: routeIdRef.current || `route_${Date.now()}`,
      points: [...routePointsRef.current],
      startPoint: routePointsRef.current[0],
      currentPoint: newPoint,
      totalDistance,
      estimatedDuration: routePointsRef.current.length > 1 ? 
        (new Date(newPoint.timestamp).getTime() - new Date(routePointsRef.current[0].timestamp).getTime()) / 1000 : 0,
      geometry
    };

    setState(prevState => ({
      ...prevState,
      currentRoute: tracedRoute,
      lastLocation: newPoint,
      totalDistance,
      averageSpeed: calculateAverageSpeed(routePointsRef.current),
      error: null
    }));

    // Atualizar o serviço de rastreamento com a nova localização
    const routeLocation: RouteLocation = {
      lat: newPoint.latitude,
      lng: newPoint.longitude,
      timestamp: newPoint.timestamp,
      accuracy: newPoint.accuracy
    };
    
    routeTrackingService.updateDriverLocation(routeLocation);

    console.log('📍 Nova localização processada:', {
      latitude: newPoint.latitude.toFixed(6),
      longitude: newPoint.longitude.toFixed(6),
      totalPoints: routePointsRef.current.length,
      totalDistance: `${(totalDistance / 1000).toFixed(2)} km`,
      averageSpeed: `${calculateAverageSpeed(routePointsRef.current).toFixed(1)} km/h`
    });
  }, [calculateDistance, calculateAverageSpeed]);

  // Função para lidar com erros de geolocalização
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Erro desconhecido ao obter localização';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permissão de localização negada';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Localização indisponível';
        break;
      case error.TIMEOUT:
        errorMessage = 'Timeout ao obter localização';
        break;
    }

    console.error('❌ Erro de geolocalização:', errorMessage, error);
    
    setState(prevState => ({
      ...prevState,
      error: errorMessage
    }));
  }, []);

  // Função para iniciar o rastreamento
  const startTracing = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prevState => ({
        ...prevState,
        error: 'Geolocalização não suportada neste navegador'
      }));
      return;
    }

    if (watchIdRef.current !== null) {
      return; // Já está rastreando
    }

    console.log('🚀 Iniciando rastreamento automático de rota...');
    
    routeIdRef.current = `route_${Date.now()}`;
    routePointsRef.current = [];
    
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      processNewLocation,
      handleLocationError,
      options
    );

    setState(prevState => ({
      ...prevState,
      isTracing: true,
      error: null
    }));
  }, [processNewLocation, handleLocationError]);

  // Função para parar o rastreamento
  const stopTracing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    console.log('🛑 Rastreamento automático de rota parado');
    
    setState(prevState => ({
      ...prevState,
      isTracing: false
    }));
  }, []);

  // Função para limpar dados da rota
  const clearRoute = useCallback(() => {
    routePointsRef.current = [];
    routeIdRef.current = null;
    
    setState({
      isTracing: false,
      currentRoute: null,
      lastLocation: null,
      error: null,
      totalDistance: 0,
      averageSpeed: 0
    });
  }, []);

  // Efeito para iniciar/parar rastreamento baseado na rota ativa
  useEffect(() => {
    if (activeTrip && activeTrip.id) {
      console.log('🎯 Rota ativa detectada, iniciando rastreamento automático...');
      startTracing();
    } else {
      console.log('🎯 Nenhuma rota ativa, parando rastreamento...');
      stopTracing();
      clearRoute();
    }

    return () => {
      stopTracing();
    };
  }, [activeTrip, startTracing, stopTracing, clearRoute]);

  // Cleanup ao desmontar o componente
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracing,
    stopTracing,
    clearRoute
  };
};