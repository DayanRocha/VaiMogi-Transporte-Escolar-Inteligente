import { RouteLocation } from './routeTrackingService';
import { realtimeDataService } from './realtimeDataService';

export interface VehiclePosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface TrackingOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  updateInterval: number;
  minDistanceThreshold: number; // metros
  maxSpeedThreshold: number; // km/h
}

export interface TrackingStats {
  totalUpdates: number;
  lastUpdate: Date | null;
  averageAccuracy: number;
  distanceTraveled: number;
  currentSpeed: number;
  maxSpeed: number;
}

type PositionUpdateCallback = (position: VehiclePosition) => void;
type TrackingErrorCallback = (error: GeolocationPositionError) => void;
type TrackingStatsCallback = (stats: TrackingStats) => void;

/**
 * Serviço para rastreamento contínuo da posição do veículo
 * Gerencia geolocalização, filtragem de dados e notificações em tempo real
 */
class VehicleTrackingService {
  private watchId: number | null = null;
  private isTracking = false;
  private updateInterval: NodeJS.Timeout | null = null;
  
  private positionCallbacks: PositionUpdateCallback[] = [];
  private errorCallbacks: TrackingErrorCallback[] = [];
  private statsCallbacks: TrackingStatsCallback[] = [];
  
  private lastPosition: VehiclePosition | null = null;
  private positionHistory: VehiclePosition[] = [];
  private trackingStats: TrackingStats = {
    totalUpdates: 0,
    lastUpdate: null,
    averageAccuracy: 0,
    distanceTraveled: 0,
    currentSpeed: 0,
    maxSpeed: 0
  };
  
  private readonly defaultOptions: TrackingOptions = {
    enableHighAccuracy: true,
    timeout: 10000, // 10 segundos
    maximumAge: 5000, // 5 segundos
    updateInterval: 3000, // 3 segundos
    minDistanceThreshold: 5, // 5 metros
    maxSpeedThreshold: 120 // 120 km/h
  };
  
  private currentOptions: TrackingOptions = { ...this.defaultOptions };

  /**
   * Inicia o rastreamento contínuo da posição
   */
  public startTracking(options?: Partial<TrackingOptions>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isTracking) {
        console.log('🚗 Rastreamento já está ativo');
        resolve();
        return;
      }

      // Verificar suporte à geolocalização
      if (!navigator.geolocation) {
        const error = new Error('Geolocalização não é suportada neste dispositivo');
        console.error('❌ Erro de geolocalização:', error);
        reject(error);
        return;
      }

      // Aplicar opções personalizadas
      this.currentOptions = { ...this.defaultOptions, ...options };
      
      console.log('🚗 Iniciando rastreamento do veículo...', this.currentOptions);

      // Configurar opções de geolocalização
      const geoOptions: PositionOptions = {
        enableHighAccuracy: this.currentOptions.enableHighAccuracy,
        timeout: this.currentOptions.timeout,
        maximumAge: this.currentOptions.maximumAge
      };

      // Obter posição inicial
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Posição inicial obtida');
          this.handlePositionUpdate(position);
          this.startContinuousTracking(geoOptions);
          this.isTracking = true;
          resolve();
        },
        (error) => {
          console.error('❌ Erro ao obter posição inicial:', error);
          this.handlePositionError(error);
          reject(error);
        },
        geoOptions
      );
    });
  }

  /**
   * Para o rastreamento contínuo
   */
  public stopTracking(): void {
    console.log('🛑 Parando rastreamento do veículo...');
    
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.isTracking = false;
    console.log('✅ Rastreamento parado');
  }

  /**
   * Inicia o rastreamento contínuo usando watchPosition
   */
  private startContinuousTracking(geoOptions: PositionOptions): void {
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      geoOptions
    );

    // Configurar intervalo de atualização forçada
    this.updateInterval = setInterval(() => {
      if (this.lastPosition) {
        this.notifyPositionUpdate(this.lastPosition);
      }
    }, this.currentOptions.updateInterval);
  }

  /**
   * Processa atualizações de posição
   */
  private handlePositionUpdate(position: GeolocationPosition): void {
    const vehiclePosition: VehiclePosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: position.timestamp
    };

    // Validar posição
    if (!this.isValidPosition(vehiclePosition)) {
      console.warn('⚠️ Posição inválida ignorada:', vehiclePosition);
      return;
    }

    // Filtrar por distância mínima
    if (this.lastPosition && !this.shouldUpdatePosition(vehiclePosition)) {
      return;
    }

    // Atualizar estatísticas
    this.updateTrackingStats(vehiclePosition);
    
    // Armazenar posição
    this.lastPosition = vehiclePosition;
    this.positionHistory.push(vehiclePosition);
    
    // Limitar histórico (manter últimas 100 posições)
    if (this.positionHistory.length > 100) {
      this.positionHistory = this.positionHistory.slice(-100);
    }

    console.log('📍 Nova posição do veículo:', {
      lat: vehiclePosition.latitude.toFixed(6),
      lng: vehiclePosition.longitude.toFixed(6),
      accuracy: `${vehiclePosition.accuracy.toFixed(1)}m`,
      speed: vehiclePosition.speed ? `${(vehiclePosition.speed * 3.6).toFixed(1)} km/h` : 'N/A'
    });

    // Notificar callbacks e serviços
    this.notifyPositionUpdate(vehiclePosition);
    this.updateRealtimeService(vehiclePosition);
  }

  /**
   * Processa erros de geolocalização
   */
  private handlePositionError(error: GeolocationPositionError): void {
    console.error('❌ Erro de geolocalização:', {
      code: error.code,
      message: error.message
    });

    // Notificar callbacks de erro
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Erro no callback de erro:', err);
      }
    });
  }

  /**
   * Valida se a posição é válida
   */
  private isValidPosition(position: VehiclePosition): boolean {
    // Verificar coordenadas válidas
    if (isNaN(position.latitude) || isNaN(position.longitude)) {
      return false;
    }
    
    // Verificar limites geográficos
    if (position.latitude < -90 || position.latitude > 90 ||
        position.longitude < -180 || position.longitude > 180) {
      return false;
    }
    
    // Verificar precisão mínima (100m)
    if (position.accuracy > 100) {
      return false;
    }
    
    // Verificar velocidade máxima
    if (position.speed && (position.speed * 3.6) > this.currentOptions.maxSpeedThreshold) {
      return false;
    }
    
    return true;
  }

  /**
   * Determina se deve atualizar a posição baseado na distância
   */
  private shouldUpdatePosition(newPosition: VehiclePosition): boolean {
    if (!this.lastPosition) return true;
    
    const distance = this.calculateDistance(
      this.lastPosition.latitude,
      this.lastPosition.longitude,
      newPosition.latitude,
      newPosition.longitude
    );
    
    return distance >= this.currentOptions.minDistanceThreshold;
  }

  /**
   * Calcula distância entre duas coordenadas (fórmula de Haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Atualiza estatísticas de rastreamento
   */
  private updateTrackingStats(position: VehiclePosition): void {
    this.trackingStats.totalUpdates++;
    this.trackingStats.lastUpdate = new Date(position.timestamp);
    
    // Calcular precisão média
    const totalAccuracy = this.positionHistory.reduce((sum, pos) => sum + pos.accuracy, 0) + position.accuracy;
    this.trackingStats.averageAccuracy = totalAccuracy / (this.positionHistory.length + 1);
    
    // Calcular distância percorrida
    if (this.lastPosition) {
      const distance = this.calculateDistance(
        this.lastPosition.latitude,
        this.lastPosition.longitude,
        position.latitude,
        position.longitude
      );
      this.trackingStats.distanceTraveled += distance;
    }
    
    // Atualizar velocidade
    if (position.speed !== undefined) {
      this.trackingStats.currentSpeed = position.speed * 3.6; // Converter para km/h
      this.trackingStats.maxSpeed = Math.max(this.trackingStats.maxSpeed, this.trackingStats.currentSpeed);
    }
    
    // Notificar callbacks de estatísticas
    this.notifyStatsUpdate();
  }

  /**
   * Notifica callbacks sobre nova posição
   */
  private notifyPositionUpdate(position: VehiclePosition): void {
    this.positionCallbacks.forEach(callback => {
      try {
        callback(position);
      } catch (error) {
        console.error('Erro no callback de posição:', error);
      }
    });
  }

  /**
   * Notifica callbacks sobre estatísticas
   */
  private notifyStatsUpdate(): void {
    this.statsCallbacks.forEach(callback => {
      try {
        callback({ ...this.trackingStats });
      } catch (error) {
        console.error('Erro no callback de estatísticas:', error);
      }
    });
  }

  /**
   * Atualiza o serviço de dados em tempo real
   */
  private updateRealtimeService(position: VehiclePosition): void {
    try {
      const routeLocation: RouteLocation = {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        timestamp: new Date(position.timestamp).toISOString(),
        speed: position.speed,
        heading: position.heading
      };
      
      realtimeDataService.updateDriverLocation(routeLocation);
    } catch (error) {
      console.error('Erro ao atualizar serviço de dados em tempo real:', error);
    }
  }

  // Métodos públicos para gerenciar callbacks
  public onPositionUpdate(callback: PositionUpdateCallback): () => void {
    this.positionCallbacks.push(callback);
    return () => {
      const index = this.positionCallbacks.indexOf(callback);
      if (index > -1) {
        this.positionCallbacks.splice(index, 1);
      }
    };
  }

  public onTrackingError(callback: TrackingErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  public onStatsUpdate(callback: TrackingStatsCallback): () => void {
    this.statsCallbacks.push(callback);
    return () => {
      const index = this.statsCallbacks.indexOf(callback);
      if (index > -1) {
        this.statsCallbacks.splice(index, 1);
      }
    };
  }

  // Getters públicos
  public get isActive(): boolean {
    return this.isTracking;
  }

  public get currentPosition(): VehiclePosition | null {
    return this.lastPosition;
  }

  public get stats(): TrackingStats {
    return { ...this.trackingStats };
  }

  public get history(): VehiclePosition[] {
    return [...this.positionHistory];
  }

  /**
   * Força uma atualização de posição
   */
  public forceUpdate(): Promise<VehiclePosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não disponível'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.handlePositionUpdate(position);
          if (this.lastPosition) {
            resolve(this.lastPosition);
          } else {
            reject(new Error('Falha ao obter posição'));
          }
        },
        (error) => {
          this.handlePositionError(error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Limpa histórico e estatísticas
   */
  public clearHistory(): void {
    this.positionHistory = [];
    this.trackingStats = {
      totalUpdates: 0,
      lastUpdate: null,
      averageAccuracy: 0,
      distanceTraveled: 0,
      currentSpeed: 0,
      maxSpeed: 0
    };
    console.log('🧹 Histórico de rastreamento limpo');
  }
}

// Instância singleton
export const vehicleTrackingService = new VehicleTrackingService();
export default vehicleTrackingService;