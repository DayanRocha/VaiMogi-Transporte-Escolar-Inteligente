import { mapboxDirectionsService, RouteWaypoint, OptimizedRoute } from './mapboxDirectionsService';

export interface LocationUpdate {
  driverId: string;
  coordinates: [number, number]; // [longitude, latitude]
  timestamp: number;
  accuracy?: number; // metros
  speed?: number; // km/h
  heading?: number; // graus (0-360)
  altitude?: number; // metros
}

export interface StudentLocation {
  studentId: string;
  name: string;
  coordinates: [number, number];
  address: string;
  pickupTime?: string;
  status: 'pending' | 'picked_up' | 'at_school';
}

export interface SchoolLocation {
  schoolId: string;
  name: string;
  coordinates: [number, number];
  address: string;
}

export interface RealTimeRouteData {
  driverLocation: LocationUpdate;
  students: StudentLocation[];
  school: SchoolLocation;
  currentRoute?: OptimizedRoute;
  estimatedArrival?: {
    nextStudent?: { studentId: string; eta: number };
    school?: { eta: number };
  };
  routeProgress: {
    distanceRemaining: number;
    timeRemaining: number;
    studentsRemaining: number;
  };
}

export interface LocationServiceOptions {
  updateInterval?: number; // ms
  accuracyThreshold?: number; // metros
  routeRecalculationDistance?: number; // metros
  enableHighAccuracy?: boolean;
}

class RealTimeLocationService {
  private watchId: number | null = null;
  private lastKnownLocation: LocationUpdate | null = null;
  private locationUpdateCallbacks: ((location: LocationUpdate) => void)[] = [];
  private routeUpdateCallbacks: ((routeData: RealTimeRouteData) => void)[] = [];
  private currentRouteData: RealTimeRouteData | null = null;
  private options: LocationServiceOptions;

  constructor(options: LocationServiceOptions = {}) {
    this.options = {
      updateInterval: 5000, // 5 segundos
      accuracyThreshold: 100, // 100 metros - mais flexível para GPS urbano
      routeRecalculationDistance: 50, // 50 metros de desvio
      enableHighAccuracy: true,
      ...options
    };
  }

  /**
   * Inicia o rastreamento de localização em tempo real
   */
  startLocationTracking(driverId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não é suportada neste dispositivo'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: this.options.enableHighAccuracy,
        timeout: 10000,
        maximumAge: this.options.updateInterval
      };

      // Primeira localização
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationUpdate = this.createLocationUpdate(driverId, position);
          this.handleLocationUpdate(locationUpdate);
          resolve();
        },
        (error) => {
          console.error('❌ Erro ao obter localização inicial:', error);
          reject(error);
        },
        options
      );

      // Rastreamento contínuo
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationUpdate = this.createLocationUpdate(driverId, position);
          this.handleLocationUpdate(locationUpdate);
        },
        (error) => {
          console.error('❌ Erro no rastreamento de localização:', error);
          this.notifyLocationError(error);
        },
        options
      );

      console.log('📍 Rastreamento de localização iniciado para motorista:', driverId);
    });
  }

  /**
   * Para o rastreamento de localização
   */
  stopLocationTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('🛑 Rastreamento de localização parado');
    }
  }

  /**
   * Configura rota inicial com estudantes e escola
   */
  async setupRoute(
    driverLocation: LocationUpdate,
    students: StudentLocation[],
    school: SchoolLocation
  ): Promise<void> {
    try {
      console.log('🗺️ Configurando rota inicial...', {
        driver: driverLocation.coordinates,
        students: students.length,
        school: school.name
      });

      // Filtra apenas estudantes pendentes
      const pendingStudents = students.filter(s => s.status === 'pending');
      
      if (pendingStudents.length === 0) {
        console.log('ℹ️ Nenhum estudante pendente, rota direta para escola');
      }

      // Converte para waypoints
      const studentWaypoints: RouteWaypoint[] = pendingStudents.map(student => ({
        coordinates: student.coordinates,
        name: student.name,
        type: 'student' as const
      }));

      // Calcula rota otimizada
      const route = await mapboxDirectionsService.calculateSchoolRouteOptimized(
        driverLocation.coordinates,
        studentWaypoints,
        school.coordinates
      );

      // Atualiza dados da rota
      this.currentRouteData = {
        driverLocation,
        students,
        school,
        currentRoute: route || undefined,
        routeProgress: {
          distanceRemaining: route?.distance || 0,
          timeRemaining: route?.duration || 0,
          studentsRemaining: pendingStudents.length
        }
      };

      // Calcula ETAs
      if (route) {
        this.calculateEstimatedArrivals();
      }

      // Notifica callbacks
      this.notifyRouteUpdate();

      console.log('✅ Rota configurada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao configurar rota:', error);
    }
  }

  /**
   * Atualiza status de um estudante (coletado, na escola, etc.)
   */
  async updateStudentStatus(studentId: string, status: StudentLocation['status']): Promise<void> {
    if (!this.currentRouteData) return;

    const student = this.currentRouteData.students.find(s => s.studentId === studentId);
    if (!student) {
      console.warn('⚠️ Estudante não encontrado:', studentId);
      return;
    }

    student.status = status;
    console.log(`📝 Status do estudante ${student.name} atualizado para: ${status}`);

    // Se estudante foi coletado, recalcula rota
    if (status === 'picked_up' && this.lastKnownLocation) {
      await this.recalculateRoute();
    }

    this.notifyRouteUpdate();
  }

  /**
   * Recalcula rota baseado na posição atual
   */
  private async recalculateRoute(): Promise<void> {
    if (!this.currentRouteData || !this.lastKnownLocation) return;

    try {
      // Estudantes ainda pendentes
      const pendingStudents = this.currentRouteData.students
        .filter(s => s.status === 'pending');

      const waypoints: RouteWaypoint[] = [
        ...pendingStudents.map(s => ({
          coordinates: s.coordinates,
          name: s.name,
          type: 'student' as const
        })),
        {
          coordinates: this.currentRouteData.school.coordinates,
          name: this.currentRouteData.school.name,
          type: 'school' as const
        }
      ];

      if (waypoints.length === 1) {
        // Apenas escola restante
        console.log('🏫 Apenas escola restante, rota direta');
      }

      const newRoute = await mapboxDirectionsService.recalculateRoute(
        this.lastKnownLocation.coordinates,
        waypoints
      );

      if (newRoute) {
        this.currentRouteData.currentRoute = newRoute;
        this.currentRouteData.routeProgress = {
          distanceRemaining: newRoute.distance,
          timeRemaining: newRoute.duration,
          studentsRemaining: pendingStudents.length
        };

        this.calculateEstimatedArrivals();
        console.log('🔄 Rota recalculada com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao recalcular rota:', error);
    }
  }

  /**
   * Calcula tempos estimados de chegada
   */
  private calculateEstimatedArrivals(): void {
    if (!this.currentRouteData?.currentRoute) return;

    const route = this.currentRouteData.currentRoute;
    const pendingStudents = this.currentRouteData.students
      .filter(s => s.status === 'pending');

    if (pendingStudents.length > 0) {
      // ETA para próximo estudante (primeira perna da rota)
      const firstLeg = route.legs[0];
      if (firstLeg) {
        this.currentRouteData.estimatedArrival = {
          nextStudent: {
            studentId: pendingStudents[0].studentId,
            eta: Date.now() + (firstLeg.duration * 1000)
          },
          school: {
            eta: Date.now() + (route.duration * 1000)
          }
        };
      }
    } else {
      // Apenas ETA para escola
      this.currentRouteData.estimatedArrival = {
        school: {
          eta: Date.now() + (route.duration * 1000)
        }
      };
    }
  }

  /**
   * Cria objeto de atualização de localização
   */
  private createLocationUpdate(driverId: string, position: GeolocationPosition): LocationUpdate {
    return {
      driverId,
      coordinates: [position.coords.longitude, position.coords.latitude],
      timestamp: Date.now(),
      accuracy: position.coords.accuracy,
      speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // m/s para km/h
      heading: position.coords.heading || undefined,
      altitude: position.coords.altitude || undefined
    };
  }

  /**
   * Processa atualização de localização
   */
  private async handleLocationUpdate(location: LocationUpdate): Promise<void> {
    const previousLocation = this.lastKnownLocation;
    this.lastKnownLocation = location;

    // Verifica se precisa recalcular rota
    if (previousLocation && this.currentRouteData?.currentRoute) {
      const distance = this.calculateDistance(
        previousLocation.coordinates,
        location.coordinates
      );

      if (distance > (this.options.routeRecalculationDistance || 50)) {
        console.log('📍 Desvio detectado, recalculando rota...', { distance });
        await this.recalculateRoute();
      }
    }

    // Atualiza dados da rota atual
    if (this.currentRouteData) {
      this.currentRouteData.driverLocation = location;
    }

    // Notifica callbacks
    this.notifyLocationUpdate(location);
    if (this.currentRouteData) {
      this.notifyRouteUpdate();
    }
  }

  /**
   * Calcula distância entre dois pontos em metros
   */
  private calculateDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = coord1[1] * Math.PI / 180;
    const φ2 = coord2[1] * Math.PI / 180;
    const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180;
    const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Registra callback para atualizações de localização
   */
  onLocationUpdate(callback: (location: LocationUpdate) => void): () => void {
    this.locationUpdateCallbacks.push(callback);
    return () => {
      const index = this.locationUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.locationUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Registra callback para atualizações de rota
   */
  onRouteUpdate(callback: (routeData: RealTimeRouteData) => void): () => void {
    this.routeUpdateCallbacks.push(callback);
    return () => {
      const index = this.routeUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.routeUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notifica callbacks de atualização de localização
   */
  private notifyLocationUpdate(location: LocationUpdate): void {
    this.locationUpdateCallbacks.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('❌ Erro em callback de localização:', error);
      }
    });
  }

  /**
   * Notifica callbacks de atualização de rota
   */
  private notifyRouteUpdate(): void {
    if (!this.currentRouteData) return;

    this.routeUpdateCallbacks.forEach(callback => {
      try {
        callback(this.currentRouteData!);
      } catch (error) {
        console.error('❌ Erro em callback de rota:', error);
      }
    });
  }

  /**
   * Notifica erro de localização
   */
  private notifyLocationError(error: GeolocationPositionError): void {
    console.error('📍 Erro de geolocalização:', {
      code: error.code,
      message: error.message
    });
  }

  /**
   * Obtém dados da rota atual
   */
  getCurrentRouteData(): RealTimeRouteData | null {
    return this.currentRouteData;
  }

  /**
   * Obtém última localização conhecida
   */
  getLastKnownLocation(): LocationUpdate | null {
    return this.lastKnownLocation;
  }
}

export { RealTimeLocationService };
export const realTimeLocationService = new RealTimeLocationService();
export default realTimeLocationService;