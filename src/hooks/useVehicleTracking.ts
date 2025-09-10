import { useState, useEffect, useCallback, useRef } from 'react';
import {
  vehicleTrackingService,
  VehiclePosition,
  TrackingOptions,
  TrackingStats
} from '@/services/vehicleTrackingService';

export interface UseVehicleTrackingReturn {
  // Estado do rastreamento
  isTracking: boolean;
  currentPosition: VehiclePosition | null;
  trackingStats: TrackingStats;
  error: string | null;
  isLoading: boolean;
  
  // Controles
  startTracking: (options?: Partial<TrackingOptions>) => Promise<void>;
  stopTracking: () => void;
  forceUpdate: () => Promise<VehiclePosition | null>;
  clearHistory: () => void;
  
  // Dados
  positionHistory: VehiclePosition[];
  lastUpdateTime: Date | null;
}

export interface UseVehicleTrackingOptions {
  autoStart?: boolean;
  trackingOptions?: Partial<TrackingOptions>;
  onPositionUpdate?: (position: VehiclePosition) => void;
  onError?: (error: GeolocationPositionError) => void;
  onStatsUpdate?: (stats: TrackingStats) => void;
}

/**
 * Hook para gerenciar rastreamento contínuo do veículo
 * Integra com o vehicleTrackingService e fornece interface reativa
 */
export const useVehicleTracking = (options: UseVehicleTrackingOptions = {}): UseVehicleTrackingReturn => {
  const {
    autoStart = false,
    trackingOptions,
    onPositionUpdate,
    onError,
    onStatsUpdate
  } = options;

  // Estados
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<VehiclePosition | null>(null);
  const [trackingStats, setTrackingStats] = useState<TrackingStats>({
    totalUpdates: 0,
    lastUpdate: null,
    averageAccuracy: 0,
    distanceTraveled: 0,
    currentSpeed: 0,
    maxSpeed: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [positionHistory, setPositionHistory] = useState<VehiclePosition[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Refs para callbacks
  const onPositionUpdateRef = useRef(onPositionUpdate);
  const onErrorRef = useRef(onError);
  const onStatsUpdateRef = useRef(onStatsUpdate);

  // Atualizar refs quando callbacks mudarem
  useEffect(() => {
    onPositionUpdateRef.current = onPositionUpdate;
  }, [onPositionUpdate]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onStatsUpdateRef.current = onStatsUpdate;
  }, [onStatsUpdate]);

  // Sincronizar estado com o serviço
  const syncWithService = useCallback(() => {
    setIsTracking(vehicleTrackingService.isActive);
    setCurrentPosition(vehicleTrackingService.currentPosition);
    setTrackingStats(vehicleTrackingService.stats);
    setPositionHistory(vehicleTrackingService.history);
    
    if (vehicleTrackingService.stats.lastUpdate) {
      setLastUpdateTime(vehicleTrackingService.stats.lastUpdate);
    }
  }, []);

  // Iniciar rastreamento
  const startTracking = useCallback(async (customOptions?: Partial<TrackingOptions>) => {
    if (isTracking) {
      console.log('🚗 Rastreamento já está ativo');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const finalOptions = { ...trackingOptions, ...customOptions };
      await vehicleTrackingService.startTracking(finalOptions);
      
      syncWithService();
      console.log('✅ Rastreamento iniciado via hook');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao iniciar rastreamento';
      setError(errorMessage);
      console.error('❌ Erro ao iniciar rastreamento:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isTracking, trackingOptions, syncWithService]);

  // Parar rastreamento
  const stopTracking = useCallback(() => {
    vehicleTrackingService.stopTracking();
    syncWithService();
    setError(null);
    console.log('🛑 Rastreamento parado via hook');
  }, [syncWithService]);

  // Forçar atualização
  const forceUpdate = useCallback(async (): Promise<VehiclePosition | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await vehicleTrackingService.forceUpdate();
      syncWithService();
      console.log('🔄 Atualização forçada concluída');
      return position;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao forçar atualização';
      setError(errorMessage);
      console.error('❌ Erro na atualização forçada:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [syncWithService]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    vehicleTrackingService.clearHistory();
    syncWithService();
    console.log('🧹 Histórico limpo via hook');
  }, [syncWithService]);

  // Configurar listeners do serviço
  useEffect(() => {
    // Listener para atualizações de posição
    const unsubscribePosition = vehicleTrackingService.onPositionUpdate((position) => {
      setCurrentPosition(position);
      setPositionHistory(vehicleTrackingService.history);
      setLastUpdateTime(new Date(position.timestamp));
      setError(null); // Limpar erro em caso de sucesso
      
      // Chamar callback externo se fornecido
      if (onPositionUpdateRef.current) {
        onPositionUpdateRef.current(position);
      }
    });

    // Listener para erros
    const unsubscribeError = vehicleTrackingService.onTrackingError((geoError) => {
      let errorMessage = 'Erro de geolocalização';
      
      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          errorMessage = 'Permissão de localização negada';
          break;
        case geoError.POSITION_UNAVAILABLE:
          errorMessage = 'Localização indisponível';
          break;
        case geoError.TIMEOUT:
          errorMessage = 'Timeout ao obter localização';
          break;
        default:
          errorMessage = geoError.message || 'Erro desconhecido de geolocalização';
      }
      
      setError(errorMessage);
      setIsLoading(false);
      
      // Chamar callback externo se fornecido
      if (onErrorRef.current) {
        onErrorRef.current(geoError);
      }
    });

    // Listener para estatísticas
    const unsubscribeStats = vehicleTrackingService.onStatsUpdate((stats) => {
      setTrackingStats(stats);
      
      // Chamar callback externo se fornecido
      if (onStatsUpdateRef.current) {
        onStatsUpdateRef.current(stats);
      }
    });

    // Sincronizar estado inicial
    syncWithService();

    // Cleanup
    return () => {
      unsubscribePosition();
      unsubscribeError();
      unsubscribeStats();
    };
  }, [syncWithService]);

  // Auto-start se habilitado
  useEffect(() => {
    if (autoStart && !isTracking && !isLoading) {
      console.log('🚀 Auto-iniciando rastreamento...');
      startTracking();
    }
  }, [autoStart, isTracking, isLoading, startTracking]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (vehicleTrackingService.isActive) {
        console.log('🧹 Limpeza: parando rastreamento ao desmontar hook');
        vehicleTrackingService.stopTracking();
      }
    };
  }, []);

  return {
    // Estado
    isTracking,
    currentPosition,
    trackingStats,
    error,
    isLoading,
    positionHistory,
    lastUpdateTime,
    
    // Controles
    startTracking,
    stopTracking,
    forceUpdate,
    clearHistory
  };
};

export default useVehicleTracking;