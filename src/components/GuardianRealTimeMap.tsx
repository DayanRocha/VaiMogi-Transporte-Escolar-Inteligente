import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Driver, Van, Student, Trip } from '@/types/driver';
import { useRealtimeData } from '../hooks/useRealtimeData';
import { useRouteTracking } from '../hooks/useRouteTracking';
import { useGuardianData } from '@/hooks/useGuardianData';
import { useGeocoding } from '@/hooks/useGeocoding';
import { useAutomaticRouteTracing } from '@/hooks/useAutomaticRouteTracing';
import { MapboxDirectionsService } from '../services/mapboxDirectionsService';
import { RealTimeLocationService } from '../services/realTimeLocationService';
import { AlertCircle, Navigation, Clock, MapPin, Route } from 'lucide-react';

// Configuração do token do Mapbox
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZGF5YW5hcmF1am8iLCJhIjoiY2x6cGNhZGNzMGNhZzJqcGNqZGNqZGNqZCJ9.example';
mapboxgl.accessToken = MAPBOX_TOKEN;

// Hook personalizado para debounce otimizado
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Limpa timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para throttle de funções
const useThrottle = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  const lastRun = useRef(Date.now());
  
  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      func(...args);
      lastRun.current = Date.now();
    }
  }, [func, delay]) as T;
};

// Adicionar estilos CSS para animações e marcadores
const addMapStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('map-animations')) {
    const style = document.createElement('style');
    style.id = 'map-animations';
    style.textContent = `
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
        }
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-10px);
        }
        60% {
          transform: translateY(-5px);
        }
      }
      
      .driver-marker {
        animation: pulse 2s infinite;
        transition: all 0.3s ease;
      }
      
      .driver-marker:hover {
        transform: scale(1.1);
      }
      
      .student-marker {
        transition: all 0.3s ease;
      }
      
      .student-marker:hover {
        animation: bounce 0.6s;
      }
      
      .school-marker {
        transition: all 0.3s ease;
      }
      
      .school-marker:hover {
        transform: scale(1.1);
      }
      
      .route-waypoint {
        animation: pulse 3s infinite;
      }
      
      .marker-loading {
        animation: pulse 2s infinite;
      }
    `;
    document.head.appendChild(style);
  }
};

// Adicionar estilos quando o componente for carregado
addMapStyles();

interface GuardianRealTimeMapProps {
  driver: Driver;
  van: Van;
  students: Student[];
  activeTrip: Trip | null;
  hideOverlays?: boolean; // Nova prop para ocultar overlays no painel do motorista
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface StudentPickup {
  id: string;
  studentId: string;
  studentName: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'picked_up' | 'dropped_off';
  estimatedTime?: string;
}

interface OptimizedRoute {
  waypoints: Array<{
    latitude: number;
    longitude: number;
    name: string;
    type: 'student' | 'school';
  }>;
  geometry: any;
  distance: number;
  duration: number;
  traffic: boolean;
}

// Função debounce para otimizar atualizações
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const GuardianRealTimeMap: React.FC<GuardianRealTimeMapProps> = ({
  driver,
  van,
  students,
  activeTrip,
  hideOverlays = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [lastRenderTime, setLastRenderTime] = useState(Date.now());
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastUpdateTime: Date.now()
  });
  
  // Refs para marcadores
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const studentMarkers = useRef<mapboxgl.Marker[]>([]);
  const schoolMarkers = useRef<mapboxgl.Marker[]>([]);
  
  // Estados para roteamento otimizado
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  
  // Instâncias dos serviços
  const directionsService = useMemo(() => new MapboxDirectionsService(), []);
  const locationService = useMemo(() => new RealTimeLocationService(), []);
  
  // Função throttled para atualizações de performance
  const updatePerformanceMetrics = useThrottle(() => {
    const now = Date.now();
    const renderTime = now - lastRenderTime;
    
    setPerformanceMetrics(prev => ({
      renderCount: prev.renderCount + 1,
      averageRenderTime: (prev.averageRenderTime + renderTime) / 2,
      lastUpdateTime: now
    }));
    
    setLastRenderTime(now);
  }, 2000);
  
  // Hooks para dados em tempo real
  const { driverLocation, isCapturing } = useRealtimeData(driver.id);
  const { activeRoute, nextDestination } = useRouteTracking();
  const { schools } = useGuardianData();
  const { geocodeStudentAddress, geocodeSchoolAddress, isGeocoding, geocodingErrors } = useGeocoding();
  
  // Aplicar debounce nas atualizações críticas
  const debouncedDriverLocation = useDebounce(driverLocation, 500); // 500ms
  const debouncedStudents = useDebounce(students, 800); // 800ms
  const debouncedSchools = useDebounce(schools, 800); // 800ms
  
  // Hook para rastreamento automático de rota
  const { 
    isTracing, 
    currentRoute: tracedRoute, 
    lastLocation, 
    totalDistance, 
    averageSpeed,
    error: tracingError 
  } = useAutomaticRouteTracing(activeTrip);

  // Função para formatar tempo
  const formatTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Função helper para verificar se o estilo do mapa está carregado
  const isMapStyleLoaded = useCallback(() => {
    return map.current && map.current.isStyleLoaded();
  }, []);

  // Função helper para executar operações no mapa quando o estilo estiver carregado
  const executeWhenStyleLoaded = useCallback((operation: () => void) => {
    if (!map.current) return;
    
    if (isMapStyleLoaded()) {
      operation();
    } else {
      // Aguardar o evento 'styledata' para garantir que o estilo está carregado
      const onStyleLoad = () => {
        operation();
        map.current?.off('styledata', onStyleLoad);
      };
      map.current.on('styledata', onStyleLoad);
    }
  }, [isMapStyleLoaded]);

  // Inicialização do mapa com otimizações
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const startTime = performance.now();
    
    // Usar localização do motorista se disponível, senão usar São Paulo como padrão
    const initialCenter = driverLocation 
      ? [driverLocation.longitude, driverLocation.latitude] 
      : [-46.6333, -23.5505]; // São Paulo como centro padrão
    
    const initialZoom = driverLocation ? 15 : 12; // Zoom maior se tiver localização do motorista

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
      // Otimizações de performance
      antialias: false, // Desabilita antialiasing para melhor performance
      optimizeForTerrain: true,
      preserveDrawingBuffer: false,
      refreshExpiredTiles: false
    });

    map.current.on('load', () => {
      const loadTime = performance.now() - startTime;
      console.log(`🗺️ Mapa carregado em ${loadTime.toFixed(2)}ms`);
      
      setIsMapLoaded(true);
      updatePerformanceMetrics();
    });

    // Otimização: reduz a frequência de renderização
    map.current.on('render', () => {
      updatePerformanceMetrics();
    });

    // Adicionar controles de navegação
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 600000
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [driverLocation, updatePerformanceMetrics]); // Reinicializar quando a localização do motorista estiver disponível

  // Centralizar mapa na localização do motorista com animação suave e controle inteligente (otimizada)
  useEffect(() => {
    if (!map.current || !isMapLoaded || !debouncedDriverLocation) return;

    const { latitude, longitude } = debouncedDriverLocation;
    const currentCenter = map.current.getCenter();
    
    // Verificar se é a primeira vez que recebemos a localização do motorista
    const isFirstLocation = !currentCenter || 
      (Math.abs(currentCenter.lat - latitude) > 0.01 || 
       Math.abs(currentCenter.lng - longitude) > 0.01);
    
    // Calcula distância para evitar movimentos desnecessários
    if (!isFirstLocation) {
      const distance = Math.sqrt(
        Math.pow(currentCenter.lng - longitude, 2) + 
        Math.pow(currentCenter.lat - latitude, 2)
      );
      
      // Só move se a distância for significativa (> 0.001 graus ≈ 100m)
      if (distance < 0.001) {
        return;
      }
    }
    
    if (isFirstLocation) {
      // Primeira centralização - mais rápida e com zoom adequado
      map.current.easeTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 1000,
        essential: true
      });
    } else {
      // Atualizações subsequentes - movimento mais suave
      map.current.easeTo({
        center: [longitude, latitude],
        duration: 1500,
        essential: true,
        easing: (t) => t * (2 - t) // Easing otimizado
      });
    }

    console.log('🎯 Mapa centralizado na localização atual do motorista:', {
      lat: debouncedDriverLocation.latitude,
      lng: debouncedDriverLocation.longitude,
      timestamp: debouncedDriverLocation.timestamp
    });
    updatePerformanceMetrics();
  }, [debouncedDriverLocation, isMapLoaded, updatePerformanceMetrics]); // Executar apenas quando a localização estiver disponível

  // Integrar serviço de localização em tempo real com otimizações de performance
  useEffect(() => {
    if (!activeTrip || !debouncedDriverLocation) return;

    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 3000; // Throttle de 3 segundos para otimizar performance
    
    // Configurar callback para atualizações de localização
    const handleLocationUpdate = (location: DriverLocation) => {
      const now = Date.now();
      
      // Throttle das atualizações para melhor performance
      if (now - lastUpdateTime < UPDATE_THROTTLE) {
        return;
      }
      lastUpdateTime = now;
      
      console.log('📍 Localização do motorista atualizada:', location);
      
      // Atualizar marcador do motorista se existir
      if (driverMarker.current) {
        driverMarker.current.setLngLat([location.longitude, location.latitude]);
        
        // Atualizar popup com informações atualizadas
        const popup = driverMarker.current.getPopup();
        if (popup) {
          popup.setHTML(`
            <div class="p-3">
              <h3 class="font-semibold text-blue-800 mb-2">🚐 Motorista</h3>
              <div class="space-y-1 text-sm">
                <p><strong>Velocidade:</strong> ${location.speed?.toFixed(1) || '0'} km/h</p>
                <p><strong>Direção:</strong> ${location.heading?.toFixed(0) || 'N/A'}°</p>
                <p><strong>Precisão:</strong> ${location.accuracy?.toFixed(0) || 'N/A'}m</p>
                <p><strong>Última atualização:</strong> ${formatTime(location.timestamp)}</p>
              </div>
            </div>
          `);
        }
      }
      
      // Centralizar mapa na nova posição do motorista de forma suave
      if (map.current) {
        map.current.easeTo({
          center: [location.longitude, location.latitude],
          duration: 2000,
          essential: true,
          easing: (t) => t * (2 - t) // Easing suave
        });
      }
    };

    // Configurar rastreamento em tempo real
    locationService.startTracking({
      driverId: activeTrip.driverId,
      routeId: activeTrip.id,
      students: activeTrip.students || [],
      school: activeTrip.route?.school || null
    });

    // Atualizar localização do motorista no serviço
    locationService.updateDriverLocation({
      driverId: activeTrip.driverId,
      latitude: debouncedDriverLocation.latitude,
      longitude: debouncedDriverLocation.longitude,
      timestamp: debouncedDriverLocation.timestamp,
      speed: debouncedDriverLocation.speed,
      heading: debouncedDriverLocation.heading
    });

    return () => {
      locationService.stopTracking();
    };
  }, [activeTrip, debouncedDriverLocation, locationService]);

  // Criar marcador customizado do motorista com melhor visibilidade
  useEffect(() => {
    if (!map.current || !isMapLoaded || !debouncedDriverLocation) return;
    
    const driverLocation = debouncedDriverLocation;

    // Remover marcador existente
    if (driverMarker.current) {
      driverMarker.current.remove();
    }

    // Criar novo marcador do motorista com design mais destacado
    const el = document.createElement('div');
    el.className = 'driver-marker';
    el.innerHTML = `
      <div class="relative">
        <div class="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-pulse">
          <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
          </svg>
        </div>
        <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45 border-b border-r border-white"></div>
        <div class="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-ping"></div>
      </div>
    `;

    // Criar popup com informações do motorista
    const popup = new mapboxgl.Popup({
      offset: 35,
      closeButton: true,
      closeOnClick: false,
      className: 'driver-popup-enhanced'
    }).setHTML(`
      <div class="p-4 bg-gradient-to-r from-red-50 to-red-100">
        <h3 class="font-bold text-red-800 mb-3 flex items-center">
          🚐 Motorista em Tempo Real
          <span class="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        </h3>
        <div class="space-y-2 text-sm">
          <p class="flex justify-between"><strong>Velocidade:</strong> <span class="text-red-700">${driverLocation.speed?.toFixed(1) || '0'} km/h</span></p>
          <p class="flex justify-between"><strong>Direção:</strong> <span class="text-red-700">${driverLocation.heading?.toFixed(0) || 'N/A'}°</span></p>
          <p class="flex justify-between"><strong>Precisão GPS:</strong> <span class="text-red-700">${driverLocation.accuracy?.toFixed(0) || 'N/A'}m</span></p>
          <p class="flex justify-between"><strong>Atualização:</strong> <span class="text-red-700">${formatTime(driverLocation.timestamp)}</span></p>
        </div>
      </div>
    `);

    // Criar e adicionar marcador
    driverMarker.current = new mapboxgl.Marker(el)
      .setLngLat([driverLocation.longitude, driverLocation.latitude])
      .setPopup(popup)
      .addTo(map.current);

    // Mostrar popup automaticamente para destacar o motorista
    setTimeout(() => {
      if (driverMarker.current) {
        driverMarker.current.togglePopup();
      }
    }, 1000);

    console.log('🚐 Marcador do motorista criado com destaque:', driverLocation);
  }, [debouncedDriverLocation, isMapLoaded, driver.name, van.licensePlate, formatTime]);

  // Adicionar ícones personalizados do Mapbox
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Adicionar ícones personalizados se ainda não existirem
    const addCustomIcons = async () => {
      try {
        // Ícone de escola
        if (!map.current!.hasImage('school-icon')) {
          const schoolIcon = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = 'data:image/svg+xml;base64,' + btoa(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#4CAF50" stroke="#fff" stroke-width="2"/>
                <path d="M8 20h16v2H8v-2zm2-8h12l-6-4-6 4zm1 2v4h2v-4h-2zm4 0v4h2v-4h-2zm4 0v4h2v-4h-2z" fill="#fff"/>
              </svg>
            `);
          });
          map.current!.addImage('school-icon', schoolIcon);
        }

        // Ícone de estudante pendente
        if (!map.current!.hasImage('student-pending')) {
          const studentPendingIcon = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = 'data:image/svg+xml;base64,' + btoa(`
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#FF9800" stroke="#fff" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="#fff"/>
              </svg>
            `);
          });
          map.current!.addImage('student-pending', studentPendingIcon);
        }

        // Ícone de estudante coletado
        if (!map.current!.hasImage('student-picked-up')) {
          const studentPickedIcon = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = 'data:image/svg+xml;base64,' + btoa(`
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#4CAF50" stroke="#fff" stroke-width="2"/>
                <path d="M9 12l2 2 4-4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `);
          });
          map.current!.addImage('student-picked-up', studentPickedIcon);
        }

        // Ícone de estudante entregue
        if (!map.current!.hasImage('student-dropped-off')) {
          const studentDroppedIcon = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = 'data:image/svg+xml;base64,' + btoa(`
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#2196F3" stroke="#fff" stroke-width="2"/>
                <path d="M7 13l3 3 7-7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `);
          });
          map.current!.addImage('student-dropped-off', studentDroppedIcon);
        }
      } catch (error) {
        console.error('Erro ao adicionar ícones personalizados:', error);
      }
    };

    addCustomIcons();
  }, [isMapLoaded]);

  // Função para obter texto do status
  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'picked_up': return 'Coletado';
      case 'dropped_off': return 'Entregue';
      default: return 'Pendente';
    }
  }, []);

  // Memoização dos dados dos estudantes para otimizar performance
  const studentsGeoJSON = useMemo(() => {
    if (!debouncedStudents?.length) return null;
    
    return {
      type: 'FeatureCollection' as const,
      features: debouncedStudents.map((student) => ({
        type: 'Feature' as const,
        properties: {
          id: student.id,
          name: student.name,
          address: student.address,
          school: student.school,
          status: 'pending'
        },
        geometry: {
          type: 'Point' as const,
          coordinates: student.longitude && student.latitude ? [student.longitude, student.latitude] : [0, 0]
        }
      }))
    };
  }, [debouncedStudents]);

  // Criar marcadores de estudantes usando símbolos do Mapbox com debounce
  useEffect(() => {
    if (!map.current || !isMapLoaded || !studentsGeoJSON) return;
    
    const startTime = performance.now();
    const sourceId = 'students-source';
    const layerId = 'students-layer';
    const labelsLayerId = 'students-labels-layer';

    // Remover camadas e fonte existentes
    const layersToRemove = [labelsLayerId, layerId];
    layersToRemove.forEach(layer => {
      if (map.current!.getLayer(layer)) {
        map.current!.removeLayer(layer);
      }
    });
    
    if (map.current!.getSource(sourceId)) {
      map.current!.removeSource(sourceId);
    }

    // Processar estudantes e criar dados GeoJSON
    const processStudentsData = async () => {
      const studentsWithCoords = [];
      
      for (const student of debouncedStudents) {
        if (!student.address) continue;
        
        let coordinates: [number, number] | null = null;
        
        // Verificar se já temos coordenadas
        if (student.latitude && student.longitude) {
          coordinates = [student.longitude, student.latitude];
        } else {
          // Geocodificar endereço usando o hook
          coordinates = await geocodeStudentAddress(student.id, student.address);
        }
        
        if (coordinates) {
          studentsWithCoords.push({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates
            },
            properties: {
              id: student.id,
              name: student.name,
              address: student.address,
              school: student.school,
              status: 'pending' // Status padrão para estudantes
            }
          });
        }
      }
      
      const studentsData = {
        type: 'FeatureCollection' as const,
        features: studentsWithCoords
      };

      // Adicionar fonte de dados com otimizações e verificação de estilo carregado
      executeWhenStyleLoaded(() => {
        if (!map.current) return;
        
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: studentsData,
          cluster: false,
          tolerance: 0.375
        });

        // Adicionar camada de símbolos com melhor visibilidade
        map.current.addLayer({
          id: layerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'icon-image': 'student-pending',
            'icon-size': 1.3, // Aumentar tamanho para melhor visibilidade
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'symbol-sort-key': ['get', 'id']
          },
          paint: {
            'icon-opacity': 1.0
          }
        });

        // Adicionar camada de labels com melhor legibilidade
        map.current.addLayer({
          id: labelsLayerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 2.2],
            'text-anchor': 'top',
            'text-size': 14, // Aumentar tamanho da fonte
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'text-max-width': 8,
            'symbol-spacing': 250
          },
          paint: {
            'text-color': '#dc2626', // Cor vermelha para estudantes pendentes
            'text-halo-color': '#ffffff',
            'text-halo-width': 2.5 // Aumentar halo para melhor legibilidade
          }
        });
      });

      // Event handlers memoizados
      const handleStudentClick = useCallback((e: any) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: [layerId]
        });

        if (features.length > 0) {
          const feature = features[0];
          const { name, address, school } = feature.properties!;
          
          new mapboxgl.Popup({ closeOnClick: true, maxWidth: '300px' })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">${name}</h3>
                <p class="text-sm text-gray-600">${address}</p>
                <p class="text-xs text-gray-500">Escola: ${school}</p>
              </div>
            `)
            .addTo(map.current!);
        }
      }, []);

      const handleMouseEnter = useCallback(() => {
        map.current!.getCanvas().style.cursor = 'pointer';
      }, []);

      const handleMouseLeave = useCallback(() => {
        map.current!.getCanvas().style.cursor = '';
      }, []);

      // Adicionar event listeners
      map.current!.on('click', layerId, handleStudentClick);
      map.current!.on('mouseenter', layerId, handleMouseEnter);
      map.current!.on('mouseleave', layerId, handleMouseLeave);
    };

    processStudentsData();
    
    const renderTime = performance.now() - startTime;
    console.log(`👥 Marcadores de estudantes renderizados em ${renderTime.toFixed(2)}ms:`, debouncedStudents?.length);
  }, [studentsGeoJSON, isMapLoaded, geocodeStudentAddress, debouncedStudents]);

  // Memoização dos dados das escolas para otimizar performance
  const schoolsGeoJSON = useMemo(() => {
    if (!debouncedSchools?.length) return null;
    
    return {
      type: 'FeatureCollection' as const,
      features: debouncedSchools.map((school) => ({
        type: 'Feature' as const,
        properties: {
          id: school.id,
          name: school.name,
          address: school.address
        },
        geometry: {
          type: 'Point' as const,
          coordinates: school.longitude && school.latitude ? [school.longitude, school.latitude] : [0, 0]
        }
      }))
    };
  }, [debouncedSchools]);

  // Criar marcadores de escolas usando símbolos do Mapbox com debounce
  useEffect(() => {
    if (!map.current || !isMapLoaded || !schoolsGeoJSON) return;
    
    const startTime = performance.now();
    const sourceId = 'schools-source';
    const layerId = 'schools-layer';
    const labelsLayerId = 'schools-labels-layer';

    // Remover camadas e fonte existentes
    const layersToRemove = [labelsLayerId, layerId];
    layersToRemove.forEach(layer => {
      if (map.current!.getLayer(layer)) {
        map.current!.removeLayer(layer);
      }
    });
    
    if (map.current!.getSource(sourceId)) {
      map.current!.removeSource(sourceId);
    }

    // Processar escolas e criar dados GeoJSON
    const processSchoolsData = async () => {
      const schoolsWithCoords = [];
      
      for (const school of debouncedSchools) {
        if (!school.address) continue;
        
        let coordinates: [number, number] | null = null;
        
        // Verificar se já temos coordenadas
        if (school.latitude && school.longitude) {
          coordinates = [school.longitude, school.latitude];
        } else {
          // Geocodificar endereço usando o hook
          coordinates = await geocodeSchoolAddress(school.id, school.address);
        }
        
        if (coordinates) {
          schoolsWithCoords.push({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates
            },
            properties: {
              id: school.id,
              name: school.name,
              address: school.address
            }
          });
        }
      }
      
      const schoolsData = {
        type: 'FeatureCollection' as const,
        features: schoolsWithCoords
      };

      // Adicionar fonte de dados com otimizações e verificação de estilo carregado
      executeWhenStyleLoaded(() => {
        if (!map.current) return;
        
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: schoolsData,
          cluster: false,
          tolerance: 0.375
        });

        // Adicionar camada de símbolos com melhor visibilidade
        map.current.addLayer({
          id: layerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'icon-image': 'school-icon',
            'icon-size': 1.4, // Aumentar tamanho para melhor visibilidade
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'symbol-sort-key': ['get', 'id']
          },
          paint: {
            'icon-opacity': 1.0
          }
        });

        // Adicionar camada de labels com melhor destaque
        map.current.addLayer({
          id: labelsLayerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 2.8],
            'text-anchor': 'top',
            'text-size': 16, // Aumentar tamanho para escolas
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'text-max-width': 10,
            'symbol-spacing': 300
          },
          paint: {
            'text-color': '#065f46', // Verde mais escuro para melhor contraste
            'text-halo-color': '#ffffff',
            'text-halo-width': 3 // Halo mais forte para escolas
          }
        });
      });

      // Event handlers memoizados
      const handleSchoolClick = useCallback((e: any) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: [layerId]
        });

        if (features.length > 0) {
          const feature = features[0];
          const { name, address } = feature.properties!;
          
          new mapboxgl.Popup({ closeOnClick: true, maxWidth: '300px' })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">${name}</h3>
                <p class="text-sm text-gray-600">${address}</p>
              </div>
            `)
            .addTo(map.current!);
        }
      }, []);

      const handleMouseEnter = useCallback(() => {
        map.current!.getCanvas().style.cursor = 'pointer';
      }, []);

      const handleMouseLeave = useCallback(() => {
        map.current!.getCanvas().style.cursor = '';
      }, []);

      // Adicionar event listeners
      map.current!.on('click', layerId, handleSchoolClick);
      map.current!.on('mouseenter', layerId, handleMouseEnter);
      map.current!.on('mouseleave', layerId, handleMouseLeave);
    };

    processSchoolsData();
    
    const renderTime = performance.now() - startTime;
    console.log(`🏫 Marcadores de escolas renderizados em ${renderTime.toFixed(2)}ms:`, debouncedSchools?.length);
   }, [schoolsGeoJSON, isMapLoaded, geocodeSchoolAddress, debouncedSchools]);

  // Calcular rota otimizada quando dados mudarem
  useEffect(() => {
    const calculateOptimizedRoute = async () => {
      if (!activeRoute || !driverLocation || isOptimizing) return;

      setIsOptimizing(true);
      setRouteError(null);

      try {
        // Preparar waypoints: motorista -> estudantes -> escola
        const waypoints = [];
        
        // Ponto de partida: localização atual do motorista
        waypoints.push({
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          name: 'Motorista',
          type: 'driver' as const
        });

        // Adicionar estudantes pendentes
        const pendingStudents = activeRoute.studentPickups
          .filter(pickup => pickup.status === 'pending' && pickup.lat && pickup.lng)
          .map(pickup => ({
            latitude: pickup.lat!,
            longitude: pickup.lng!,
            name: pickup.studentName,
            type: 'student' as const
          }));
        
        waypoints.push(...pendingStudents);

        // Adicionar escola como destino final
        if (activeRoute.school && activeRoute.school.latitude && activeRoute.school.longitude) {
          waypoints.push({
            latitude: activeRoute.school.latitude,
            longitude: activeRoute.school.longitude,
            name: activeRoute.school.name,
            type: 'school' as const
          });
        }

        if (waypoints.length < 2) {
          console.log('🚫 Waypoints insuficientes para calcular rota');
          return;
        }

        // Calcular rota otimizada
        const routeResult = await directionsService.calculateOptimizedRoute(
          waypoints,
          {
            considerTraffic: true,
            avoidTolls: false,
            vehicleType: 'van'
          }
        );

        if (routeResult.success && routeResult.route) {
          setOptimizedRoute({
            waypoints,
            geometry: routeResult.route.geometry,
            distance: routeResult.route.distance,
            duration: routeResult.route.duration,
            traffic: true
          });
          
          console.log('🗺️ Rota otimizada calculada:', {
            waypoints: waypoints.length,
            distancia: `${(routeResult.route.distance / 1000).toFixed(2)} km`,
            duracao: `${Math.floor(routeResult.route.duration / 60)}min`
          });
        } else {
          setRouteError(routeResult.error || 'Erro ao calcular rota');
        }
      } catch (error) {
        console.error('❌ Erro ao calcular rota otimizada:', error);
        setRouteError('Erro interno ao calcular rota');
      } finally {
        setIsOptimizing(false);
      }
    };

    calculateOptimizedRoute();
  }, [activeRoute, driverLocation, directionsService, isOptimizing]);

  // Desenhar rota otimizada no mapa
  useEffect(() => {
    if (!map.current || !isMapLoaded || !optimizedRoute) return;

    const routeId = 'optimized-route';
    const waypointsId = 'route-waypoints';
    
    // Remover rota existente
    if (map.current.getLayer(routeId)) {
      map.current.removeLayer(routeId);
    }
    if (map.current.getSource(routeId)) {
      map.current.removeSource(routeId);
    }
    
    if (map.current.getLayer(waypointsId)) {
      map.current.removeLayer(waypointsId);
    }
    if (map.current.getSource(waypointsId)) {
      map.current.removeSource(waypointsId);
    }

    // Adicionar rota otimizada com verificação de estilo carregado
    executeWhenStyleLoaded(() => {
      if (!map.current) return;
      
      map.current.addSource(routeId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            routeType: 'optimized',
            distance: optimizedRoute.distance,
            duration: optimizedRoute.duration,
            traffic: optimizedRoute.traffic
          },
          geometry: optimizedRoute.geometry
        }
      });

      map.current.addLayer({
        id: routeId,
        type: 'line',
        source: routeId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': tracedRoute ? 'none' : 'visible'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 5,
          'line-opacity': 0.8
        }
      });

      // Adicionar waypoints como marcadores
      const waypointsData = {
        type: 'FeatureCollection' as const,
        features: optimizedRoute.waypoints.map((waypoint, index) => ({
          type: 'Feature' as const,
          properties: {
            name: waypoint.name,
            type: waypoint.type,
            order: index + 1
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [waypoint.longitude, waypoint.latitude]
          }
        }))
      };

      map.current.addSource(waypointsId, {
        type: 'geojson',
        data: waypointsData
      });

      map.current.addLayer({
        id: waypointsId,
        type: 'circle',
        source: waypointsId,
        paint: {
          'circle-radius': [
            'case',
            ['==', ['get', 'type'], 'driver'], 8,
            ['==', ['get', 'type'], 'school'], 10,
            6
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'type'], 'driver'], '#ef4444',
            ['==', ['get', 'type'], 'school'], '#22c55e',
            '#3b82f6'
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });
    });

    // Ajustar visualização para mostrar toda a rota
    if (optimizedRoute.waypoints.length > 0) {
      const coordinates = optimizedRoute.waypoints.map(wp => [wp.longitude, wp.latitude]);
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord as [number, number]);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [optimizedRoute, isMapLoaded, tracedRoute]);

  // Desenhar rota traçada automaticamente em tempo real
  useEffect(() => {
    if (!map.current || !isMapLoaded || !tracedRoute || !tracedRoute.geometry) return;

    const tracedRouteId = 'traced-route';
    const startMarkerId = 'start-marker';
    const endMarkerId = 'end-marker';
    
    // Remover rota traçada existente
    if (map.current.getLayer(tracedRouteId)) {
      map.current.removeLayer(tracedRouteId);
    }
    if (map.current.getSource(tracedRouteId)) {
      map.current.removeSource(tracedRouteId);
    }

    // Remover marcadores existentes
    if (map.current.getLayer(startMarkerId)) {
      map.current.removeLayer(startMarkerId);
    }
    if (map.current.getSource(startMarkerId)) {
      map.current.removeSource(startMarkerId);
    }
    if (map.current.getLayer(endMarkerId)) {
      map.current.removeLayer(endMarkerId);
    }
    if (map.current.getSource(endMarkerId)) {
      map.current.removeSource(endMarkerId);
    }

    // Adicionar rota traçada com verificação de estilo carregado
    executeWhenStyleLoaded(() => {
      if (!map.current) return;
      
      map.current.addSource(tracedRouteId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            distance: tracedRoute.totalDistance,
            duration: tracedRoute.estimatedDuration
          },
          geometry: tracedRoute.geometry
        }
      });

      // Adicionar linha da rota traçada (cor diferente da rota planejada)
      map.current.addLayer({
        id: tracedRouteId,
        type: 'line',
        source: tracedRouteId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#10b981', // Verde para rota percorrida
          'line-width': 5,
          'line-opacity': 0.95
        }
      }, map.current.getLayer('optimized-route') ? 'optimized-route' : undefined); // Adicionar acima da rota planejada se existir
    });

    // Adicionar marcador de início (primeiro ponto) com verificação de estilo carregado
    if (tracedRoute.startPoint) {
      executeWhenStyleLoaded(() => {
        if (!map.current) return;
        
        map.current.addSource(startMarkerId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {
              title: 'Início da Rota',
              timestamp: tracedRoute.startPoint.timestamp
            },
            geometry: {
              type: 'Point',
              coordinates: [tracedRoute.startPoint.longitude, tracedRoute.startPoint.latitude]
            }
          }
        });

        map.current.addLayer({
          id: startMarkerId,
          type: 'circle',
          source: startMarkerId,
          paint: {
            'circle-radius': 8,
            'circle-color': '#22c55e',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 3
          }
        });
      });
    }

    // Adicionar marcador de posição atual (último ponto) com verificação de estilo carregado
    if (tracedRoute.currentPoint) {
      executeWhenStyleLoaded(() => {
        if (!map.current) return;
        
        map.current.addSource(endMarkerId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {
              title: 'Posição Atual',
              timestamp: tracedRoute.currentPoint.timestamp
            },
            geometry: {
              type: 'Point',
              coordinates: [tracedRoute.currentPoint.longitude, tracedRoute.currentPoint.latitude]
            }
          }
        });

        map.current.addLayer({
          id: endMarkerId,
          type: 'circle',
          source: endMarkerId,
          paint: {
            'circle-radius': 10,
            'circle-color': '#ef4444',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 3
          }
        });
      });
    }

    console.log('🗺️ Rota traçada automaticamente atualizada no mapa:', {
       pontos: tracedRoute.points.length,
       distancia: `${(tracedRoute.totalDistance / 1000).toFixed(2)} km`,
       duracao: `${Math.floor(tracedRoute.estimatedDuration / 60)}min`
     });
   }, [tracedRoute, isMapLoaded]);

  // Cleanup ao desmontar - otimizado
  useEffect(() => {
    return () => {
      console.log('🧹 Limpando recursos do mapa...');
      
      // Limpar marcadores
      if (driverMarker.current) {
        driverMarker.current.remove();
        driverMarker.current = null;
      }
      
      studentMarkers.current.forEach(marker => {
        if (marker) marker.remove();
      });
      studentMarkers.current = [];
      
      schoolMarkers.current.forEach(marker => {
        if (marker) marker.remove();
      });
      schoolMarkers.current = [];
      
      // Limpar layers e sources do mapa
      if (map.current) {
        const layersToRemove = [
          'students-layer', 'students-labels', 'schools-layer', 'schools-labels',
          'route-layer', 'traced-route-layer', 'route-start-marker', 'route-end-marker'
        ];
        
        const sourcesToRemove = [
          'students', 'schools', 'route', 'traced-route', 
          'route-start-marker', 'route-end-marker'
        ];
        
        layersToRemove.forEach(layerId => {
          if (map.current?.getLayer(layerId)) {
            map.current.removeLayer(layerId);
          }
        });
        
        sourcesToRemove.forEach(sourceId => {
          if (map.current?.getSource(sourceId)) {
            map.current.removeSource(sourceId);
          }
        });
        
        // Remover event listeners
        map.current.off('load');
        map.current.off('render');
        map.current.off('click', 'students-layer');
        map.current.off('mouseenter', 'students-layer');
        map.current.off('mouseleave', 'students-layer');
        map.current.off('click', 'schools-layer');
        map.current.off('mouseenter', 'schools-layer');
        map.current.off('mouseleave', 'schools-layer');
        
        // Destruir o mapa
        map.current.remove();
        map.current = null;
      }
      
      console.log('✅ Recursos do mapa limpos com sucesso');
    };
  }, []);

  // Não mostrar o mapa se não houver rota ativa
  if (!activeTrip) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-50">
        <div className="text-center p-8">
          <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma Rota Ativa</h3>
          <p className="text-gray-500">
            O mapa será exibido quando uma rota estiver em andamento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Container do mapa */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Status da geocodificação */}
      {isGeocoding && !hideOverlays && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg z-20">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700 font-medium">Geocodificando endereços...</span>
          </div>
        </div>
      )}
      
      {/* Erros de geocodificação */}
      {geocodingErrors.length > 0 && !hideOverlays && (
        <div className="absolute top-4 left-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg max-w-sm z-20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">Erros de Geocodificação</h4>
              <div className="space-y-1">
                {geocodingErrors.slice(-3).map((error, index) => (
                  <p key={index} className="text-xs text-red-700">{error}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Informações da rota - overlay */}
      {driverLocation && !hideOverlays && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Rota Ativa</h3>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                Última atualização: {formatTime(driverLocation.timestamp)}
              </span>
            </div>
            
            {nextDestination && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">
                  Próximo: {nextDestination.studentName}
                </span>
              </div>
            )}
            
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                Pressione ESC para sair do modo tela cheia
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Informações da rota otimizada */}
      {optimizedRoute && !hideOverlays && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
          <div className="flex items-center mb-2">
            <Route className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-800">Rota Otimizada</h3>
            {optimizedRoute.traffic && (
              <div className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Tráfego
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Distância:</span>
              <span className="font-medium">{(optimizedRoute.distance / 1000).toFixed(1)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tempo estimado:</span>
              <span className="font-medium">{Math.floor(optimizedRoute.duration / 60)} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paradas:</span>
              <span className="font-medium">{optimizedRoute.waypoints.length - 1}</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Rota calculada com tráfego em tempo real
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Status de otimização */}
      {isOptimizing && !hideOverlays && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg z-20">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700 font-medium">Calculando rota otimizada...</span>
          </div>
        </div>
      )}
      
      {/* Erro de roteamento */}
      {routeError && !hideOverlays && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg max-w-sm z-20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">Erro de Roteamento</h4>
              <p className="text-xs text-red-700">{routeError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Informações da rota traçada em tempo real */}
      {tracedRoute && !hideOverlays && (
        <div className="absolute top-20 right-4 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-sm z-10">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <h3 className="font-semibold text-green-800">Rota em Tempo Real</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-600">Distância percorrida:</span>
              <span className="font-medium text-green-800">{(tracedRoute.totalDistance / 1000).toFixed(2)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Tempo decorrido:</span>
              <span className="font-medium text-green-800">{Math.floor(tracedRoute.estimatedDuration / 60)}min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Pontos capturados:</span>
              <span className="font-medium text-green-800">{tracedRoute.points.length}</span>
            </div>
            {tracedRoute.currentPoint && (
              <div className="pt-2 border-t border-green-200">
                <div className="text-xs text-green-600 mb-1">Última atualização:</div>
                <div className="text-xs font-medium text-green-800">
                  {new Date(tracedRoute.currentPoint.timestamp).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Indicador de captura de dados - melhorado */}
      {isCapturing && !hideOverlays && (
        <div className="absolute bottom-4 right-4 bg-green-100 border border-green-300 rounded-lg p-2 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 font-medium">Rastreando em tempo real</span>
          </div>
        </div>
      )}
      
      {/* Overlay de performance - apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && performanceMetrics && !hideOverlays && (
        <div className="absolute bottom-20 right-4 bg-gray-900 text-white rounded-lg p-3 text-xs z-10 opacity-75">
          <div className="font-mono space-y-1">
            <div>FPS: {performanceMetrics.fps}</div>
            <div>Renders: {performanceMetrics.renderCount}</div>
            <div>Última atualização: {performanceMetrics.lastUpdate}ms</div>
            <div>Memória: {performanceMetrics.memoryUsage}MB</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardianRealTimeMap;