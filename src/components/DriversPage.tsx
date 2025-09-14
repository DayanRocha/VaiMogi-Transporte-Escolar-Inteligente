
import { Users, Truck, Route, Settings, Navigation, ArrowLeft, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DriversPageProps {
  onTabChange: (tab: string) => void;
  onBack: () => void;
  onClientsClick?: () => void;
  onDriversClick?: () => void;
  onSettingsClick?: () => void;
  onTripClick?: () => void;
  onRoutesClick?: () => void;
  onLogout?: () => void;
  activeTopButton?: 'clients' | 'drivers' | 'settings' | 'trip' | null;
  hasActiveTrip?: boolean;
}

export const DriversPage = ({ 
  onTabChange, 
  onBack, 
  onClientsClick, 
  onDriversClick, 
  onSettingsClick,
  onTripClick,
  onRoutesClick,
  onLogout,
  activeTopButton,
  hasActiveTrip 
}: DriversPageProps) => {
  const menuItems = [
    {
      id: 'profile',
      title: 'Motoristas',
      icon: Users,
      description: 'Perfil do motorista'
    },
    {
      id: 'van',
      title: 'Vans', 
      icon: Truck,
      description: 'Informações da van'
    },
    {
      id: 'routes-list',
      title: 'Rotas',
      icon: Route,
      description: 'Gerenciar rotas'
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <div className="w-12"></div> {/* Spacer for centering */}
        <img 
          src="/lovable-uploads/13ad1463-722e-40c8-b16d-03c288d5ef24.png" 
          alt="Logo" 
          className="w-32 h-32 object-contain"
        />
        <button 
          onClick={onLogout}
          className="w-12 h-12 rounded-xl bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
          title="Sair"
        >
          <LogOut className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Top Icons - Always visible */}
      <div className="flex justify-center gap-6 px-4 mb-8">
        <button 
          className={`w-16 h-16 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors ${
            activeTopButton === 'clients' ? 'bg-white/40 shadow-lg' : 'bg-white/20'
          }`}
          onClick={onClientsClick}
        >
          <Users className="w-8 h-8 text-white" />
        </button>
        <button 
          className={`w-16 h-16 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors ${
            activeTopButton === 'drivers' ? 'bg-white/40 shadow-lg' : 'bg-white/20'
          }`}
          onClick={onDriversClick}
        >
          <Truck className="w-8 h-8 text-white" />
        </button>
        <button 
          className={`w-16 h-16 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors relative ${
            activeTopButton === 'trip' ? 'bg-white/40 shadow-lg' : 'bg-white/20'
          }`}
          onClick={onTripClick}
        >
          <Navigation className="w-8 h-8 text-white" />
          {hasActiveTrip && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </button>
        <button 
          className={`w-16 h-16 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors ${
            activeTopButton === 'settings' ? 'bg-white/40 shadow-lg' : 'bg-white/20'
          }`}
          onClick={onSettingsClick}
        >
          <Settings className="w-8 h-8 text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="px-4">
        <h2 className="text-white text-lg font-medium mb-6">Sobre os motoristas</h2>
        
        <div className="space-y-4">
          {menuItems.map((item) => (
            <Card 
              key={item.id}
              className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                if (item.id === 'routes-list' && onRoutesClick) {
                  onRoutesClick();
                } else {
                  onTabChange(item.id);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-800 font-medium text-lg">{item.title}</span>
                </div>
                <div className="text-gray-400 text-xl">
                  <span>›</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
