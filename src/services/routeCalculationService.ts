import { RouteLocation } from './routeTrackingService';
import { StudentAddress, SchoolAddress } from './realtimeDataService';

export interface RouteWaypoint {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  type: 'pickup' | 'dropoff' | 'school';
  studentId?: string;
}

export interface CalculatedRoute {
  waypoints: RouteWaypoint[];
  coordinates: Array<[number, number]>;
  distance: number; // em metros
  duration: number; // em segundos
  geometry: string;
  legs: Array<{
    distance: number;
    duration: number;
    steps: Array<{
      instruction: string;
      distance: number;
      duration: number;
    }>;
  }>;
}

export interface RouteOptimizationOptions {
  optimize?: boolean;
  roundtrip?: boolean;
  source?: 'first' | 'any';
  destination?: 'last' | 'any';
}

class RouteCalculationService {
  private static instance: RouteCalculationService;
  private cache: Map<string, CalculatedRoute> = new Map();
  private readonly maxCacheSize = 50;

  private constructor() {
    console.log('🗺️ RouteCalculationService inicializado (sem Mapbox)');
  }

  static getInstance(): RouteCalculationService {
    if (!RouteCalculationService.instance) {
      RouteCalculationService.instance = new RouteCalculationService();
    }
    return RouteCalculationService.instance;
  }

  /**
   * Calcula rota automática baseada na localização do motorista e destinos
   * Versão simplificada sem integração com Mapbox
   */
  async calculateAutoRoute(
    driverLocation: RouteLocation,
    studentAddresses: StudentAddress[],
    schoolAddress: SchoolAddress,
    direction: 'to_school' | 'to_home',
    options: RouteOptimizationOptions = {}
  ): Promise<CalculatedRoute | null> {
    console.log('🚀 Calculando rota automática (modo simplificado)...', {
      direction,
      studentsCount: studentAddresses.length,
      hasSchoolAddress: !!schoolAddress.coordinates,
      driverLocation: `${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(4)}`
    });

    try {
      // Preparar waypoints baseado na direção
      const waypoints = this.prepareWaypoints(
        driverLocation,
        studentAddresses,
        schoolAddress,
        direction
      );

      if (waypoints.length < 2) {
        console.warn('⚠️ Waypoints insuficientes para calcular rota');
        return null;
      }

      // Verificar cache
      const cacheKey = this.generateCacheKey(waypoints, options);
      const cachedRoute = this.cache.get(cacheKey);
      if (cachedRoute) {
        console.log('📋 Rota encontrada no cache');
        return cachedRoute;
      }

      // Calcular rota simplificada
      const route = this.calculateSimplifiedRoute(waypoints);
      
      if (route) {
        // Armazenar no cache
        this.addToCache(cacheKey, route);
        
        console.log('✅ Rota calculada com sucesso (modo simplificado):', {
          distance: `${(route.distance / 1000).toFixed(2)} km`,
          duration: `${Math.round(route.duration / 60)} min`,
          waypointsCount: route.waypoints.length
        });
      }

      return route;
    } catch (error) {
      console.error('❌ Erro ao calcular rota automática:', error);
      return null;
    }
  }

  /**
   * Prepara waypoints baseado na direção da rota
   */
  private prepareWaypoints(
    driverLocation: RouteLocation,
    studentAddresses: StudentAddress[],
    schoolAddress: SchoolAddress,
    direction: 'to_school' | 'to_home'
  ): RouteWaypoint[] {
    const waypoints: RouteWaypoint[] = [];

    // Adicionar localização atual do motorista como ponto de partida
    waypoints.push({
      id: 'driver-start',
      name: 'Localização do Motorista',
      address: 'Localização atual',
      coordinates: [driverLocation.lng, driverLocation.lat],
      type: 'pickup'
    });

    // Filtrar estudantes com coordenadas válidas
    const validStudents = studentAddresses.filter(student => 
      student.coordinates && 
      typeof student.coordinates.lat === 'number' && 
      typeof student.coordinates.lng === 'number'
    );

    if (direction === 'to_school') {
      // Rota para escola: motorista -> estudantes -> escola
      validStudents.forEach(student => {
        waypoints.push({
          id: `pickup-${student.studentId}`,
          name: student.studentName,
          address: student.address,
          coordinates: [student.coordinates!.lng, student.coordinates!.lat],
          type: 'pickup',
          studentId: student.studentId
        });
      });

      // Adicionar escola como destino final
      if (schoolAddress.coordinates) {
        waypoints.push({
          id: 'school-destination',
          name: schoolAddress.schoolName,
          address: schoolAddress.address,
          coordinates: [schoolAddress.coordinates.lng, schoolAddress.coordinates.lat],
          type: 'school'
        });
      }
    } else {
      // Rota para casa: escola -> estudantes (dropoff)
      if (schoolAddress.coordinates) {
        waypoints.push({
          id: 'school-start',
          name: schoolAddress.schoolName,
          address: schoolAddress.address,
          coordinates: [schoolAddress.coordinates.lng, schoolAddress.coordinates.lat],
          type: 'school'
        });
      }

      validStudents.forEach(student => {
        waypoints.push({
          id: `dropoff-${student.studentId}`,
          name: student.studentName,
          address: student.address,
          coordinates: [student.coordinates!.lng, student.coordinates!.lat],
          type: 'dropoff',
          studentId: student.studentId
        });
      });
    }

    console.log('📍 Waypoints preparados:', {
      total: waypoints.length,
      pickups: waypoints.filter(w => w.type === 'pickup').length,
      dropoffs: waypoints.filter(w => w.type === 'dropoff').length,
      schools: waypoints.filter(w => w.type === 'school').length
    });

    return waypoints;
  }

  /**
   * Calcula rota simplificada sem API externa
   */
  private calculateSimplifiedRoute(waypoints: RouteWaypoint[]): CalculatedRoute {
    let totalDistance = 0;
    let totalDuration = 0;
    const coordinates: Array<[number, number]> = [];
    const legs: Array<{
      distance: number;
      duration: number;
      steps: Array<{
        instruction: string;
        distance: number;
        duration: number;
      }>;
    }> = [];

    // Calcular distâncias entre waypoints consecutivos
    for (let i = 0; i < waypoints.length - 1; i++) {
      const current = waypoints[i];
      const next = waypoints[i + 1];
      
      const distance = this.calculateDistance(
        current.coordinates[1], // lat
        current.coordinates[0], // lng
        next.coordinates[1],    // lat
        next.coordinates[0]     // lng
      );
      
      // Estimar duração baseada na velocidade média urbana (30 km/h)
      const duration = (distance / 1000) * (60 / 30) * 60; // segundos
      
      totalDistance += distance;
      totalDuration += duration;
      
      // Adicionar coordenadas
      coordinates.push(current.coordinates);
      if (i === waypoints.length - 2) {
        coordinates.push(next.coordinates);
      }
      
      // Criar leg
      legs.push({
        distance,
        duration,
        steps: [{
          instruction: `Dirigir de ${current.name} para ${next.name}`,
          distance,
          duration
        }]
      });
    }

    return {
      waypoints,
      coordinates,
      distance: totalDistance,
      duration: totalDuration,
      geometry: JSON.stringify({ coordinates, type: 'LineString' }),
      legs
    };
  }

  /**
   * Recalcula rota baseado na nova localização do motorista
   */
  async recalculateRoute(
    currentRoute: CalculatedRoute,
    newDriverLocation: RouteLocation
  ): Promise<CalculatedRoute | null> {
    console.log('🔄 Recalculando rota com nova localização do motorista');
    
    try {
      // Obter waypoints restantes
      const remainingWaypoints = this.getRemainingWaypoints(currentRoute, newDriverLocation);
      
      if (remainingWaypoints.length < 2) {
        console.log('✅ Rota concluída - todos os waypoints visitados');
        return null;
      }
      
      // Atualizar primeiro waypoint com nova localização do motorista
      remainingWaypoints[0] = {
        ...remainingWaypoints[0],
        coordinates: [newDriverLocation.lng, newDriverLocation.lat]
      };
      
      // Calcular nova rota simplificada
      return this.calculateSimplifiedRoute(remainingWaypoints);
      
    } catch (error) {
      console.error('❌ Erro ao recalcular rota:', error);
      return null;
    }
  }

  /**
   * Obtém waypoints restantes baseado na posição atual
   */
  private getRemainingWaypoints(
    currentRoute: CalculatedRoute,
    driverLocation: RouteLocation
  ): RouteWaypoint[] {
    // Implementação simplificada - retorna todos os waypoints exceto o primeiro
    return currentRoute.waypoints.slice(1);
  }

  private generateCacheKey(
    waypoints: RouteWaypoint[],
    options: RouteOptimizationOptions
  ): string {
    const waypointIds = waypoints.map(wp => wp.id).join('-');
    const optionsStr = JSON.stringify(options);
    return `${waypointIds}_${optionsStr}`;
  }

  private addToCache(key: string, route: CalculatedRoute): void {
    if (this.cache.size >= this.maxCacheSize) {
      // Remover entrada mais antiga
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, route);
  }

  /**
   * Limpa o cache de rotas
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache de rotas limpo');
  }

  /**
   * Calcula distância entre duas coordenadas usando fórmula de Haversine
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Estima horário de chegada baseado na rota calculada
   */
  estimateArrivalTime(
    route: CalculatedRoute,
    currentTime: Date = new Date()
  ): Date {
    const arrivalTime = new Date(currentTime.getTime() + route.duration * 1000);
    return arrivalTime;
  }
}

export const routeCalculationService = RouteCalculationService.getInstance();

// Funções de conveniência
export const calculateAutoRoute = (
  driverLocation: RouteLocation,
  studentAddresses: StudentAddress[],
  schoolAddress: SchoolAddress,
  direction: 'to_school' | 'to_home',
  options?: RouteOptimizationOptions
) => {
  return routeCalculationService.calculateAutoRoute(
    driverLocation,
    studentAddresses,
    schoolAddress,
    direction,
    options
  );
};

export const recalculateRoute = (
  currentRoute: CalculatedRoute,
  newDriverLocation: RouteLocation
) => {
  return routeCalculationService.recalculateRoute(currentRoute, newDriverLocation);
};