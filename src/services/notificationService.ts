import { GuardianNotification } from '@/hooks/useGuardianData';
import { TripStudent, Student, School } from '@/types/driver';
import { audioService, NotificationSoundType } from '@/services/audioService';
import { routeTrackingService } from '@/services/routeTrackingService';
// Removido: import { mockDriverMovement } from '@/services/mockLocationService';
import { realTimeNotificationService } from '@/services/realTimeNotificationService';
// Remover duplicação: import { Student } from '@/types/driver';

export interface NotificationEvent {
  type: 'route_started' | 'van_arrived' | 'embarked' | 'at_school' | 'disembarked' | 'route_finished';
  studentId: string;
  studentName: string;
  direction: 'to_school' | 'to_home';
  location?: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  schoolName?: string;
  address?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private listeners: ((notification: GuardianNotification) => void)[] = [];
  private realTimePollingInterval: NodeJS.Timeout | null = null;
  private isRealTimeEnabled = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Obter ID do responsável logado
  private getCurrentGuardianId(): string {
    try {
      const guardianData = localStorage.getItem('guardianData');
      if (guardianData) {
        const parsed = JSON.parse(guardianData);
        return parsed.id || 'default';
      }
    } catch (error) {
      console.error('❌ Erro ao obter ID do responsável:', error);
    }
    return 'default';
  }

  // Gerar chave única para notificações do responsável
  private getNotificationKey(guardianId: string): string {
    return `guardianNotifications_${guardianId}`;
  }

  // Adicionar listener para receber notificações
  addListener(callback: (notification: GuardianNotification) => void) {
    this.listeners.push(callback);
    // Iniciar polling em tempo real quando há listeners
    this.startRealTimePolling();
  }

  // Remover listener
  removeListener(callback: (notification: GuardianNotification) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
    // Parar polling se não há mais listeners
    if (this.listeners.length === 0) {
      this.stopRealTimePolling();
    }
  }

  // Iniciar polling em tempo real para verificar mudanças
  private startRealTimePolling() {
    if (this.isRealTimeEnabled || this.realTimePollingInterval) return;
    
    this.isRealTimeEnabled = true;
    console.log('🔄 Iniciando polling em tempo real para notificações');
    
    // Verificar mudanças a cada 1 segundo para máxima responsividade
    this.realTimePollingInterval = setInterval(() => {
      this.checkForNewNotifications();
    }, 1000);
  }

  // Parar polling em tempo real
  private stopRealTimePolling() {
    if (this.realTimePollingInterval) {
      clearInterval(this.realTimePollingInterval);
      this.realTimePollingInterval = null;
    }
    this.isRealTimeEnabled = false;
    console.log('⏹️ Polling em tempo real parado');
  }

  // Verificar se há novas notificações no localStorage
  private checkForNewNotifications() {
    try {
      const guardianId = this.getCurrentGuardianId();
      const notificationKey = this.getNotificationKey(guardianId);
      const stored = localStorage.getItem(notificationKey);
      
      if (stored) {
        const notifications = JSON.parse(stored);
        const lastCheckKey = `lastNotificationCheck_${guardianId}`;
        const lastCheck = localStorage.getItem(lastCheckKey);
        const lastCheckTime = lastCheck ? parseInt(lastCheck) : 0;
        
        // Verificar se há notificações mais recentes que a última verificação
        const newNotifications = notifications.filter((notification: GuardianNotification) => {
          const notificationTime = new Date(notification.timestamp).getTime();
          return notificationTime > lastCheckTime;
        });
        
        if (newNotifications.length > 0) {
          // Atualizar timestamp da última verificação
          localStorage.setItem(lastCheckKey, Date.now().toString());
          
          // Notificar sobre as novas notificações (mais recente primeiro)
          newNotifications.reverse().forEach((notification: GuardianNotification) => {
            console.log('📱 Nova notificação detectada em tempo real:', notification.message);
            this.notifyListeners(notification);
          });
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar novas notificações:', error);
    }
  }

  // Enviar notificação para todos os listeners
  private notifyListeners(notification: GuardianNotification) {
    this.listeners.forEach(listener => listener(notification));
  }

  // Criar mensagem baseada no tipo de evento
  private createMessage(event: NotificationEvent): string {
    const { type, studentName, direction, schoolName, address } = event;
    
    switch (type) {
      case 'route_started':
        return direction === 'to_school' 
          ? `Rota iniciada! ${studentName} será buscado em casa`
          : `Rota de volta iniciada! ${studentName} será levado para casa`;
          
      case 'van_arrived':
        return direction === 'to_school'
          ? `A van chegou no ponto de embarque de ${studentName}`
          : `A van chegou na escola para buscar ${studentName}`;
          
      case 'embarked':
        return direction === 'to_school'
          ? `${studentName} embarcou na van e está a caminho da escola`
          : `${studentName} embarcou na van e está a caminho de casa`;
          
      case 'at_school':
        return `${studentName} chegou na escola ${schoolName || ''}`;
        
      case 'disembarked':
        return direction === 'to_school'
          ? `${studentName} foi desembarcado na escola ${schoolName || ''}`
          : `${studentName} foi desembarcado em casa`;
          
      case 'route_finished':
        return direction === 'to_school'
          ? `Rota da manhã finalizada. Todos os alunos foram entregues na escola`
          : `Rota da tarde finalizada. Todos os alunos foram entregues em casa`;
          
      default:
        return `Atualização sobre ${studentName}`;
    }
  }

  // Mapear tipo de evento para tipo de notificação
  private mapEventToNotificationType(eventType: NotificationEvent['type']): GuardianNotification['type'] {
    switch (eventType) {
      case 'van_arrived':
        return 'van_arrived';
      case 'embarked':
        return 'embarked';
      case 'at_school':
        return 'at_school';
      case 'disembarked':
        return 'disembarked';
      default:
        return 'van_arrived'; // padrão conservador quando não identificado
    }
  }

  // Método principal para enviar notificação para responsável específico
  async sendNotification(event: NotificationEvent, targetGuardianId?: string) {
    console.log('📱 Enviando notificação:', event);
    
    const notification: GuardianNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: this.mapEventToNotificationType(event.type),
      studentName: event.studentName,
      message: this.createMessage(event),
      timestamp: event.timestamp,
      isRead: false,
      location: event.location
    };

    // Se um responsável específico foi fornecido, salvar apenas para ele
    if (targetGuardianId) {
      this.saveNotificationForGuardian(notification, targetGuardianId);
    } else {
      // Caso contrário, salvar para o responsável atual (compatibilidade)
      this.saveNotificationToStorage(notification);
    }
    
    // Notificar todos os listeners (componentes que estão escutando)
    // O som será reproduzido apenas do lado do responsável
    this.notifyListeners(notification);
    
    // Enviar via serviço de tempo real para máxima responsividade
    realTimeNotificationService.sendRealTimeNotification(notification);
    
    console.log('✅ Notificação enviada:', notification);
  }

  // Salvar notificação para um responsável específico
  private saveNotificationForGuardian(notification: GuardianNotification, guardianId: string) {
    try {
      const notificationKey = this.getNotificationKey(guardianId);
      
      // Buscar notificações existentes do responsável específico
      const stored = localStorage.getItem(notificationKey);
      const existingNotifications = stored ? JSON.parse(stored) : [];
      
      const updatedNotifications = [notification, ...existingNotifications];
      
      // Manter apenas as últimas 50 notificações
      const limitedNotifications = updatedNotifications.slice(0, 50);
      
      localStorage.setItem(notificationKey, JSON.stringify(limitedNotifications));
      console.log(`💾 Notificação salva para responsável específico ${guardianId}:`, notification.message);
    } catch (error) {
      console.error('❌ Erro ao salvar notificação para responsável específico:', error);
    }
  }

  // Reproduzir som baseado no tipo de evento
  private async playNotificationSound(eventType: NotificationEvent['type']) {
    try {
      console.log(`🔊 NotificationService: Reproduzindo som para evento ${eventType}`);
      const soundType: NotificationSoundType = eventType as NotificationSoundType;
      await audioService.playNotificationSound(soundType);
      console.log(`✅ NotificationService: Som reproduzido para ${eventType}`);
    } catch (error) {
      console.warn('❌ NotificationService: Erro ao reproduzir som da notificação:', error);
    }
  }

  // Salvar notificação no localStorage específico do responsável
  private saveNotificationToStorage(notification: GuardianNotification) {
    try {
      const guardianId = this.getCurrentGuardianId();
      const notificationKey = this.getNotificationKey(guardianId);
      
      const existingNotifications = this.getStoredNotifications();
      const updatedNotifications = [notification, ...existingNotifications];
      
      // Manter apenas as últimas 50 notificações
      const limitedNotifications = updatedNotifications.slice(0, 50);
      
      localStorage.setItem(notificationKey, JSON.stringify(limitedNotifications));
      console.log(`💾 Notificação salva para responsável ${guardianId}:`, notification.message);
    } catch (error) {
      console.error('❌ Erro ao salvar notificação:', error);
    }
  }

  // Recuperar notificações do localStorage específicas do responsável
  getStoredNotifications(): GuardianNotification[] {
    try {
      const guardianId = this.getCurrentGuardianId();
      const notificationKey = this.getNotificationKey(guardianId);
      
      let stored = localStorage.getItem(notificationKey);
      let notifications = stored ? JSON.parse(stored) : [];
      
      // Migração: se não há notificações específicas do usuário, verificar se há notificações antigas globais
      if (notifications.length === 0) {
        const oldNotifications = localStorage.getItem('guardianNotifications');
        if (oldNotifications) {
          try {
            const oldData = JSON.parse(oldNotifications);
            if (oldData.length > 0) {
              console.log(`🔄 Migrando ${oldData.length} notificações antigas para responsável ${guardianId}`);
              
              // Salvar as notificações antigas para este usuário
              localStorage.setItem(notificationKey, JSON.stringify(oldData));
              notifications = oldData;
              
              // Remover notificações globais antigas após migração
              localStorage.removeItem('guardianNotifications');
              console.log('✅ Migração de notificações concluída');
            }
          } catch (migrationError) {
            console.error('❌ Erro na migração de notificações:', migrationError);
          }
        }
      }
      
      console.log(`📱 Carregadas ${notifications.length} notificações para responsável ${guardianId}`);
      return notifications;
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error);
      return [];
    }
  }

  // Marcar notificação como lida
  markAsRead(notificationId: string) {
    try {
      const guardianId = this.getCurrentGuardianId();
      const notificationKey = this.getNotificationKey(guardianId);
      
      const notifications = this.getStoredNotifications();
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      );
      
      localStorage.setItem(notificationKey, JSON.stringify(updatedNotifications));
      console.log(`✅ Notificação marcada como lida para responsável ${guardianId}:`, notificationId);
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
    }
  }

  // Excluir notificação individual
  deleteNotification(notificationId: string) {
    try {
      const guardianId = this.getCurrentGuardianId();
      const notificationKey = this.getNotificationKey(guardianId);
      
      const notifications = this.getStoredNotifications();
      const updatedNotifications = notifications.filter(notification => notification.id !== notificationId);
      
      localStorage.setItem(notificationKey, JSON.stringify(updatedNotifications));
      console.log(`🗑️ Notificação excluída para responsável ${guardianId}:`, notificationId);
    } catch (error) {
      console.error('❌ Erro ao excluir notificação:', error);
    }
  }

  // Excluir múltiplas notificações
  deleteNotifications(notificationIds: string[]) {
    try {
      const guardianId = this.getCurrentGuardianId();
      const notificationKey = this.getNotificationKey(guardianId);
      
      const notifications = this.getStoredNotifications();
      const updatedNotifications = notifications.filter(notification => !notificationIds.includes(notification.id));
      
      localStorage.setItem(notificationKey, JSON.stringify(updatedNotifications));
      console.log(`🗑️ ${notificationIds.length} notificações excluídas para responsável ${guardianId}`);
    } catch (error) {
      console.error('❌ Erro ao excluir notificações:', error);
    }
  }

  // Limpar todas as notificações do responsável atual
  clearAllNotifications() {
    const guardianId = this.getCurrentGuardianId();
    const notificationKey = this.getNotificationKey(guardianId);
    
    localStorage.removeItem(notificationKey);
    console.log(`🗑️ Todas as notificações foram removidas para responsável ${guardianId}`);
  }

  // Método administrativo: limpar notificações de todos os usuários
  clearAllUsersNotifications() {
    try {
      const keys = Object.keys(localStorage);
      const notificationKeys = keys.filter(key => key.startsWith('guardianNotifications_'));
      
      notificationKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Também remover notificações globais antigas se existirem
      localStorage.removeItem('guardianNotifications');
      
      console.log(`🗑️ Notificações removidas para ${notificationKeys.length} responsáveis`);
    } catch (error) {
      console.error('❌ Erro ao limpar notificações de todos os usuários:', error);
    }
  }

  // Buscar responsável de um estudante específico
  private findGuardianForStudent(studentId: string): string | null {
    try {
      const savedStudents = localStorage.getItem('students');
      if (savedStudents) {
        const students = JSON.parse(savedStudents);
        const student = students.find((s: any) => s.id === studentId);
        
        if (student && student.guardianId) {
          console.log(`👤 Responsável encontrado para estudante ${student.name || studentId}: ${student.guardianId}`);
          return student.guardianId;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar responsável do estudante:', error);
    }
    
    console.log(`⚠️ Responsável não encontrado para estudante ${studentId}`);
    return null;
  }

  // Métodos de conveniência para eventos específicos
  async notifyRouteStarted(studentId: string, studentName: string, direction: 'to_school' | 'to_home') {
    const guardianId = this.findGuardianForStudent(studentId);
    
    // Nota: O rastreamento de rota é iniciado no useDriverData.ts
    // Não iniciamos aqui para evitar duplicação
    
    await this.sendNotification({
      type: 'route_started',
      studentId,
      studentName,
      direction,
      timestamp: new Date().toISOString()
    }, guardianId || undefined);
  }

  async notifyVanArrived(studentId: string, studentName: string, direction: 'to_school' | 'to_home', location?: { lat: number; lng: number }) {
    const guardianId = this.findGuardianForStudent(studentId);
    
    await this.sendNotification({
      type: 'van_arrived',
      studentId,
      studentName,
      direction,
      location,
      timestamp: new Date().toISOString()
    }, guardianId || undefined);
  }

  async notifyEmbarked(studentId: string, studentName: string, direction: 'to_school' | 'to_home', location?: { lat: number; lng: number }) {
    const guardianId = this.findGuardianForStudent(studentId);
    
    // Atualizar status no rastreamento de rota
    routeTrackingService.updateStudentStatus(studentId, 'picked_up');
    console.log('🚌 Aluno embarcado - Transição para fase escola');
    
    await this.sendNotification({
      type: 'embarked',
      studentId,
      studentName,
      direction,
      location,
      timestamp: new Date().toISOString()
    }, guardianId || undefined);
  }

  async notifyAtSchool(studentId: string, studentName: string, schoolName: string, location?: { lat: number; lng: number }) {
    const guardianId = this.findGuardianForStudent(studentId);
    
    await this.sendNotification({
      type: 'at_school',
      studentId,
      studentName,
      direction: 'to_school',
      schoolName,
      location,
      timestamp: new Date().toISOString()
    }, guardianId || undefined);
  }

  async notifyDisembarked(studentId: string, studentName: string, direction: 'to_school' | 'to_home', schoolName?: string, address?: string, location?: { lat: number; lng: number }) {
    const guardianId = this.findGuardianForStudent(studentId);
    
    // Atualizar status no rastreamento de rota
    routeTrackingService.updateStudentStatus(studentId, 'dropped_off');
    console.log('🏫 Aluno desembarcado na escola');
    
    await this.sendNotification({
      type: 'disembarked',
      studentId,
      studentName,
      direction,
      schoolName,
      address,
      location,
      timestamp: new Date().toISOString()
    }, guardianId || undefined);
  }

  async notifyRouteFinished(direction: 'to_school' | 'to_home') {
    // Finalizar rastreamento de rota
    routeTrackingService.endRoute();
    console.log('🗺️ Rastreamento de rota finalizado');
    
    // Para notificação de fim de rota, enviar para todos os responsáveis ativos
    try {
      const savedGuardians = localStorage.getItem('guardians');
      if (savedGuardians) {
        const guardians = JSON.parse(savedGuardians);
        const activeGuardians = guardians.filter((g: any) => g.isActive !== false);
        
        // Enviar notificação para cada responsável ativo
        for (const guardian of activeGuardians) {
          await this.sendNotification({
            type: 'route_finished',
            studentId: 'all',
            studentName: 'Todos os alunos',
            direction,
            timestamp: new Date().toISOString()
          }, guardian.id);
        }
        
        console.log(`📢 Notificação de fim de rota enviada para ${activeGuardians.length} responsáveis`);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de fim de rota:', error);
      
      // Quando não houver ID específico, enviar notificação geral
      await this.sendNotification({
        type: 'route_finished',
        studentId: 'all',
        studentName: 'Todos os alunos',
        direction,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const notificationService = NotificationService.getInstance();