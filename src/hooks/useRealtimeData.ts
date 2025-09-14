import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeDataService, RealtimeRouteData } from '@/services/realtimeDataService';
import { useRouteTracking } from './useRouteTracking';
import { useVehicleTracking } from './useVehicleTracking';

export interface UseRealtimeDataReturn {
  realtimeData: RealtimeRouteData | null;
  isCapturing: boolean;
  error: string | null;
  isLoading: boolean;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  forceUpdate: () => Promise<void>;
  vehicleTracking: {
    position: any;
    isActive: boolean;
    stats: any;
    error: string | null;
    forceUpdate: () => Promise<void>;
    clearHistory: () => void;
  };
}

/**
 * Hook para gerenciar dados em tempo real da rota
 */
export const useRealtimeData = (): UseRealtimeDataReturn => {
  const [realtimeData, setRealtimeData] = useState<RealtimeRouteData | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { hasActiveRoute, activeRoute } = useRouteTracking();
  const listenerIdRef = useRef<string | null>(null);
  
  // Integrar com hook de rastreamento do veículo
  const vehicleTracking = useVehicleTracking({
    autoStart: false, // Será iniciado manualmente
    enableHighAccuracy: true,
    updateInterval: 5000, // 5 segundos (reduzido de 3s)
    minDistanceThreshold: 10 // 10 metros (aumentado de 5m)
  });

  // Callback para atualização dos dados
  const handleDataUpdate = useCallback((data: RealtimeRouteData) => {
    console.log('🔄 Dados em tempo real atualizados:', {
      hasDriverLocation: !!data.driverLocation,
      studentsCount: data.studentAddresses.length,
      hasSchoolAddress: !!data.schoolAddress,
      routeCoordinatesCount: data.routeCoordinates.length
    });
    
    setRealtimeData(data);
    setError(null);
  }, []);

  // Iniciar captura de dados
  const startCapture = useCallback(async () => {
    if (isCapturing) {
      console.log('ℹ️ Captura já está ativa');
      return;
    }

    if (!hasActiveRoute || !activeRoute) {
      const errorMsg = 'Nenhuma rota ativa encontrada para iniciar captura';
      console.warn('⚠️', errorMsg);
      setError(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Iniciando captura de dados em tempo real...');
      
      // Iniciar rastreamento do veículo primeiro
      await vehicleTracking.startTracking();
      
      // Adicionar listener antes de iniciar
      realtimeDataService.addListener(handleDataUpdate);
      
      // Iniciar captura
      await realtimeDataService.startDataCapture();
      
      setIsCapturing(true);
      console.log('✅ Captura de dados iniciada com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao iniciar captura';
      console.error('❌ Erro ao iniciar captura:', errorMessage);
      setError(errorMessage);
      setIsCapturing(false);
      
      // Parar rastreamento em caso de erro
      vehicleTracking.stopTracking();
      
      // Remover listener em caso de erro
      realtimeDataService.removeListener(handleDataUpdate);
    } finally {
      setIsLoading(false);
    }
  }, [isCapturing, hasActiveRoute, activeRoute, handleDataUpdate, vehicleTracking]);

  // Parar captura de dados
  const stopCapture = useCallback(() => {
    if (!isCapturing) {
      console.log('ℹ️ Captura já está parada');
      return;
    }

    console.log('🛑 Parando captura de dados...');
    
    try {
      // Parar rastreamento do veículo
      vehicleTracking.stopTracking();
      
      realtimeDataService.stopDataCapture();
      realtimeDataService.removeListener(handleDataUpdate);
      
      setIsCapturing(false);
      setError(null);
      
      console.log('✅ Captura de dados parada');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao parar captura';
      console.error('❌ Erro ao parar captura:', errorMessage);
      setError(errorMessage);
    }
  }, [isCapturing, handleDataUpdate, vehicleTracking]);

  // Forçar atualização dos dados
  const forceUpdate = useCallback(async () => {
    try {
      console.log('🔄 Forçando atualização dos dados...');
      setError(null);
      
      await realtimeDataService.forceUpdate();
      
      console.log('✅ Dados atualizados com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar dados';
      console.error('❌ Erro ao forçar atualização:', errorMessage);
      setError(errorMessage);
    }
  }, []);

  // Efeito para inicializar dados existentes
  useEffect(() => {
    const existingData = realtimeDataService.getLastKnownData();
    if (existingData) {
      console.log('📋 Carregando dados existentes do serviço');
      setRealtimeData(existingData);
    }
  }, []);

  // Efeito para gerenciar captura baseada na rota ativa
  useEffect(() => {
    if (hasActiveRoute && activeRoute && !isCapturing) {
      console.log('🎯 Rota ativa detectada, iniciando captura automática...');
      startCapture();
    } else if (!hasActiveRoute && isCapturing) {
      console.log('🛑 Rota inativa detectada, parando captura...');
      stopCapture();
    }
  }, [hasActiveRoute, activeRoute, isCapturing, startCapture, stopCapture]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (isCapturing) {
        console.log('🧹 Limpando captura ao desmontar hook');
        realtimeDataService.removeListener(handleDataUpdate);
        realtimeDataService.stopDataCapture();
      }
    };
  }, [isCapturing, handleDataUpdate]);

  return {
    realtimeData,
    isCapturing,
    error,
    isLoading,
    startCapture,
    stopCapture,
    forceUpdate,
    // Expor dados do rastreamento do veículo
    vehicleTracking: {
      position: vehicleTracking.position,
      isActive: vehicleTracking.isActive,
      stats: vehicleTracking.stats,
      error: vehicleTracking.error,
      forceUpdate: vehicleTracking.forceUpdate,
      clearHistory: vehicleTracking.clearHistory
    }
  };
};

export default useRealtimeData;