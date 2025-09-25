import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLngExpression, LatLngBounds } from 'leaflet';
import mapboxgl from 'mapbox-gl';
import 'leaflet/dist/leaflet.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Driver, Van, Student, Trip } from '@/types/driver';
import { useGuardianRealtimeData } from '../hooks/useGuardianRealtimeData';
import { useRouteTracking } from '../hooks/useRouteTracking';
import { useGuardianData } from '@/hooks/useGuardianData';
import { useLeafletMap } from '../hooks/useLeafletMap';
import { Navigation, Clock, MapPin } from 'lucide-react';

// Configuração do token do Mapbox
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZGF5YW5hcmF1am8iLCJhIjoiY2x6cGNhZGNzMGNhZzJqcGNqZGNqZGNqZCJ9.example';
mapboxgl.accessToken = MAPBOX_TOKEN;

// Fix para ícones padrão do Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configurar ícones padrão do Leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface GuardianLeafletMapProps {
  driver: Driver;
  van: Van;
  students: Student[];
  activeTrip: Trip | null;
  hideOverlays?: boolean;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

// Componente para mostrar informações de zoom e qualidade
const MapQualityIndicator: React.FC = () => {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoom = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  const getQualityText = (zoom: number) => {
    if (zoom >= 18) return { text: 'Máxima', color: 'text-green-600' };
    if (zoom >= 16) return { text: 'Alta', color: 'text-blue-600' };
    if (zoom >= 14) return { text: 'Média', color: 'text-yellow-600' };
    return { text: 'Baixa', color: 'text-red-600' };
  };

  const quality = getQualityText(currentZoom);

  return (
    <div className="leaflet-bottom leaflet-left" style={{ marginBottom: '10px', marginLeft: '10px' }}>
      <div className="leaflet-control leaflet-bar bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Zoom:</span>
            <span className="font-bold">{currentZoom.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Qualidade:</span>
            <span className={`font-medium ${quality.color}`}>{quality.text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para integrar Mapbox com rastreamento do motorista
const MapboxDriverTracker: React.FC<{ driverLocation?: DriverLocation }> = ({ driverLocation }) => {
  const map = useMap();
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Atualizar localização do motorista usando dados do Mapbox
  useEffect(() => {
    if (!driverLocation || 
        typeof driverLocation.latitude !== 'number' ||
        typeof driverLocation.longitude !== 'number' ||
        isNaN(driverLocation.latitude) || 
        isNaN(driverLocation.longitude)) return;

    const { latitude, longitude } = driverLocation;
    
    // Verificar se a localização mudou significativamente
    if (lastLocationRef.current) {
      const distance = Math.sqrt(
        Math.pow(lastLocationRef.current.lat - latitude, 2) + 
        Math.pow(lastLocationRef.current.lng - longitude, 2)
      );
      
      // Só atualizar se a distância for significativa (> 0.001 graus ≈ 100m)
      if (distance < 0.001) {
        return;
      }
    }

    // Sincronizar com o mapa Leaflet usando dados precisos do Mapbox
    try {
      const leafletMap = map;
      const currentCenter = leafletMap.getCenter();
      const distance = leafletMap.distance(currentCenter, [latitude, longitude]);

      // Só mover se a distância for significativa (> 200 metros para mais atualizações)
      if (distance > 200) {
        // Usar zoom alto para mostrar mais detalhes
        const targetZoom = Math.max(leafletMap.getZoom(), 17);
        leafletMap.setView([latitude, longitude], targetZoom, {
          animate: true,
          duration: 2.0, // Animação mais rápida
          easing: (t) => t * (2 - t) // Easing suave
        });
        
        console.log('🗺️ Mapa atualizado com localização Mapbox:', { latitude, longitude, zoom: targetZoom });
      }
      
      // Atualizar referência da última localização
      lastLocationRef.current = { lat: latitude, lng: longitude };
    } catch (error) {
      console.warn('Erro ao sincronizar com Mapbox:', error);
    }
  }, [map, driverLocation]);

  return null;
};

// Componente para centralizar o mapa automaticamente
const MapController: React.FC<{ center: LatLngExpression; driverLocation?: DriverLocation }> = ({ 
  center, 
  driverLocation 
}) => {
  const map = useMap();
  const lastCenterRef = useRef<LatLngExpression | null>(null);

  useEffect(() => {
    if (center && center !== lastCenterRef.current) {
      try {
        // Validar se center é um array válido
        if (Array.isArray(center) && center.length === 2 && 
            typeof center[0] === 'number' && typeof center[1] === 'number' &&
            !isNaN(center[0]) && !isNaN(center[1])) {
          map.setView(center, 17, { // Zoom alto para mais detalhes
            animate: true,
            duration: 1.0
          });
          lastCenterRef.current = center;
        }
      } catch (error) {
        console.warn('Erro ao centralizar mapa:', error);
      }
    }
  }, [map, center]);

  return null;
};



export const GuardianLeafletMap: React.FC<GuardianLeafletMapProps> = ({
  driver,
  van,
  students,
  activeTrip,
  hideOverlays = false
}) => {
  // Hook otimizado para dados em tempo real do responsável
  const { driverLocation, isCapturing } = useGuardianRealtimeData(driver.id);
  const { activeRoute } = useRouteTracking();
  const { schools } = useGuardianData();
  
  // Hook personalizado para gerenciar o mapa Leaflet
  const {
    mapCenter,
    mapZoom,
    studentsWithCoords,
    schoolsWithCoords,
    formatTime
  } = useLeafletMap({
    driverLocation,
    students,
    schools
  });

  // Criar ícones personalizados com mais detalhes
  const createCustomIcon = (color: string, size: [number, number] = [25, 41]) => {
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="${size[0]}" height="${size[1]}" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
            </filter>
            <radialGradient id="grad" cx="50%" cy="30%" r="70%">
              <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
            </radialGradient>
          </defs>
          <path fill="url(#grad)" stroke="#fff" stroke-width="3" filter="url(#shadow)" 
                d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
          <circle fill="#fff" cx="12.5" cy="12.5" r="7" stroke="${color}" stroke-width="2"/>
          <circle fill="${color}" cx="12.5" cy="12.5" r="4"/>
        </svg>
      `)}`,
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1]],
      popupAnchor: [0, -size[1]]
    });
  };

  // Ícones personalizados com tamanhos maiores para melhor visibilidade
  const driverIcon = createCustomIcon('#ef4444', [40, 64]); // Vermelho para motorista - maior
  const studentIcon = createCustomIcon('#f59e0b', [25, 40]); // Amarelo para estudantes
  const schoolIcon = createCustomIcon('#10b981', [30, 48]); // Verde para escolas



  // Verificar se há uma rota ativa (activeTrip ou activeRoute)
  const hasActiveRoute = activeTrip || activeRoute;
  
  // Não mostrar o mapa se não houver rota ativa
  if (!hasActiveRoute) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 max-w-md">
          <div className="bg-white rounded-full p-6 shadow-lg mb-6 mx-auto w-fit">
            <MapPin className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            Aguardando Rota Ativa
          </h3>
          <p className="text-gray-500 leading-relaxed mb-4">
            O mapa será exibido automaticamente quando o motorista iniciar uma rota de transporte escolar.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <span>Aguardando dados em tempo real...</span>
          </div>
        </div>
      </div>
    );
  }

  // Estado de carregamento quando há rota ativa mas sem dados de localização
  if (hasActiveRoute && !driverLocation && studentsWithCoords.length === 0 && schoolsWithCoords.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center p-8 max-w-md">
          <div className="bg-white rounded-full p-6 shadow-lg mb-6 mx-auto w-fit">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-blue-700 mb-3">
            Carregando Mapa
          </h3>
          <p className="text-blue-600 leading-relaxed mb-4">
            Rota ativa detectada! Aguardando dados de localização do motorista e pontos de parada...
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Sincronizando dados em tempo real</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        maxZoom={20}
        minZoom={10}
        preferCanvas={true}
      >
        {/* Camada de tiles com mais detalhes - OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={20}
          maxNativeZoom={19}
          tileSize={256}
          zoomOffset={0}
          detectRetina={true}
        />
        
        {/* Camada adicional de detalhes para zoom alto */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          maxZoom={20}
          opacity={0.3}
          minZoom={16}
        />

        {/* Controlador do mapa */}
        <MapController center={mapCenter} driverLocation={driverLocation} />

        {/* Integração Mapbox para rastreamento do motorista */}
        <MapboxDriverTracker driverLocation={driverLocation} />

        {/* Indicador de qualidade do mapa */}
        <MapQualityIndicator />

        {/* Marcador do motorista usando Leaflet com popup detalhado */}
        {driverLocation && 
         typeof driverLocation.latitude === 'number' && 
         typeof driverLocation.longitude === 'number' &&
         !isNaN(driverLocation.latitude) && 
         !isNaN(driverLocation.longitude) && (
          <Marker
            position={[driverLocation.latitude, driverLocation.longitude]}
            icon={driverIcon}
          >
            <Popup
              closeButton={false}
              autoClose={false}
              autoPan={false}
              className="driver-popup"
            >
              <div className="p-3 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <h3 className="font-bold text-red-800">🚐 {driver.name}</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Van:</span>
                    <span className="font-medium">{van.licensePlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Velocidade:</span>
                    <span className="font-medium text-blue-600">
                      {driverLocation.speed?.toFixed(1) || '0'} km/h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precisão:</span>
                    <span className="font-medium text-green-600">
                      {driverLocation.accuracy?.toFixed(0) || 'N/A'}m
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Última atualização: {formatTime(driverLocation.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>


    </div>
  );
};

export default GuardianLeafletMap;