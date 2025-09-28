import React from 'react';
import { User, Truck, Route, Users, Navigation, Home, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationModernProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasActiveTrip?: boolean;
  notificationCount?: number;
}

const tabs = [
  { 
    id: 'home', 
    label: 'Início', 
    icon: Home,
    description: 'Página inicial'
  },
  { 
    id: 'profile', 
    label: 'Perfil', 
    icon: User,
    description: 'Meu perfil'
  },
  { 
    id: 'van', 
    label: 'Van', 
    icon: Truck,
    description: 'Dados da van'
  },
  { 
    id: 'routes', 
    label: 'Rotas', 
    icon: Route,
    description: 'Gerenciar rotas'
  },
  { 
    id: 'trip', 
    label: 'Viagem', 
    icon: Navigation,
    description: 'Viagem ativa'
  }
];

export const BottomNavigationModern: React.FC<BottomNavigationModernProps> = ({ 
  activeTab, 
  onTabChange, 
  hasActiveTrip = false,
  notificationCount = 0
}) => {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-neutral-200 shadow-2xl"
      role="navigation"
      aria-label="Navegação principal"
    >
      {/* Indicador de conexão */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-12 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full" />
      </div>

      <div className="container-responsive py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isTrip = tab.id === 'trip';
            const showTripIndicator = isTrip && hasActiveTrip;
            const showNotification = tab.id === 'home' && notificationCount > 0;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  // Base styles
                  "relative flex flex-col items-center gap-1 px-3 py-3 rounded-2xl",
                  "transition-all duration-300 ease-out group",
                  "min-h-[64px] min-w-[64px] touch-manipulation",
                  "focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2",
                  
                  // Active state
                  isActive && [
                    "text-orange-600 bg-gradient-to-br from-orange-50 to-orange-100",
                    "shadow-lg scale-105 ring-2 ring-orange-200/50",
                    "border border-orange-200/50"
                  ],
                  
                  // Inactive state
                  !isActive && [
                    "text-neutral-600 hover:text-orange-600",
                    "hover:bg-white/80 hover:shadow-md hover:scale-105",
                    "hover:ring-1 hover:ring-orange-200/30"
                  ],
                  
                  // Trip indicator animation
                  showTripIndicator && "animate-pulse"
                )}
                aria-label={`${tab.label} - ${tab.description}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon container */}
                <div className="relative">
                  <Icon 
                    className={cn(
                      "w-6 h-6 transition-all duration-300 ease-out",
                      "group-hover:scale-110",
                      isActive && "text-orange-600 scale-110 drop-shadow-sm",
                      showTripIndicator && "text-orange-600"
                    )} 
                  />
                  
                  {/* Active trip indicator */}
                  {showTripIndicator && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce shadow-lg border-2 border-white">
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                    </div>
                  )}
                  
                  {/* Notification badge */}
                  {showNotification && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </div>
                  )}
                </div>

                {/* Label */}
                <span 
                  className={cn(
                    "text-xs font-semibold tracking-wide transition-all duration-300",
                    isActive ? "text-orange-600 drop-shadow-sm" : "text-neutral-600 group-hover:text-orange-600"
                  )}
                >
                  {tab.label}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-600 rounded-full" />
                )}

                {/* Hover effect overlay */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  "bg-gradient-to-br from-orange-50/50 to-orange-100/30"
                )} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white/95" />
    </nav>
  );
};

export default BottomNavigationModern;