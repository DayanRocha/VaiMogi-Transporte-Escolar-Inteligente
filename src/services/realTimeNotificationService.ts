import { GuardianNotification } from '@/hooks/useGuardianData';
import { notificationService } from './notificationService';

export interface RealTimeNotification {
  id: string;
  guardianId: string;
  type: 'route_started' | 'arrived_at_location' | 'student_picked_up' | 'student_dropped_off' | 'route_completed' | 'route_delayed' | 'arriving_soon';
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
        }
      });

      // Enviar heartbeat a cada 30 segundos para manter conexão ativa
      setInterval(() => {
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({
            type: 'heartbeat',
            timestamp: Date.now()
          });
        }
      }, 30000);

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
    this.listeners.push(callback);
    
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
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('❌ Erro ao notificar listener:', error);
      }
    });
  }

  // Enviar notificação em tempo real
  sendRealTimeNotification(notification: GuardianNotification) {
    try {
      // Enviar via BroadcastChannel para outras abas
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'new-notification',
          notification,
          timestamp: Date.now()
        });
        console.log('📡 Notificação enviada via BroadcastChannel');
      }

      // Notificar listeners locais
      this.notifyListeners(notification);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação em tempo real:', error);
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
  sendNotification(notification: Omit<RealTimeNotification, 'id' | 'timestamp' | 'isRead'>) {
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

    console.log('✅ Notificação processada para:', notification.guardianId, fullNotification.title);
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
