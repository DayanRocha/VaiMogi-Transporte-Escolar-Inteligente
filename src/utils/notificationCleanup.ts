// Utilitário para limpeza de notificações duplicadas

export const cleanupDuplicateNotifications = () => {
  try {
    // Limpar notificações em tempo real duplicadas
    const realTimeKey = 'realTimeNotifications';
    const realTimeData = localStorage.getItem(realTimeKey);
    
    if (realTimeData) {
      const notifications = JSON.parse(realTimeData);
      const uniqueNotifications = notifications.filter((notification: any, index: number, array: any[]) => {
        // Manter apenas a primeira ocorrência de cada notificação única
        return array.findIndex(n => 
          n.type === notification.type &&
          n.message === notification.message &&
          Math.abs(new Date(n.timestamp).getTime() - new Date(notification.timestamp).getTime()) < 5000
        ) === index;
      });

      if (uniqueNotifications.length !== notifications.length) {
        localStorage.setItem(realTimeKey, JSON.stringify(uniqueNotifications));
        console.log(`🧹 Removidas ${notifications.length - uniqueNotifications.length} notificações duplicadas`);
      }
    }

    // Limpar notificações muito antigas (mais de 7 dias)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (realTimeData) {
      const notifications = JSON.parse(realTimeData);
      const recentNotifications = notifications.filter((n: any) => 
        new Date(n.timestamp) > sevenDaysAgo
      );

      if (recentNotifications.length !== notifications.length) {
        localStorage.setItem(realTimeKey, JSON.stringify(recentNotifications));
        console.log(`🧹 Removidas ${notifications.length - recentNotifications.length} notificações antigas`);
      }
    }

  } catch (error) {
    console.error('Erro ao limpar notificações:', error);
  }
};

// Executar limpeza automaticamente
export const initNotificationCleanup = () => {
  // Limpeza inicial
  cleanupDuplicateNotifications();
  
  // Limpeza periódica a cada 5 minutos
  setInterval(cleanupDuplicateNotifications, 5 * 60 * 1000);
};