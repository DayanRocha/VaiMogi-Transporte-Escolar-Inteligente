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
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -46.6333, -23.5505 // São Paulo como centro padrão (lng, lat para Mapbox)
  ]);
  const [mapZoom, setMapZoom] = useState(15); // Zoom inicial mais alto para mais detalhes
  const [geocodedStudents, setGeocodedStudents] = useState<Student[]>(students);
  const [geocodedSchools, setGeocodedSchools] = useState<School[]>(schools);

  // Hook de geocodificação
  const { geocodeStudentAddress, geocodeSchoolAddress, isGeocoding } = useGeocoding();

  // Geocodificar endereços de estudantes que não possuem coordenadas
  useEffect(() => {
    const geocodeStudents = async () => {
      const updatedStudents = await Promise.all(
        students.map(async (student) => {
          // Se já tem coordenadas válidas, retorna o estudante como está
          if (student.latitude && student.longitude && 
              typeof student.latitude === 'number' &&
              typeof student.longitude === 'number' &&
              !isNaN(student.latitude) && 
              !isNaN(student.longitude) &&
              student.latitude !== 0 &&
              student.longitude !== 0) {
            return student;
          }

          // Se tem endereço mas não tem coordenadas, geocodifica
          if (student.address && student.address.trim().length > 0) {
            console.log('🔍 Geocodificando endereço do estudante:', student.name, student.address);
            const coordinates = await geocodeStudentAddress(student.id, student.address);
            if (coordinates) {
              console.log('✅ Coordenadas obtidas para estudante:', student.name, coordinates);
              return {
                ...student,
                latitude: coordinates[1], // lat
                longitude: coordinates[0] // lng
              };
            }
          }

          return student;
        })
      );
      setGeocodedStudents(updatedStudents);
    };

    geocodeStudents();
  }, [students, geocodeStudentAddress]);

  // Geocodificar endereços de escolas que não possuem coordenadas
  useEffect(() => {
    const geocodeSchools = async () => {
      const updatedSchools = await Promise.all(
        schools.map(async (school) => {
          // Se já tem coordenadas válidas, retorna a escola como está
          if (school.latitude && school.longitude && 
              typeof school.latitude === 'number' &&
              typeof school.longitude === 'number' &&
              !isNaN(school.latitude) && 
              !isNaN(school.longitude) &&
              school.latitude !== 0 &&
              school.longitude !== 0) {
            return school;
          }

          // Se tem endereço mas não tem coordenadas, geocodifica
          if (school.address && school.address.trim().length > 0) {
            console.log('🔍 Geocodificando endereço da escola:', school.name, school.address);
            const coordinates = await geocodeSchoolAddress(school.id, school.address);
            if (coordinates) {
              console.log('✅ Coordenadas obtidas para escola:', school.name, coordinates);
              return {
                ...school,
                latitude: coordinates[1], // lat
                longitude: coordinates[0] // lng
              };
            }
          }

          return school;
        })
      );
      setGeocodedSchools(updatedSchools);
    };

    geocodeSchools();
  }, [schools, geocodeSchoolAddress]);

  // Filtrar estudantes e escolas com coordenadas válidas (usando dados geocodificados)
  const studentsWithCoords = useMemo(() => (
    geocodedStudents.filter(student => 
      student.latitude && 
      student.longitude && 
      typeof student.latitude === 'number' &&
      typeof student.longitude === 'number' &&
      !isNaN(student.latitude) && 
      !isNaN(student.longitude) &&
      student.latitude !== 0 &&
      student.longitude !== 0
    )
  ), [geocodedStudents]);

  const schoolsWithCoords = useMemo(() => (
    geocodedSchools.filter(school => 
      school.latitude && 
      school.longitude &&
      typeof school.latitude === 'number' &&
      typeof school.longitude === 'number' &&
      !isNaN(school.latitude) && 
      !isNaN(school.longitude) &&
      school.latitude !== 0 &&
      school.longitude !== 0
    )
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