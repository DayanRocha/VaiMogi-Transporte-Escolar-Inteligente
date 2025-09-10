import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { realTimeNotificationService } from '@/services/realTimeNotificationService';

interface RealTimeIndicatorProps {
  className?: string;
}

export const RealTimeIndicator = ({ className = '' }: RealTimeIndicatorProps) => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    // Simular verificação de conectividade
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
      setLastUpdate(new Date());
    };

    // Verificar conectividade a cada 5 segundos
    const interval = setInterval(checkConnection, 5000);
    
    // Escutar mudanças de conectividade
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    // Escutar notificações para mostrar atividade
    const handleNotification = (notification: any) => {
      console.log('📊 RealTimeIndicator: Nova notificação recebida:', notification.type);
      setLastUpdate(new Date());
      setNotificationCount(prev => prev + 1);
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 1000);
    };

    realTimeNotificationService.addListener(handleNotification);

    // Escutar eventos customizados também
    const handleCustomEvent = (event: any) => {
      console.log('📊 RealTimeIndicator: Evento customizado recebido');
      handleNotification(event.detail);
    };

    window.addEventListener('realTimeNotification', handleCustomEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
      window.removeEventListener('realTimeNotification', handleCustomEvent);
      realTimeNotificationService.removeListener(handleNotification);
    };
  }, []);

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return 'agora';
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes}min atrás`;
    } else {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {/* Indicador de conectividade */}
      <div className="flex items-center gap-1">
        {isConnected ? (
          <Wifi 
            className={`w-4 h-4 text-green-500 ${
              pulseAnimation ? 'animate-pulse' : ''
            }`} 
          />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
        
        {/* Indicador de atividade */}
        <Activity 
          className={`w-3 h-3 ${
            isConnected ? 'text-green-400' : 'text-gray-400'
          } ${
            pulseAnimation ? 'animate-bounce' : ''
          }`} 
        />
      </div>

      {/* Status text */}
      <span className={`${
        isConnected ? 'text-green-600' : 'text-red-600'
      }`}>
        {isConnected ? 'Tempo Real' : 'Desconectado'}
      </span>

      {/* Notification count */}
      {notificationCount > 0 && (
        <span className="text-blue-600 font-medium">
          • {notificationCount}
        </span>
      )}

      {/* Última atualização */}
      <span className="text-gray-500">
        • {formatLastUpdate(lastUpdate)}
      </span>
    </div>
  );
};