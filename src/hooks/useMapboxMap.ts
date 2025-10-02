import { useState, useEffect, useCallback, useMemo } from 'react';
import { Student, School } from '@/types/driver';
import { useGeocoding } from '@/hooks/useGeocoding';

interface Position {
  latitude: number;
  longitude: number;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface UseMapboxMapProps {
  driverLocation?: DriverLocation;
  students: Student[];
  schools: School[];
}

export const useMapboxMap = ({ driverLocation, students, schools }: UseMapboxMapProps) => {
  console.log('🗺️ useMapboxMap: Recebendo dados:', {
    students: students.length,
    schools: schools.length,
    driverLocation: !!driverLocation
  });
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -46.6333, -23.5505 // São Paulo como centro padrão (lng, lat para Mapbox)
  ]);
  const [mapZoom, setMapZoom] = useState(15); // Zoom inicial mais alto para mais detalhes
  const [geocodedStudents, setGeocodedStudents] = useState<Student[]>(students);
  const [geocodedSchools, setGeocodedSchools] = useState<School[]>(schools);
  
  // Cache de endereços já geocodificados (baseado no endereço, não em lat/lng)
  const geocodedAddressCache = useMemo(() => new Map<string, { lat: number; lng: number }>(), []);

  // Hook de geocodificação
  const { geocodeStudentAddress, geocodeSchoolAddress } = useGeocoding();

  // Geocodificar endereços de estudantes baseado no endereço cadastrado
  useEffect(() => {
    const geocodeStudents = async () => {
      let hasChanges = false;
      const updatedStudents = await Promise.all(
        students.map(async (student) => {
          if (!student.address || student.address.trim().length === 0) {
            console.warn('⚠️ Estudante sem endereço:', student.name);
            return student;
          }

          const addressKey = student.address.trim().toLowerCase();
          
          // Verificar se já temos coordenadas válidas para este endereço específico
          const hasValidCoordsForAddress = student.latitude && student.longitude &&
            typeof student.latitude === 'number' &&
            typeof student.longitude === 'number' &&
            !isNaN(student.latitude) && 
            !isNaN(student.longitude) &&
            student.latitude >= -25 && student.latitude <= -20 &&
            student.longitude >= -54 && student.longitude <= -44;

          if (hasValidCoordsForAddress) {
            console.log('✅ Estudante já tem coordenadas válidas para o endereço:', student.name, { lat: student.latitude, lng: student.longitude });
            // Adicionar ao cache
            geocodedAddressCache.set(addressKey, { lat: student.latitude, lng: student.longitude });
            return student;
          }

          // Verificar cache de endereços
          const cachedCoords = geocodedAddressCache.get(addressKey);
          if (cachedCoords) {
            console.log('✅ Usando coordenadas do cache para estudante:', student.name);
            hasChanges = true;
            return {
              ...student,
              latitude: cachedCoords.lat,
              longitude: cachedCoords.lng
            };
          }

          // Geocodificar o endereço
          console.log('🔍 Geocodificando endereço do estudante:', student.name, student.address);
          
          const coordinates = await geocodeStudentAddress(student.id, student.address);
          if (coordinates) {
            const lat = coordinates[1];
            const lng = coordinates[0];
            
            // Validar coordenadas obtidas (região mais ampla para SP)
            if (lat >= -25 && lat <= -20 && lng >= -54 && lng <= -44) {
              console.log('✅ Coordenadas VÁLIDAS obtidas para estudante:', student.name, { lat, lng, endereço: student.address });
              
              // Adicionar ao cache
              geocodedAddressCache.set(addressKey, { lat, lng });
              
              hasChanges = true;
              return {
                ...student,
                latitude: lat,
                longitude: lng
              };
            } else {
              console.error('❌ Coordenadas INVÁLIDAS obtidas (fora da região SP):', student.name, { lat, lng, endereço: student.address });
              console.error('💡 Verifique se o endereço está correto:', student.address);
            }
          } else {
            console.warn('⚠️ Não foi possível geocodificar estudante:', student.name, student.address);
          }

          return student;
        })
      );
      
      setGeocodedStudents(updatedStudents);
      
      // Salvar coordenadas geocodificadas no localStorage
      if (hasChanges) {
        try {
          localStorage.setItem('students', JSON.stringify(updatedStudents));
          console.log('💾 Coordenadas dos estudantes salvas no localStorage');
        } catch (error) {
          console.error('❌ Erro ao salvar coordenadas dos estudantes:', error);
        }
      }
    };

    geocodeStudents();
  }, [students, geocodeStudentAddress, geocodedAddressCache]);

  // Geocodificar endereços de escolas baseado no endereço cadastrado
  useEffect(() => {
    const geocodeSchools = async () => {
      let hasChanges = false;
      const updatedSchools = await Promise.all(
        schools.map(async (school) => {
          if (!school.address || school.address.trim().length === 0) {
            console.warn('⚠️ Escola sem endereço:', school.name);
            return school;
          }

          const addressKey = school.address.trim().toLowerCase();
          
          // Verificar se já temos coordenadas válidas para este endereço específico
          const hasValidCoordsForAddress = school.latitude && school.longitude &&
            typeof school.latitude === 'number' &&
            typeof school.longitude === 'number' &&
            !isNaN(school.latitude) && 
            !isNaN(school.longitude) &&
            school.latitude >= -25 && school.latitude <= -20 &&
            school.longitude >= -50 && school.longitude <= -44;

          if (hasValidCoordsForAddress) {
            console.log('✅ Escola já tem coordenadas válidas para o endereço:', school.name, { lat: school.latitude, lng: school.longitude });
            // Adicionar ao cache
            geocodedAddressCache.set(addressKey, { lat: school.latitude, lng: school.longitude });
            return school;
          }

          // Verificar cache de endereços
          const cachedCoords = geocodedAddressCache.get(addressKey);
          if (cachedCoords) {
            console.log('✅ Usando coordenadas do cache para escola:', school.name);
            hasChanges = true;
            return {
              ...school,
              latitude: cachedCoords.lat,
              longitude: cachedCoords.lng
            };
          }

          // Geocodificar o endereço
          console.log('🔍 Geocodificando endereço da escola:', school.name, school.address);
          
          const coordinates = await geocodeSchoolAddress(school.id, school.address);
          if (coordinates) {
            const lat = coordinates[1];
            const lng = coordinates[0];
            
            // Validar coordenadas obtidas
            if (lat >= -25 && lat <= -20 && lng >= -50 && lng <= -44) {
              console.log('✅ Coordenadas VÁLIDAS obtidas para escola:', school.name, { lat, lng, endereço: school.address });
              
              // Adicionar ao cache
              geocodedAddressCache.set(addressKey, { lat, lng });
              
              hasChanges = true;
              return {
                ...school,
                latitude: lat,
                longitude: lng
              };
            } else {
              console.error('❌ Coordenadas INVÁLIDAS obtidas (fora da região SP):', school.name, { lat, lng, endereço: school.address });
              console.error('💡 Verifique se o endereço está correto:', school.address);
            }
          } else {
            console.warn('⚠️ Não foi possível geocodificar escola:', school.name, school.address);
          }

          return school;
        })
      );
      
      setGeocodedSchools(updatedSchools);
      
      // Salvar coordenadas geocodificadas no localStorage
      if (hasChanges) {
        try {
          localStorage.setItem('schools', JSON.stringify(updatedSchools));
          console.log('💾 Coordenadas das escolas salvas no localStorage');
        } catch (error) {
          console.error('❌ Erro ao salvar coordenadas das escolas:', error);
        }
      }
    };

    geocodeSchools();
  }, [schools, geocodeSchoolAddress, geocodedAddressCache]);

  // Filtrar estudantes e escolas com coordenadas válidas (usando dados geocodificados)
  const studentsWithCoords = useMemo(() => (
    geocodedStudents?.filter(student => 
      student.latitude && 
      student.longitude && 
      typeof student.latitude === 'number' &&
      typeof student.longitude === 'number' &&
      !isNaN(student.latitude) && 
      !isNaN(student.longitude) &&
      student.latitude !== 0 &&
      student.longitude !== 0 &&
      // Validar região (São Paulo e arredores)
      student.latitude >= -25 && student.latitude <= -20 &&
      student.longitude >= -54 && student.longitude <= -44
    ) || []
  ), [geocodedStudents]);

  const schoolsWithCoords = useMemo(() => (
    geocodedSchools?.filter(school => 
      school.latitude && 
      school.longitude &&
      typeof school.latitude === 'number' &&
      typeof school.longitude === 'number' &&
      !isNaN(school.latitude) && 
      !isNaN(school.longitude) &&
      school.latitude !== 0 &&
      school.longitude !== 0 &&
      // Validar região (São Paulo e arredores)
      school.latitude >= -25 && school.latitude <= -20 &&
      school.longitude >= -50 && school.longitude <= -44
    ) || []
  ), [geocodedSchools]);

  // Sempre atualizar centro do mapa para seguir o motorista em tempo real
  useEffect(() => {
    let nextCenter: [number, number] | null = null;
    let nextZoom: number | null = null;

    if (driverLocation && 
        typeof driverLocation.latitude === 'number' &&
        typeof driverLocation.longitude === 'number' &&
        !isNaN(driverLocation.latitude) && 
        !isNaN(driverLocation.longitude) &&
        driverLocation.latitude !== 0 &&
        driverLocation.longitude !== 0) {
      // Sempre seguir o motorista com zoom alto
      nextCenter = [driverLocation.longitude, driverLocation.latitude]; // lng, lat para Mapbox
      nextZoom = 18; // Zoom muito alto para acompanhar o motorista
    } else if (studentsWithCoords.length > 0) {
      // Se não temos localização do motorista, centralizar no primeiro estudante
      const firstStudent = studentsWithCoords[0];
      if (firstStudent.latitude && firstStudent.longitude) {
        nextCenter = [firstStudent.longitude, firstStudent.latitude]; // lng, lat para Mapbox
        nextZoom = 16; // Zoom alto para estudantes
      }
    } else if (schoolsWithCoords.length > 0) {
      // Se não temos estudantes, centralizar na primeira escola
      const firstSchool = schoolsWithCoords[0];
      if (firstSchool.latitude && firstSchool.longitude) {
        nextCenter = [firstSchool.longitude, firstSchool.latitude]; // lng, lat para Mapbox
        nextZoom = 16; // Zoom alto para escolas
      }
    }

    // Aplicar somente se houver alteração real para evitar loops de atualização
    if (nextCenter) {
      const centerChanged = (mapCenter[0] !== nextCenter[0]) || (mapCenter[1] !== nextCenter[1]);
      const zoomChanged = (nextZoom !== null) && (mapZoom !== nextZoom);

      if (centerChanged) {
        setMapCenter(nextCenter);
      }
      if (zoomChanged) {
        setMapZoom(nextZoom!);
      }
    }
  }, [driverLocation, studentsWithCoords, schoolsWithCoords, mapCenter, mapZoom]);

  // Criar coordenadas da rota (formato GeoJSON para Mapbox)
  const routeCoordinates: [number, number][] = [];
  if (driverLocation && 
      typeof driverLocation.latitude === 'number' &&
      typeof driverLocation.longitude === 'number' &&
      !isNaN(driverLocation.latitude) && 
      !isNaN(driverLocation.longitude) &&
      driverLocation.latitude !== 0 &&
      driverLocation.longitude !== 0) {
    routeCoordinates.push([driverLocation.longitude, driverLocation.latitude]); // lng, lat para Mapbox
    
    // Adicionar coordenadas dos estudantes
    studentsWithCoords.forEach(student => {
      if (student.latitude && student.longitude) {
        routeCoordinates.push([student.longitude, student.latitude]); // lng, lat para Mapbox
      }
    });
    
    // Adicionar coordenadas das escolas
    schoolsWithCoords.forEach(school => {
      if (school.latitude && school.longitude) {
        routeCoordinates.push([school.longitude, school.latitude]); // lng, lat para Mapbox
      }
    });
  }

  // Função para calcular bounds do mapa baseado em todos os pontos
  const calculateMapBounds = useCallback(() => {
    const allPoints: [number, number][] = [];
    
    if (driverLocation && 
        typeof driverLocation.latitude === 'number' &&
        typeof driverLocation.longitude === 'number' &&
        !isNaN(driverLocation.latitude) && 
        !isNaN(driverLocation.longitude) &&
        driverLocation.latitude !== 0 &&
        driverLocation.longitude !== 0) {
      allPoints.push([driverLocation.longitude, driverLocation.latitude]); // lng, lat para Mapbox
    }
    
    studentsWithCoords.forEach(student => {
      if (student.latitude && student.longitude) {
        allPoints.push([student.longitude, student.latitude]); // lng, lat para Mapbox
      }
    });
    
    schoolsWithCoords.forEach(school => {
      if (school.latitude && school.longitude) {
        allPoints.push([school.longitude, school.latitude]); // lng, lat para Mapbox
      }
    });
    
    return allPoints;
  }, [driverLocation, studentsWithCoords, schoolsWithCoords]);

  // Função para calcular LngLatBounds do Mapbox
  const calculateMapboxBounds = useCallback(() => {
    const allPoints = calculateMapBounds();
    
    if (allPoints.length === 0) {
      return null;
    }
    
    if (allPoints.length === 1) {
      // Se há apenas um ponto, retornar bounds com padding
      const [lng, lat] = allPoints[0];
      const padding = 0.01; // ~1km de padding
      return [
        [lng - padding, lat - padding], // southwest
        [lng + padding, lat + padding]  // northeast
      ] as [[number, number], [number, number]];
    }
    
    // Calcular bounds para múltiplos pontos
    let minLng = allPoints[0][0];
    let maxLng = allPoints[0][0];
    let minLat = allPoints[0][1];
    let maxLat = allPoints[0][1];
    
    allPoints.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });
    
    return [
      [minLng, minLat], // southwest
      [maxLng, maxLat]  // northeast
    ] as [[number, number], [number, number]];
  }, [calculateMapBounds]);

  // Função para formatar tempo
  const formatTime = useCallback((timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Horário inválido';
    }
  }, []);

  // Função para calcular distância aproximada entre dois pontos
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em km
  }, []);

  // Função para converter coordenadas para formato GeoJSON
  const createGeoJSONFeature = useCallback((coordinates: [number, number][], properties: any = {}) => {
    return {
      type: 'Feature' as const,
      properties,
      geometry: {
        type: 'LineString' as const,
        coordinates
      }
    };
  }, []);

  // Função para criar marcadores GeoJSON
  const createPointFeature = useCallback((lng: number, lat: number, properties: any = {}) => {
    return {
      type: 'Feature' as const,
      properties,
      geometry: {
        type: 'Point' as const,
        coordinates: [lng, lat]
      }
    };
  }, []);

  return {
    mapCenter,
    mapZoom,
    studentsWithCoords,
    schoolsWithCoords,
    routeCoordinates,
    calculateMapBounds,
    calculateMapboxBounds,
    formatTime,
    calculateDistance,
    createGeoJSONFeature,
    createPointFeature,
    setMapCenter,
    setMapZoom
  };
};