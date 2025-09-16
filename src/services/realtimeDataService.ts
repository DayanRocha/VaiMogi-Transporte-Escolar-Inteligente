import { routeTrackingService, ActiveRoute, RouteLocation } from './routeTrackingService';
import { routeCalculationService, CalculatedRoute } from './routeCalculationService';
import { vehicleTrackingService, VehiclePosition } from './vehicleTrackingService';

export interface StudentAddress {
  studentId: string;
  studentName: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface SchoolAddress {
  schoolId: string;
  schoolName: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface RealtimeRouteData {
  driverLocation: RouteLocation & { error?: string };
  studentAddresses: StudentAddress[];
  schoolAddress: SchoolAddress;
  routeCoordinates: Array<[number, number]>;
  calculatedRoute?: CalculatedRoute;
  estimatedArrival?: string;
  totalDistance?: number;
  totalDuration?: number;
  isRouteCalculated: boolean;
}

class RealtimeDataService {
  private static instance: RealtimeDataService;
  private locationWatchId: number | null = null;
  private dataUpdateInterval: NodeJS.Timeout | null = null;
  private listeners: ((data: RealtimeRouteData) => void)[] = [];
  private lastKnownData: RealtimeRouteData | null = null;
  private currentCalculatedRoute: CalculatedRoute | null = null;

  private constructor() {
    // Construtor privado para implementar Singleton
  }

  /**
   * Geocodifica um endereço usando coordenadas simuladas
   * Versão simplificada sem integração com Mapbox
   */
  private async geocodeAddress(address: string): Promise<[number, number] | null> {
    try {
      // Validar se o endereço não está vazio
      if (!address || address.trim().length === 0) {
        console.warn('⚠️ Endereço vazio fornecido para geocodificação');
        return null;
      }

      console.log('🔍 Simulando geocodificação para endereço:', address);
      
      // Simular coordenadas baseadas no hash do endereço
      // Coordenadas aproximadas da região de Mogi das Cruzes, SP
      const baseLatitude = -23.5225; // Mogi das Cruzes latitude base
      const baseLongitude = -46.1883; // Mogi das Cruzes longitude base
      
      // Gerar variação baseada no endereço para simular diferentes localizações
      const addressHash = this.simpleHash(address.trim().toLowerCase());
      const latVariation = (addressHash % 200 - 100) / 10000; // Variação de ±0.01 graus
      const lngVariation = (addressHash % 300 - 150) / 10000; // Variação de ±0.015 graus
      
      const simulatedLat = baseLatitude + latVariation;
      const simulatedLng = baseLongitude + lngVariation;
      
      console.log('✅ Coordenadas simuladas geradas:', { 
        address, 
        lng: simulatedLng, 
        lat: simulatedLat 
      });
      
      return [simulatedLng, simulatedLat];
      
    } catch (error) {
      console.error('❌ Erro ao simular geocodificação:', { address, error });
      return null;
    }
  }

  /**
   * Função auxiliar para gerar hash simples de uma string
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para 32bit integer
    }
    return Math.abs(hash);
  }

  static getInstance(): RealtimeDataService {
    if (!RealtimeDataService.instance) {
      RealtimeDataService.instance = new RealtimeDataService();
    }
    return RealtimeDataService.instance;
  }

  /**
   * Inicia a captura automática de dados em tempo real
   */
  async startDataCapture(): Promise<void> {
    console.log('🚀 Iniciando captura automática de dados...');
    
    const activeRoute = routeTrackingService.getActiveRoute();
    if (!activeRoute) {
      console.warn('⚠️ Nenhuma rota ativa encontrada para captura de dados');
      return;
    }

    try {
      // Capturar dados iniciais
      await this.captureInitialData(activeRoute);
      
      // Iniciar rastreamento de veículo (substitui rastreamento de localização simples)
      await this.startVehicleTracking();
      
      // Iniciar atualizações periódicas
      this.startPeriodicUpdates();
      
      console.log('✅ Captura de dados iniciada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao iniciar captura de dados:', error);
      throw error;
    }
  }

  /**
   * Para a captura de dados
   */
  stopDataCapture(): void {
    console.log('🛑 Parando captura de dados...');
    
    // Parar rastreamento de veículo
    if (vehicleTrackingService.isActive) {
      vehicleTrackingService.stopTracking();
    }
    
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
    
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
      this.dataUpdateInterval = null;
    }
    
    console.log('✅ Captura de dados parada');
  }

  /**
   * Captura dados iniciais da rota ativa
   */
  private async captureInitialData(activeRoute: ActiveRoute): Promise<void> {
    console.log('📍 Capturando dados iniciais da rota...');
    
    try {
      // Capturar endereços dos estudantes
      const studentAddresses = await this.captureStudentAddresses(activeRoute.studentPickups);
      
      // Capturar endereço da escola (simulado - em produção viria do banco)
      const schoolAddress = await this.captureSchoolAddress();
      
      // Obter localização atual do motorista
      const driverLocation = await this.getCurrentDriverLocation();
      
      if (driverLocation) {
        const initialData: RealtimeRouteData = {
          driverLocation,
          studentAddresses,
          schoolAddress,
          routeCoordinates: [],
          isRouteCalculated: false
        };
        
        // Calcular rota automática
        await this.calculateInitialRoute(initialData, activeRoute);
        
        this.lastKnownData = initialData;
        this.notifyListeners(initialData);
        
        console.log('✅ Dados iniciais capturados:', {
          studentsCount: studentAddresses.length,
          hasDriverLocation: !!driverLocation,
          hasSchoolAddress: !!schoolAddress
        });
      }
    } catch (error) {
      console.error('❌ Erro ao capturar dados iniciais:', error);
      throw error;
    }
  }

  /**
   * Captura endereços dos estudantes e suas coordenadas
   */
  private async captureStudentAddresses(studentPickups: any[]): Promise<StudentAddress[]> {
    const addresses: StudentAddress[] = [];
    
    for (const pickup of studentPickups) {
      try {
        let coordinates: { lat: number; lng: number } | undefined;
        
        // Se já tem coordenadas, validar e usar elas
        if (pickup.lat && pickup.lng) {
          const lat = Number(pickup.lat);
          const lng = Number(pickup.lng);
          
          // Validar coordenadas existentes
          if (!isNaN(lat) && !isNaN(lng) && 
              lat >= -90 && lat <= 90 && 
              lng >= -180 && lng <= 180) {
            coordinates = { lat, lng };
            console.log('✅ Coordenadas válidas encontradas para estudante:', pickup.studentName || pickup.id);
          } else {
            console.warn('⚠️ Coordenadas inválidas para estudante, tentando geocodificar:', pickup.studentName || pickup.id);
            // Tentar geocodificar se as coordenadas são inválidas
            if (pickup.address) {
              const coords = await this.geocodeAddress(pickup.address);
              if (coords) {
                coordinates = { lat: coords[1], lng: coords[0] };
              }
            }
          }
        } else if (pickup.address) {
          // Geocodificar o endereço
          const coords = await this.geocodeAddress(pickup.address);
          if (coords) {
            coordinates = { lat: coords[1], lng: coords[0] };
          }
        }
        
        addresses.push({
          studentId: pickup.studentId,
          studentName: pickup.studentName,
          address: pickup.address,
          coordinates
        });
        
        console.log(`📍 Endereço capturado para ${pickup.studentName}:`, {
          address: pickup.address,
          hasCoordinates: !!coordinates
        });
      } catch (error) {
        console.error(`❌ Erro ao capturar endereço do estudante ${pickup.studentName}:`, error);
        // Adicionar sem coordenadas em caso de erro
        addresses.push({
          studentId: pickup.studentId,
          studentName: pickup.studentName,
          address: pickup.address
        });
      }
    }
    
    return addresses;
  }

  /**
   * Captura endereço da escola
   */
  private async captureSchoolAddress(): Promise<SchoolAddress> {
    // Em produção, isso viria do banco de dados
    // Por enquanto, usando dados simulados com localização correta em Mogi das Cruzes
    const schoolData = {
      schoolId: 'school-001',
      schoolName: 'Escola Municipal de Mogi das Cruzes',
      address: 'Rua Coronel Souza Franco, 1000 - Centro, Mogi das Cruzes - SP'
    };
    
    try {
      const coords = await this.geocodeAddress(schoolData.address);
      
      return {
        ...schoolData,
        coordinates: coords ? { lat: coords[1], lng: coords[0] } : undefined
      };
    } catch (error) {
      console.error('❌ Erro ao geocodificar endereço da escola:', error);
      return schoolData;
    }
  }

  /**
   * Obtém localização atual do motorista
   */
  private async getCurrentDriverLocation(): Promise<RouteLocation | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('⚠️ Geolocalização não suportada');
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: RouteLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy
          };
          
          console.log('📍 Localização do motorista capturada:', {
            lat: location.lat.toFixed(6),
            lng: location.lng.toFixed(6),
            accuracy: location.accuracy
          });
          
          resolve(location);
        },
        (error) => {
          console.error('❌ Erro ao obter localização do motorista:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000 // 30 segundos
        }
      );
    });
  }

  /**
   * Inicia rastreamento de veículo avançado
   */
  private async startVehicleTracking(): Promise<void> {
    try {
      console.log('🚗 Iniciando rastreamento avançado do veículo...');
      
      // Configurar opções de rastreamento
      const trackingOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
        updateInterval: 3000, // 3 segundos
        minDistanceThreshold: 5, // 5 metros
        maxSpeedThreshold: 120 // 120 km/h
      };
      
      // Configurar callback para atualizações de posição
      vehicleTrackingService.onPositionUpdate((position: VehiclePosition) => {
        this.handleVehiclePositionUpdate(position);
      });
      
      // Configurar callback para erros
      vehicleTrackingService.onTrackingError((error: GeolocationPositionError) => {
        this.handleLocationError(error);
      });
      
      // Iniciar rastreamento
      await vehicleTrackingService.startTracking(trackingOptions);
      
      console.log('✅ Rastreamento avançado do veículo iniciado');
    } catch (error) {
      console.error('❌ Erro ao iniciar rastreamento do veículo:', error);
      // Fallback para rastreamento simples
      this.startLocationTracking();
    }
  }

  /**
   * Inicia rastreamento contínuo de localização (fallback)
   */
  private startLocationTracking(): void {
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocalização não suportada para rastreamento');
      return;
    }
    
    console.log('🎯 Iniciando rastreamento de localização simples...');
    
    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        this.handleLocationUpdate(position);
      },
      (error) => {
        console.error('❌ Erro no rastreamento de localização:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000 // 10 segundos
      }
    );
  }

  /**
   * Processa atualizações de posição do veículo (avançado)
   */
  private async handleVehiclePositionUpdate(position: VehiclePosition): Promise<void> {
    const location: RouteLocation = {
      lat: position.latitude,
      lng: position.longitude,
      accuracy: position.accuracy,
      timestamp: new Date(position.timestamp).toISOString(),
      speed: position.speed,
      heading: position.heading
    };

    console.log('🚗 Nova posição do veículo:', {
      lat: location.lat.toFixed(6),
      lng: location.lng.toFixed(6),
      accuracy: `${location.accuracy.toFixed(1)}m`,
      speed: position.speed ? `${(position.speed * 3.6).toFixed(1)} km/h` : 'N/A'
    });

    // Atualizar no serviço de rastreamento
    routeTrackingService.updateDriverLocation(location);

    // Atualizar dados locais
    if (this.lastKnownData) {
      this.lastKnownData.driverLocation = location;
      
      // Verificar se precisa recalcular rota
      if (this.currentCalculatedRoute) {
        const shouldRecalculate = await this.shouldRecalculateRoute(location);
        if (shouldRecalculate) {
          await this.recalculateRoute();
        }
      }
      
      this.notifyListeners(this.lastKnownData);
    }
  }

  /**
   * Processa atualizações de localização simples (fallback)
   */
  private async handleLocationUpdate(position: GeolocationPosition): Promise<void> {
    const location: RouteLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: new Date().toISOString(),
      accuracy: position.coords.accuracy
    };
    
    // Atualizar no serviço de rastreamento
    routeTrackingService.updateDriverLocation(location);
    
    // Atualizar dados locais
    if (this.lastKnownData) {
      this.lastKnownData.driverLocation = location;
      
      // Verificar se precisa recalcular rota
      if (this.currentCalculatedRoute) {
        const shouldRecalculate = await this.shouldRecalculateRoute(location);
        if (shouldRecalculate) {
          await this.recalculateRoute();
        }
      }
      
      this.notifyListeners(this.lastKnownData);
    }
    
    console.log('📍 Localização atualizada:', {
      lat: location.lat.toFixed(6),
      lng: location.lng.toFixed(6),
      accuracy: location.accuracy
    });
  }

  /**
   * Trata erros de localização
   */
  private handleLocationError(error: GeolocationPositionError): void {
    let errorMessage = 'Erro desconhecido de geolocalização';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permissão de localização negada pelo usuário';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Informações de localização não disponíveis';
        break;
      case error.TIMEOUT:
        errorMessage = 'Timeout na solicitação de localização';
        break;
      default:
        errorMessage = `Erro de geolocalização: ${error.message}`;
        break;
    }
    
    console.error('❌ Erro no rastreamento de localização:', {
      code: error.code,
      message: errorMessage,
      originalMessage: error.message
    });
    
    // Notificar listeners sobre o erro
    if (this.lastKnownData) {
      this.notifyListeners({
        ...this.lastKnownData,
        driverLocation: {
          ...this.lastKnownData.driverLocation,
          error: errorMessage
        }
      });
    }
  }

  /**
   * Inicia atualizações periódicas dos dados
   */
  private startPeriodicUpdates(): void {
    console.log('⏰ Iniciando atualizações periódicas...');
    
    this.dataUpdateInterval = setInterval(async () => {
      try {
        await this.updateRouteData();
      } catch (error) {
        console.error('❌ Erro na atualização periódica:', error);
      }
    }, 30000); // Atualizar a cada 30 segundos
  }

  /**
   * Calcula rota inicial automaticamente
   */
  private async calculateInitialRoute(
    data: RealtimeRouteData,
    activeRoute: ActiveRoute
  ): Promise<void> {
    try {
      console.log('🗺️ Calculando rota inicial automática...');
      
      const calculatedRoute = await routeCalculationService.calculateAutoRoute(
        data.driverLocation,
        data.studentAddresses,
        data.schoolAddress,
        activeRoute.direction,
        { optimize: true }
      );
      
      if (calculatedRoute) {
        this.currentCalculatedRoute = calculatedRoute;
        
        // Atualizar dados com a rota calculada
        const updatedData: RealtimeRouteData = {
          ...data,
          calculatedRoute,
          routeCoordinates: calculatedRoute.coordinates,
          totalDistance: calculatedRoute.distance,
          totalDuration: calculatedRoute.duration,
          estimatedArrival: routeCalculationService.estimateArrivalTime(calculatedRoute).toISOString(),
          isRouteCalculated: true
        };
        
        this.lastKnownData = updatedData;
        this.notifyListeners(updatedData);
        
        console.log('✅ Rota inicial calculada:', {
          distance: `${(calculatedRoute.distance / 1000).toFixed(2)} km`,
          duration: `${Math.round(calculatedRoute.duration / 60)} min`,
          waypoints: calculatedRoute.waypoints.length
        });
      } else {
        console.warn('⚠️ Não foi possível calcular rota inicial');
        this.lastKnownData = data;
        this.notifyListeners(data);
      }
    } catch (error) {
      console.error('❌ Erro ao calcular rota inicial:', error);
      this.lastKnownData = data;
      this.notifyListeners(data);
    }
  }

  /**
   * Atualiza dados da rota
   */
  private async updateRouteData(): Promise<void> {
    if (!this.lastKnownData) return;
    
    const activeRoute = routeTrackingService.getActiveRoute();
    if (!activeRoute) return;
    
    console.log('🔄 Atualizando dados da rota...');
    
    try {
      // Se há uma rota calculada e nova localização, recalcular se necessário
      if (this.currentCalculatedRoute && this.lastKnownData.driverLocation) {
        const shouldRecalculate = await this.shouldRecalculateRoute(
          this.lastKnownData.driverLocation
        );
        
        if (shouldRecalculate) {
          await this.recalculateRoute();
        }
      }
      
      // Notificar listeners com dados atuais
      this.notifyListeners(this.lastKnownData);
    } catch (error) {
      console.error('❌ Erro ao atualizar dados da rota:', error);
    }
  }

  /**
   * Verifica se deve recalcular a rota
   */
  private async shouldRecalculateRoute(driverLocation: RouteLocation): Promise<boolean> {
    if (!this.currentCalculatedRoute) return false;
    
    // Recalcular se o motorista se desviou significativamente da rota
    // Por enquanto, implementação simples baseada em tempo
    const lastUpdate = new Date(driverLocation.timestamp);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    // Recalcular a cada 5 minutos ou se houve mudança significativa
    return minutesSinceUpdate >= 5;
  }

  /**
   * Recalcula a rota baseada na posição atual
   */
  private async recalculateRoute(): Promise<void> {
    if (!this.currentCalculatedRoute || !this.lastKnownData) return;
    
    try {
      console.log('🔄 Recalculando rota...');
      
      const newRoute = await routeCalculationService.recalculateRoute(
        this.currentCalculatedRoute,
        this.lastKnownData.driverLocation
      );
      
      if (newRoute) {
        this.currentCalculatedRoute = newRoute;
        
        // Atualizar dados
        this.lastKnownData = {
          ...this.lastKnownData,
          calculatedRoute: newRoute,
          routeCoordinates: newRoute.coordinates,
          totalDistance: newRoute.distance,
          totalDuration: newRoute.duration,
          estimatedArrival: routeCalculationService.estimateArrivalTime(newRoute).toISOString()
        };
        
        console.log('✅ Rota recalculada com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao recalcular rota:', error);
    }
  }

  /**
   * Adiciona listener para mudanças nos dados
   */
  addListener(callback: (data: RealtimeRouteData) => void): void {
    this.listeners.push(callback);
    
    // Se já tem dados, notificar imediatamente
    if (this.lastKnownData) {
      callback(this.lastKnownData);
    }
  }

  /**
   * Remove listener
   */
  removeListener(callback: (data: RealtimeRouteData) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifica todos os listeners
   */
  private notifyListeners(data: RealtimeRouteData): void {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Erro ao notificar listener:', error);
      }
    });
  }

  /**
   * Obtém os últimos dados conhecidos
   */
  getLastKnownData(): RealtimeRouteData | null {
    return this.lastKnownData;
  }

  /**
   * Força atualização dos dados
   */
  async forceUpdate(): Promise<void> {
    const activeRoute = routeTrackingService.getActiveRoute();
    if (activeRoute) {
      await this.captureInitialData(activeRoute);
    }
  }

  /**
   * Captura endereço de um estudante específico (método público)
   */
  async captureStudentAddress(studentId: string, address: string): Promise<{ coordinates: [number, number] } | null> {
    try {
      if (!address || address.trim().length === 0) {
        console.warn('⚠️ Endereço vazio fornecido para estudante:', studentId);
        return null;
      }

      console.log('🔍 Geocodificando endereço do estudante:', { studentId, address });
      
      const coords = await this.geocodeAddress(address);
      if (coords) {
        console.log('✅ Coordenadas obtidas para estudante:', { studentId, coordinates: coords });
        return { coordinates: coords };
      }
      
      console.warn('⚠️ Não foi possível geocodificar endereço do estudante:', { studentId, address });
      return null;
    } catch (error) {
      console.error('❌ Erro ao capturar endereço do estudante:', { studentId, address, error });
      return null;
    }
  }

  /**
   * Captura endereço de uma escola específica (método público)
   */
  async captureSchoolAddress(schoolId: string, address: string): Promise<{ coordinates: [number, number] } | null> {
    try {
      if (!address || address.trim().length === 0) {
        console.warn('⚠️ Endereço vazio fornecido para escola:', schoolId);
        return null;
      }

      console.log('🔍 Geocodificando endereço da escola:', { schoolId, address });
      
      const coords = await this.geocodeAddress(address);
      if (coords) {
        console.log('✅ Coordenadas obtidas para escola:', { schoolId, coordinates: coords });
        return { coordinates: coords };
      }
      
      console.warn('⚠️ Não foi possível geocodificar endereço da escola:', { schoolId, address });
      return null;
    } catch (error) {
      console.error('❌ Erro ao capturar endereço da escola:', { schoolId, address, error });
      return null;
    }
  }
}

export const realtimeDataService = RealtimeDataService.getInstance();

// Funções de conveniência
export const startRealtimeTracking = () => {
  return realtimeDataService.startDataCapture();
};

export const stopRealtimeTracking = () => {
  realtimeDataService.stopDataCapture();
};

export const getRealtimeData = () => {
  return realtimeDataService.getLastKnownData();
};