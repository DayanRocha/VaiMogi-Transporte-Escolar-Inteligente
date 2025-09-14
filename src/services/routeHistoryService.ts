interface RouteHistoryItem {
  id: string;
  driverName: string;
  startTime: string;
  endTime?: string;
  direction: 'to_school' | 'to_home';
  studentsCount: number;
  completedStudents: number;
  duration?: string;
  date: string;
  studentPickups?: Array<{
    studentId: string;
    studentName: string;
    address: string;
    status: 'pending' | 'picked_up' | 'dropped_off';
  }>;
}

class RouteHistoryService {
  private static instance: RouteHistoryService;
  private readonly STORAGE_KEY = 'routeHistory';

  static getInstance(): RouteHistoryService {
    if (!RouteHistoryService.instance) {
      RouteHistoryService.instance = new RouteHistoryService();
    }
    return RouteHistoryService.instance;
  }

  // Adicionar uma rota finalizada ao histórico
  addCompletedRoute(route: any): void {
    try {
      const historyItem: RouteHistoryItem = {
        id: route.id,
        driverName: route.driverName,
        startTime: new Date(route.startTime).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        endTime: route.endTime ? new Date(route.endTime).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : undefined,
        direction: route.direction,
        studentsCount: route.studentPickups?.length || 0,
        completedStudents: route.studentPickups?.filter((s: any) => s.status === 'picked_up' || s.status === 'dropped_off').length || 0,
        duration: this.calculateDuration(route.startTime, route.endTime),
        date: new Date().toISOString(),
        studentPickups: route.studentPickups
      };

      const existingHistory = this.getRouteHistory();
      const updatedHistory = [historyItem, ...existingHistory];
      
      // Manter apenas os últimos 100 registros para evitar sobrecarga
      const limitedHistory = updatedHistory.slice(0, 100);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedHistory));
      
      console.log('✅ Rota adicionada ao histórico:', {
        id: historyItem.id,
        driverName: historyItem.driverName,
        direction: historyItem.direction,
        duration: historyItem.duration
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar rota ao histórico:', error);
    }
  }

  // Obter todo o histórico de rotas
  getRouteHistory(): RouteHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar histórico de rotas:', error);
      return [];
    }
  }

  // Obter histórico de rotas de um dia específico
  getRouteHistoryByDate(date: Date): RouteHistoryItem[] {
    const allHistory = this.getRouteHistory();
    const targetDate = date.toDateString();
    
    return allHistory.filter(route => {
      const routeDate = new Date(route.date).toDateString();
      return routeDate === targetDate;
    });
  }

  // Obter histórico de rotas de hoje
  getTodayRouteHistory(): RouteHistoryItem[] {
    return this.getRouteHistoryByDate(new Date());
  }

  // Remover uma rota do histórico
  removeRouteFromHistory(routeId: string): boolean {
    try {
      const existingHistory = this.getRouteHistory();
      const updatedHistory = existingHistory.filter(route => route.id !== routeId);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
      
      console.log('🗑️ Rota removida do histórico:', routeId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover rota do histórico:', error);
      return false;
    }
  }

  // Limpar histórico antigo (rotas com mais de 30 dias)
  cleanOldHistory(): void {
    try {
      const allHistory = this.getRouteHistory();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentHistory = allHistory.filter(route => {
        const routeDate = new Date(route.date);
        return routeDate >= thirtyDaysAgo;
      });
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentHistory));
      
      const removedCount = allHistory.length - recentHistory.length;
      if (removedCount > 0) {
        console.log(`🧹 ${removedCount} rotas antigas removidas do histórico`);
      }
    } catch (error) {
      console.error('❌ Erro ao limpar histórico antigo:', error);
    }
  }

  // Calcular duração entre início e fim da rota
  private calculateDuration(startTime: string, endTime?: string): string {
    if (!endTime) return 'Em andamento';
    
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end.getTime() - start.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}min`;
      } else {
        return `${minutes}min`;
      }
    } catch (error) {
      console.error('❌ Erro ao calcular duração:', error);
      return 'N/A';
    }
  }

  // Obter estatísticas do histórico
  getHistoryStats(): {
    totalRoutes: number;
    todayRoutes: number;
    averageDuration: string;
    completionRate: number;
  } {
    const allHistory = this.getRouteHistory();
    const todayHistory = this.getTodayRouteHistory();
    
    const completedRoutes = allHistory.filter(route => route.endTime);
    const totalStudents = allHistory.reduce((sum, route) => sum + route.studentsCount, 0);
    const completedStudents = allHistory.reduce((sum, route) => sum + route.completedStudents, 0);
    
    // Calcular duração média (apenas rotas completas)
    let averageDurationMs = 0;
    if (completedRoutes.length > 0) {
      const totalDurationMs = completedRoutes.reduce((sum, route) => {
        if (route.startTime && route.endTime) {
          const start = new Date(`2000-01-01 ${route.startTime}`);
          const end = new Date(`2000-01-01 ${route.endTime}`);
          return sum + (end.getTime() - start.getTime());
        }
        return sum;
      }, 0);
      averageDurationMs = totalDurationMs / completedRoutes.length;
    }
    
    const avgHours = Math.floor(averageDurationMs / (1000 * 60 * 60));
    const avgMinutes = Math.floor((averageDurationMs % (1000 * 60 * 60)) / (1000 * 60));
    const averageDuration = avgHours > 0 ? `${avgHours}h ${avgMinutes}min` : `${avgMinutes}min`;
    
    return {
      totalRoutes: allHistory.length,
      todayRoutes: todayHistory.length,
      averageDuration,
      completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0
    };
  }
}

export const routeHistoryService = RouteHistoryService.getInstance();
export type { RouteHistoryItem };