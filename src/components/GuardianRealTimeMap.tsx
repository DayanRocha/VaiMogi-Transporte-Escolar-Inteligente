import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Driver, Van, Student, Trip } from '@/types/driver';
import { useRealtimeData } from '../hooks/useRealtimeData';
import { useRouteTracking } from '../hooks/useRouteTracking';
import { useGuardianData } from '@/hooks/useGuardianData';
import { useGeocoding } from '@/hooks/useGeocoding';
import { useAutomaticRouteTracing } from '@/hooks/useAutomaticRouteTracing';
import { AlertCircle, Navigation, Clock, MapPin } from 'lucide-react';

// Configuração do token do Mapbox
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZGF5YW5hcmF1am8iLCJhIjoiY2x6cGNhZGNzMGNhZzJqcGNqZGNqZGNqZCJ9.example';
mapboxgl.accessToken = MAPBOX_TOKEN;

// Hook de debounce para otimizar atualizações
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Adicionar estilos CSS para animações
const addMapStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('map-animations')) {
    const style = document.createElement('style');
    style.id = 'map-animations';
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.7;
          transform: scale(1.1);
        }
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
  activeTrip
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Refs para marcadores
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const studentMarkers = useRef<mapboxgl.Marker[]>([]);
  const schoolMarkers = useRef<mapboxgl.Marker[]>([]);
  
  // Hooks para dados em tempo real
  const { driverLocation, isCapturing } = useRealtimeData(driver.id);
  const { activeRoute, nextDestination } = useRouteTracking();
  const { schools } = useGuardianData();
  const { geocodeStudentAddress, geocodeSchoolAddress, isGeocoding, geocodingErrors } = useGeocoding();
  
  // Aplicar debounce nas atualizações críticas
  const debouncedDriverLocation = useDebounce(driverLocation, 1000); // 1 segundo
  const debouncedStudents = useDebounce(students, 2000); // 2 segundos
  const debouncedSchools = useDebounce(schools, 3000); // 3 segundos
  
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

  // Inicialização do mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-46.6333, -23.5505], // São Paulo como centro padrão
      zoom: 12,
      attributionControl: false
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    // Adicionar controles de navegação
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
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
  }, []);

  // Atualizar localização do motorista com debounce
  useEffect(() => {
    if (!map.current || !isMapLoaded || !debouncedDriverLocation) return;
    
    const driverLocation = debouncedDriverLocation;

    // Criar ou atualizar marcador do motorista
    if (!driverMarker.current) {
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.style.cssText = 'width: 30px; height: 30px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); cursor: pointer;';

      driverMarker.current = new mapboxgl.Marker(el)
        .setLngLat([driverLocation.longitude, driverLocation.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">${driver.name}</h3>
                <p class="text-sm text-gray-600">Van: ${van.licensePlate}</p>
                <p class="text-xs text-gray-500">Última atualização: ${formatTime(driverLocation.timestamp)}</p>
              </div>
            `)
        )
        .addTo(map.current);
    } else {
      driverMarker.current.setLngLat([driverLocation.longitude, driverLocation.latitude]);
    }

    // Centralizar mapa na localização do motorista
    map.current.easeTo({
      center: [driverLocation.longitude, driverLocation.latitude],
      duration: 1000
    });
  }, [driverLocation, isMapLoaded, driver.name, van.licensePlate, formatTime]);

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

  // Criar marcadores de estudantes usando símbolos do Mapbox com debounce
  useEffect(() => {
    if (!map.current || !isMapLoaded || !debouncedStudents.length) return;
    
    const students = debouncedStudents;

    const sourceId = 'students-source';
    const layerId = 'students-layer';
    const labelsLayerId = 'students-labels-layer';

    // Remover camadas e fonte existentes
    if (map.current!.getLayer(labelsLayerId)) {
      map.current!.removeLayer(labelsLayerId);
    }
    if (map.current!.getLayer(layerId)) {
      map.current!.removeLayer(layerId);
    }
    if (map.current!.getSource(sourceId)) {
      map.current!.removeSource(sourceId);
    }

    // Processar estudantes e criar dados GeoJSON
    const processStudentsData = async () => {
      const studentsWithCoords = [];
      
      for (const student of students) {
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

      // Adicionar fonte de dados
      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: studentsData
      });

      // Adicionar camada de símbolos
      map.current!.addLayer({
        id: layerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'icon-image': 'student-pending',
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      });

      // Adicionar camada de labels
      map.current!.addLayer({
        id: labelsLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 2],
          'text-anchor': 'top',
          'text-size': 12
        },
        paint: {
          'text-color': '#333',
          'text-halo-color': '#fff',
          'text-halo-width': 1
        }
      });

      // Adicionar evento de clique para popups
      const handleStudentClick = (e: any) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: [layerId]
        });

        if (features.length > 0) {
          const feature = features[0];
          const { name, address, school } = feature.properties!;
          
          new mapboxgl.Popup()
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
      };

      map.current!.on('click', layerId, handleStudentClick);
      map.current!.on('mouseenter', layerId, () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', layerId, () => {
        map.current!.getCanvas().style.cursor = '';
      });
    };

    processStudentsData();
  }, [debouncedStudents, isMapLoaded, geocodeStudentAddress]);

  // Criar marcadores de escolas usando símbolos do Mapbox com debounce
  useEffect(() => {
    if (!map.current || !isMapLoaded || !debouncedSchools.length) return;
    
    const schools = debouncedSchools;

    const sourceId = 'schools-source';
    const layerId = 'schools-layer';
    const labelsLayerId = 'schools-labels-layer';

    // Remover camadas e fonte existentes
    if (map.current!.getLayer(labelsLayerId)) {
      map.current!.removeLayer(labelsLayerId);
    }
    if (map.current!.getLayer(layerId)) {
      map.current!.removeLayer(layerId);
    }
    if (map.current!.getSource(sourceId)) {
      map.current!.removeSource(sourceId);
    }

    // Processar escolas e criar dados GeoJSON
    const processSchoolsData = async () => {
      const schoolsWithCoords = [];
      
      for (const school of schools) {
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

      // Adicionar fonte de dados
      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: schoolsData
      });

      // Adicionar camada de símbolos
      map.current!.addLayer({
        id: layerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'icon-image': 'school-icon',
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      });

      // Adicionar camada de labels
      map.current!.addLayer({
        id: labelsLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 2.5],
          'text-anchor': 'top',
          'text-size': 14
        },
        paint: {
          'text-color': '#2d5016',
          'text-halo-color': '#fff',
          'text-halo-width': 2
        }
      });

      // Adicionar evento de clique para popups
      const handleSchoolClick = (e: any) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: [layerId]
        });

        if (features.length > 0) {
          const feature = features[0];
          const { name, address } = feature.properties!;
          
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">${name}</h3>
                <p class="text-sm text-gray-600">${address}</p>
              </div>
            `)
            .addTo(map.current!);
        }
      };

      map.current!.on('click', layerId, handleSchoolClick);
      map.current!.on('mouseenter', layerId, () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', layerId, () => {
        map.current!.getCanvas().style.cursor = '';
      });
    };

    processSchoolsData();
   }, [debouncedSchools, isMapLoaded, geocodeSchoolAddress]);

  // Desenhar rota otimizada
  useEffect(() => {
    if (!map.current || !isMapLoaded || !activeRoute) return;

    const routeId = 'optimized-route';
    
    // Remover rota existente
    if (map.current.getSource(routeId)) {
      map.current.removeLayer(routeId);
      map.current.removeSource(routeId);
    }

    // Adicionar nova rota
    map.current.addSource(routeId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {
          routeType: 'planned'
        },
        geometry: activeRoute.geometry || {
        type: 'LineString',
        coordinates: activeRoute.studentPickups
          .filter(pickup => pickup.lat && pickup.lng)
          .map(pickup => [pickup.lng, pickup.lat])
      }
      }
    });

    map.current.addLayer({
      id: routeId,
      type: 'line',
      source: routeId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
        'visibility': tracedRoute ? 'none' : 'visible' // Ocultar rota planejada quando há rota traçada
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4,
        'line-opacity': 0.6,
        'line-dasharray': [2, 2] // Linha tracejada para diferenciação
      }
    });
  }, [activeRoute, isMapLoaded, tracedRoute]);

  // Desenhar rota traçada automaticamente em tempo real
  useEffect(() => {
    if (!map.current || !isMapLoaded || !tracedRoute || !tracedRoute.geometry) return;

    const tracedRouteId = 'traced-route';
    const startMarkerId = 'start-marker';
    const endMarkerId = 'end-marker';
    
    // Remover rota traçada existente
    if (map.current.getSource(tracedRouteId)) {
      map.current.removeLayer(tracedRouteId);
      map.current.removeSource(tracedRouteId);
    }

    // Remover marcadores existentes
    if (map.current.getSource(startMarkerId)) {
      map.current.removeLayer(startMarkerId);
      map.current.removeSource(startMarkerId);
    }
    if (map.current.getSource(endMarkerId)) {
      map.current.removeLayer(endMarkerId);
      map.current.removeSource(endMarkerId);
    }

    // Adicionar rota traçada
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
    }, 'optimized-route'); // Adicionar acima da rota planejada para prioridade visual

    // Adicionar marcador de início (primeiro ponto)
    if (tracedRoute.startPoint) {
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
    }

    // Adicionar marcador de posição atual (último ponto)
    if (tracedRoute.currentPoint) {
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
    }

    console.log('🗺️ Rota traçada automaticamente atualizada no mapa:', {
       pontos: tracedRoute.points.length,
       distancia: `${(tracedRoute.totalDistance / 1000).toFixed(2)} km`,
       duracao: `${Math.floor(tracedRoute.estimatedDuration / 60)}min`
     });
   }, [tracedRoute, isMapLoaded]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (driverMarker.current) {
        driverMarker.current.remove();
      }
      studentMarkers.current.forEach(marker => marker.remove());
      schoolMarkers.current.forEach(marker => marker.remove());
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
      {isGeocoding && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg z-20">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700 font-medium">Geocodificando endereços...</span>
          </div>
        </div>
      )}
      
      {/* Erros de geocodificação */}
      {geocodingErrors.length > 0 && (
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
      {driverLocation && (
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
      
      {/* Informações da rota */}
      {activeRoute && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
          <h3 className="font-semibold text-gray-800 mb-2">Informações da Rota</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Distância:</span>
              <span className="font-medium">{activeRoute.studentPickups ? (activeRoute.studentPickups.length * 2).toFixed(1) : '0.0'} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tempo estimado:</span>
              <span className="font-medium">{activeRoute.studentPickups ? (activeRoute.studentPickups.length * 5) : 0} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paradas:</span>
              <span className="font-medium">{activeRoute.studentPickups?.length || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Informações da rota traçada em tempo real */}
      {tracedRoute && (
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
      
      {/* Indicador de captura de dados */}
      {isCapturing && (
        <div className="absolute bottom-4 right-4 bg-green-100 border border-green-300 rounded-lg p-2 z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700">Rastreando em tempo real</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardianRealTimeMap;