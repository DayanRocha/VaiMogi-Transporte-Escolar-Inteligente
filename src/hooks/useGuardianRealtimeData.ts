import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeDataService, RealtimeRouteData } from '@/services/realtimeDataService';
import { useRouteTracking } from './useRouteTracking';

export interface UseGuardianRealtimeDataReturn {
  driverLocation: any;
  isCapturing: boolean;
  error: string | null;
  isLoading: boolean;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  forceUpdate: () => Promise<void>;
}

/**
 * Hook otimizado para dados em tempo real no painel do responsável
 * Com atualizações menos frequentes para melhor experiência do usuário
 */
export const useGuardianRealtimeData = (driverId: string): UseGuardianRealtimeDataReturn => {
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { hasActiveRoute, activeRoute } = useRouteTracking();
  const lastUpdateRef = useRef<number>(0);
  const updateThrottleRef = useRef<NodeJS.Timeout>();

  // Throttle de atualizações para evitar re-renderizações constantes
  const GUARDIAN_UPDATE_INTERVAL = 10000; // 10 segundos para o painel do responsável

  // Callback throttled para atualização dos dados
  const handleDataUpdate = useCallback((data: RealtimeRouteData) => {
    const now = Date.now();
    
    // Aplicar throttle específico para o painel do responsável
    if (now - lastUpdateRef.current < GUARDIAN_UPDATE_INTERVAL) {
      // Agendar atualização para o próximo intervalo
      if (updateThrottleRef.current) {
        clearTimeout(updateThrottleRef.current);
      }
      
      updateThrottleRef.current = setTimeout(() => {
        setDriverLocation(data.driverLocation);
        setError(null);
        lastUpdateRef.current = Date.now();
        console.log('🔄 [Guardian] Localização do motorista atualizada (throttled):', data.driverLocation);
      }, GUARDIAN_UPDATE_INTERVAL - (now - lastUpdateRef.current));
      
      return;
    }
    
    setDriverLocation(data.driverLocation);
    setError(null);
    lastUpdateRef.current = now;
    
    console.log('🔄 [Guardian] Localização do motorista atualizada:', {
      hasDriverLocation: !!data.driverLocation,
      timestamp: data.driverLocation?.timestamp
    });
  }, []);

  // Iniciar captura de dados
  const startCapture = useCallback(async () => {
    if (isCapturing) {
      console.log('ℹ️ [Guardian] Captura já está ativa');
      return;
    }

    if (!hasActiveRoute || !activeRoute) {
      const errorMsg = 'Nenhuma rota ativa encontrada para iniciar captura';
      console.warn('⚠️ [Guardian]', errorMsg);
      setError(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 [Guardian] Iniciando captura de dados em tempo real...');
      
      // Adicionar listener antes de iniciar
      realtimeDataService.addListener(handleDataUpdate);
      
      // Iniciar captura
      await realtimeDataService.startDataCapture();
      
      setIsCapturing(true);
      console.log('✅ [Guardian] Captura de dados iniciada com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao iniciar captura';
      console.error('❌ [Guardian] Erro ao iniciar captura:', errorMessage);
      setError(errorMessage);
      setIsCapturing(false);
      
      // Remover listener em caso de erro
      realtimeDataService.removeListener(handleDataUpdate);
    } finally {
      setIsLoading(false);
    }
  }, [isCapturing, hasActiveRoute, activeRoute, handleDataUpdate]);

  // Parar captura de dados
  const stopCapture = useCallback(() => {
    if (!isCapturing) {
      console.log('ℹ️ [Guardian] Captura já está parada');
      return;
    }

    console.log('🛑 [Guardian] Parando captura de dados...');
    
    try {
      // Limpar timeout se existir
      if (updateThrottleRef.current) {
        clearTimeout(updateThrottleRef.current);
      }
      
      realtimeDataService.stopDataCapture();
      realtimeDataService.removeListener(handleDataUpdate);
      
      setIsCapturing(false);
      setError(null);
      
      console.log('✅ [Guardian] Captura de dados parada');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao parar captura';
      console.error('❌ [Guardian] Erro ao parar captura:', errorMessage);
      setError(errorMessage);
    }
  }, [isCapturing, handleDataUpdate]);

  // Forçar atualização dos dados
  const forceUpdate = useCallback(async () => {
    try {
      console.log('🔄 [Guardian] Forçando atualização dos dados...');
      setError(null);
      
      await realtimeDataService.forceUpdate();
      
      console.log('✅ [Guardian] Dados atualizados com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar dados';
      console.error('❌ [Guardian] Erro ao forçar atualização:', errorMessage);
      setError(errorMessage);
    }
  }, []);

  // Efeito para inicializar dados existentes
  useEffect(() => {
    const existingData = realtimeDataService.getLastKnownData();
    if (existingData && existingData.driverLocation) {
      console.log('📋 [Guardian] Carregando dados existentes do serviço');
      setDriverLocation(existingData.driverLocation);
    }
  }, []);

  // Efeito para gerenciar captura baseada na rota ativa
  useEffect(() => {
    if (hasActiveRoute && activeRoute && !isCapturing) {
      console.log('🎯 [Guardian] Rota ativa detectada, iniciando captura automática...');
      startCapture();
    } else if (!hasActiveRoute && isCapturing) {
      console.log('🛑 [Guardian] Rota inativa detectada, parando captura...');
      stopCapture();
    }
  }, [hasActiveRoute, activeRoute, isCapturing, startCapture, stopCapture]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (updateThrottleRef.current) {
        clearTimeout(updateThrottleRef.current);
      }
      
      if (isCapturing) {
        console.log('🧹 [Guardian] Limpando captura ao desmontar hook');
        realtimeDataService.removeListener(handleDataUpdate);
        realtimeDataService.stopDataCapture();
      }
    };
  }, [isCapturing, handleDataUpdate]);

  return {
    driverLocation,
    isCapturing,
    error,
    isLoading,
    startCapture,
    stopCapture,
    forceUpdate
  };
};

export default useGuardianRealtimeData;