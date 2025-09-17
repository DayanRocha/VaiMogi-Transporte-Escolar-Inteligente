import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Configurar token do Mapbox
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface FullScreenMapProps {
  driverLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  isOpen: boolean;
  onClose: () => void;
  studentPickups?: Array<{
    id: string;
    lat: number;
    lng: number;
    studentName: string;
    status: 'pending' | 'picked_up' | 'dropped_off';
  }>;
  hideOverlays?: boolean; // Nova prop para ocultar overlays no painel do motorista
}

export const FullScreenMap: React.FC<FullScreenMapProps> = React.memo(({
  driverLocation,
  isOpen,
  onClose,
  studentPickups = [],
  hideOverlays = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const studentMarkers = useRef<mapboxgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const lastDriverLocationRef = useRef<string>('');
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar o mapa quando o componente montar
  useEffect(() => {
    if (!mapContainer.current) return;

    // Verificar se o token do Mapbox está disponível
    if (!mapboxgl.accessToken) {
      console.error('❌ Token do Mapbox não encontrado');
      return;
    }

    // Limpar mapa anterior se existir
    if (map.current) {
      map.current.remove();
      map.current = null;
      setIsMapLoaded(false);
    }

    try {
      // Criar novo mapa
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: driverLocation ? [driverLocation.lng, driverLocation.lat] : [-46.6333, -23.5505],
        zoom: 15,
        attributionControl: false
      });
    } catch (error) {
      console.error('❌ Erro ao criar mapa:', error);
      return;
    }

    map.current.on('load', () => {
      setIsMapLoaded(true);
      console.log('🗺️ Mapa em tela cheia carregado');
    });

    // Cleanup quando o modal fechar
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setIsMapLoaded(false);
      
      // Limpar refs
      driverMarker.current = null;
      studentMarkers.current = [];
      lastDriverLocationRef.current = '';
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
  }, [isOpen, driverLocation]);

  // Função para atualizar localização do motorista
  const updateDriverLocation = useCallback((location: typeof driverLocation) => {
    if (!map.current || !isMapLoaded || !location) return;

    try {
      // Verificar se a localização mudou significativamente
      const locationKey = `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`;
      if (lastDriverLocationRef.current === locationKey) {
        return; // Não atualizar se a localização não mudou
      }
      lastDriverLocationRef.current = locationKey;

      // Remover marcador anterior
      if (driverMarker.current) {
        driverMarker.current.remove();
      }

      // Criar novo marcador do motorista
      const driverElement = document.createElement('div');
      driverElement.className = 'driver-marker';
      driverElement.innerHTML = `
        <div class="bg-blue-600 text-white p-3 rounded-full shadow-lg border-2 border-white">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
      `;

      driverMarker.current = new mapboxgl.Marker(driverElement)
        .setLngLat([location.lng, location.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 35 })
            .setHTML(`
              <div class="p-3">
                <h3 class="font-semibold text-sm mb-2">🚐 Motorista</h3>
                <p class="text-sm text-gray-600">Localização Atual</p>
                <p class="text-xs font-mono bg-gray-100 p-1 rounded">
                  ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}
                </p>
                <p class="text-xs text-gray-500">
                  Atualizado: ${new Date(location.timestamp).toLocaleTimeString('pt-BR')}
                </p>
              </div>
            `)
        )
        .addTo(map.current);

      // Centralizar o mapa na localização do motorista com animação suave
      map.current.easeTo({
        center: [location.lng, location.lat],
        zoom: 16,
        duration: 2500
      });

    } catch (error) {
      console.error('Erro ao atualizar localização do motorista:', error);
    }
  }, [isMapLoaded, isOpen]);

  // Atualizar localização do motorista com debounce
  useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      updateDriverLocation(driverLocation);
    }, 1000);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [driverLocation, updateDriverLocation]);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Remover a condição que impedia renderização em modo container

  if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-2">⚠️ Configuração Necessária</h3>
          <p className="text-gray-600 mb-4">
            Token do Mapbox não configurado. Adicione VITE_MAPBOX_ACCESS_TOKEN no arquivo .env
          </p>
          <Button onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isOpen ? 'fixed inset-0 bg-black z-50' : 'relative w-full h-full bg-gray-100'}`}>
      {/* Header - só mostra quando em modo fullscreen e overlays não estão ocultos */}
      {isOpen && !hideOverlays && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-white text-lg font-semibold">🗺️ Mapa em Tela Cheia</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Container do mapa */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Overlay de loading */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Informações da localização (overlay inferior) - só em fullscreen e quando overlays não estão ocultos */}
      {driverLocation && isMapLoaded && isOpen && !hideOverlays && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 mx-auto max-w-md">
            <div className="text-center">
              <h3 className="font-semibold text-gray-800 mb-2">📍 Localização Atual</h3>
              <div className="space-y-1 text-sm">
                <p className="font-mono text-gray-600">
                  {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
                </p>
                <p className="text-gray-500">
                  Atualizado: {new Date(driverLocation.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instruções (canto inferior direito) - só em fullscreen e quando overlays não estão ocultos */}
      {isOpen && !hideOverlays && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-black/50 text-white text-xs p-2 rounded backdrop-blur-sm">
            Pressione ESC para sair
          </div>
        </div>
      )}
    </div>
  );
});

export default FullScreenMap;