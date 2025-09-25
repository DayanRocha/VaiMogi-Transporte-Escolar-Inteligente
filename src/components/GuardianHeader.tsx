import { Menu, Bell, LogOut } from 'lucide-react';
import { Guardian } from '@/types/driver';
import { GuardianNotification } from '@/hooks/useGuardianData';
import { RealTimeIndicator } from '@/components/RealTimeIndicator';

interface GuardianHeaderProps {
  guardian: Guardian;
  notifications: any[];
  unreadCount?: number;
  onMenuClick: () => void;
  onNotificationClick: () => void;
  onLogout: () => void;
}

export const GuardianHeader = ({ 
  guardian, 
  notifications, 
  unreadCount: propUnreadCount,
  onMenuClick, 
  onNotificationClick,
  onLogout 
}: GuardianHeaderProps) => {
  const unreadCount = propUnreadCount ?? notifications.filter(n => !n.isRead).length;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4">
      {/* Left side - Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            Olá, {guardian.name.split(' ')[0]}
          </h1>
          <p className="text-xs text-gray-500">Acompanhe a rota escolar</p>
        </div>
      </div>

      {/* Center - Real Time Indicator */}
      <div className="hidden sm:block">
        <RealTimeIndicator />
      </div>

      {/* Right side - Notifications, Permissions, Test Sound and Logout */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNotificationClick}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Notificações"
        >
          <Bell className="w-6 h-6 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        
        <button
          onClick={onLogout}
          className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut className="w-6 h-6 text-gray-600 hover:text-red-600" />
        </button>
      </div>
    </header>
  );
};