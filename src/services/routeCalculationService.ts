import { MAPBOX_CONFIG } from '@/config/maps';
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
    console.log('🗺️ RouteCalculationService inicializado');
  }

  static getInstance(): RouteCalculationService {
    if (!RouteCalculationService.instance) {
      RouteCalculationService.instance = new RouteCalculationService();
    }
    return RouteCalculationService.instance;
  }

  /**
   * Calcula rota automática baseada na localização do motorista e destinos
   */
  async calculateAutoRoute(
    driverLocation: RouteLocation,
    studentAddresses: StudentAddress[],
    schoolAddress: SchoolAddress,
    direction: 'to_school' | 'to_home',
    options: RouteOptimizationOptions = {}
  ): Promise<CalculatedRoute | null> {
    console.log('🚀 Calculando rota automática...', {
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

      // Calcular nova rota
      const route = await this.calculateOptimizedRoute(waypoints, options);
      
      if (route) {
        // Armazenar no cache
        this.addToCache(cacheKey, route);
        
        console.log('✅ Rota calculada com sucesso:', {
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
   * Calcula rota otimizada usando Mapbox Directions API
   */
  private async calculateOptimizedRoute(
    waypoints: RouteWaypoint[],
    options: RouteOptimizationOptions
  ): Promise<CalculatedRoute | null> {
    if (waypoints.length < 2) {
      console.warn('⚠️ Mínimo de 2 waypoints necessários');
      return null;
    }

    // Verificar limite de waypoints do Mapbox (máximo 25)
    if (waypoints.length > 25) {
      console.warn('⚠️ Muitos waypoints. Limitando a 25 conforme API do Mapbox');
      waypoints = waypoints.slice(0, 25);
    }

    try {
      // Validar coordenadas rigorosamente antes de enviar para a API
      const validWaypoints = waypoints.filter(wp => {
        const [lng, lat] = wp.coordinates;
        
        // Validação mais rigorosa conforme documentação Mapbox
        const isValidLng = typeof lng === 'number' && 
                          !isNaN(lng) && 
                          isFinite(lng) && 
                          lng >= -180 && lng <= 180;
        
        const isValidLat = typeof lat === 'number' && 
                          !isNaN(lat) && 
                          isFinite(lat) && 
                          lat >= -90 && lat <= 90;
        
        const isValid = isValidLng && isValidLat;
        
        if (!isValid) {
          console.warn(`⚠️ Coordenada inválida encontrada para ${wp.name}:`, {
            lng, lat, 
            isValidLng, 
            isValidLat,
            reason: isNaN(lng) || isNaN(lat) ? 'Coordenada NaN detectada' : 'Coordenada fora dos limites'
          });
        }
        return isValid;
      });

      if (validWaypoints.length < 2) {
        console.error('❌ Não há waypoints válidos suficientes após validação');
        return null;
      }

      // Remover waypoints duplicados ou muito próximos (mínimo 50 metros para evitar problemas)
      const uniqueWaypoints = validWaypoints.filter((wp, index) => {
        for (let i = 0; i < index; i++) {
          const distance = this.calculateDistance(
            wp.coordinates[1], wp.coordinates[0],
            validWaypoints[i].coordinates[1], validWaypoints[i].coordinates[0]
          );
          if (distance < 0.05) { // menos de 50 metros
            console.warn(`⚠️ Waypoint muito próximo removido: ${wp.name} (${distance.toFixed(3)}km do anterior)`);
            return false;
          }
        }
        return true;
      });

      if (uniqueWaypoints.length < 2) {
        console.error('❌ Não há waypoints únicos suficientes após remoção de duplicatas');
        return null;
      }

      // Preparar coordenadas com precisão adequada (6 casas decimais)
      const coordinates = uniqueWaypoints
        .map(wp => {
          const lng = Number(wp.coordinates[0].toFixed(6));
          const lat = Number(wp.coordinates[1].toFixed(6));
          return `${lng},${lat}`;
        })
        .join(';');

      console.log('🗺️ Coordenadas enviadas para API:', coordinates);
      console.log('📊 Waypoints finais:', uniqueWaypoints.length);

      // Usar perfil de condução padrão (mapbox/driving)
      const profile = 'mapbox/driving';
      const baseUrl = `${MAPBOX_CONFIG.directionsApiUrl}/${coordinates}`;
      
      const params = new URLSearchParams({
        access_token: MAPBOX_CONFIG.accessToken,
        geometries: 'geojson',
        steps: 'true',
        overview: 'full'
      });

      // Adicionar parâmetros válidos conforme documentação Mapbox
      if (options.optimize && uniqueWaypoints.length > 2 && uniqueWaypoints.length <= 12) {
        // Otimização só funciona com 3-12 waypoints (excluindo origem e destino)
        params.append('optimize', 'true');
      }
      
      // Remover annotations que podem causar problemas
      // Manter apenas parâmetros essenciais para evitar erro 422

      const url = `${baseUrl}?${params.toString()}`;
      
      // Verificar se URL não excede limite (8100 bytes)
      if (url.length > 8100) {
        console.warn('⚠️ URL muito longa, usando método POST');
        return await this.calculateRouteWithPost(uniqueWaypoints, options);
      }
      
      console.log('🌐 Fazendo requisição para Mapbox Directions API...');
      console.log('🔗 URL:', url.substring(0, 200) + '...');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        let errorMessage = `Erro na API Mapbox: ${response.status} - ${response.statusText}`;
        let errorDetails = null;
        
        try {
          errorDetails = await response.json();
          console.error('❌ Resposta de erro da API:', errorDetails);
        } catch (e) {
          console.error('❌ Não foi possível ler detalhes do erro');
        }
        
        if (response.status === 422) {
          // Erro 422: InvalidInput - parâmetros inválidos
          const message = errorDetails?.message || 'Parâmetros de entrada inválidos';
          errorMessage = `Erro de validação (422): ${message}`;
          
          console.error('❌ Erro 422 - Dados enviados:', {
            coordinates,
            waypoints: uniqueWaypoints.length,
            url: url.substring(0, 300)
          });
        } else if (response.status === 401) {
          errorMessage = 'Token de acesso inválido ou não fornecido';
        } else if (response.status === 403) {
          errorMessage = 'Acesso negado - verifique as permissões da conta';
        } else if (response.status === 404) {
          errorMessage = 'Perfil de roteamento não encontrado';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        console.warn('⚠️ Nenhuma rota encontrada na resposta da API');
        return null;
      }

      const route = data.routes[0];
      const geometry = route.geometry;
      
      if (!geometry || !geometry.coordinates) {
        console.error('❌ Geometria da rota inválida');
        return null;
      }
      
      // Processar resposta da API
      const calculatedRoute: CalculatedRoute = {
        waypoints: uniqueWaypoints,
        coordinates: geometry.coordinates,
        distance: route.distance,
        duration: route.duration,
        geometry: JSON.stringify(geometry),
        legs: route.legs?.map((leg: any) => ({
          distance: leg.distance,
          duration: leg.duration,
          steps: leg.steps?.map((step: any) => ({
            instruction: step.maneuver?.instruction || 'Continue',
            distance: step.distance,
            duration: step.duration
          })) || []
        })) || []
      };

      console.log('✅ Rota processada com sucesso:', {
        totalDistance: `${(calculatedRoute.distance / 1000).toFixed(2)} km`,
        totalDuration: `${Math.round(calculatedRoute.duration / 60)} min`,
        coordinatesCount: calculatedRoute.coordinates.length,
        legsCount: calculatedRoute.legs.length
      });

      return calculatedRoute;
    } catch (error) {
      console.error('❌ Erro ao calcular rota otimizada:', error);
      throw error;
    }
  }

  /**
   * Calcula rota usando método POST para URLs muito longas
   */
  private async calculateRouteWithPost(
    waypoints: RouteWaypoint[],
    options: RouteOptimizationOptions
  ): Promise<CalculatedRoute | null> {
    try {
      const coordinates = waypoints.map(wp => [
        Number(wp.coordinates[0].toFixed(6)),
        Number(wp.coordinates[1].toFixed(6))
      ]);

      const requestBody: any = {
        coordinates,
        geometries: 'geojson',
        steps: true,
        overview: 'full'
      };

      // Adicionar otimização apenas se houver waypoints suficientes
      if (options.optimize && waypoints.length >= 3 && waypoints.length <= 12) {
        requestBody.optimize = true;
      }

      const profile = 'mapbox/driving';
      const url = `${MAPBOX_CONFIG.directionsApiUrl}?access_token=${MAPBOX_CONFIG.accessToken}`;

      console.log('🌐 Fazendo requisição POST para Mapbox Directions API...');
      console.log('📦 Payload:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMessage = `Erro na API Mapbox (POST): ${response.status} - ${response.statusText}`;
        let errorDetails = null;
        
        try {
          errorDetails = await response.json();
          console.error('❌ Resposta de erro da API (POST):', errorDetails);
        } catch (e) {
          console.error('❌ Não foi possível ler detalhes do erro (POST)');
        }
        
        if (response.status === 422) {
          const message = errorDetails?.message || 'Parâmetros de entrada inválidos';
          errorMessage = `Erro de validação POST (422): ${message}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        console.warn('⚠️ Nenhuma rota encontrada (POST)');
        return null;
      }

      const route = data.routes[0];
      const geometry = route.geometry;
      
      if (!geometry || !geometry.coordinates) {
        console.error('❌ Geometria da rota inválida (POST)');
        return null;
      }
      
      // Processar resposta da API
      const calculatedRoute: CalculatedRoute = {
        waypoints: waypoints,
        coordinates: geometry.coordinates,
        distance: route.distance,
        duration: route.duration,
        geometry: JSON.stringify(geometry),
        legs: route.legs?.map((leg: any) => ({
          distance: leg.distance,
          duration: leg.duration,
          steps: leg.steps?.map((step: any) => ({
            instruction: step.maneuver?.instruction || 'Continue',
            distance: step.distance,
            duration: step.duration
          })) || []
        })) || []
      };

      console.log('✅ Rota calculada com sucesso via POST:', {
        totalDistance: `${(calculatedRoute.distance / 1000).toFixed(2)} km`,
        totalDuration: `${Math.round(calculatedRoute.duration / 60)} min`,
        coordinatesCount: calculatedRoute.coordinates.length,
        legsCount: calculatedRoute.legs.length
      });

      return calculatedRoute;

    } catch (error) {
      console.error('❌ Erro ao calcular rota via POST:', error);
      throw error;
    }
  }

  /**
   * Recalcula rota baseada na nova posição do motorista
   */
  async recalculateRoute(
    currentRoute: CalculatedRoute,
    newDriverLocation: RouteLocation
  ): Promise<CalculatedRoute | null> {
    console.log('🔄 Recalculando rota com nova posição do motorista...');

    try {
      // Encontrar próximo waypoint não visitado
      const remainingWaypoints = this.getRemainingWaypoints(currentRoute, newDriverLocation);
      
      if (remainingWaypoints.length === 0) {
        console.log('✅ Todos os waypoints foram visitados');
        return null;
      }

      // Criar novo waypoint para posição atual
      const currentWaypoint: RouteWaypoint = {
        id: 'driver-current',
        name: 'Posição Atual',
        address: 'Localização atual do motorista',
        coordinates: [newDriverLocation.lng, newDriverLocation.lat],
        type: 'pickup'
      };

      // Calcular nova rota
      const newWaypoints = [currentWaypoint, ...remainingWaypoints];
      
      return await this.calculateOptimizedRoute(newWaypoints, { optimize: false });
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
    // Implementação simplificada - em produção seria mais sofisticada
    // Por enquanto, retorna todos os waypoints exceto o primeiro
    return currentRoute.waypoints.slice(1);
  }

  /**
   * Gera chave para cache
   */
  private generateCacheKey(
    waypoints: RouteWaypoint[],
    options: RouteOptimizationOptions
  ): string {
    const waypointIds = waypoints.map(wp => wp.id).join('-');
    const optionsStr = JSON.stringify(options);
    return `${waypointIds}-${optionsStr}`;
  }

  /**
   * Adiciona rota ao cache
   */
  private addToCache(key: string, route: CalculatedRoute): void {
    // Limpar cache se estiver muito grande
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, route);
  }

  /**
   * Limpa cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache de rotas limpo');
  }

  /**
   * Calcula distância entre dois pontos (Haversine)
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Estima tempo de chegada baseado na rota
   */
  estimateArrivalTime(
    route: CalculatedRoute,
    currentTime: Date = new Date()
  ): Date {
    const arrivalTime = new Date(currentTime.getTime() + (route.duration * 1000));
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