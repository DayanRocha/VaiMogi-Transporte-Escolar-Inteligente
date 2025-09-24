
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
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white/80 to-white/95 backdrop-blur-xl border-t border-gray-200/30 px-4 py-3 z-50 safe-area shadow-2xl">
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
                "flex flex-col items-center gap-1 px-4 py-2 rounded-3xl transition-all duration-300 ease-out relative group min-h-[50px] min-w-[50px] focus:outline-none focus:ring-2 focus:ring-orange-500/50",
                isActive 
                  ? "text-orange-600 bg-gradient-to-r from-orange-50 to-orange-100 shadow-lg scale-105 ring-2 ring-orange-200/50" 
                  : "text-gray-700 hover:text-orange-600 hover:bg-white/60 hover:shadow-md hover:scale-105 hover:ring-1 hover:ring-orange-200/30",
                showTripIndicator && "animate-pulse"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-7 h-7 transition-all duration-300 ease-out group-hover:scale-110", 
                  showTripIndicator && "text-orange-600",
                  isActive && "text-orange-600 scale-110 drop-shadow-sm"
                )} />
              </div>
              <span className={cn(
                "text-xs font-semibold tracking-wide transition-all duration-300 opacity-90",
                isActive ? "text-orange-600 drop-shadow-sm" : "text-gray-600 group-hover:text-orange-600"
              )}>{tab.label}</span>
              {showTripIndicator && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-bounce shadow-lg border-2 border-white" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
