
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, Navigation } from 'lucide-react';
import { routeTrackingService } from '@/services/routeTrackingService';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { toast } from '@/hooks/use-toast';

export const ActiveTripExecution = () => {
  const { activeRoute, hasActiveRoute, driverLocation, nextDestination, routeProgress, elapsedTime } = useRouteTracking();
  const [isInitialized, setIsInitialized] = useState(false);

  // Garantir que o componente inicializa corretamente mesmo após recarregar a página
  useEffect(() => {
    const initializeComponent = () => {
      console.log('🔧 Inicializando ActiveTripExecution...');
      
      // Verificar se há rota ativa persistida
      const persistedRoute = routeTrackingService.getActiveRoute();
      if (persistedRoute && persistedRoute.isActive) {
        console.log('✅ Rota ativa encontrada - componente inicializado com rota:', persistedRoute.id);
        setIsInitialized(true);
        
        toast({
          title: "Rota Restaurada",
          description: `Rota "${persistedRoute.driverName}" foi restaurada automaticamente.`,
          duration: 3000
        });
      } else {
        console.log('ℹ️ Nenhuma rota ativa - componente em modo de espera');
        setIsInitialized(true);
      }
    };

    // Executar inicialização após um pequeno delay para garantir que outros serviços estejam prontos
    const initTimeout = setTimeout(initializeComponent, 100);

    return () => clearTimeout(initTimeout);
  }, []);

  // Handler para finalizar rota explicitamente
  const handleEndRoute = () => {
    if (activeRoute) {
      console.log('🛑 Finalizando rota explicitamente:', activeRoute.id);
      
      // Tentar encerramento normal primeiro
      const normalEnd = routeTrackingService.endRoute();
      
      if (!normalEnd) {
        // Se o encerramento normal falhou, forçar encerramento
        console.log('⚠️ Encerramento normal falhou, forçando encerramento...');
        routeTrackingService.forceEndRoute();
      }
      
      toast({
        title: "Rota Finalizada",
        description: "A rota foi finalizada com sucesso.",
        duration: 3000
      });
    }
  };

  // Handler para simular atualização de status (para testes)
  const handleUpdateStudentStatus = (studentId: string, status: 'picked_up' | 'dropped_off') => {
    console.log(`🔄 Atualizando status do estudante ${studentId} para ${status}`);
    routeTrackingService.updateStudentStatus(studentId, status);
    
    toast({
      title: "Status Atualizado",
      description: `Estudante ${status === 'picked_up' ? 'embarcado' : 'desembarcado'} com sucesso.`,
      duration: 2000
    });
  };

  if (!isInitialized) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Inicializando execução de rota...</p>
        </div>
      </div>
    );
  }

  if (!hasActiveRoute) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Execução de Rota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma Rota Ativa</h3>
              <p className="text-gray-600 mb-4">
                Inicie uma rota para ver as informações de execução em tempo real.
              </p>
              <p className="text-sm text-gray-500">
                As rotas ativas são mantidas mesmo se você sair da aplicação.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Informações da Rota Ativa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Rota em Execução
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Ativa
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Tempo: {elapsedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                Estudantes: {activeRoute.studentPickups.length}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso da Rota</span>
              <span>{routeProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${routeProgress}%` }}
              />
            </div>
          </div>

          {driverLocation && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-1">Localização Atual</h4>
              <p className="text-xs text-gray-600">
                Lat: {driverLocation.lat.toFixed(6)}, Lng: {driverLocation.lng.toFixed(6)}
              </p>
              <p className="text-xs text-gray-500">
                Atualizado: {new Date(driverLocation.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Estudantes */}
      <Card>
        <CardHeader>
          <CardTitle>Estudantes na Rota</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activeRoute.studentPickups.map((student) => (
              <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-sm">{student.studentName}</h4>
                  <p className="text-xs text-gray-600">{student.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      student.status === 'pending' ? 'outline' :
                      student.status === 'picked_up' ? 'default' : 'secondary'
                    }
                  >
                    {student.status === 'pending' ? 'Aguardando' :
                     student.status === 'picked_up' ? 'Embarcado' : 'Desembarcado'}
                  </Badge>
                  
                  {student.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStudentStatus(student.studentId, 'picked_up')}
                    >
                      Embarcar
                    </Button>
                  )}
                  
                  {student.status === 'picked_up' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStudentStatus(student.studentId, 'dropped_off')}
                    >
                      Desembarcar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controles da Rota */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleEndRoute}
            variant="destructive" 
            className="w-full mb-3"
          >
            Finalizar Rota
          </Button>
          
          <Button 
            onClick={() => {
              console.log('🚨 Encerramento forçado solicitado pelo motorista');
              routeTrackingService.forceEndRoute();
              toast({
                title: "Rota Encerrada Forçadamente",
                description: "A rota foi encerrada e todos os dados foram limpos.",
                duration: 3000
              });
            }}
            variant="outline" 
            size="sm"
            className="w-full"
          >
            Forçar Encerramento
          </Button>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            Use "Forçar Encerramento" se a rota não finalizar normalmente
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
