import { useState, useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_CONFIG } from '../config/maps';

interface RouteResponse {
  routes: Array<{
    geometry: {
      coordinates: Array<[number, number]>;
    };
    duration: number;
    distance: number;
  }>;
}

interface UseMapboxReturn {
  getRoute: (start: [number, number], end: [number, number]) => Promise<RouteResponse | null>;
  getCurrentLocation: () => Promise<[number, number] | null>;
  geocodeAddress: (address: string) => Promise<[number, number] | null>;
  reverseGeocode: (coordinates: [number, number]) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export const useMapbox = (): UseMapboxReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRoute = useCallback(async (
    start: [number, number], 
    end: [number, number]
  ): Promise<RouteResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `${MAPBOX_CONFIG.directionsApiUrl}/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_CONFIG.accessToken}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        return data;
      } else {
        throw new Error('Nenhuma rota encontrada');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao calcular rota: ${errorMessage}`);
      console.error('Erro ao buscar rota:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback((): Promise<[number, number] | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('Geolocalização não suportada pelo navegador');
        resolve(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoading(false);
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (err) => {
          setIsLoading(false);
          setError(`Erro ao obter localização: ${err.message}`);
          console.error('Erro de geolocalização:', err);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      );
    });
  }, []);

  const geocodeAddress = useCallback(async (address: string): Promise<[number, number] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=BR&limit=1`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].center;
        return [coordinates[0], coordinates[1]];
      } else {
        throw new Error('Endereço não encontrado');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao geocodificar endereço: ${errorMessage}`);
      console.error('Erro ao geocodificar:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (coordinates: [number, number]): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${MAPBOX_CONFIG.accessToken}&types=address`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      } else {
        throw new Error('Endereço não encontrado para as coordenadas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao obter endereço: ${errorMessage}`);
      console.error('Erro no reverse geocoding:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getRoute,
    getCurrentLocation,
    geocodeAddress,
    reverseGeocode,
    isLoading,
    error
  };
};

export default useMapbox;