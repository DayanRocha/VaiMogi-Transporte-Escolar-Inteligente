import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_CONFIG, isMapboxConfigured } from '../../config/maps';

interface MapboxMapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: Array<{
    id: string;
    coordinates: [number, number];
    popup?: string;
    color?: string;
  }>;
  route?: Array<[number, number]>;
  onMapLoad?: (map: mapboxgl.Map) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const MapboxMap: React.FC<MapboxMapProps> = React.memo(({
  center,
  zoom = MAPBOX_CONFIG.defaultZoom,
  markers = [],
  route = [],
  onMapLoad,
  onError,
  className = 'w-full h-96'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isMapboxConfigured()) {
      const errorMsg = 'Token do MapBox não configurado. Configure VITE_MAPBOX_ACCESS_TOKEN no arquivo .env';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    if (map.current) return; // Evita inicializar múltiplas vezes

    if (!mapContainer.current) {
      const errorMsg = 'Container do mapa não encontrado';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    // Usar centro fornecido ou fallback para São Paulo
    const initialCenter: [number, number] = center || [-46.6333, -23.5505];

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_CONFIG.style,
        center: initialCenter,
        zoom: zoom
      });

      map.current.on('load', () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setIsLoaded(true);
        if (onMapLoad && map.current) {
          onMapLoad(map.current);
        }
      });

      // Timeout para detectar se o mapa está demorando muito para carregar
      loadingTimeoutRef.current = setTimeout(() => {
        if (!isLoaded) {
          const timeoutError = 'Timeout: Mapa demorou muito para carregar';
          console.warn(timeoutError);
          setError(timeoutError);
          if (onError) {
            onError(timeoutError);
          }
        }
      }, 15000); // 15 segundos

      map.current.on('error', (e) => {
        console.error('Erro no MapBox:', e);
        const errorMessage = `Erro ao carregar o mapa: ${e.error?.message || 'Erro desconhecido'}`;
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      });

    } catch (err) {
      console.error('Erro ao inicializar MapBox:', err);
      const errorMessage = `Erro ao inicializar o mapa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`;
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      if (map.current) {
        // Limpar marcadores
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        
        map.current.remove();
        map.current = null;
        setIsLoaded(false);
      }
    };
  }, []);

  // Atualizar centro do mapa quando necessário
  useEffect(() => {
    if (!map.current || !isLoaded || !center) return;
    
    const currentCenter = map.current.getCenter();
    const [newLng, newLat] = center;
    
    // Só atualizar se a diferença for significativa (mais de 0.001 graus)
    const threshold = 0.001;
    if (Math.abs(currentCenter.lng - newLng) > threshold || 
        Math.abs(currentCenter.lat - newLat) > threshold) {
      map.current.setCenter(center);
    }
  }, [center, isLoaded]);

  // Atualizar marcadores
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Remover marcadores existentes
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Adicionar novos marcadores
    markers.forEach(marker => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = marker.color || '#3b82f6';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const mapboxMarker = new mapboxgl.Marker(el)
        .setLngLat(marker.coordinates)
        .addTo(map.current!);

      if (marker.popup) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(marker.popup);
        mapboxMarker.setPopup(popup);
      }

      markersRef.current.push(mapboxMarker);
    });
  }, [markers, isLoaded]);

  // Atualizar rota
  useEffect(() => {
    if (!map.current || !isLoaded || route.length === 0) return;

    // Remover rota existente
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    // Adicionar nova rota
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route
        }
      }
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4
      }
    });
  }, [route, isLoaded]);

  if (error) {
    // Notificar o componente pai sobre o erro
    if (onError && !error.includes('já foi reportado')) {
      onError(error + ' - já foi reportado');
    }
    
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg`}>
        <div className="text-center p-4">
          <p className="text-red-600 font-medium">Erro no Mapa</p>
          <p className="text-sm text-gray-600 mt-1">
            {error.includes('Token') ? 'Configuração do MapBox' : 'Falha ao carregar'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Alternando para modo simplificado...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Carregando mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
});

MapboxMap.displayName = 'MapboxMap';

export default MapboxMap;