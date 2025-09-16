import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeDataService } from '@/services/realtimeDataService';

interface GeocodeResult {
  coordinates: [number, number];
  address: string;
  timestamp: string;
}

interface GeocodeCache {
  [key: string]: GeocodeResult;
}

interface UseGeocodingOptions {
  enableCache?: boolean;
  cacheTimeout?: number; // em minutos
}

interface UseGeocodingReturn {
  geocodeAddress: (address: string, id?: string) => Promise<[number, number] | null>;
  geocodeStudentAddress: (studentId: string, address: string) => Promise<[number, number] | null>;
  geocodeSchoolAddress: (schoolId: string, address: string) => Promise<[number, number] | null>;
  isGeocoding: boolean;
  geocodingErrors: string[];
  clearCache: () => void;
  getCachedResult: (address: string) => GeocodeResult | null;
}

/**
 * Hook personalizado para geocodificação de endereços com cache
 */
export const useGeocoding = (options: UseGeocodingOptions = {}): UseGeocodingReturn => {
  const {
    enableCache = true,
    cacheTimeout = 60 // 1 hora por padrão
  } = options;

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingErrors, setGeocodingErrors] = useState<string[]>([]);
  const cacheRef = useRef<GeocodeCache>({});
  const activeRequestsRef = useRef<Map<string, Promise<[number, number] | null>>>(new Map());

  /**
   * Gera chave única para o cache baseada no endereço
   */
  const getCacheKey = useCallback((address: string): string => {
    return address.trim().toLowerCase().replace(/\s+/g, ' ');
  }, []);

  /**
   * Verifica se um resultado do cache ainda é válido
   */
  const isCacheValid = useCallback((result: GeocodeResult): boolean => {
    if (!enableCache) return false;
    
    const now = new Date();
    const resultTime = new Date(result.timestamp);
    const diffMinutes = (now.getTime() - resultTime.getTime()) / (1000 * 60);
    
    return diffMinutes < cacheTimeout;
  }, [enableCache, cacheTimeout]);

  /**
   * Obtém resultado do cache se disponível e válido
   */
  const getCachedResult = useCallback((address: string): GeocodeResult | null => {
    if (!enableCache) return null;
    
    const cacheKey = getCacheKey(address);
    const cached = cacheRef.current[cacheKey];
    
    if (cached && isCacheValid(cached)) {
      return cached;
    }
    
    // Remove cache expirado
    if (cached) {
      delete cacheRef.current[cacheKey];
    }
    
    return null;
  }, [enableCache, getCacheKey, isCacheValid]);

  /**
   * Armazena resultado no cache
   */
  const setCacheResult = useCallback((address: string, coordinates: [number, number]): void => {
    if (!enableCache) return;
    
    const cacheKey = getCacheKey(address);
    cacheRef.current[cacheKey] = {
      coordinates,
      address,
      timestamp: new Date().toISOString()
    };
  }, [enableCache, getCacheKey]);

  /**
   * Geocodifica um endereço genérico
   */
  const geocodeAddress = useCallback(async (address: string, id?: string): Promise<[number, number] | null> => {
    if (!address || address.trim().length === 0) {
      console.warn('⚠️ Endereço vazio fornecido para geocodificação');
      return null;
    }

    // Verificar cache primeiro
    const cached = getCachedResult(address);
    if (cached) {
      console.log('✅ Coordenadas obtidas do cache:', { address, coordinates: cached.coordinates });
      return cached.coordinates;
    }

    // Verificar se já existe uma requisição em andamento para este endereço
    const requestKey = getCacheKey(address);
    if (activeRequestsRef.current.has(requestKey)) {
      console.log('⏳ Aguardando requisição em andamento para:', address);
      return activeRequestsRef.current.get(requestKey)!;
    }

    // Criar nova requisição
    const geocodePromise = (async (): Promise<[number, number] | null> => {
      try {
        setIsGeocoding(true);
        setGeocodingErrors(prev => prev.filter(error => !error.includes(address)));

        console.log('🔍 Geocodificando endereço:', { address, id });
        
        // Simular geocodificação (substituir por serviço real se necessário)
        const result = await realtimeDataService.captureStudentAddress(id || 'generic', address);
        
        if (result?.coordinates) {
          // Armazenar no cache
          setCacheResult(address, result.coordinates);
          console.log('✅ Geocodificação bem-sucedida:', { address, coordinates: result.coordinates });
          return result.coordinates;
        }
        
        const errorMsg = `Não foi possível geocodificar: ${address}`;
        setGeocodingErrors(prev => [...prev, errorMsg]);
        console.warn('⚠️', errorMsg);
        return null;
        
      } catch (error) {
        const errorMsg = `Erro ao geocodificar ${address}: ${error}`;
        setGeocodingErrors(prev => [...prev, errorMsg]);
        console.error('❌', errorMsg);
        return null;
      } finally {
        setIsGeocoding(false);
        activeRequestsRef.current.delete(requestKey);
      }
    })();

    // Armazenar requisição ativa
    activeRequestsRef.current.set(requestKey, geocodePromise);
    
    return geocodePromise;
  }, [getCachedResult, getCacheKey, setCacheResult]);

  /**
   * Geocodifica endereço de um estudante específico
   */
  const geocodeStudentAddress = useCallback(async (studentId: string, address: string): Promise<[number, number] | null> => {
    try {
      const result = await realtimeDataService.captureStudentAddress(studentId, address);
      if (result?.coordinates) {
        setCacheResult(address, result.coordinates);
        return result.coordinates;
      }
      return null;
    } catch (error) {
      const errorMsg = `Erro ao geocodificar endereço do estudante ${studentId}: ${error}`;
      setGeocodingErrors(prev => [...prev, errorMsg]);
      console.error('❌', errorMsg);
      return null;
    }
  }, [setCacheResult]);

  /**
   * Geocodifica endereço de uma escola específica
   */
  const geocodeSchoolAddress = useCallback(async (schoolId: string, address: string): Promise<[number, number] | null> => {
    try {
      const result = await realtimeDataService.captureSchoolAddress(schoolId, address);
      if (result?.coordinates) {
        setCacheResult(address, result.coordinates);
        return result.coordinates;
      }
      return null;
    } catch (error) {
      const errorMsg = `Erro ao geocodificar endereço da escola ${schoolId}: ${error}`;
      setGeocodingErrors(prev => [...prev, errorMsg]);
      console.error('❌', errorMsg);
      return null;
    }
  }, [setCacheResult]);

  /**
   * Limpa o cache de geocodificação
   */
  const clearCache = useCallback(() => {
    cacheRef.current = {};
    console.log('🗑️ Cache de geocodificação limpo');
  }, []);

  // Limpar requisições ativas ao desmontar
  useEffect(() => {
    return () => {
      activeRequestsRef.current.clear();
    };
  }, []);

  return {
    geocodeAddress,
    geocodeStudentAddress,
    geocodeSchoolAddress,
    isGeocoding,
    geocodingErrors,
    clearCache,
    getCachedResult
  };
};