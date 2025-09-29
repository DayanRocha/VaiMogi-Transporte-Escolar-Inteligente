
import { Users, UserCheck, School, Settings, Truck, Navigation, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ClientsPageProps {
  onTabChange: (tab: string) => void;
  onBack: () => void;
  onClientsClick?: () => void;
  onDriversClick?: () => void;
  onSettingsClick?: () => void;
  onTripClick?: () => void;
  onLogout?: () => void;
  activeTopButton?: 'clients' | 'drivers' | 'settings' | 'trip' | null;
  hasActiveTrip?: boolean;
}

export const ClientsPage = ({ 
  onTabChange, 
  onBack, 
  onClientsClick, 
  onDriversClick, 
  onSettingsClick,
  onTripClick,
  onLogout,
  activeTopButton,
  hasActiveTrip 
}: ClientsPageProps) => {
  const menuItems = [
    {
      id: 'schools',
      title: 'Escolas',
      icon: School,
      description: 'Cadastre primeiro as escolas',
      step: '1º'
    },
    {
      id: 'guardians',
      title: 'Responsáveis', 
      icon: UserCheck,
      description: 'Cadastre os responsáveis dos alunos',
      step: '2º'
    },
    {
      id: 'students',
      title: 'Estudantes',
      icon: Users,
      description: 'Por último, cadastre os estudantes',
      step: '3º'
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

      {/* Top Icons - Modern glass buttons */}
      <div className="flex justify-center gap-6 px-4 mb-8">
        <button
          aria-label="Responsáveis"
          className={`w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-sm transition-all duration-200 bg-white/15 hover:bg-white/25 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500 ${
            activeTopButton === 'clients' ? 'bg-white/35 shadow-xl ring-2 ring-white/40' : ''
          }`}
          onClick={onClientsClick}
        >
          <Users className="w-8 h-8 text-white drop-shadow" />
        </button>
        <button
          aria-label="Motoristas"
          className={`w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-sm transition-all duration-200 bg-white/15 hover:bg-white/25 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500 ${
            activeTopButton === 'drivers' ? 'bg-white/35 shadow-xl ring-2 ring-white/40' : ''
          }`}
          onClick={onDriversClick}
        >
          <Truck className="w-8 h-8 text-white drop-shadow" />
        </button>
        <button
          aria-label="Rotas"
          className={`relative w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-sm transition-all duration-200 bg-white/15 hover:bg-white/25 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500 ${
            activeTopButton === 'trip' ? 'bg-white/35 shadow-xl ring-2 ring-white/40' : ''
          }`}
          onClick={onTripClick}
        >
          <Navigation className="w-8 h-8 text-white drop-shadow" />
          {hasActiveTrip && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </button>
        <button
          aria-label="Configurações"
          className={`w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-sm transition-all duration-200 bg-white/15 hover:bg-white/25 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500 ${
            activeTopButton === 'settings' ? 'bg-white/35 shadow-xl ring-2 ring-white/40' : ''
          }`}
          onClick={onSettingsClick}
        >
          <Settings className="w-8 h-8 text-white drop-shadow" />
        </button>
      </div>

      {/* Main Content */}
      <div className="px-4">
        <h2 className="text-white text-lg font-medium mb-4">*CONFIGURAÇÃO INICIAL*</h2>
        
        {/* Instrução */}
        <div className="bg-white/25 backdrop-blur-sm border border-white/800 rounded-2xl p-5 mb-4 shadow-lg">
          <p className="text-neutral-800 text-base leading-relaxed font-medium">
            Para começar, recomendamos seguir esta ordem de cadastro para uma melhor organização:
          </p>
        </div>
        
        <div className="space-y-4">
          {menuItems.map((item) => (
            <Card 
              key={item.id}
              className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onTabChange(item.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                        {item.step}
                      </span>
                      <span className="text-gray-800 font-medium text-lg">{item.title}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                  </div>
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
