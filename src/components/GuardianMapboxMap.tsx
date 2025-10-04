import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Student, School } from '@/types/driver';
// Removido indicador de qualidade para evitar sobreposições no mapa
import { useMapboxMap } from '../hooks/useMapboxMap';
import { MapQualityIndicator } from './MapQualityIndicator';
import { RealTimeIndicator } from './RealTimeIndicator';
import { mapboxDirectionsService } from '@/services/mapboxDirectionsService';

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

function GuardianMapboxMap({
  driverLocation,
  activeRoute,
  students,
  schools,
  mapQuality,
  onMapQualityChange
}: GuardianMapboxMapProps) {
  console.log('🗺️ GuardianMapboxMap: Props recebidas:', {
    students: students?.length || 0,
    schools: schools?.length || 0,
    driverLocation: !!driverLocation,
    activeRoute: !!activeRoute
  });
  
  if (schools && schools.length > 0) {
    console.log('🏫 GuardianMapboxMap: Escolas recebidas (props):', schools.map(s => ({
      id: s.id,
      name: s.name,
      address: s.address,
      lat: s.latitude,
      lng: s.longitude,
      temCoordenadas: !!(s.latitude && s.longitude),
      coordenadasValidas: s.latitude && s.longitude && 
        s.latitude >= -25 && s.latitude <= -20 &&
        s.longitude >= -50 && s.longitude <= -44
    })));
  }
  
  // Log para debug: verificar quando as props schools mudam
  useEffect(() => {
    console.log('🔄 Props schools mudaram! Total:', schools.length);
    if (schools.length > 0) {
      console.log('🔄 Primeira escola:', {
        id: schools[0].id,
        name: schools[0].name,
        address: schools[0].address,
        lat: schools[0].latitude,
        lng: schools[0].longitude
      });
    }
  }, [schools]);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const studentMarkersMapRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const schoolMarkersMapRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const isUserInteractingRef = useRef(false);
  const lastInteractionAtRef = useRef<number>(0);
  const interactionGraceMs = 4000; // janela de graça após interação do usuário
  // Estados do mapa
  // Pausar atualizações dinâmicas do mapa (ex.: mover marcador em tempo real)
  const [updatesEnabled, setUpdatesEnabled] = useState(true);

  // Controlar frequência e sensibilidade das atualizações do marcador do motorista
  const lastDriverUpdateRef = useRef<number>(0);
  const minUpdateIntervalMs = 3000; // Aumentado para 3 segundos
  const minDistanceDeg = 0.0002; // Aumentado para ser mais restritivo
  const lastDriverLngLatRef = useRef<[number, number] | null>(null); // referência da última posição

  // Função para calcular distância entre duas coordenadas em graus
  const distanceDeg = useCallback((a: [number, number] | null, b: [number, number] | null): number => {
    if (!a || !b) return Infinity;
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Otimização: memoizar função shouldDeferCamera para evitar recriações
  const shouldDeferCamera = useCallback(() => {
    if (isUserInteractingRef.current) return true;
    const since = Date.now() - lastInteractionAtRef.current;
    return since < interactionGraceMs;
  }, [interactionGraceMs]);

  // Otimização: memoizar função getMapStyle para evitar recriações
  const getMapStyle = useCallback((quality: 'high' | 'medium' | 'low') => {
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
  }, []);

  

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
    setMapCenter,
    setMapZoom
  } = useMapboxMap({ driverLocation, students, schools });

  // Estado para armazenar a rota de navegação
  const [navigationRoute, setNavigationRoute] = useState<any>(null);

  // Estados locais para controle do mapa
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Estado para controlar se deve seguir o motorista automaticamente
  const [isFollowingDriver, setIsFollowingDriver] = useState(true);
  const userInteractedRef = useRef(false);

  // Resetar estado de seguimento quando rota mudar
  useEffect(() => {
    if (activeRoute && activeRoute.status === 'active') {
      setIsFollowingDriver(true);
      userInteractedRef.current = false;
      console.log('🎯 Nova rota ativa - ativando seguimento do motorista');
    }
  }, [activeRoute?.id]);

  // Buscar rota de navegação quando houver rota ativa
  useEffect(() => {
    const fetchNavigationRoute = async () => {
      if (!activeRoute || activeRoute.status !== 'active' || !driverLocation) {
        setNavigationRoute(null);
        return;
      }

      console.log('🗺️ Buscando rota de navegação...');

      // Montar waypoints: motorista -> estudantes -> escolas
      const waypoints = [];

      // 1. Localização atual do motorista
      waypoints.push({
        longitude: driverLocation.longitude,
        latitude: driverLocation.latitude,
        name: 'Motorista'
      });

      // 2. Localizações dos estudantes
      studentsWithCoords.forEach(student => {
        if (student.latitude && student.longitude) {
          waypoints.push({
            longitude: student.longitude,
            latitude: student.latitude,
            name: student.name
          });
        }
      });

      // 3. Localizações das escolas
      schoolsWithCoords.forEach(school => {
        if (school.latitude && school.longitude) {
          waypoints.push({
            longitude: school.longitude,
            latitude: school.latitude,
            name: school.name
          });
        }
      });

      console.log('🗺️ Waypoints para navegação:', waypoints.length);

      if (waypoints.length < 2) {
        console.warn('⚠️ Não há waypoints suficientes para calcular rota');
        return;
      }

      const route = await mapboxDirectionsService.getRoute(waypoints, 'driving-traffic');
      
      if (route) {
        setNavigationRoute(route);
        console.log('✅ Rota de navegação carregada');
      }
    };

    fetchNavigationRoute();
  }, [activeRoute, driverLocation, studentsWithCoords, schoolsWithCoords]);

  // Inicializar studentMarkers como array vazio
  const studentMarkers = useRef<mapboxgl.Marker[]>([]);

  // Definir funções de interação no escopo do componente
  const onInteractStart = useCallback(() => { 
    isUserInteractingRef.current = true; 
    console.log('🖱️ Usuário iniciou interação - rastreamento pausado');
  }, []);
  
  const onInteractEnd = useCallback(() => { 
    isUserInteractingRef.current = false; 
    lastInteractionAtRef.current = Date.now(); 
    console.log('🖱️ Usuário finalizou interação - navegação livre ativa');
  }, []);

  // Otimização: memoizar função getDriverPopupHTML para evitar recriações
  const getDriverPopupHTML = useCallback(() => {
    if (!driverLocation) return '';
    return `
      <div style="padding: 8px;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">🚌 Motorista</div>
        <div style="font-size: 12px; color: #374151;">
          <div><strong>Última atualização:</strong> ${formatTime(driverLocation.timestamp)}</div>
          ${driverLocation.speed !== undefined ? `<div><strong>Velocidade:</strong> ${driverLocation.speed.toFixed(1)} km/h</div>` : ''}
          ${driverLocation.accuracy !== undefined ? `<div><strong>Precisão:</strong> ±${Math.round(driverLocation.accuracy)}m</div>` : ''}
          <div style="margin-top: 4px; padding: 2px 6px; background: #10b981; color: white; border-radius: 4px; font-size: 10px; display: inline-block;">
            🟢 Tempo Real
          </div>
        </div>
      </div>
    `;
  }, [driverLocation, formatTime]);

  // Otimização: memoizar dados dos estudantes e escolas para evitar recálculos desnecessários
  const memoizedStudentsWithCoords = useMemo(() => studentsWithCoords, [studentsWithCoords]);
  const memoizedSchoolsWithCoords = useMemo(() => schoolsWithCoords, [schoolsWithCoords]);

  // Inicializar o mapa
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
      // Configurações otimizadas para performance
      const mapConfig = {
        container: mapContainer.current,
        style: getMapStyle(mapQuality),
        center: mapCenter,
        zoom: mapZoom,
        attributionControl: false,
        // Otimizações de performance
        antialias: false, // Desabilita antialiasing para melhor performance
        optimizeForTerrain: true,
        preserveDrawingBuffer: false,
        refreshExpiredTiles: false,
        // Configurações de renderização suave
        renderWorldCopies: false,
        maxTileCacheSize: 50, // Reduz cache de tiles para economizar memória
        transformRequest: (url: string, resourceType: string) => {
          // Otimizar requisições de recursos
          if (resourceType === 'Tile') {
            return {
              url: url,
              headers: {},
              credentials: 'same-origin'
            };
          }
        }
      };

      // Criar novo mapa com configurações otimizadas
      map.current = new mapboxgl.Map(mapConfig);
    } catch (error) {
      console.error('❌ Erro ao criar mapa:', error);
      return;
    }

    map.current.on('load', () => {
      setIsMapLoaded(true);
      console.log('🗺️ Mapa carregado com otimizações de performance');
      
      // Configurar otimizações pós-carregamento
      if (map.current) {
        // Reduzir frequência de renderização para melhor performance
        map.current.setRenderWorldCopies(false);
        
        // Configurar qualidade adaptativa baseada na performance
        const canvas = map.current.getCanvas();
        if (canvas) {
          // Ajustar qualidade do canvas baseado na performance do dispositivo
          const devicePixelRatio = window.devicePixelRatio || 1;
          const adaptiveRatio = devicePixelRatio > 2 ? 1.5 : devicePixelRatio;
          canvas.style.imageRendering = 'optimizeSpeed';
        }
      }
    });

    // Otimizar eventos de renderização
    let renderTimeout: NodeJS.Timeout;
    map.current.on('render', () => {
      // Throttle de eventos de renderização para evitar sobrecarga
      clearTimeout(renderTimeout);
      renderTimeout = setTimeout(() => {
        // Lógica de renderização otimizada pode ser adicionada aqui
      }, 100);
    });

    // Adicionar controles de navegação
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Configurar eventos de interação para pausar atualizações durante interação
    map.current.on('dragstart', onInteractStart);
    map.current.on('dragend', onInteractEnd);
    map.current.on('zoomstart', onInteractStart);
    map.current.on('zoomend', onInteractEnd);
    map.current.on('rotatestart', onInteractStart);
    map.current.on('rotateend', onInteractEnd);

    // Detectar quando usuário move o mapa manualmente (para parar de seguir motorista)
    const handleUserInteraction = () => {
      if (isFollowingDriver) {
        console.log('👆 Usuário moveu o mapa - parando de seguir motorista');
        setIsFollowingDriver(false);
        userInteractedRef.current = true;
      }
    };

    map.current.on('dragstart', handleUserInteraction);
    map.current.on('zoomstart', handleUserInteraction);
    map.current.on('pitchstart', handleUserInteraction);

    return () => {
      if (map.current) {
        // Limpar eventos
        map.current.off('dragstart', onInteractStart);
        map.current.off('dragend', onInteractEnd);
        map.current.off('zoomstart', onInteractStart);
        map.current.off('zoomend', onInteractEnd);
        map.current.off('rotatestart', onInteractStart);
        map.current.off('rotateend', onInteractEnd);
        
        // Remover mapa
        map.current.remove();
        map.current = null;
      }
      setIsMapLoaded(false);
      
      // Limpar refs
      driverMarker.current = null;
      studentMarkers.current = [];
      
      clearTimeout(renderTimeout);
    };
  }, [mapCenter, mapZoom, getMapStyle, mapQuality, onInteractStart, onInteractEnd]);

  // Centralização inicial do mapa (apenas uma vez quando carrega)
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    if (hasInitializedRef.current) return; // Já inicializou, não fazer nada

    console.log('🎯 Inicializando posição do mapa (primeira vez)');

    // Calcular bounds para incluir todos os pontos relevantes
    const calculateBounds = () => {
      const bounds = new mapboxgl.LngLatBounds();
      let hasPoints = false;
      
      // Adicionar localização do motorista
      if (driverLocation) {
        bounds.extend([driverLocation.longitude, driverLocation.latitude]);
        hasPoints = true;
      }
      
      // Adicionar localizações dos estudantes
      memoizedStudentsWithCoords.forEach(student => {
        if (student.latitude && student.longitude) {
          bounds.extend([student.longitude, student.latitude]);
          hasPoints = true;
        }
      });
      
      // Adicionar localizações das escolas
      memoizedSchoolsWithCoords.forEach(school => {
        if (school.latitude && school.longitude) {
          bounds.extend([school.longitude, school.latitude]);
          hasPoints = true;
        }
      });
      
      return hasPoints ? bounds : null;
    };

    // Se há rota ativa, centralizar no motorista (modo navegação)
    if (activeRoute && activeRoute.status === 'active' && driverLocation) {
      console.log('🎯 Centralizando no motorista (primeira vez)');
      
      map.current.flyTo({
        center: [driverLocation.longitude, driverLocation.latitude],
        zoom: 16,
        pitch: 45,
        bearing: driverLocation.heading || 0,
        duration: 1500
      });
      
      hasInitializedRef.current = true;
      return;
    }

    // Se não há rota ativa, mostrar todos os pontos
    const bounds = calculateBounds();
    
    if (bounds && !bounds.isEmpty()) {
      console.log('🎯 Mostrando todos os marcadores (primeira vez)');
      
      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
        maxZoom: 14,
        pitch: 0,
        duration: 2000
      });
      hasInitializedRef.current = true;
    } else if (driverLocation) {
      map.current.flyTo({
        center: [driverLocation.longitude, driverLocation.latitude],
        zoom: 15,
        duration: 1000
      });
      hasInitializedRef.current = true;
    } else if (memoizedSchoolsWithCoords.length > 0) {
      const firstSchool = memoizedSchoolsWithCoords[0];
      map.current.flyTo({
        center: [firstSchool.longitude, firstSchool.latitude],
        zoom: 14,
        duration: 1500
      });
      hasInitializedRef.current = true;
    }
  }, [isMapLoaded, driverLocation, activeRoute, memoizedStudentsWithCoords, memoizedSchoolsWithCoords]);

  // Seguir motorista em tempo real quando há rota ativa (apenas se isFollowingDriver = true)
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    if (!activeRoute || activeRoute.status !== 'active' || !driverLocation) return;
    if (!isFollowingDriver) return; // Não seguir se usuário desativou

    // Atualizar posição do mapa suavemente para seguir o motorista
    console.log('🚗 Seguindo motorista em tempo real');
    
    map.current.easeTo({
      center: [driverLocation.longitude, driverLocation.latitude],
      bearing: driverLocation.heading || 0,
      duration: 1000 // Transição suave de 1 segundo
    });
  }, [driverLocation, activeRoute, isMapLoaded, isFollowingDriver]);

  // Atualizar estilo do mapa quando a qualidade mudar
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      // Aguardar o mapa estar completamente carregado antes de mudar o estilo
      const currentStyle = map.current.getStyle();
      const newStyle = getMapStyle(mapQuality);
      
      // Só atualizar se o estilo realmente mudou
      if (currentStyle.name !== newStyle) {
        console.log('🎨 Mudando estilo do mapa:', newStyle);
        console.log('🔄 Salvando marcadores antes de mudar estilo...');
        
        // Salvar referências dos marcadores atuais
        const savedDriverMarker = driverMarker.current;
        const savedStudentMarkers = new Map(studentMarkersMapRef.current);
        const savedSchoolMarkers = new Map(schoolMarkersMapRef.current);
        
        console.log('💾 Marcadores salvos:', {
          driver: !!savedDriverMarker,
          students: savedStudentMarkers.size,
          schools: savedSchoolMarkers.size
        });
        
        // Mudar o estilo
        map.current.setStyle(newStyle);
        
        // Quando o estilo carregar, recriar os marcadores
        map.current.once('style.load', () => {
          console.log('🎨 Estilo carregado, recriando marcadores...');
          
          // Recriar marcador do motorista
          if (savedDriverMarker) {
            const lngLat = savedDriverMarker.getLngLat();
            savedDriverMarker.addTo(map.current!);
            console.log('✅ Marcador do motorista recriado');
          }
          
          // Recriar marcadores dos estudantes
          savedStudentMarkers.forEach((marker, id) => {
            marker.addTo(map.current!);
          });
          console.log('✅ Marcadores dos estudantes recriados:', savedStudentMarkers.size);
          
          // Recriar marcadores das escolas
          savedSchoolMarkers.forEach((marker, id) => {
            marker.addTo(map.current!);
          });
          console.log('✅ Marcadores das escolas recriados:', savedSchoolMarkers.size);
        });
      }
    }
  }, [mapQuality, getMapStyle]);

  // Gerenciar marcador do motorista de forma estática (sem tempo real)
  useEffect(() => {
    if (!map.current) return;

    // Se não há localização, remover marcador existente e sair
    if (!driverLocation) {
      if (driverMarker.current) {
        driverMarker.current.remove();
        driverMarker.current = null;
      }
      return;
    }

    const position: [number, number] = [driverLocation.longitude, driverLocation.latitude];
    
    // Verificar se a posição mudou significativamente (evitar atualizações desnecessárias)
    const positionKey = `${position[0].toFixed(6)},${position[1].toFixed(6)}`;
    const lastPositionKey = driverMarker.current?.getLngLat() 
      ? `${driverMarker.current.getLngLat().lng.toFixed(6)},${driverMarker.current.getLngLat().lat.toFixed(6)}`
      : '';
    
    // Se a posição não mudou significativamente, apenas atualizar o popup
    if (driverMarker.current && positionKey === lastPositionKey) {
      // Atualizar apenas o conteúdo do popup sem recriar o marcador
      const popup = driverMarker.current.getPopup();
      if (popup) {
        const popupHTML = `
          <div style="padding: 8px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">🚌 Motorista</div>
            <div style="font-size: 12px; color: #374151;">
              <div><strong>Última atualização:</strong> ${formatTime(driverLocation.timestamp)}</div>
              ${driverLocation.speed !== undefined ? `<div><strong>Velocidade:</strong> ${driverLocation.speed.toFixed(1)} km/h</div>` : ''}
              ${driverLocation.accuracy !== undefined ? `<div><strong>Precisão:</strong> ±${Math.round(driverLocation.accuracy)}m</div>` : ''}
              <div style="margin-top: 4px; padding: 2px 6px; background: #6b7280; color: white; border-radius: 4px; font-size: 10px; display: inline-block;">
                📍 Localização Atualizada
              </div>
            </div>
          </div>
        `;
        popup.setHTML(popupHTML);
      }
      return;
    }

    // Se já existe marcador, apenas atualizar posição (sem recentralizar mapa)
    if (driverMarker.current) {
      driverMarker.current.setLngLat(position);
      
      // Atualizar popup com nova informação
      const popup = driverMarker.current.getPopup();
      if (popup) {
        const popupHTML = `
          <div style="padding: 8px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">🚌 Motorista</div>
            <div style="font-size: 12px; color: #374151;">
              <div><strong>Última atualização:</strong> ${formatTime(driverLocation.timestamp)}</div>
              ${driverLocation.speed !== undefined ? `<div><strong>Velocidade:</strong> ${driverLocation.speed.toFixed(1)} km/h</div>` : ''}
              ${driverLocation.accuracy !== undefined ? `<div><strong>Precisão:</strong> ±${Math.round(driverLocation.accuracy)}m</div>` : ''}
              <div style="margin-top: 4px; padding: 2px 6px; background: #10b981; color: white; border-radius: 4px; font-size: 10px; display: inline-block;">
                📍 Posição Atualizada
              </div>
            </div>
          </div>
        `;
        popup.setHTML(popupHTML);
      }
      
      console.log('🚌 Posição do motorista atualizada (sem recentralizar)');
      return;
    }

    // Criar HTML do popup
    const createPopupHTML = () => {
      return `
        <div style="padding: 8px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">🚌 Motorista</div>
          <div style="font-size: 12px; color: #374151;">
            <div><strong>Última atualização:</strong> ${formatTime(driverLocation.timestamp)}</div>
            ${driverLocation.speed !== undefined ? `<div><strong>Velocidade:</strong> ${driverLocation.speed.toFixed(1)} km/h</div>` : ''}
            ${driverLocation.accuracy !== undefined ? `<div><strong>Precisão:</strong> ±${Math.round(driverLocation.accuracy)}m</div>` : ''}
            <div style="margin-top: 4px; padding: 2px 6px; background: #6b7280; color: white; border-radius: 4px; font-size: 10px; display: inline-block;">
              📍 Localização Estática
            </div>
          </div>
        </div>
      `;
    };

    // Criar marcador de navegação estilo Google Maps
    const el = document.createElement('div');
    el.className = 'driver-marker-navigation';
    
    // Obter direção (heading) se disponível
    const heading = driverLocation.heading || 0;
    
    // Criar SVG de seta de navegação
    el.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 48 48" style="transform: rotate(${heading}deg); transition: transform 0.3s ease;">
        <!-- Sombra -->
        <ellipse cx="24" cy="42" rx="8" ry="3" fill="rgba(0,0,0,0.3)" />
        
        <!-- Círculo externo (borda branca) -->
        <circle cx="24" cy="24" r="18" fill="white" />
        
        <!-- Círculo interno (azul) -->
        <circle cx="24" cy="24" r="16" fill="#4285F4" />
        
        <!-- Seta de navegação -->
        <path d="M 24 8 L 30 28 L 24 24 L 18 28 Z" fill="white" />
        
        <!-- Ponto central -->
        <circle cx="24" cy="24" r="3" fill="white" />
      </svg>
    `;
    
    el.style.cssText = `
      width: 48px;
      height: 48px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `;

    // Adicionar estilos hover e animação
    if (!document.getElementById('driver-marker-navigation-styles')) {
      const style = document.createElement('style');
      style.id = 'driver-marker-navigation-styles';
      style.textContent = `
        .driver-marker-navigation:hover {
          transform: scale(1.15);
        }
        
        .driver-marker-navigation svg {
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }
        
        .driver-marker-navigation:hover svg {
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.4));
        }
      `;
      document.head.appendChild(style);
    }

    const popup = new mapboxgl.Popup({ 
      offset: 30, 
      className: 'driver-popup-static',
      closeButton: true,
      closeOnClick: false
    }).setHTML(createPopupHTML());

    driverMarker.current = new mapboxgl.Marker(el)
      .setLngLat(position)
      .setPopup(popup)
      .addTo(map.current);

    console.log('🚌 Marcador estático do motorista criado/atualizado na posição:', position);
  }, [driverLocation]); // Removendo formatTime das dependências

  // Marcadores dos estudantes - agrupados por endereço
  useEffect(() => {
    if (!map.current) return;
    
    // Sempre exibir marcadores de estudantes, independente de rota ativa
    if (memoizedStudentsWithCoords.length === 0) {
      // Remover todos os marcadores quando não há estudantes
      studentMarkers.current.forEach(marker => marker.remove());
      studentMarkers.current = [];
      return;
    }

    // Remover todos os marcadores existentes
    studentMarkers.current.forEach(marker => marker.remove());
    studentMarkers.current = [];

    // Agrupar estudantes por endereço (coordenadas)
    const studentsByLocation = new Map<string, Student[]>();
    
    memoizedStudentsWithCoords.forEach(student => {
      if (!student.latitude || !student.longitude) return;
      
      const positionKey = `${student.longitude.toFixed(6)},${student.latitude.toFixed(6)}`;
      
      if (!studentsByLocation.has(positionKey)) {
        studentsByLocation.set(positionKey, []);
      }
      studentsByLocation.get(positionKey)!.push(student);
    });

    console.log('👥 Estudantes agrupados por localização:', studentsByLocation.size, 'localizações');

    // Criar um marcador para cada localização (pode ter múltiplos estudantes)
    studentsByLocation.forEach((studentsAtLocation, positionKey) => {
      const firstStudent = studentsAtLocation[0];
      const position: [number, number] = [firstStudent.longitude, firstStudent.latitude];
      const studentCount = studentsAtLocation.length;
      
      console.log(`📍 Criando marcador para ${studentCount} estudante(s) em:`, position);

      // Criar marcador com badge se houver múltiplos estudantes
      const el = document.createElement('div');
      el.className = 'student-marker';
      el.style.cssText = `
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: white;
        font-weight: bold;
        transition: all 0.2s ease;
        position: relative;
      `;
      el.innerHTML = '👨‍🎓';
      
      // Adicionar badge com número de estudantes se houver mais de um
      if (studentCount > 1) {
        const badge = document.createElement('div');
        badge.className = 'student-count-badge';
        badge.textContent = studentCount.toString();
        badge.style.cssText = `
          position: absolute;
          top: -6px;
          right: -6px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        el.appendChild(badge);
      }

      // Adicionar estilos apenas uma vez
      if (!document.getElementById('student-marker-styles')) {
        const style = document.createElement('style');
        style.id = 'student-marker-styles';
        style.textContent = `
          .student-marker:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6);
          }
          
          /* Estilos do popup moderno */
          .mapboxgl-popup.student-popup-modern .mapboxgl-popup-content {
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            border: 1px solid #e5e7eb;
          }
          
          .mapboxgl-popup.student-popup-modern .mapboxgl-popup-close-button {
            font-size: 18px;
            padding: 4px 8px;
            color: #6b7280;
            right: 4px;
            top: 4px;
          }
          
          .mapboxgl-popup.student-popup-modern .mapboxgl-popup-close-button:hover {
            background: #f3f4f6;
            color: #1f2937;
            border-radius: 6px;
          }
          
          .mapboxgl-popup.student-popup-modern .mapboxgl-popup-tip {
            border-top-color: #f9fafb;
          }
        `;
        document.head.appendChild(style);
      }

      // Criar HTML do popup com todos os estudantes
      const popupHTML = `
        <div style="padding: 6px; max-width: 260px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          ${studentCount > 1 ? `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; margin-bottom: 8px; text-align: center; box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);">
              👥 ${studentCount} Estudantes
            </div>
          ` : ''}
          ${studentsAtLocation.map((student, index) => {
            const studentSchool = schools.find(school => school.id === student.schoolId);
            const statusConfig = {
              waiting: { color: '#10b981', bg: '#d1fae5', text: 'Aguardando', icon: '⏳' },
              embarked: { color: '#3b82f6', bg: '#dbeafe', text: 'Embarcado', icon: '🚌' },
              dropped_off: { color: '#8b5cf6', bg: '#ede9fe', text: 'Na Escola', icon: '🏫' }
            };
            const status = statusConfig[student.status as keyof typeof statusConfig] || statusConfig.waiting;
            
            return `
              <div style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'}; padding: 8px; border-radius: 6px; margin-bottom: ${index < studentsAtLocation.length - 1 ? '6px' : '0'};">
                <div style="font-weight: 600; font-size: 13px; color: #1f2937; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
                  <span style="font-size: 16px;">👨‍🎓</span>
                  <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${student.name}</span>
                </div>
                <div style="font-size: 11px; color: #6b7280; line-height: 1.5;">
                  ${index === 0 ? `
                    <div style="display: flex; align-items: start; gap: 4px; margin-bottom: 3px;">
                      <span style="color: #10b981; font-size: 12px;">📍</span>
                      <span style="flex: 1;">${student.address}</span>
                    </div>
                  ` : ''}
                  ${studentSchool ? `
                    <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 3px;">
                      <span style="font-size: 12px;">🏫</span>
                      <span>${studentSchool.name}</span>
                    </div>
                  ` : ''}
                  <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                    <span style="font-size: 12px;">📞</span>
                    <span>${student.guardianPhone}</span>
                  </div>
                  <div style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: ${status.bg}; color: ${status.color}; border-radius: 12px; font-size: 10px; font-weight: 600;">
                    <span>${status.icon}</span>
                    <span>${status.text}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      const popup = new mapboxgl.Popup({ 
        offset: 25, 
        className: 'student-popup-modern',
        closeButton: true,
        closeOnClick: false,
        maxWidth: '280px'
      }).setHTML(popupHTML);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(position)
        .setPopup(popup)
        .addTo(map.current!);

      studentMarkers.current.push(marker);
    });

    console.log(`👨‍🎓 Marcadores de estudantes criados: ${studentMarkers.current.length} marcadores para ${memoizedStudentsWithCoords.length} estudantes`);
  }, [memoizedStudentsWithCoords, schools]);

  // Marcadores das escolas - estáveis (atualiza/recicla em vez de recriar tudo)
  useEffect(() => {
    console.log('🏫 ========== useEffect ESCOLAS executado ==========');
    console.log('🏫 map.current existe?', !!map.current);
    console.log('🏫 Quantidade de escolas:', memoizedSchoolsWithCoords.length);
    console.log('🏫 Marcadores existentes:', schoolMarkersMapRef.current.size);
    
    if (!map.current) {
      console.log('❌ map.current não existe, saindo...');
      return;
    }
    
    // Sempre exibir marcadores de escolas, independente de rota ativa
    if (memoizedSchoolsWithCoords.length === 0) {
      console.log('⚠️ Nenhuma escola com coordenadas válidas');
      // Remover todos os marcadores quando não há escolas
      for (const [id, marker] of schoolMarkersMapRef.current.entries()) {
        console.log('🗑️ Removendo marcador da escola:', id);
        marker.remove();
        schoolMarkersMapRef.current.delete(id);
      }
      return;
    }

    console.log('✅ Processando', memoizedSchoolsWithCoords.length, 'escolas');
    const currentIds = new Set<string>();

    memoizedSchoolsWithCoords.forEach(school => {
      if (!school.latitude || !school.longitude) {
        console.log('⚠️ Escola SEM coordenadas:', school.name);
        return;
      }
      
      // Validar se coordenadas estão na região correta
      const isValidRegion = school.latitude >= -25 && school.latitude <= -20 &&
                           school.longitude >= -50 && school.longitude <= -44;
      
      if (!isValidRegion) {
        console.log('❌ Coordenadas FORA da região:', school.name);
        return;
      }
      
      console.log('🏫 Processando escola:', school.name);
      currentIds.add(school.id);

      let marker = schoolMarkersMapRef.current.get(school.id);
      
      // Contar quantos estudantes estão associados a esta escola
      const studentsInSchool = students.filter(student => student.schoolId === school.id).length;
      
      const popupHTML = `
        <div style="padding: 10px;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #059669;">🏫 ${school.name}</div>
          <div style="font-size: 12px; color: #374151;">
            <div style="margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <strong>Endereço:</strong>
            </div>
            <div style="margin-bottom: 8px; padding: 4px 8px; background: #f3f4f6; border-radius: 4px; margin-left: 18px;">${school.address}</div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: 600;">
                👨‍🎓 ${studentsInSchool} ${studentsInSchool === 1 ? 'Aluno' : 'Alunos'}
              </span>
            </div>
          </div>
        </div>
      `;

      // Se não existe marcador OU se foi removido por mudança de endereço, criar novo
      if (!marker || !schoolMarkersMapRef.current.has(school.id)) {
        console.log('🏫 Criando marcador para:', school.name);
        
        const el = document.createElement('div');
        el.className = 'school-marker';
        el.style.cssText = `
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 1000;
        `;
        el.innerHTML = '🏫';

        const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(popupHTML);
        
        try {
          marker = new mapboxgl.Marker(el)
            .setLngLat([school.longitude, school.latitude])
            .setPopup(popup)
            .addTo(map.current!);
          
          schoolMarkersMapRef.current.set(school.id, marker);
          console.log('✅ Marcador criado:', school.name);
        } catch (error) {
          console.error('❌ Erro ao criar marcador:', error);
        }
      } else {
        // Verificar se o endereço mudou comparando coordenadas
        const currentPos = marker.getLngLat();
        const posChanged = Math.abs(currentPos.lng - school.longitude) > 0.0001 || 
                          Math.abs(currentPos.lat - school.latitude) > 0.0001;
        
        if (posChanged) {
          console.log('🔄 Endereço mudou! Removendo marcador antigo');
          console.log('   Posição antiga:', { lng: currentPos.lng, lat: currentPos.lat });
          console.log('   Posição nova:', { lng: school.longitude, lat: school.latitude });
          
          // Remover marcador antigo completamente
          marker.remove();
          schoolMarkersMapRef.current.delete(school.id);
          console.log('🗑️ Marcador antigo removido, será recriado');
          
          // Criar novo marcador imediatamente
          try {
            console.log('🏫 Criando NOVO marcador para escola:', school.name);
            
            const el = document.createElement('div');
            el.className = 'school-marker';
            el.style.backgroundImage = 'url(/school-marker.png)';
            el.style.width = '40px';
            el.style.height = '40px';
            el.style.backgroundSize = 'cover';
            el.style.cursor = 'pointer';
            el.style.borderRadius = '50%';
            el.style.border = '3px solid #10b981';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            
            if (studentCount > 0) {
              const badge = document.createElement('div');
              badge.className = 'student-count-badge';
              badge.textContent = studentCount.toString();
              badge.style.position = 'absolute';
              badge.style.top = '-8px';
              badge.style.right = '-8px';
              badge.style.backgroundColor = '#ef4444';
              badge.style.color = 'white';
              badge.style.borderRadius = '50%';
              badge.style.width = '24px';
              badge.style.height = '24px';
              badge.style.display = 'flex';
              badge.style.alignItems = 'center';
              badge.style.justifyContent = 'center';
              badge.style.fontSize = '12px';
              badge.style.fontWeight = 'bold';
              badge.style.border = '2px solid white';
              badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              el.appendChild(badge);
            }
            
            const popup = new mapboxgl.Popup({ 
              offset: 25,
              closeButton: true,
              closeOnClick: false
            }).setHTML(popupHTML);
            
            marker = new mapboxgl.Marker(el)
              .setLngLat([school.longitude, school.latitude])
              .setPopup(popup)
              .addTo(map.current!);
            
            schoolMarkersMapRef.current.set(school.id, marker);
            console.log('✅ Marcador da escola criado e adicionado ao mapa');
          } catch (error) {
            console.error('❌ Erro ao criar marcador da escola:', error);
          }
        } else {
          console.log('🔄 Atualizando marcador:', school.name);
          
          // Verificar se o marcador está realmente no DOM
          const markerElement = marker.getElement();
          const isInDOM = markerElement && document.body.contains(markerElement);
          
          if (!isInDOM) {
            console.log('⚠️ Marcador não está no DOM, readicionando...');
            marker.addTo(map.current!);
          }
          
          marker.setLngLat([school.longitude, school.latitude]);
          marker.getPopup()?.setHTML(popupHTML);
        }
      }
    });

    // Remover marcadores de escolas que não estão mais presentes
    for (const [id, marker] of schoolMarkersMapRef.current.entries()) {
      if (!currentIds.has(id)) {
        console.log('🗑️ Removendo marcador obsoleto:', id);
        marker.remove();
        schoolMarkersMapRef.current.delete(id);
      }
    }
    
    console.log('🏫 Total de marcadores:', schoolMarkersMapRef.current.size);
    console.log('🏫 Total no DOM:', document.querySelectorAll('.school-marker').length);
    console.log('🏫 ========== FIM useEffect ESCOLAS ==========');
  }, [memoizedSchoolsWithCoords, students]); // Removido activeRoute das dependências

  // Renderizar rota de navegação no mapa
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const routeLayerId = 'navigation-route';
    const routeSourceId = 'navigation-route-source';

    // Remover rota anterior se existir
    if (map.current.getLayer(routeLayerId)) {
      map.current.removeLayer(routeLayerId);
    }
    if (map.current.getLayer(`${routeLayerId}-border`)) {
      map.current.removeLayer(`${routeLayerId}-border`);
    }
    if (map.current.getSource(routeSourceId)) {
      map.current.removeSource(routeSourceId);
    }

    // Se não há rota de navegação, sair
    if (!navigationRoute) {
      console.log('⚠️ Nenhuma rota de navegação para renderizar');
      return;
    }

    console.log('🗺️ Renderizando rota de navegação no mapa');

    try {
      // Adicionar source com a geometria da rota
      map.current.addSource(routeSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: navigationRoute.geometry
        }
      });

      // Adicionar layer de borda (sombra) para a rota
      map.current.addLayer({
        id: `${routeLayerId}-border`,
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#000000', // Preto para borda
          'line-width': 12, // Mais largo que a linha principal
          'line-opacity': 0.3 // Semi-transparente para efeito de sombra
        }
      });

      // Adicionar layer principal da rota
      map.current.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#f97316', // Laranja (padrão do app)
          'line-width': 8, // Mais largo para melhor visibilidade
          'line-opacity': 0.95 // Quase opaco para melhor visibilidade
        }
      });

      console.log('✅ Rota de navegação renderizada:', {
        distance: mapboxDirectionsService.formatDistance(navigationRoute.distance),
        duration: mapboxDirectionsService.formatDuration(navigationRoute.duration)
      });
    } catch (error) {
      console.error('❌ Erro ao renderizar rota de navegação:', error);
    }

    return () => {
      // Cleanup ao desmontar
      if (map.current) {
        if (map.current.getLayer(routeLayerId)) {
          map.current.removeLayer(routeLayerId);
        }
        if (map.current.getLayer(`${routeLayerId}-border`)) {
          map.current.removeLayer(`${routeLayerId}-border`);
        }
        if (map.current.getSource(routeSourceId)) {
          map.current.removeSource(routeSourceId);
        }
      }
    };
  }, [navigationRoute, isMapLoaded]);



  // Função para voltar a seguir o motorista
  const followDriver = useCallback(() => {
    if (!map.current || !driverLocation) return;
    
    console.log('🎯 Voltando a seguir motorista');
    setIsFollowingDriver(true);
    userInteractedRef.current = false;
    
    // Centralizar no motorista imediatamente
    map.current.flyTo({
      center: [driverLocation.longitude, driverLocation.latitude],
      zoom: 16,
      pitch: 45,
      bearing: driverLocation.heading || 0,
      duration: 1500
    });
  }, [driverLocation]);

  // Função para recentralizar o mapa (ver todos os pontos)
  const recenterMap = useCallback(() => {
    if (!map.current) return;
    
    console.log('🎯 Mostrando todos os pontos');
    setIsFollowingDriver(false); // Parar de seguir motorista
    
    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;
    
    // Adicionar localização do motorista
    if (driverLocation) {
      bounds.extend([driverLocation.longitude, driverLocation.latitude]);
      hasPoints = true;
    }
    
    // Adicionar localizações dos estudantes
    studentsWithCoords.forEach(student => {
      if (student.latitude && student.longitude) {
        bounds.extend([student.longitude, student.latitude]);
        hasPoints = true;
      }
    });
    
    // Adicionar localizações das escolas
    schoolsWithCoords.forEach(school => {
      if (school.latitude && school.longitude) {
        bounds.extend([school.longitude, school.latitude]);
        hasPoints = true;
      }
    });
    
    if (hasPoints && !bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 120, bottom: 120, left: 120, right: 120 },
        maxZoom: 13,
        pitch: 0, // Visão plana
        duration: 1500
      });
      console.log('🎯 Mapa recentralizado para ver tudo');
    }
  }, [driverLocation, studentsWithCoords, schoolsWithCoords]);

  return (
    <div className="relative w-full h-full">
      {/* Container do mapa - SEMPRE renderizado */}
      <div 
        ref={mapContainer} 
        className="mapbox-map w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Controles do mapa */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <MapQualityIndicator quality={mapQuality} onQualityChange={onMapQualityChange} />
        {activeRoute && activeRoute.status === 'active' && <RealTimeIndicator />}
        
        {/* Botões de navegação */}
        {activeRoute && activeRoute.status === 'active' && driverLocation && (
          <>
            {/* Botão para seguir motorista (aparece quando NÃO está seguindo) */}
            {!isFollowingDriver && (
              <button
                onClick={followDriver}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg shadow-lg border border-blue-700 transition-all duration-200 flex items-center gap-2 text-sm"
                title="Seguir motorista"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Seguir Motorista
              </button>
            )}
            
            {/* Indicador de que está seguindo */}
            {isFollowingDriver && (
              <div className="bg-blue-600 text-white font-medium py-2 px-3 rounded-lg shadow-lg border border-blue-700 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Seguindo
              </div>
            )}
          </>
        )}
        
        {/* Botão para ver tudo */}
        <button
          onClick={recenterMap}
          className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-3 rounded-lg shadow-lg border border-gray-200 transition-all duration-200 flex items-center gap-2 text-sm"
          title="Mostrar todos os marcadores"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Ver Tudo
        </button>
      </div>



      {/* Overlay informativo quando NÃO há rota ativa */}
      {!activeRoute || activeRoute.status !== 'active' ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-gray-900/50 backdrop-blur-sm pointer-events-none z-20">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-md text-center border border-gray-200 pointer-events-auto">
            <div className="mb-3">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Aguardando próxima rota</h2>
            <p className="text-sm text-gray-600 mb-3">
              Não há rota ativa no momento. O mapa mostra as localizações cadastradas.
            </p>
            <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-2">
              <strong>Status:</strong> Aguardando definição de rota
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default GuardianMapboxMap;
export { GuardianMapboxMap };