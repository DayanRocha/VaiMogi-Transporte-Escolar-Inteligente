import { useState, useEffect, useCallback } from 'react';
import { LatLngExpression } from 'leaflet';
import { Student, School } from '@/types/driver';

interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface UseLeafletMapProps {
  driverLocation?: DriverLocation;
  students: Student[];
  schools: School[];
}

export const useLeafletMap = ({ driverLocation, students, schools }: UseLeafletMapProps) => {
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([
    -23.5505, -46.6333 // São Paulo como centro padrão
  ]);
  const [mapZoom, setMapZoom] = useState(15); // Zoom inicial mais alto para mais detalhes

  // Filtrar estudantes e escolas com coordenadas válidas
  const studentsWithCoords = students.filter(student => 
    student.latitude && 
    student.longitude && 
    typeof student.latitude === 'number' &&
    typeof student.longitude === 'number' &&
    !isNaN(student.latitude) && 
    !isNaN(student.longitude) &&
    student.latitude !== 0 &&
    student.longitude !== 0
  );

  const schoolsWithCoords = schools.filter(school => 
    school.latitude && 
    school.longitude &&
    typeof school.latitude === 'number' &&
    typeof school.longitude === 'number' &&
    !isNaN(school.latitude) && 
    !isNaN(school.longitude) &&
    school.latitude !== 0 &&
    school.longitude !== 0
  );

  // Atualizar centro do mapa quando a localização do motorista estiver disponível
  useEffect(() => {
    if (driverLocation && 
        typeof driverLocation.latitude === 'number' &&
        typeof driverLocation.longitude === 'number' &&
        !isNaN(driverLocation.latitude) && 
        !isNaN(driverLocation.longitude) &&
        driverLocation.latitude !== 0 &&
        driverLocation.longitude !== 0) {
      setMapCenter([driverLocation.latitude, driverLocation.longitude]);
      setMapZoom(18); // Zoom muito alto quando temos localização do motorista
    } else if (studentsWithCoords.length > 0) {
      // Se não temos localização do motorista, centralizar no primeiro estudante
      const firstStudent = studentsWithCoords[0];
      if (firstStudent.latitude && firstStudent.longitude) {
        setMapCenter([firstStudent.latitude, firstStudent.longitude]);
        setMapZoom(16); // Zoom alto para estudantes
      }
    } else if (schoolsWithCoords.length > 0) {
      // Se não temos estudantes, centralizar na primeira escola
      const firstSchool = schoolsWithCoords[0];
      if (firstSchool.latitude && firstSchool.longitude) {
        setMapCenter([firstSchool.latitude, firstSchool.longitude]);
        setMapZoom(16); // Zoom alto para escolas
      }
    }
  }, [driverLocation, studentsWithCoords, schoolsWithCoords]);

  // Criar coordenadas da rota
  const routeCoordinates: LatLngExpression[] = [];
  if (driverLocation && 
      typeof driverLocation.latitude === 'number' &&
      typeof driverLocation.longitude === 'number' &&
      !isNaN(driverLocation.latitude) && 
      !isNaN(driverLocation.longitude) &&
      driverLocation.latitude !== 0 &&
      driverLocation.longitude !== 0) {
    routeCoordinates.push([driverLocation.latitude, driverLocation.longitude]);
    
    // Adicionar coordenadas dos estudantes
    studentsWithCoords.forEach(student => {
      if (student.latitude && student.longitude) {
        routeCoordinates.push([student.latitude, student.longitude]);
      }
    });
    
    // Adicionar coordenadas das escolas
    schoolsWithCoords.forEach(school => {
      if (school.latitude && school.longitude) {
        routeCoordinates.push([school.latitude, school.longitude]);
      }
    });
  }

  // Função para calcular bounds do mapa baseado em todos os pontos
  const calculateMapBounds = useCallback(() => {
    const allPoints: LatLngExpression[] = [];
    
    if (driverLocation && 
        typeof driverLocation.latitude === 'number' &&
        typeof driverLocation.longitude === 'number' &&
        !isNaN(driverLocation.latitude) && 
        !isNaN(driverLocation.longitude) &&
        driverLocation.latitude !== 0 &&
        driverLocation.longitude !== 0) {
      allPoints.push([driverLocation.latitude, driverLocation.longitude]);
    }
    
    studentsWithCoords.forEach(student => {
      if (student.latitude && student.longitude) {
        allPoints.push([student.latitude, student.longitude]);
      }
    });
    
    schoolsWithCoords.forEach(school => {
      if (school.latitude && school.longitude) {
        allPoints.push([school.latitude, school.longitude]);
      }
    });
    
    return allPoints;
  }, [driverLocation, studentsWithCoords, schoolsWithCoords]);

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

  return {
    mapCenter,
    mapZoom,
    studentsWithCoords,
    schoolsWithCoords,
    routeCoordinates,
    calculateMapBounds,
    formatTime,
    calculateDistance,
    setMapCenter,
    setMapZoom
  };
};