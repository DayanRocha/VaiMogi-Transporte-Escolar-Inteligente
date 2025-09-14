import { GuardianNotification } from '@/hooks/useGuardianData';
import { notificationService } from './notificationService';

export interface RealTimeNotification {
  id: string;
  guardianId: string;
  type: 'route_started' | 'van_arrived' | 'embarked' | 'at_school' | 'disembarked' | 'route_completed' | 'route_delayed' | 'arriving_soon';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  location?: {
    lat: number;
    lng: number;
  };
  studentId?: string;
  studentName?: string;
}

/**
 * Serviço de notificações em tempo real que utiliza:
 * - BroadcastChannel para comunicação entre abas
 * - Storage events para sincronização
 * - Polling otimizado para detecção de mudanças
 */
class RealTimeNotificationService {
  private static instance: RealTimeNotificationService;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: ((notification: GuardianNotification) => void)[] = [];
  private isInitialized = false;

  static getInstance(): RealTimeNotificationService {
    if (!RealTimeNotificationService.instance) {
      RealTimeNotificationService.instance = new RealTimeNotificationService();
    }
    return RealTimeNotificationService.instance;
  }

  // Inicializar serviço de tempo real
  init() {
    if (this.isInitialized) return;

    try {
      // Criar canal de broadcast para comunicação entre abas
      this.broadcastChannel = new BroadcastChannel('guardian-notifications');
      
      // Escutar mensagens de outras abas
      this.broadcastChannel.addEventListener('message', (event) => {
        if (event.data.type === 'new-notification') {
          console.log('📡 Notificação recebida via BroadcastChannel:', event.data.notification);
          this.notifyListeners(event.data.notification);
        } else if (event.data.type === 'heartbeat') {
          console.log('💓 Heartbeat recebido');
        } else if (event.data.type === 'sync-request') {
          console.log('🔄 Solicitação de sincronização recebida');
          this.handleSyncRequest();
        }
      });

      // Enviar heartbeat a cada 15 segundos para manter conexão ativa (mais frequente)
      setInterval(() => {
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({
            type: 'heartbeat',
            timestamp: Date.now()
          });
        }
      }, 15000);
      
      // Solicitar sincronização inicial
      setTimeout(() => {
        this.requestSync();
      }, 1000);

      // Escutar mudanças no localStorage de outras abas
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('guardianNotifications_')) {
          console.log('💾 Mudança detectada no localStorage:', event.key);
          this.handleStorageChange(event);
        }
      });

      // Escutar eventos customizados para notificações
      window.addEventListener('realTimeNotification', (event: any) => {
        const notification = event.detail;
        console.log('🔔 Evento customizado recebido:', notification.type);
        this.notifyListeners(notification);
      });

      this.isInitialized = true;
      console.log('🚀 Serviço de notificações em tempo real inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de tempo real:', error);
    }
  }

  // Adicionar listener
  addListener(callback: (notification: GuardianNotification) => void) {
    console.log('🔧 DEBUG: Tentando adicionar listener...');
    console.log('🔧 DEBUG: Listeners atuais antes da adição:', this.listeners.length);
    if (!this.listeners.includes(callback)) {
      this.listeners.push(callback);
      console.log('✅ DEBUG: Listener adicionado com sucesso, total:', this.listeners.length);
    } else {
      console.log('⚠️ DEBUG: Listener já existe, não adicionado');
    }
    
    // Inicializar se ainda não foi
    if (!this.isInitialized) {
      this.init();
    }
  }

  // Remover listener
  removeListener(callback: (notification: GuardianNotification) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notificar todos os listeners
  private notifyListeners(notification: GuardianNotification) {
    console.log('🔊 DEBUG: notifyListeners chamado para', this.listeners.length, 'listeners');
    this.listeners.forEach((listener, index) => {
      try {
        console.log(`🔊 DEBUG: Chamando listener ${index + 1}/${this.listeners.length}`);
        listener(notification);
        console.log(`✅ DEBUG: Listener ${index + 1} executado com sucesso`);
      } catch (error) {
        console.error(`❌ DEBUG: Erro ao notificar listener ${index + 1}:`, error);
      }
    });
    console.log('🔊 DEBUG: Todos os listeners foram processados');
  }

  // Enviar notificação em tempo real
  sendRealTimeNotification(notification: GuardianNotification) {
    try {
      console.log('🔊 DEBUG: sendRealTimeNotification chamado com:', notification);
      console.log('🔊 DEBUG: Número de listeners registrados:', this.listeners.length);
      
      // Enviar via BroadcastChannel para outras abas
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'new-notification',
          notification,
          timestamp: Date.now()
        });
        console.log('📡 DEBUG: Notificação enviada via BroadcastChannel');
      } else {
        console.log('⚠️ DEBUG: BroadcastChannel não disponível');
      }

      // Notificar listeners locais
      console.log('🔊 DEBUG: Notificando listeners locais...');
      this.notifyListeners(notification);
      console.log('✅ DEBUG: Listeners notificados com sucesso');
    } catch (error) {
      console.error('❌ DEBUG: Erro ao enviar notificação em tempo real:', error);
    }
  }

  // Lidar com mudanças no localStorage
  private handleStorageChange(event: StorageEvent) {
    if (!event.newValue || !event.key) return;

    try {
      const notifications = JSON.parse(event.newValue);
      if (Array.isArray(notifications) && notifications.length > 0) {
        // Pegar a notificação mais recente
        const latestNotification = notifications[0];
        
        // Verificar se é uma notificação nova (últimos 5 segundos)
        const notificationTime = new Date(latestNotification.timestamp).getTime();
        const now = Date.now();
        
        if (now - notificationTime < 5000) {
          console.log('🔄 Nova notificação detectada via storage event');
          this.notifyListeners(latestNotification);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar mudança no storage:', error);
    }
  }

  // Obter notificações para um responsável específico
  getNotificationsForGuardian(guardianId: string): RealTimeNotification[] {
    try {
      const stored = localStorage.getItem(`realTimeNotifications_${guardianId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error);
      return [];
    }
  }

  // Salvar notificações no localStorage
  private saveNotifications(guardianId: string, notifications: RealTimeNotification[]) {
    try {
      localStorage.setItem(`realTimeNotifications_${guardianId}`, JSON.stringify(notifications));
    } catch (error) {
      console.error('❌ Erro ao salvar notificações:', error);
    }
  }

  // Enviar notificação para responsável específico
  async sendNotification(notification: Omit<RealTimeNotification, 'id' | 'timestamp' | 'isRead'>) {
    const fullNotification: RealTimeNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      isRead: false
    };

    console.log('📨 Enviando notificação em tempo real:', {
      guardianId: notification.guardianId,
      type: notification.type,
      title: notification.title,
      timestamp: fullNotification.timestamp
    });

    // Salvar no localStorage
    const existing = this.getNotificationsForGuardian(notification.guardianId);
    const updated = [fullNotification, ...existing].slice(0, 50); // Manter apenas 50 mais recentes
    this.saveNotifications(notification.guardianId, updated);

    // Enviar em tempo real via BroadcastChannel
    this.sendRealTimeNotification(fullNotification as any);

    // Também disparar evento customizado para garantia
    this.dispatchCustomEvent(fullNotification);

    // Som será reproduzido apenas no lado do responsável via useGuardianData.ts
    // Removido daqui para evitar reprodução dupla e garantir que toque apenas para o responsável

    console.log('✅ Notificação processada para:', notification.guardianId, fullNotification.title);
  }

  // Enviar notificação genérica diretamente para um responsável específico
  async sendNotificationToGuardian(guardianId: string, payload: { type: string; details?: any }) {
    try {
      const { type, details } = payload;

      // Funções auxiliares para gerar título e mensagem da notificação
      const title = this.generateTitle(type, details);
      const message = this.generateMessage(type, details);

      await this.sendNotification({
        guardianId,
        type: type as any,
        title,
        message,
        location: details?.location,
        studentId: details?.studentId,
        studentName: details?.studentName
      });
    } catch (error) {
      console.error('❌ Erro ao enviar notificação para responsável:', error);
    }
  }

  // Gerar título da notificação com base no tipo
  private generateTitle(type: string, details?: any): string {
    const { direction } = details || {};
    
    switch (type) {
      case 'route_started':
        return 'Rota iniciada';
      case 'van_arrived':
        return 'Van chegou ao ponto de embarque';
      case 'embarked':
        return 'Estudante embarcado';
      case 'at_school':
        return 'Estudante desembarcado na escola';
      case 'disembarked':
        if (direction === 'to_school') {
          return 'Estudante desembarcado na escola';
        } else {
          return 'Estudante desembarcado em casa';
        }
      case 'route_completed':
        return 'Rota concluída';
      default:
        return 'Notificação';
    }
  }

  // Gerar mensagem da notificação com base no tipo
  private generateMessage(type: string, details?: any): string {
    const { studentName, location, direction } = details || {};

    switch (type) {
      case 'route_started':
        return direction === 'to_school'
          ? `A rota para a escola foi iniciada.`
          : `A rota de retorno para casa foi iniciada.`;
      case 'van_arrived':
        if (direction === 'to_home') {
          return studentName
            ? `A van chegou na escola para buscar ${studentName}.`
            : 'A van chegou na escola para buscar o estudante.';
        } else {
          return studentName
            ? `A van chegou ao ponto de embarque de ${studentName}.`
            : 'A van chegou ao ponto de embarque.';
        }
      case 'embarked':
        if (direction === 'to_school') {
          return studentName
            ? `${studentName} embarcou e está a caminho da escola.`
            : 'O estudante embarcou e está a caminho da escola.';
        } else {
          return studentName
            ? `${studentName} embarcou e está a caminho de casa.`
            : 'O estudante embarcou e está a caminho de casa.';
        }
      case 'at_school':
        return studentName
          ? `${studentName} foi desembarcado na escola.`
          : 'O estudante foi desembarcado na escola.';
      case 'disembarked':
        if (direction === 'to_school') {
          return studentName
            ? `${studentName} foi desembarcado na escola.`
            : 'O estudante foi desembarcado na escola.';
        } else {
          return studentName
            ? `${studentName} foi desembarcado em casa.`
            : 'O estudante foi desembarcado em casa.';
        }
      case 'route_completed':
        return 'A rota foi concluída.';
      default:
        return 'Você possui uma nova notificação.';
    }
  }

  // Disparar evento customizado para notificações
  private dispatchCustomEvent(notification: RealTimeNotification) {
    const event = new CustomEvent('realTimeNotification', {
      detail: notification
    });
    window.dispatchEvent(event);
    console.log('📡 Evento customizado disparado:', notification.type);
  }

  // Inscrever-se para notificações de um responsável
  subscribe(guardianId: string, callback: (notification: RealTimeNotification) => void): () => void {
    const wrappedCallback = (notification: GuardianNotification) => {
      // Converter GuardianNotification para RealTimeNotification se necessário
      if ('guardianId' in notification && notification.guardianId === guardianId) {
        callback(notification as any);
      }
    };

    this.addListener(wrappedCallback);

    return () => {
      this.removeListener(wrappedCallback);
    };
  }

  // Marcar notificação como lida
  markAsRead(notificationId: string, guardianId: string) {
    const notifications = this.getNotificationsForGuardian(guardianId);
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    this.saveNotifications(guardianId, updated);
  }

  // Excluir notificação
  deleteNotification(notificationId: string, guardianId: string) {
    const notifications = this.getNotificationsForGuardian(guardianId);
    const updated = notifications.filter(n => n.id !== notificationId);
    this.saveNotifications(guardianId, updated);
  }

  // Limpar notificações antigas (mais de 7 dias)
  cleanupOldNotifications() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Obter todas as chaves de notificações
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('realTimeNotifications_')
      );

      keys.forEach(key => {
        const notifications = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = notifications.filter((n: RealTimeNotification) => 
          new Date(n.timestamp) > sevenDaysAgo
        );
        
        if (filtered.length !== notifications.length) {
          localStorage.setItem(key, JSON.stringify(filtered));
          console.log(`🧹 Limpeza: ${notifications.length - filtered.length} notificações antigas removidas`);
        }
      });
    } catch (error) {
      console.error('❌ Erro na limpeza de notificações:', error);
    }
  }

  // Solicitar sincronização de outras abas
  private requestSync() {
    if (this.broadcastChannel) {
      console.log('🔄 Solicitando sincronização de outras abas...');
      this.broadcastChannel.postMessage({
        type: 'sync-request',
        timestamp: Date.now()
      });
    }
  }
  
  // Lidar com solicitação de sincronização
  private handleSyncRequest() {
    // Verificar se há notificações recentes para compartilhar
    const recentNotifications = this.getRecentNotifications();
    if (recentNotifications.length > 0) {
      console.log('🔄 Compartilhando notificações recentes:', recentNotifications.length);
      recentNotifications.forEach(notification => {
        this.sendRealTimeNotification(notification);
      });
    }
  }
  
  // Obter notificações recentes (últimos 5 minutos)
  private getRecentNotifications(): GuardianNotification[] {
    try {
      const allNotifications: GuardianNotification[] = [];
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      // Verificar todas as chaves de notificações no localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('guardianNotifications_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const notifications = JSON.parse(stored);
            const recentOnes = notifications.filter((n: GuardianNotification) => {
              const notificationTime = new Date(n.timestamp).getTime();
              return notificationTime > fiveMinutesAgo;
            });
            allNotifications.push(...recentOnes);
          }
        }
      }
      
      return allNotifications;
    } catch (error) {
      console.error('❌ Erro ao obter notificações recentes:', error);
      return [];
    }
  }

  // Limpar recursos
  destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    
    this.listeners = [];
    this.isInitialized = false;
    console.log('🧹 Serviço de notificações em tempo real destruído');
  }
}

export const realTimeNotificationService = RealTimeNotificationService.getInstance();
