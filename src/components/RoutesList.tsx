
import { Edit, Play, Trash2, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Route } from '@/types/driver';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useState } from 'react';

interface RoutesListProps {
  routes: Route[];
  onEdit: (route: Route) => void;
  onStart: (routeId: string) => void;
  onDelete: (routeId: string) => void;
  hasActiveTrip: boolean;
  onBack: () => void;
  onExecuteRoute: (routeId: string) => void;
}

const weekDayLabels: Record<string, string> = {
  'Mon': 'Seg',
  'Tue': 'Ter',
  'Wed': 'Qua',
  'Thu': 'Qui',
  'Fri': 'Sex',
  'Sat': 'Sáb',
  'Sun': 'Dom'
};

export const RoutesList = ({ 
  routes, 
  onEdit, 
  onStart, 
  onDelete, 
  hasActiveTrip, 
  onBack,
  onExecuteRoute 
}: RoutesListProps) => {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRouteClick = (route: Route) => {
    console.log('Route clicked:', route.name);
    setSelectedRoute(route);
    setDrawerOpen(true);
  };

  const handleExecuteRoute = () => {
    if (selectedRoute) {
      console.log('Executing route:', selectedRoute.name);
      onExecuteRoute(selectedRoute.id);
      setDrawerOpen(false);
      setSelectedRoute(null);
    }
  };

  const handleEditRoute = () => {
    if (selectedRoute) {
      console.log('Editing route:', selectedRoute.name);
      onEdit(selectedRoute);
      setDrawerOpen(false);
      setSelectedRoute(null);
    }
  };

  const handleCancelRoute = () => {
    console.log('Canceling route menu');
    setDrawerOpen(false);
    setSelectedRoute(null);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Minhas Rotas</h1>
      </div>
      
      {routes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma rota cadastrada</p>
          <p className="text-sm">Cadastre sua primeira rota na aba "Rotas"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => (
            <div key={route.id}>
              <div 
                onClick={() => handleRouteClick(route)}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{route.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {route.startTime}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {route.students.length} alunos
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {route.weekDays.map((day) => (
                    <span
                      key={day}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                    >
                      {weekDayLabels[day]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-semibold"
            >
              Executar rota
            </Button>

            <Button
              onClick={handleCancelRoute}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-4 text-lg font-semibold"
            >
              Cancelar
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
