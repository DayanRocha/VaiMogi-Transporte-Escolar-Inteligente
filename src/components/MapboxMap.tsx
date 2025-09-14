import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation } from 'lucide-react';

// Configurar o token de acesso do Mapbox
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface MapboxMapProps {
  driverLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  studentPickups?: Array<{
    studentId: string;
    studentName: string;
    address: string;
    lat?: number;
    lng?: number;
    status: string;
  }>;
  className?: string;
}

export const MapboxMap: React.FC<MapboxMapProps> = React.memo(({
  driverLocation,
  studentPickups = [],
  className = "w-full h-96"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const studentMarkers = useRef<mapboxgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const lastDriverLocationRef = useRef<string | null>(null);
  const lastStudentPickupsRef = useRef<string | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar o mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-46.6333, -23.5505], // São Paulo como centro padrão
        zoom: 12,
        attributionControl: false
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.AttributionControl({
        compact: true
      }), 'bottom-right');

      map.current.on('load', () => {
        setIsMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Erro no Mapbox:', e);
      });

    } catch (error) {
      console.error('Erro ao inicializar o Mapbox:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Função para atualizar localização do motorista com debounce
  const updateDriverLocation = useCallback((location: typeof driverLocation) => {
    if (!map.current || !isMapLoaded || !location) return;

    try {
      // Verificar se a localização mudou significativamente
      const locationKey = `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`;
      if (lastDriverLocationRef.current === locationKey) {
        return; // Não atualizar se a localização não mudou
      }
      lastDriverLocationRef.current = locationKey;

      // Remover marcador anterior do motorista
      if (driverMarker.current) {
        driverMarker.current.remove();
      }

      // Criar elemento customizado para o marcador do motorista
      const driverElement = document.createElement('div');
      driverElement.className = 'driver-marker';
      driverElement.innerHTML = `
        <div class="bg-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
          </svg>
        </div>
      `;

      // Adicionar novo marcador do motorista
      driverMarker.current = new mapboxgl.Marker(driverElement)
        .setLngLat([location.lng, location.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-sm mb-1">🚐 Localização da Van</h3>
                <p class="text-xs text-gray-600">Última atualização:</p>
                <p class="text-xs">${new Date(location.timestamp).toLocaleTimeString('pt-BR')}</p>
              </div>
            `)
        )
        .addTo(map.current);

      // Centralizar o mapa na localização do motorista com animação suave
      map.current.easeTo({
        center: [location.lng, location.lat],
        zoom: 14,
        duration: 2000 // Animação mais suave
      });

    } catch (error) {
      console.error('Erro ao atualizar localização do motorista:', error);
    }
  }, [isMapLoaded]);

  // Atualizar localização do motorista com debounce
  useEffect(() => {
    if (!driverLocation) return;

    // Limpar timeout anterior
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce de 1 segundo para evitar atualizações excessivas
    updateTimeoutRef.current = setTimeout(() => {
      updateDriverLocation(driverLocation);
    }, 1000);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [driverLocation, updateDriverLocation]);

  // Função para atualizar marcadores dos estudantes
  const updateStudentMarkers = useCallback((students: typeof studentPickups) => {
    if (!map.current || !isMapLoaded) return;

    try {
      // Verificar se os dados dos estudantes mudaram
      const studentsKey = JSON.stringify(students.map(s => ({ id: s.studentId, status: s.status, lat: s.lat, lng: s.lng })));
      if (lastStudentPickupsRef.current === studentsKey) {
        return; // Não atualizar se os dados não mudaram
      }
      lastStudentPickupsRef.current = studentsKey;

      // Remover marcadores anteriores dos estudantes
      studentMarkers.current.forEach(marker => marker.remove());
      studentMarkers.current = [];

      // Adicionar novos marcadores dos estudantes
      students.forEach((student, index) => {
        if (student.lat && student.lng) {
          const studentElement = document.createElement('div');
          studentElement.className = 'student-marker';
          
          const statusColor = student.status === 'picked_up' ? 'bg-green-600' : 
                            student.status === 'dropped_off' ? 'bg-gray-400' : 'bg-yellow-600';
          
          studentElement.innerHTML = `
            <div class="${statusColor} text-white p-2 rounded-full shadow-lg border-2 border-white text-xs font-bold">
              ${index + 1}
            </div>
          `;

          const marker = new mapboxgl.Marker(studentElement)
            .setLngLat([student.lng, student.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div class="p-2">
                    <h3 class="font-semibold text-sm mb-1">👨‍🎓 ${student.studentName}</h3>
                    <p class="text-xs text-gray-600 mb-1">${student.address}</p>
                    <p class="text-xs">
                      <span class="inline-block w-2 h-2 rounded-full mr-1 ${statusColor.replace('bg-', 'bg-')}"></span>
                      ${student.status === 'picked_up' ? 'Embarcado' : 
                        student.status === 'dropped_off' ? 'Desembarcado' : 'Aguardando'}
                    </p>
                  </div>
                `)
            )
            .addTo(map.current!);

          studentMarkers.current.push(marker);
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar marcadores dos estudantes:', error);
    }
  }, [isMapLoaded]);

  // Atualizar marcadores dos estudantes
  useEffect(() => {
    updateStudentMarkers(studentPickups);
  }, [studentPickups, updateStudentMarkers]);

  // Ajustar zoom para mostrar todos os pontos (executado separadamente)
  useEffect(() => {
    if (!map.current || !isMapLoaded || !driverLocation || studentPickups.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    
    // Adicionar localização do motorista
    bounds.extend([driverLocation.lng, driverLocation.lat]);
    
    // Adicionar localizações dos estudantes
    studentPickups.forEach(student => {
      if (student.lat && student.lng) {
        bounds.extend([student.lng, student.lat]);
      }
    });

    // Ajustar bounds com debounce
    const timeoutId = setTimeout(() => {
      if (map.current) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
          duration: 1500 // Animação suave
        });
      }
    }, 2000); // Aguardar 2 segundos antes de ajustar

    return () => clearTimeout(timeoutId);
  }, [driverLocation, studentPickups, isMapLoaded]);

  if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg`}>
        <div className="text-center text-gray-600">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Token do Mapbox não configurado</p>
          <p className="text-xs">Verifique a variável VITE_MAPBOX_ACCESS_TOKEN</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg shadow-md"
        style={{ minHeight: '300px' }}
      />
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center text-gray-600">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Carregando mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxMap;