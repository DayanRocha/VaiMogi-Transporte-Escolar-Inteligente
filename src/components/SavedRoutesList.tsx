import { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Route } from '@/types/driver';

interface SavedRoutesListProps {
  routes: Route[];
  onAddRoute: () => void;
  onExecuteRoute: (route: Route) => void;
  onEditRoute: (route: Route) => void;
  onDeleteRoute: (routeId: string) => void;
  onBack: () => void;
}

export const SavedRoutesList = ({
  routes,
  onAddRoute,
  onExecuteRoute,
  onEditRoute,
  onDeleteRoute,
  onBack
}: SavedRoutesListProps) => {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRouteClick = (route: Route) => {
    setSelectedRoute(route);
    setDrawerOpen(true);
  };

  const handleExecuteRoute = () => {
    if (selectedRoute) {
      onExecuteRoute(selectedRoute);
      setDrawerOpen(false);
      setSelectedRoute(null);
    }
  };

  const handleEditRoute = () => {
    if (selectedRoute) {
      onEditRoute(selectedRoute);
      setDrawerOpen(false);
      setSelectedRoute(null);
    }
  };

  const handleCancel = () => {
    setDrawerOpen(false);
    setSelectedRoute(null);
  };

  const handleDeleteRoute = () => {
    if (selectedRoute) {
      if (window.confirm(`Tem certeza que deseja excluir a rota "${selectedRoute.name}"?`)) {
        onDeleteRoute(selectedRoute.id);
        setDrawerOpen(false);
        setSelectedRoute(null);
      }
    }
  };

  const getRouteInitials = (routeName: string) => {
    return routeName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const formatWeekDays = (weekDays: string[]) => {
    const dayMap: Record<string, string> = {
      'monday': 'Seg',
      'tuesday': 'Ter',
      'wednesday': 'Qua',
      'thursday': 'Qui',
      'friday': 'Sex',
      'saturday': 'Sáb',
      'sunday': 'Dom'
    };
    
    return weekDays.map(day => dayMap[day] || day).join(', ');
  };

  const getCircleColor = (index: number) => {
    const colors = [
      'bg-green-500',
      'bg-blue-500', 
      'bg-gray-500',
      'bg-orange-500',
      'bg-purple-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold text-xl">Suas Rotas</h1>
        </div>
        <button
          onClick={onAddRoute}
          className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
        >
          <Plus className="w-5 h-5 text-orange-500" />
        </button>
      </div>

      {/* Routes List */}
      <div className="bg-gray-100 min-h-screen rounded-t-3xl p-4">
        {routes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhuma rota cadastrada</p>
            <p className="text-sm">Clique no + para criar sua primeira rota</p>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((route, index) => (
              <div
                key={route.id}
                onClick={() => handleRouteClick(route)}
                className="bg-white rounded-lg p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${getCircleColor(index)} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">
                      {getRouteInitials(route.name)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{route.name}</h3>
                    <p className="text-sm text-gray-500">
                      {route.startTime} - {formatWeekDays(route.weekDays)}
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 text-xl">›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Route Actions Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[400px]">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-xl font-bold text-gray-800">
              {selectedRoute?.name}
            </DrawerTitle>
          </DrawerHeader>

          <div className="p-4 space-y-3">
            <Button
              onClick={handleExecuteRoute}
              className="w-full py-4 text-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 transition-all duration-200"
            >
              Executar rota
            </Button>

            <Button
              onClick={handleDeleteRoute}
              className="w-full py-4 text-lg font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 transition-all duration-200"
            >
              Excluir rota
            </Button>

            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full py-4 text-lg font-semibold border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition-all duration-200"
            >
              Cancelar
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};