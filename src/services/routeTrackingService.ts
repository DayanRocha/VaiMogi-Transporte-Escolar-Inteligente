import { GuardianNotification } from '@/hooks/useGuardianData';
import { routeHistoryService } from './routeHistoryService';
import { realtimeDataService } from './realtimeDataService';

export interface RouteLocation {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
}

export interface ActiveRoute {
  id: string;
  driverId: string;
  driverName: string;
  direction: 'to_school' | 'to_home';
  startTime: string;
  endTime?: string;
  isActive: boolean;
  currentLocation?: RouteLocation;
  studentPickups: {
    studentId: string;
    studentName: string;
    address: string;
    lat?: number;
    lng: number;
    status: 'pending' | 'picked_up' | 'dropped_off';
  }[];
}

class RouteTrackingService {
  private static instance: RouteTrackingService;
  private listeners: ((route: ActiveRoute | null) => void)[] = [];
  private locationUpdateInterval: NodeJS.Timeout | null = null;
  private persistenceCheckInterval: NodeJS.Timeout | null = null;
  private lastRouteStartTime: number = 0;

  private constructor() {
    // Verificar e limpar dados antigos na inicialização
    this.cleanupOnInit();
    
    // Iniciar verificação contínua de persistência
    this.startPersistenceCheck();
    
    // Setup de event listeners apenas para logs, NUNCA para encerrar rotas
    this.setupApplicationLifecycleHandlers();
  }

  private cleanupOnInit() {
    console.log('🔍 Verificando dados antigos na inicialização...');
    
    const stored = localStorage.getItem('activeRoute');
    if (stored) {
      try {
        const route = JSON.parse(stored);
        const startTime = new Date(route.startTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        
        // Se a rota tem mais de 3 horas, limpar automaticamente
        if (hoursDiff > 3) {
          console.log('🧹 Limpando rota muito antiga na inicialização:', {
            routeId: route.id,
            hoursOld: hoursDiff.toFixed(1)
          });
          this.forceCleanup();
        } else {
          console.log('ℹ️ Rota recente encontrada, mantendo:', {
            routeId: route.id,
            hoursOld: hoursDiff.toFixed(1)
          });
        }
      } catch (error) {
        console.log('❌ Dados corrompidos encontrados, limpando...');
        this.forceCleanup();
      }
    }
  }

  static getInstance(): RouteTrackingService {
    if (!RouteTrackingService.instance) {
      RouteTrackingService.instance = new RouteTrackingService();
    }
    return RouteTrackingService.instance;
  }

  private setupApplicationLifecycleHandlers() {
    // Apenas para logs - NUNCA encerrar rotas automaticamente
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📱 Aplicação ficou em background - rota continua ativa');
      } else {
        console.log('📱 Aplicação voltou ao foreground - verificando rota...');
        this.restoreActiveRouteOnInit();
      }
    });

    window.addEventListener('beforeunload', () => {
      console.log('🚪 Motorista saindo da aplicação - rota mantida ativa no localStorage');
      // IMPORTANTE: NUNCA encerrar a rota aqui
    });

    window.addEventListener('focus', () => {
      console.log('🎯 Aplicação recuperou o foco - restaurando rota...');
      this.restoreActiveRouteOnInit();
    });

    // Detectar quando a página é recarregada
    window.addEventListener('load', () => {
      console.log('🔄 Página recarregada - restaurando rota ativa...');
      this.restoreActiveRouteOnInit();
    });
  }

  private restoreActiveRouteOnInit() {
    console.log('🔍 Verificando se há rota ativa para restaurar...');
    
    const route = this.getActiveRoute();
    if (route && route.isActive) {
      // Verificar se a rota é realmente recente (menos de 2 horas)
      const startTime = new Date(route.startTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 2) {
        console.log('✅ Rota ativa recente restaurada automaticamente:', {
          id: route.id,
          driverName: route.driverName,
          studentsCount: route.studentPickups?.length || 0,
          startTime: route.startTime,
          hoursActive: hoursDiff.toFixed(1),
          currentLocation: route.currentLocation ? 'Disponível' : 'Não disponível'
        });
        
        // Reiniciar rastreamento de localização se necessário
        if (!this.locationUpdateInterval) {
          this.startLocationTracking();
        }
        
        // Notificar todos os listeners sobre a rota ativa
        this.notifyListeners(route);
      } else {
        console.log('⚠️ Rota encontrada mas muito antiga para restaurar automaticamente:', {
          hoursActive: hoursDiff.toFixed(1),
          threshold: '2 horas'
        });
        this.cleanupOldRoute();
      }
    } else {
      console.log('ℹ️ Nenhuma rota ativa válida para restaurar');
    }
  }

  private startPersistenceCheck() {
    // Verificar a cada 30 segundos se a rota ainda está persistida
    this.persistenceCheckInterval = setInterval(() => {
      const route = this.getActiveRoute();
      if (route && route.isActive) {
        // Verificar se a flag de persistência ainda existe
        const persistenceFlag = localStorage.getItem('routePersistenceFlag');
        if (persistenceFlag === 'true') {
          // Atualizar timestamp para manter a rota "viva"
          // Manter a rota viva sem introduzir localização fictícia
          if (!route.currentLocation) {
            console.log('ℹ️ Rota ativa sem localização atual — não definindo coordenadas padrão.');
          }
          
          // Re-persistir para manter fresca
          this.persistRoute(route);
          console.log('💾 Rota mantida ativa via persistência automática');
        } else {
          // Se não há flag de persistência, parar a verificação
          console.log('🛑 Flag de persistência removida, parando verificação automática');
          if (this.persistenceCheckInterval) {
            clearInterval(this.persistenceCheckInterval);
            this.persistenceCheckInterval = null;
          }
        }
      } else {
        // Se não há rota ativa, parar a verificação
        console.log('🛑 Nenhuma rota ativa, parando verificação de persistência');
        if (this.persistenceCheckInterval) {
          clearInterval(this.persistenceCheckInterval);
          this.persistenceCheckInterval = null;
        }
      }
    }, 30000); // 30 segundos
  }

  addListener(callback: (route: ActiveRoute | null) => void) {
    this.listeners.push(callback);
    
    // Verificar se há rota ativa RECENTE (menos de 1 hora)
    const activeRoute = this.getActiveRoute();
    if (activeRoute && activeRoute.isActive) {
      const startTime = new Date(activeRoute.startTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 1) {
        console.log('📡 Notificando listener sobre rota ativa recente');
        callback(activeRoute);
      } else {
        console.log('⚠️ Rota encontrada mas muito antiga, não notificando listener');
        this.cleanupOldRoute();
        callback(null);
      }
    } else {
      callback(null);
    }
  }

  removeListener(callback: (route: ActiveRoute | null) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(route: ActiveRoute | null) {
    this.listeners.forEach(listener => {
      try {
        listener(route);
      } catch (error) {
        console.error('❌ Erro ao notificar listener:', error);
      }
    });
  }

  getActiveRoute(): ActiveRoute | null {
  console.log('Debug: Iniciando getActiveRoute');
  try {
    const stored = localStorage.getItem('activeRoute');
    console.log('Debug: Stored activeRoute exists:', !!stored);
    const persistenceFlag = localStorage.getItem('routePersistenceFlag');
    console.log('Debug: Persistence flag:', persistenceFlag);
    
    if (stored) {
      const route = JSON.parse(stored);
      
      // Verificar se a rota não é muito antiga (mais de 6 horas para ser mais restritivo)
      const startTime = new Date(route.startTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      console.log('Debug: Hours since start:', hoursDiff);
      
      if (hoursDiff > 6) {
        console.log('⏰ Rota muito antiga (>6h), limpando automaticamente...');
        this.cleanupOldRoute();
        return null;
      }
      
      // Verificar se a flag de persistência existe (indica que a rota não foi encerrada)
      if (persistenceFlag !== 'true') {
        console.log('🚫 Rota sem flag de persistência, provavelmente foi encerrada. Limpando...');
        this.cleanupOldRoute();
        return null;
      }
      
      // Verificar se a rota foi explicitamente marcada como inativa
      if (!route.isActive) {
        console.log('🚫 Rota marcada como inativa, limpando...');
        this.cleanupOldRoute();
        return null;
      }
      
      // Se passou por todas as verificações, a rota é válida
      console.log('✅ Rota ativa válida encontrada:', {
        id: route.id,
        driverName: route.driverName,
        hoursActive: hoursDiff.toFixed(1),
        hasPersistenceFlag: persistenceFlag === 'true'
      });
      return route;
    }
  } catch (error) {
    console.error('❌ Erro ao carregar rota ativa:', error);
    console.log('Debug: Erro detalhes:', error.message);
    // Em caso de erro, limpar dados corrompidos
    this.cleanupOldRoute();
  }
  
  console.log('Debug: Retornando null - nenhuma rota válida encontrada');
  return null;
}

  private cleanupOldRoute() {
    localStorage.removeItem('activeRoute');
    localStorage.removeItem('routeLastSave');
    localStorage.removeItem('routePersistenceFlag');
    this.stopLocationTracking();
    this.notifyListeners(null);
    this.lastRouteStartTime = 0; // Reset do debounce
    console.log('🧹 Rota antiga removida automaticamente');
  }

  // Método para forçar encerramento da rota (para o motorista)
  forceEndRoute() {
    console.log('🚨 FORÇANDO encerramento da rota pelo motorista...');
    
    const route = this.getActiveRoute();
    if (route) {
      // Adicionar ao histórico antes de limpar
      try {
        route.isActive = false;
        route.endTime = new Date().toISOString();
        routeHistoryService.addCompletedRoute(route);
        console.log('✅ Rota salva no histórico antes da limpeza forçada');
      } catch (error) {
        console.error('❌ Erro ao salvar no histórico:', error);
      }
    }
    
    // Limpar TUDO imediatamente
    localStorage.removeItem('activeRoute');
    localStorage.removeItem('routeLastSave');
    localStorage.removeItem('routePersistenceFlag');
    
    // Parar todos os intervalos
    this.stopLocationTracking();
    if (this.persistenceCheckInterval) {
      clearInterval(this.persistenceCheckInterval);
      this.persistenceCheckInterval = null;
    }
    
    // Reset completo
    this.notifyListeners(null);
    this.lastRouteStartTime = 0;
    
    console.log('✅ Rota FORÇADAMENTE encerrada e limpa');
    return true;
  }

  // Método para forçar limpeza completa (útil para debugging)
  forceCleanup() {
    console.log('🧹 Forçando limpeza completa de todas as rotas...');
    localStorage.removeItem('activeRoute');
    localStorage.removeItem('routeLastSave');
    localStorage.removeItem('routePersistenceFlag');
    this.stopLocationTracking();
    if (this.persistenceCheckInterval) {
      clearInterval(this.persistenceCheckInterval);
      this.persistenceCheckInterval = null;
    }
    this.notifyListeners(null);
    this.lastRouteStartTime = 0;
    console.log('✅ Limpeza completa realizada');
  }

  startRoute(driverId: string, driverName: string, direction: 'to_school' | 'to_home', students: any[]) {
  console.log('Debug: Iniciando startRoute');
  console.log('Debug: Parâmetros recebidos:', { driverId, driverName, direction, studentsCount: students.length });
  
  const now = Date.now();
  console.log('Debug: Verificando debounce - time since last:', now - this.lastRouteStartTime);
  
  if (now - this.lastRouteStartTime < 2000) {
    console.log('Debug: Debounce ativado - ignorando chamada');
    return this.getActiveRoute();
  }
  
  console.log('Debug: Limpando dados antigos via forceCleanup');
  this.forceCleanup();

  console.log('Debug: Verificando se limpeza foi efetiva - activeRoute após cleanup:', !!localStorage.getItem('activeRoute'));
  
  const existingRoute = this.getActiveRoute();
  if (existingRoute && existingRoute.isActive) {
    console.log('Debug: Rota existente ainda ativa após cleanup - forçando limpeza agressiva');
    localStorage.clear();
  } else {
    console.log('Debug: Sistema limpo com sucesso');
  }
  
  this.lastRouteStartTime = now;
  
  console.log('Debug: Criando novo objeto de rota');
  const route: ActiveRoute = {
    id: Date.now().toString(),
    driverId,
    driverName,
    direction,
    startTime: new Date().toISOString(),
    isActive: true,
    studentPickups: students.map(student => ({
      studentId: student.id,
      studentName: student.name,
      address: student.address || 'Endereço não informado',
      lat: student.lat,
      lng: student.lng,
      status: 'pending'
    }))
  };

  console.log('Debug: Chamando persistRoute');
  this.persistRoute(route);
  
  console.log('Debug: Verificando persistência - activeRoute após persist:', !!localStorage.getItem('activeRoute'));
  console.log('Debug: Persistence flag após persist:', localStorage.getItem('routePersistenceFlag'));
  
  console.log('Debug: Iniciando location tracking');
  this.startLocationTracking();
  
  console.log('Debug: Iniciando automatic route tracing');
  this.startAutomaticRouteTracing(route);
  
  console.log('Debug: Notificando listeners');
  this.notifyListeners(route);
  
  console.log('Debug: Rota iniciada com sucesso');
  return route;
}

  private persistRoute(route: ActiveRoute) {
  console.log('Debug: Iniciando persistRoute');
  try {
    localStorage.setItem('activeRoute', JSON.stringify(route));
    localStorage.setItem('routeLastSave', Date.now().toString());
    localStorage.setItem('routePersistenceFlag', 'true');
    console.log('Debug: Itens setados com sucesso');
  } catch (error) {
    console.error('Debug: Erro ao persistir:', error.message);
  }
  console.log('Debug: Finalizando persistRoute');
}

  // ÚNICO método que pode encerrar uma rota - DEVE ser chamado explicitamente
  endRoute() {
    console.log('🔍 Tentativa de encerrar rota...');
    const route = this.getActiveRoute();
    if (route && route.isActive) {
      console.log('✅ Rota ativa encontrada, encerrando:', {
        id: route.id,
        driverName: route.driverName,
        startTime: route.startTime
      });
      
      route.isActive = false;
      route.endTime = new Date().toISOString();
      
      // Salvar estado final
      this.persistRoute(route);
      
      // Adicionar rota ao histórico
      try {
        routeHistoryService.addCompletedRoute(route);
      } catch (error) {
        console.error('❌ Erro ao salvar rota no histórico:', error);
      }
      
      // Parar rastreamento
      this.stopLocationTracking();
      
      // Parar verificação de persistência
      if (this.persistenceCheckInterval) {
        clearInterval(this.persistenceCheckInterval);
        this.persistenceCheckInterval = null;
      }
      
      // Limpar IMEDIATAMENTE todos os dados da rota encerrada
      localStorage.removeItem('activeRoute');
      localStorage.removeItem('routeLastSave');
      localStorage.removeItem('routePersistenceFlag');
      
      // Reset do debounce timer
      this.lastRouteStartTime = 0;
      
      // Notificar listeners que a rota foi EXPLICITAMENTE encerrada
      this.notifyListeners(null);
      
      console.log('🏁 Rota EXPLICITAMENTE finalizada pelo motorista:', {
        id: route.id,
        driverName: route.driverName,
        duration: route.endTime && route.startTime ? 
          `${Math.round((new Date(route.endTime).getTime() - new Date(route.startTime).getTime()) / (1000 * 60))} min` : 
          'N/A'
      });
      
      console.log('🧹 Dados da rota removidos IMEDIATAMENTE do localStorage');
      
      return true;
    }
    
    console.log('⚠️ Tentativa de encerrar rota, mas nenhuma rota ativa encontrada');
    return false;
  }

  updateDriverLocation(location: RouteLocation) {
    const route = this.getActiveRoute();
    if (route && route.isActive) {
      route.currentLocation = location;
      this.persistRoute(route);
      this.notifyListeners(route);
      console.log('📍 Localização do motorista atualizada:', {
        lat: location.lat.toFixed(6),
        lng: location.lng.toFixed(6),
        timestamp: location.timestamp
      });
    }
  }

  updateStudentStatus(studentId: string, status: 'pending' | 'picked_up' | 'dropped_off') {
    const route = this.getActiveRoute();
    if (route && route.isActive) {
      const student = route.studentPickups.find(s => s.studentId === studentId);
      if (student) {
        student.status = status;
        this.persistRoute(route);
        this.notifyListeners(route);
        console.log(`👤 Status do estudante ${student.studentName} atualizado para: ${status}`);
      }
    }
  }

  private startLocationTracking() {
    // Parar qualquer rastreamento anterior
    this.stopLocationTracking();

    // Atualizar localização a cada 10 segundos
    this.locationUpdateInterval = setInterval(() => {
      const route = this.getActiveRoute();
      if (route && route.isActive) {
        this.getCurrentLocation().then(location => {
          if (location) {
            this.updateDriverLocation(location);
          }
        });
      } else {
        // Se não há rota ativa, parar o rastreamento
        this.stopLocationTracking();
      }
    }, 10000);

    // Primeira atualização imediata
    this.getCurrentLocation().then(location => {
      if (location) {
        this.updateDriverLocation(location);
      }
    });

    console.log('📍 Rastreamento de localização iniciado (intervalo: 10s)');
  }

  private stopLocationTracking() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
      console.log('📍 Rastreamento de localização interrompido');
    }
  }

  private getCurrentLocation(): Promise<RouteLocation | null> {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: RouteLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date().toISOString(),
              accuracy: position.coords.accuracy
            };
            resolve(location);
          },
          (error) => {
            console.warn('⚠️ Erro na geolocalização:', error.message);
            // Não usar fallback para mocks, retornar null
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 45000
          }
        );
      } else {
        console.warn('⚠️ Geolocalização não suportada pelo navegador');
        resolve(null);
      }
    });
  }

  // Removido: getMockLocation (dependência de mock removida)
  // Método para verificar se há uma rota persistida (útil para debugging)
  hasPersistentRoute(): boolean {
    const route = this.getActiveRoute();
    const flag = localStorage.getItem('routePersistenceFlag');
    return !!(route && route.isActive && flag === 'true');
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  isNearLocation(driverLat: number, driverLng: number, targetLat: number, targetLng: number, radiusMeters: number = 100): boolean {
    const distance = this.calculateDistance(driverLat, driverLng, targetLat, targetLng);
    return distance <= radiusMeters;
  }

  /**
   * Inicia o traçado automático de rota quando a viagem é iniciada
   */
  private async startAutomaticRouteTracing(route: ActiveRoute): Promise<void> {
    try {
      console.log('🗺️ Iniciando traçado automático de rota...');
      
      // Aguardar um pouco para garantir que a localização inicial seja capturada
      setTimeout(async () => {
        try {
          // Iniciar captura de dados em tempo real que inclui cálculo automático de rota
          await realtimeDataService.startDataCapture();
          
          console.log('✅ Traçado automático de rota iniciado com sucesso');
        } catch (error) {
          console.error('❌ Erro ao iniciar traçado automático de rota:', error);
        }
      }, 2000); // Aguardar 2 segundos para estabilizar a localização
      
    } catch (error) {
      console.error('❌ Erro ao configurar traçado automático de rota:', error);
    }
  }
}

export const routeTrackingService = RouteTrackingService.getInstance();

// Função utilitária para encerramento forçado (para motoristas)
export const forceEndRoute = () => {
  return routeTrackingService.forceEndRoute();
};

// Função utilitária para limpeza de emergência (debugging)
export const forceCleanupRoutes = () => {
  routeTrackingService.forceCleanup();
};

// Função utilitária para verificar dados fantasma
export const checkForGhostData = () => {
  const activeRoute = localStorage.getItem('activeRoute');
  const persistenceFlag = localStorage.getItem('routePersistenceFlag');
  const lastSave = localStorage.getItem('routeLastSave');
  
  console.log('👻 Verificação de dados fantasma:', {
    hasActiveRoute: !!activeRoute,
    hasPersistenceFlag: !!persistenceFlag,
    hasLastSave: !!lastSave,
    activeRouteData: activeRoute ? JSON.parse(activeRoute) : null
  });
  
  return {
    hasGhostData: !!(activeRoute || persistenceFlag || lastSave),
    data: { activeRoute, persistenceFlag, lastSave }
  };
};
