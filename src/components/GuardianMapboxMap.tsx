import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Student, School } from '@/types/driver';
// Removido indicador de qualidade para evitar sobreposições no mapa
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

function GuardianMapboxMap({
  driverLocation,
  activeRoute,
  students,
  schools,
  mapQuality,
  onMapQualityChange
}: GuardianMapboxMapProps) {
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
    createPointFeature
  } = useMapboxMap({
    driverLocation,
    students,
    schools
  });

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

  // Inicialização do mapa quando houver rota ativa
  useEffect(() => {

    // Inicializa o mapa apenas quando houver rota ativa
    if (!activeRoute || activeRoute.status !== 'active') return;
    if (!mapContainer.current || map.current) return;

    // Não seguir motorista por padrão; apenas centralizar uma vez ao abrir

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

    // Centralizar inicialmente no motorista, se houver localização disponível
    if (driverLocation) {
      const initialPosition: [number, number] = [driverLocation.longitude, driverLocation.latitude];
      map.current.flyTo({
        center: initialPosition,
        zoom: 15,
        duration: 0
      });
      lastDriverLngLatRef.current = initialPosition; // inicializar referência

      // Criar marcador do motorista na abertura se houver localização e nenhum marcador
      if (!driverMarker.current) {
        const el = document.createElement('div');
        el.className = 'driver-marker-static';
        el.style.cssText = `
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 16px rgba(107, 114, 128, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: white;
          font-weight: bold;
          transition: all 0.3s ease;
        `;
        el.innerHTML = '🚌';

        // Estilo hover para o marcador do motorista
        if (!document.getElementById('driver-marker-static-styles')) {
          const style = document.createElement('style');
          style.id = 'driver-marker-static-styles';
          style.textContent = `
            .driver-marker-static:hover {
              transform: scale(1.1);
              box-shadow: 0 6px 20px rgba(107, 114, 128, 0.6);
            }
          `;
          document.head.appendChild(style);
        }

        const popup = new mapboxgl.Popup({
          offset: 30,
          className: 'driver-popup-static',
          closeButton: true,
          closeOnClick: false
        }).setHTML(`
          <div style="padding: 8px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">🚌 Motorista</div>
            <div style="font-size: 12px; color: #374151;">Localização atual exibida ao abrir o mapa.</div>
          </div>
        `);

        driverMarker.current = new mapboxgl.Marker(el)
          .setLngLat(initialPosition)
          .setPopup(popup)
          .addTo(map.current);

        // Abrir popup para destacar a localização do motorista ao abrir
        driverMarker.current.togglePopup();
      }
    }

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

    // Detectar interações do usuário (arrasto/zoom/rotação) com debounce
    const onInteractStart = () => { 
      isUserInteractingRef.current = true; 
      console.log('🖱️ Usuário iniciou interação - rastreamento pausado');
    };
    
    const onInteractEnd = () => { 
      isUserInteractingRef.current = false; 
      lastInteractionAtRef.current = Date.now(); 
      console.log('🖱️ Usuário finalizou interação - navegação livre ativa');
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
  }, [activeRoute, getMapStyle, mapCenter, mapZoom]);

  // Atualizar estilo do mapa quando a qualidade mudar
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      // Aguardar o mapa estar completamente carregado antes de mudar o estilo
      const currentStyle = map.current.getStyle();
      const newStyle = getMapStyle(mapQuality);
      
      // Só atualizar se o estilo realmente mudou
      if (currentStyle.name !== newStyle) {
        map.current.setStyle(newStyle);
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
                📍 Localização Estática
              </div>
            </div>
          </div>
        `;
        popup.setHTML(popupHTML);
      }
      return;
    }

    // Remover marcador existente apenas se a posição mudou
    if (driverMarker.current) {
      driverMarker.current.remove();
      driverMarker.current = null;
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

    // Criar marcador estático apenas quando necessário
    const el = document.createElement('div');
    el.className = 'driver-marker-static';
    el.style.cssText = `
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 16px rgba(107, 114, 128, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: white;
      font-weight: bold;
      transition: all 0.3s ease;
    `;
    el.innerHTML = '🚌';

    // Adicionar estilo hover apenas uma vez
    if (!document.getElementById('driver-marker-static-styles')) {
      const style = document.createElement('style');
      style.id = 'driver-marker-static-styles';
      style.textContent = `
        .driver-marker-static:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(107, 114, 128, 0.6);
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

  // Marcadores dos estudantes - estáveis (atualiza/recicla em vez de recriar tudo)
  useEffect(() => {
    if (!map.current) return;

    const currentIds = new Set<string>();
    const existingMarkers = new Map<string, mapboxgl.Marker>();
    
    // Mapear marcadores existentes por ID do estudante
    studentMarkers.current.forEach((marker, index) => {
      const student = memoizedStudentsWithCoords[index];
      if (student) {
        existingMarkers.set(student.id, marker);
      }
    });

    // Limpar array de marcadores para reconstruir
    studentMarkers.current = [];

    memoizedStudentsWithCoords.forEach(student => {
      if (!student.latitude || !student.longitude) return;
      currentIds.add(student.id);

      const position: [number, number] = [student.longitude, student.latitude];
      const positionKey = `${position[0].toFixed(6)},${position[1].toFixed(6)}`;
      
      // Verificar se já existe um marcador para este estudante
      const existingMarker = existingMarkers.get(student.id);
      
      if (existingMarker) {
        // Verificar se a posição mudou
        const currentPos = existingMarker.getLngLat();
        const currentPosKey = `${currentPos.lng.toFixed(6)},${currentPos.lat.toFixed(6)}`;
        
        if (currentPosKey === positionKey) {
          // Posição não mudou, reutilizar marcador existente
          studentMarkers.current.push(existingMarker);
          existingMarkers.delete(student.id);
          return;
        } else {
          // Posição mudou, atualizar posição do marcador existente
          existingMarker.setLngLat(position);
          
          // Atualizar popup se necessário
          const popup = existingMarker.getPopup();
          if (popup) {
            popup.setHTML(`
              <div style="padding: 8px;">
                <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">👨‍🎓 ${student.name}</div>
                <div style="font-size: 12px; color: #374151;">
                  <div><strong>Endereço:</strong> ${student.address}</div>
                  <div><strong>Escola:</strong> ${student.school}</div>
                  <div><strong>Período:</strong> ${student.period}</div>
                  <div style="margin-top: 4px; padding: 2px 6px; background: #10b981; color: white; border-radius: 4px; font-size: 10px; display: inline-block;">
                    📍 Ponto de Coleta
                  </div>
                </div>
              </div>
            `);
          }
          
          studentMarkers.current.push(existingMarker);
          existingMarkers.delete(student.id);
          return;
        }
      }

      // Criar novo marcador apenas se não existir
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
      `;
      el.innerHTML = '👨‍🎓';

      // Adicionar estilo hover apenas uma vez
      if (!document.getElementById('student-marker-styles')) {
        const style = document.createElement('style');
        style.id = 'student-marker-styles';
        style.textContent = `
          .student-marker:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6);
          }
        `;
        document.head.appendChild(style);
      }

      const popup = new mapboxgl.Popup({ 
        offset: 25, 
        className: 'student-popup',
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div style="padding: 8px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">👨‍🎓 ${student.name}</div>
          <div style="font-size: 12px; color: #374151;">
            <div><strong>Endereço:</strong> ${student.address}</div>
            <div><strong>Escola:</strong> ${student.school}</div>
            <div><strong>Período:</strong> ${student.period}</div>
            <div style="margin-top: 4px; padding: 2px 6px; background: #10b981; color: white; border-radius: 4px; font-size: 10px; display: inline-block;">
              📍 Ponto de Coleta
            </div>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(position)
        .setPopup(popup)
        .addTo(map.current!);

      studentMarkers.current.push(marker);
    });

    // Remover marcadores que não são mais necessários
    existingMarkers.forEach(marker => {
      marker.remove();
    });

    console.log(`👨‍🎓 Marcadores de estudantes otimizados: ${studentMarkers.current.length} ativos`);
  }, [memoizedStudentsWithCoords]);

  // Marcadores das escolas - estáveis (atualiza/recicla em vez de recriar tudo)
  useEffect(() => {
    if (!map.current) return;

    const currentIds = new Set<string>();

    memoizedSchoolsWithCoords.forEach(school => {
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
  }, [memoizedSchoolsWithCoords]);

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
          
          {/* Controles do mapa */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            {/* Indicador de qualidade do mapa */}
            <MapQualityIndicator quality={mapQuality} />
            
            {/* Indicador de tempo real */}
            <RealTimeIndicator 
              isActive={updatesEnabled} 
              onToggle={() => setUpdatesEnabled(!updatesEnabled)}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default GuardianMapboxMap;
export { GuardianMapboxMap };