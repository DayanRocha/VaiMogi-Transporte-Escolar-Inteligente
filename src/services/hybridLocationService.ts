export interface LocationSource {
  name: string;
  priority: number;
  getPosition(): Promise<VehiclePosition>;
}

class HybridLocationService {
  private sources: LocationSource[] = [];
  private fallbackTimeout = 15000;

  constructor() {
    this.initializeSources();
  }

  private initializeSources() {
    // GPS de alta precisão
    this.sources.push({
      name: 'GPS_HIGH_ACCURACY',
      priority: 1,
      getPosition: () => this.getGPSPosition(true)
    });

    // GPS padrão
    this.sources.push({
      name: 'GPS_STANDARD',
      priority: 2,
      getPosition: () => this.getGPSPosition(false)
    });

    // Network-based location
    this.sources.push({
      name: 'NETWORK',
      priority: 3,
      getPosition: () => this.getNetworkPosition()
    });

    // IP-based location (último recurso)
    this.sources.push({
      name: 'IP_GEOLOCATION',
      priority: 4,
      getPosition: () => this.getIPPosition()
    });
  }

  async getCurrentPosition(): Promise<VehiclePosition> {
    const promises = this.sources.map(async (source) => {
      try {
        const position = await Promise.race([
          source.getPosition(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), this.fallbackTimeout)
          )
        ]);
        return { position, source: source.name };
      } catch (error) {
        console.warn(`❌ Falha na fonte ${source.name}:`, error);
        throw error;
      }
    });

    // Retorna a primeira posição válida
    try {
      const result = await Promise.any(promises);
      console.log(`📍 Posição obtida via ${result.source}`);
      return result.position;
    } catch (error) {
      throw new Error('Todas as fontes de localização falharam');
    }
  }

  private async getGPSPosition(highAccuracy: boolean): Promise<VehiclePosition> {
    return new Promise((resolve, reject) => {
      const options = this.getPlatformOptimizedOptions(highAccuracy);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp
          });
        },
        reject,
        options
      );
    });
  }

  private getPlatformOptimizedOptions(highAccuracy: boolean): PositionOptions {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isAndroid) {
      return {
        enableHighAccuracy: highAccuracy,
        timeout: 20000,
        maximumAge: highAccuracy ? 5000 : 15000
      };
    }
    
    if (isIOS) {
      return {
        enableHighAccuracy: highAccuracy ? true : false,
        timeout: 15000,
        maximumAge: highAccuracy ? 3000 : 10000
      };
    }
    
    return {
      enableHighAccuracy: highAccuracy,
      timeout: 15000,
      maximumAge: 10000
    };
  }

  private async getNetworkPosition(): Promise<VehiclePosition> {
    // Implementar usando Network Information API se disponível
    throw new Error('Network positioning não implementado');
  }

  private async getIPPosition(): Promise<VehiclePosition> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: 10000, // Baixa precisão para IP
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error('IP geolocation falhou');
    }
  }
}

export const hybridLocationService = new HybridLocationService();