// Configuração do token do Mapbox
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZGF5YW5hcmF1am8iLCJhIjoiY2x6cGNhZGNzMGNhZzJqcGNqZGNqZGNqZCJ9.example';

export interface RouteWaypoint {
  coordinates: [number, number]; // [longitude, latitude]
  name?: string;
  type: 'student' | 'school' | 'driver';
}

export interface OptimizedRoute {
  geometry: {
    coordinates: [number, number][];
    type: 'LineString';
  };
  legs: RouteLeg[];
  distance: number; // meters
  duration: number; // seconds
  weight_name: string;
  weight: number;
}

export interface RouteLeg {
  distance: number;
  duration: number;
  steps: RouteStep[];
  summary: string;
}

export interface RouteStep {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: 'LineString';
  };
  name: string;
  mode: string;
  maneuver: {
    bearing_after: number;
    bearing_before: number;
    location: [number, number];
    modifier?: string;
    type: string;
    instruction: string;
  };
}

export interface DirectionsResponse {
  routes: OptimizedRoute[];
  waypoints: {
    hint: string;
    distance: number;
    name: string;
    location: [number, number];
  }[];
  code: string;
  uuid?: string;
}

export interface TrafficAwareRouteOptions {
  profile?: 'driving' | 'driving-traffic' | 'walking' | 'cycling';
  alternatives?: boolean;
  steps?: boolean;
  continue_straight?: boolean;
  waypoint_snapping?: string[];
  annotations?: string[];
  language?: string;
  overview?: 'full' | 'simplified' | 'false';
  geometries?: 'geojson' | 'polyline' | 'polyline6';
}

class MapboxDirectionsService {
  private baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';
  private accessToken = MAPBOX_TOKEN;

  /**
   * Calcula rota otimizada entre múltiplos pontos com consideração de tráfego
   */
  async calculateOptimizedRoute(
    waypoints: RouteWaypoint[],
    options: TrafficAwareRouteOptions = {}
  ): Promise<OptimizedRoute | null> {
    try {
      if (waypoints.length < 2) {
        throw new Error('Pelo menos 2 pontos são necessários para calcular uma rota');
      }

      const defaultOptions: TrafficAwareRouteOptions = {
        profile: 'driving-traffic', // Usa dados de tráfego em tempo real
        alternatives: true,
        steps: true,
        continue_straight: false,
        annotations: ['duration', 'distance', 'speed'],
        language: 'pt-BR',
        overview: 'full',
        geometries: 'geojson'
      };

      const finalOptions = { ...defaultOptions, ...options };
      
      // Formata coordenadas para a API
      const coordinates = waypoints
        .map(wp => `${wp.coordinates[0]},${wp.coordinates[1]}`)
        .join(';');

      // Constrói URL da API
      const url = this.buildDirectionsUrl(coordinates, finalOptions);
      
      console.log('🗺️ Calculando rota otimizada:', {
        waypoints: waypoints.length,
        profile: finalOptions.profile,
        url
      });

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro na API Directions: ${response.status} ${response.statusText}`);
      }

      const data: DirectionsResponse = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        console.warn('⚠️ Nenhuma rota encontrada:', data);
        return null;
      }

      // Retorna a melhor rota (primeira no array)
      const bestRoute = data.routes[0];
      
      console.log('✅ Rota calculada com sucesso:', {
        distance: `${(bestRoute.distance / 1000).toFixed(2)} km`,
        duration: `${Math.round(bestRoute.duration / 60)} min`,
        legs: bestRoute.legs.length
      });

      return bestRoute;
    } catch (error) {
      console.error('❌ Erro ao calcular rota:', error);
      return null;
    }
  }

  /**
   * Calcula múltiplas rotas alternativas
   */
  async calculateAlternativeRoutes(
    waypoints: RouteWaypoint[],
    options: TrafficAwareRouteOptions = {}
  ): Promise<OptimizedRoute[]> {
    try {
      const routeOptions = {
        ...options,
        alternatives: true
      };

      const coordinates = waypoints
        .map(wp => `${wp.coordinates[0]},${wp.coordinates[1]}`)
        .join(';');

      const url = this.buildDirectionsUrl(coordinates, routeOptions);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro na API Directions: ${response.status}`);
      }

      const data: DirectionsResponse = await response.json();
      
      if (data.code !== 'Ok' || !data.routes) {
        return [];
      }

      return data.routes;
    } catch (error) {
      console.error('❌ Erro ao calcular rotas alternativas:', error);
      return [];
    }
  }

  /**
   * Calcula rota otimizada para coleta de estudantes
   */
  async calculateSchoolRouteOptimized(
    driverLocation: [number, number],
    studentLocations: RouteWaypoint[],
    schoolLocation: [number, number]
  ): Promise<OptimizedRoute | null> {
    try {
      // Monta waypoints: motorista -> estudantes -> escola
      const waypoints: RouteWaypoint[] = [
        {
          coordinates: driverLocation,
          name: 'Motorista',
          type: 'driver'
        },
        ...studentLocations,
        {
          coordinates: schoolLocation,
          name: 'Escola',
          type: 'school'
        }
      ];

      return await this.calculateOptimizedRoute(waypoints, {
        profile: 'driving-traffic',
        alternatives: false,
        steps: true
      });
    } catch (error) {
      console.error('❌ Erro ao calcular rota escolar:', error);
      return null;
    }
  }

  /**
   * Recalcula rota em tempo real baseado na posição atual
   */
  async recalculateRoute(
    currentPosition: [number, number],
    remainingWaypoints: RouteWaypoint[]
  ): Promise<OptimizedRoute | null> {
    try {
      const waypoints: RouteWaypoint[] = [
        {
          coordinates: currentPosition,
          name: 'Posição Atual',
          type: 'driver'
        },
        ...remainingWaypoints
      ];

      return await this.calculateOptimizedRoute(waypoints, {
        profile: 'driving-traffic', // Sempre usa tráfego para recálculo
        alternatives: false,
        steps: true
      });
    } catch (error) {
      console.error('❌ Erro ao recalcular rota:', error);
      return null;
    }
  }

  /**
   * Constrói URL da API Directions
   */
  private buildDirectionsUrl(
    coordinates: string,
    options: TrafficAwareRouteOptions
  ): string {
    const params = new URLSearchParams({
      access_token: this.accessToken,
      alternatives: options.alternatives ? 'true' : 'false',
      steps: options.steps ? 'true' : 'false',
      continue_straight: options.continue_straight ? 'true' : 'false',
      overview: options.overview || 'full',
      geometries: options.geometries || 'geojson'
    });

    if (options.annotations && options.annotations.length > 0) {
      params.append('annotations', options.annotations.join(','));
    }

    if (options.language) {
      params.append('language', options.language);
    }

    if (options.waypoint_snapping && options.waypoint_snapping.length > 0) {
      params.append('waypoint_snapping', options.waypoint_snapping.join(';'));
    }

    const profile = options.profile || 'driving-traffic';
    return `${this.baseUrl}/${profile}/${coordinates}?${params.toString()}`;
  }

  /**
   * Converte duração em segundos para formato legível
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  /**
   * Converte distância em metros para formato legível
   */
  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }
}

export { MapboxDirectionsService };
export const mapboxDirectionsService = new MapboxDirectionsService();
export default mapboxDirectionsService;