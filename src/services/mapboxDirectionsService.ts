/**
 * Serviço para buscar rotas usando a API de Directions do Mapbox
 */

interface DirectionsWaypoint {
  longitude: number;
  latitude: number;
  name?: string;
}

interface DirectionsRoute {
  geometry: {
    coordinates: [number, number][];
    type: 'LineString';
  };
  duration: number; // em segundos
  distance: number; // em metros
  legs: Array<{
    duration: number;
    distance: number;
    steps: Array<{
      maneuver: {
        instruction: string;
        type: string;
        location: [number, number];
      };
      distance: number;
      duration: number;
    }>;
  }>;
}

interface DirectionsResponse {
  routes: DirectionsRoute[];
  waypoints: Array<{
    name: string;
    location: [number, number];
  }>;
  code: string;
}

class MapboxDirectionsService {
  private accessToken: string;
  private baseUrl = 'https://api.mapbox.com/directions/v5';

  constructor() {
    this.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
    if (!this.accessToken) {
      console.error('❌ Token do Mapbox não configurado');
    }
  }

  /**
   * Busca rota entre múltiplos pontos
   */
  async getRoute(
    waypoints: DirectionsWaypoint[],
    profile: 'driving-traffic' | 'driving' | 'walking' | 'cycling' = 'driving-traffic'
  ): Promise<DirectionsRoute | null> {
    try {
      if (waypoints.length < 2) {
        console.error('❌ É necessário pelo menos 2 pontos para calcular rota');
        return null;
      }

      if (waypoints.length > 25) {
        console.error('❌ Máximo de 25 pontos permitidos');
        return null;
      }

      // Formatar coordenadas: longitude,latitude;longitude,latitude
      const coordinates = waypoints
        .map(wp => `${wp.longitude},${wp.latitude}`)
        .join(';');

      const url = `${this.baseUrl}/mapbox/${profile}/${coordinates}`;
      
      const params = new URLSearchParams({
        access_token: this.accessToken,
        geometries: 'geojson',
        overview: 'full',
        steps: 'true',
        alternatives: 'false',
        continue_straight: 'false'
      });

      console.log('🗺️ Buscando rota do Mapbox:', {
        profile,
        waypoints: waypoints.length,
        url: `${url}?${params}`
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        console.error('❌ Erro na API de Directions:', response.status, response.statusText);
        return null;
      }

      const data: DirectionsResponse = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        console.error('❌ Nenhuma rota encontrada:', data);
        return null;
      }

      const route = data.routes[0];
      
      console.log('✅ Rota obtida com sucesso:', {
        distance: `${(route.distance / 1000).toFixed(2)} km`,
        duration: `${Math.round(route.duration / 60)} min`,
        waypoints: data.waypoints.length,
        coordinates: route.geometry.coordinates.length
      });

      return route;
    } catch (error) {
      console.error('❌ Erro ao buscar rota:', error);
      return null;
    }
  }

  /**
   * Formata duração em texto legível
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
   * Formata distância em texto legível
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

export const mapboxDirectionsService = new MapboxDirectionsService();
