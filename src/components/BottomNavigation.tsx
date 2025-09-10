
import { User, Truck, Route, Users, Navigation, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasActiveTrip?: boolean;
}

const tabs = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'van', label: 'Van', icon: Truck },
  { id: 'routes', label: 'Rotas', icon: Route },
  { id: 'trip', label: 'Viagem', icon: Navigation }
];

export const BottomNavigation = ({ activeTab, onTabChange, hasActiveTrip }: BottomNavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 px-4 py-3 z-50 safe-area shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isTrip = tab.id === 'trip';
          const showTripIndicator = isTrip && hasActiveTrip;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 relative transform active:scale-95 min-h-[44px] min-w-[44px]",
                isActive 
                  ? "text-orange-500 bg-orange-50 shadow-md scale-105" 
                  : "text-gray-600 hover:text-orange-500 hover:bg-gray-50",
                showTripIndicator && "animate-pulse"
              )}
            >
              <Icon className={cn(
                "w-6 h-6 transition-all duration-200", 
                showTripIndicator && "text-orange-500",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>{tab.label}</span>
              {showTripIndicator && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-lg" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
