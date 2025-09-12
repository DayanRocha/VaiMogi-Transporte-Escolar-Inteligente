
import { useState, useEffect, useCallback } from 'react';
import { realTimeNotificationService, RealTimeNotification } from '@/services/realTimeNotificationService';
import { audioService } from '@/services/audioService';

export const useRealTimeNotifications = (guardianId: string) => {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Carregar notificações existentes
  useEffect(() => {
    const existingNotifications = realTimeNotificationService.getNotificationsForGuardian(guardianId);
    setNotifications(existingNotifications);
    setUnreadCount(existingNotifications.filter(n => !n.isRead).length);
  }, [guardianId]);

  // Callback para processar nova notificação
  const handleNewNotification = useCallback(async (notification: RealTimeNotification) => {
    console.log('🔔 Nova notificação recebida:', notification.title);

    // Verificar se já existe para evitar duplicação
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        console.log('⚠️ Notificação duplicada ignorada:', notification.id);
        return prev;
      }
      
      // Adicionar nova notificação
      setUnreadCount(prevCount => prevCount + 1);
      return [notification, ...prev];
    });

    // Tocar som de notificação personalizado pelo tipo\n    try {\n      await audioService.playNotificationSound(notification.type as NotificationSoundType);\n    } catch (error) {\n      console.warn('Não foi possível tocar som de notificação:', error);\n    }

    // Mostrar notificação do browser (se permitido)
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/vai-mogi.png',
        tag: notification.id,
        requireInteraction: true, // Manter visível até interação
        silent: false
      });
      
      // Auto-fechar após 10 segundos
      setTimeout(() => {
        browserNotification.close();
      }, 10000);
      
      console.log('🔔 Notificação do browser exibida:', notification.title);
    } else if ('Notification' in window && Notification.permission === 'default') {
      // Tentar solicitar permissão novamente
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/vai-mogi.png',
            tag: notification.id
          });
        }
      });
    }

    // Vibrar dispositivo (se suportado)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  // Inscrever-se para notificações em tempo real
  useEffect(() => {
    console.log('🔔 Configurando listeners de notificação para:', guardianId);
    
    // Método 1: Serviço de notificações
    const unsubscribe = realTimeNotificationService.subscribe(guardianId, handleNewNotification);
    
    // Método 2: Listener direto para eventos customizados
    const handleCustomEvent = (event: any) => {
      const notification = event.detail;
      if (notification.guardianId === guardianId) {
        console.log('🔔 Notificação recebida via evento customizado:', notification.title);
        handleNewNotification(notification);
      }
    };
    
    window.addEventListener('realTimeNotification', handleCustomEvent);
    
    // Método 3: Polling para garantir sincronização
    const pollingInterval = setInterval(() => {
      const currentNotifications = realTimeNotificationService.getNotificationsForGuardian(guardianId);
      const latestNotification = currentNotifications[0];
      
      if (latestNotification && !notifications.some(n => n.id === latestNotification.id)) {
        console.log('🔄 Nova notificação detectada via polling:', latestNotification.title);
        handleNewNotification(latestNotification);
      }
    }, 2000); // Verificar a cada 2 segundos
    
    // Solicitar permissão para notificações do browser
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Permissão de notificação:', permission);
      });
    }

    // Limpeza automática de notificações antigas
    realTimeNotificationService.cleanupOldNotifications();

    return () => {
      unsubscribe();
      window.removeEventListener('realTimeNotification', handleCustomEvent);
      clearInterval(pollingInterval);
      console.log('🧹 Listeners de notificação removidos para:', guardianId);
    };
  }, [guardianId, handleNewNotification, notifications]);

  // Marcar notificação como lida
  const markAsRead = useCallback((notificationId: string) => {
    realTimeNotificationService.markAsRead(notificationId, guardianId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [guardianId]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    notifications.forEach(n => {
      if (!n.isRead) {
        realTimeNotificationService.markAsRead(n.id, guardianId);
      }
    });
    
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, [notifications, guardianId]);

  // Excluir notificação
  const deleteNotification = useCallback((notificationId: string) => {
    realTimeNotificationService.deleteNotification(notificationId, guardianId);
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.isRead ? Math.max(0, prev - 1) : prev;
    });
  }, [guardianId, notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};
