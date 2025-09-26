import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Student, School } from '@/types/driver';
import { MapQualityIndicator } from './MapQualityIndicator';
import { useMapboxMap } from '../hooks/useMapboxMap';

// Configure o token do Mapbox usando a variável de ambiente do Vite
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface GuardianMapboxMapProps {
  driverLocation?: DriverLocation;
  activeRoute?: {
    id: string;
    name: string;
    coordinates: [number, number][];
    status: 'active' | 'inactive' | 'completed';
  };
  students: Student[];
  schools: School[];
  mapQuality: 'high' | 'medium' | 'low';
  onMapQualityChange: (quality: 'high' | 'medium' | 'low') => void;
}

export const GuardianMapboxMap: React.FC<GuardianMapboxMapProps> = ({
  driverLocation,
  activeRoute,
  students,
  schools,
  mapQuality,
  onMapQualityChange
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const studentMarkersMapRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const schoolMarkersMapRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const isUserInteractingRef = useRef(false);
  const lastInteractionAtRef = useRef<number>(0);
  const interactionGraceMs = 4000; // janela de graça após interação do usuário
  const [followDriver, setFollowDriver] = useState(true);

  const shouldDeferCamera = () => {
    if (isUserInteractingRef.current) return true;
    const since = Date.now() - lastInteractionAtRef.current;
    return since < interactionGraceMs;
  };

  // Hook personalizado para gerenciar o mapa Mapbox
  const {
    mapCenter,
    mapZoom,
    studentsWithCoords,
    schoolsWithCoords,
    calculateMapBounds,
    formatTime,
    calculateDistance,
    createGeoJSONFeature,
    createPointFeature
  } = useMapboxMap({
    driverLocation,
    students,
    schools
  });

  // Inicializar o mapa
  useEffect(() => {
    // Inicializa o mapa apenas quando houver rota ativa
    if (!activeRoute || activeRoute.status !== 'active') return;
    if (!mapContainer.current || map.current) return;

    // Ao ativar uma rota, habilitar seguir motorista por padrão
    setFollowDriver(true);

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(mapQuality),
      center: mapCenter,
      zoom: mapZoom,
      minZoom: 8,
      maxZoom: 20,
      attributionControl: true,
      logoPosition: 'bottom-right'
    });

    // Adicionar controles de navegação
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Adicionar controle de escala
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    // Adicionar controle de geolocalização
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right');

    // Detectar interações do usuário (arrasto/zoom/rotação)
    const onInteractStart = () => { 
      isUserInteractingRef.current = true; 
      // Desativa seguir motorista quando o usuário interagir
      setFollowDriver(false);
    };
    const onInteractEnd = () => { 
      isUserInteractingRef.current = false; 
      lastInteractionAtRef.current = Date.now(); 
    };

    const m = map.current;
    m.on('dragstart', onInteractStart);
    m.on('zoomstart', onInteractStart);
    m.on('rotatestart', onInteractStart);
    m.on('pitchstart', onInteractStart);
    m.on('movestart', onInteractStart);

    m.on('dragend', onInteractEnd);
    m.on('zoomend', onInteractEnd);
    m.on('rotateend', onInteractEnd);
    m.on('pitchend', onInteractEnd);
    m.on('moveend', onInteractEnd);

    return () => {
      if (!map.current) return;
      m.off('dragstart', onInteractStart);
      m.off('zoomstart', onInteractStart);
      m.off('rotatestart', onInteractStart);
      m.off('pitchstart', onInteractStart);
      m.off('movestart', onInteractStart);

      m.off('dragend', onInteractEnd);
      m.off('zoomend', onInteractEnd);
      m.off('rotateend', onInteractEnd);
      m.off('pitchend', onInteractEnd);
      m.off('moveend', onInteractEnd);

      m.remove();
      map.current = null;
    };
  }, [activeRoute]);

  // Função para obter o estilo do mapa baseado na qualidade
  const getMapStyle = (quality: 'high' | 'medium' | 'low') => {
    switch (quality) {
      case 'high':
        return 'mapbox://styles/mapbox/satellite-streets-v12';
      case 'medium':
        return 'mapbox://styles/mapbox/streets-v12';
      case 'low':
        return 'mapbox://styles/mapbox/light-v11';
      default:
        return 'mapbox://styles/mapbox/streets-v12';
    }
  };

  // Atualizar estilo do mapa quando a qualidade mudar
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(getMapStyle(mapQuality));
    }
  }, [mapQuality]);

  // Atualizar centro e zoom do mapa
  useEffect(() => {
    if (!map.current) return;
    // Quando o usuário escolheu a posição (followDriver = false), não atualizar a câmera automaticamente
    if (!followDriver) return;
    if (shouldDeferCamera()) return; // não mexe na câmera durante ou logo após interação do usuário

    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();
    const zoomDiff = Math.abs(currentZoom - mapZoom);
    const lngDiff = Math.abs(currentCenter.lng - mapCenter[0]);
    const latDiff = Math.abs(currentCenter.lat - mapCenter[1]);

    const centerChanged = lngDiff >= 0.0001 || latDiff >= 0.0001;
    const zoomChanged = zoomDiff >= 0.01;

    if (!centerChanged && zoomChanged) {
      // Aplicar zoom suave preservando o centro/viewport atual
      map.current.easeTo({ zoom: mapZoom, duration: 500 });
      return;
    }

    if (centerChanged || zoomChanged) {
      map.current.flyTo({
        center: mapCenter,
        zoom: mapZoom,
        duration: 1000
      });
    }
  }, [mapCenter, mapZoom, followDriver]);

  // Gerenciar marcador do motorista: criar/atualizar sem recentralizar automaticamente
  useEffect(() => {
    if (!map.current) return;

    // Remover marcador se não houver localização
    if (!driverLocation) {
      if (driverMarker.current) {
        driverMarker.current.remove();
        driverMarker.current = null;
      }
      return;
    }

    const getDriverPopupHTML = () => `
      <div style="padding: 8px;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">Motorista</div>
        <div style="font-size: 12px; color: #374151;">
          <div><strong>Última atualização:</strong> ${formatTime(driverLocation.timestamp)}</div>
          ${driverLocation.speed !== undefined ? `<div><strong>Velocidade:</strong> ${driverLocation.speed.toFixed(1)} km/h</div>` : ''}
          ${driverLocation.accuracy !== undefined ? `<div><strong>Precisão:</strong> ±${Math.round(driverLocation.accuracy)}m</div>` : ''}
        </div>
      </div>
    `;

    if (!driverMarker.current) {
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.style.cssText = `
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: white;
        font-weight: bold;
      `;
      el.innerHTML = '🚌';

      const popup = new mapboxgl.Popup({ offset: 25, className: 'driver-popup' }).setHTML(getDriverPopupHTML());

      driverMarker.current = new mapboxgl.Marker(el)
        .setLngLat([driverLocation.longitude, driverLocation.latitude])
        .setPopup(popup)
        .addTo(map.current);
    } else {
      driverMarker.current.setLngLat([driverLocation.longitude, driverLocation.latitude]);
      driverMarker.current.getPopup()?.setHTML(getDriverPopupHTML());
    }

    // Só recentraliza se followDriver estiver ativo e sem interação recente
    if (followDriver && !shouldDeferCamera()) {
      const currentZoom = map.current.getZoom();
      const targetZoom = Math.max(currentZoom, 15);
      map.current.easeTo({
        center: [driverLocation.longitude, driverLocation.latitude],
        zoom: targetZoom,
        duration: 700
      });
    }
  }, [driverLocation, followDriver, formatTime]);

  // Marcadores dos estudantes - estáveis (atualiza/recicla em vez de recriar tudo)
  useEffect(() => {
    if (!map.current) return;

    const currentIds = new Set<string>();

    studentsWithCoords.forEach(student => {
      if (!student.latitude || !student.longitude) return;
      currentIds.add(student.id);

      let marker = studentMarkersMapRef.current.get(student.id);
      const popupHTML = `
        <div style="padding: 6px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${student.name}</div>
          <div style="font-size: 12px; color: #374151;">${student.address}</div>
        </div>
      `;

      if (!marker) {
        const el = document.createElement('div');
        el.className = 'student-marker';
        el.style.cssText = `
          width: 28px;
          height: 28px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
        `;
        el.innerHTML = '🎒';

        const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(popupHTML);
        marker = new mapboxgl.Marker(el)
          .setLngLat([student.longitude, student.latitude])
          .setPopup(popup)
          .addTo(map.current!);
        studentMarkersMapRef.current.set(student.id, marker);
      } else {
        marker.setLngLat([student.longitude, student.latitude]);
        marker.getPopup()?.setHTML(popupHTML);
      }
    });

    // Remover marcadores de estudantes que não estão mais presentes
    for (const [id, marker] of studentMarkersMapRef.current.entries()) {
      if (!currentIds.has(id)) {
        marker.remove();
        studentMarkersMapRef.current.delete(id);
      }
    }
  }, [studentsWithCoords]);

  // Marcadores das escolas - estáveis (atualiza/recicla em vez de recriar tudo)
  useEffect(() => {
    if (!map.current) return;

    const currentIds = new Set<string>();

    schoolsWithCoords.forEach(school => {
      if (!school.latitude || !school.longitude) return;
      currentIds.add(school.id);

      let marker = schoolMarkersMapRef.current.get(school.id);
      const popupHTML = `
        <div style="padding: 6px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${school.name}</div>
          <div style="font-size: 12px; color: #374151;">${school.address}</div>
        </div>
      `;

      if (!marker) {
        const el = document.createElement('div');
        el.className = 'school-marker';
        el.style.cssText = `
          width: 28px;
          height: 28px;
          background: #10b981;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
        `;
        el.innerHTML = '🎓';

        const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(popupHTML);
        marker = new mapboxgl.Marker(el)
          .setLngLat([school.longitude, school.latitude])
          .setPopup(popup)
          .addTo(map.current!);
        schoolMarkersMapRef.current.set(school.id, marker);
      } else {
        marker.setLngLat([school.longitude, school.latitude]);
        marker.getPopup()?.setHTML(popupHTML);
      }
    });

    // Remover marcadores de escolas que não estão mais presentes
    for (const [id, marker] of schoolMarkersMapRef.current.entries()) {
      if (!currentIds.has(id)) {
        marker.remove();
        schoolMarkersMapRef.current.delete(id);
      }
    }
  }, [schoolsWithCoords]);

  // Gerenciar rota ativa com atualização incremental (evita remover/adicionar toda vez)
  useEffect(() => {
    if (!map.current || !activeRoute) return;

    const routeId = 'active-route';

    const addOrUpdateRoute = () => {
      if (!map.current) return;
      const source = map.current.getSource(routeId) as mapboxgl.GeoJSONSource | undefined;
      const data = createGeoJSONFeature(activeRoute.coordinates);

      if (source) {
        source.setData(data as any);
      } else {
        map.current.addSource(routeId, {
          type: 'geojson',
          data
        });

        if (!map.current.getLayer(routeId)) {
          map.current.addLayer({
            id: routeId,
            type: 'line',
            source: routeId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': activeRoute.status === 'active' ? '#22c55e' : '#6b7280',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });
        }
      }
    };

    if (map.current.isStyleLoaded()) {
      addOrUpdateRoute();
    } else {
      map.current.on('style.load', addOrUpdateRoute);
    }

    return () => {
      if (!map.current) return;
      map.current.off('style.load', addOrUpdateRoute);
    };
  }, [activeRoute, createGeoJSONFeature]);

  return (
    <div className="relative w-full h-full">
      {(!activeRoute || activeRoute.status !== 'active') ? (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg max-w-lg text-center">
            <h2 className="text-lg font-semibold mb-2">Aguardando nova rota</h2>
            <p className="text-sm text-gray-600">
              Não há rota ativa no momento. O sistema está aguardando a definição de uma nova rota para exibir o mapa.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Container do mapa */}
          <div 
            ref={mapContainer} 
            className="mapbox-map w-full h-full"
            style={{ minHeight: '400px' }}
          />
          
          {/* Indicador de qualidade do mapa */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <MapQualityIndicator 
                quality={mapQuality} 
                onQualityChange={onMapQualityChange}
              />
            </div>
          </div>

          {/* Informações do motorista */}
          {driverLocation && (
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
                <h3 className="font-semibold text-sm mb-2">Status do Motorista</h3>
                <div className="space-y-1 text-xs">
                  <p><span className="font-medium">Velocidade:</span> {driverLocation.speed ?? 0} km/h</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                      'bg-green-100 text-green-800'
                    }`}>
                      Ativo
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botão seguir/parar de seguir motorista */}
          <div className="absolute right-4 top-24 z-10">
            <button
              onClick={() => setFollowDriver(v => !v)}
              className={`px-3 py-2 rounded-md shadow bg-white/90 backdrop-blur-sm text-sm font-medium border ${followDriver ? 'border-green-300 text-green-700' : 'border-gray-300 text-gray-700'}`}
              title={followDriver ? 'Seguindo motorista. Clique para parar de seguir.' : 'Clique para seguir o motorista.'}
            >
              {followDriver ? 'Seguindo motorista' : 'Seguir motorista'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default GuardianMapboxMap;