import { ArrowLeft, Users, UserCheck, UserX, Shield, ShieldOff } from 'lucide-react';
import { Guardian } from '@/types/driver';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface GuardianStatusManagerProps {
  guardians: Guardian[];
  onBack: () => void;
  onUpdateGuardian: (guardianId: string, data: Partial<Guardian>) => void;
}

export const GuardianStatusManager = ({ 
  guardians, 
  onBack, 
  onUpdateGuardian 
}: GuardianStatusManagerProps) => {

  const handleToggleStatus = (guardianId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    onUpdateGuardian(guardianId, { isActive: newStatus });
    
    const guardian = guardians.find(g => g.id === guardianId);
    if (guardian) {
      if (newStatus) {
        toast.success(`${guardian.name} foi ativado e pode acessar o aplicativo`);
      } else {
        toast.error(`${guardian.name} foi desativado e não pode mais acessar o aplicativo`);
      }
    }
  };

  const activeGuardians = guardians.filter(g => g.isActive !== false);
  const inactiveGuardians = guardians.filter(g => g.isActive === false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl font-semibold text-gray-800">Status dos Responsáveis</h1>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{activeGuardians.length}</p>
                <p className="text-sm text-green-600">Ativos</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <ShieldOff className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{inactiveGuardians.length}</p>
                <p className="text-sm text-red-600">Inativos</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de Responsáveis */}
        {guardians.length === 0 ? (
          <Card className="p-6 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">Nenhum responsável cadastrado</p>
            <p className="text-sm text-gray-400">
              Cadastre responsáveis primeiro para gerenciar seus status
            </p>
          </Card>
        ) : (
          <Card className="p-4">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Todos os Responsáveis</h2>
            
            <div className="space-y-3">
              {guardians.map((guardian) => {
                const isActive = guardian.isActive !== false; // Default é true se não definido
                
                return (
                  <div 
                    key={guardian.id} 
                    className={`rounded-lg p-4 border-2 transition-colors ${
                      isActive 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive 
                            ? 'bg-green-500' 
                            : 'bg-red-500'
                        }`}>
                          {isActive ? (
                            <UserCheck className="w-5 h-5 text-white" />
                          ) : (
                            <UserX className="w-5 h-5 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{guardian.name}</h3>
                          <p className="text-sm text-gray-600">{guardian.email}</p>
                          {guardian.phone && (
                            <p className="text-sm text-gray-500">{guardian.phone}</p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <div className={`w-2 h-2 rounded-full ${
                              isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-xs font-medium ${
                              isActive ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {isActive ? 'Pode acessar o aplicativo' : 'Acesso bloqueado'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2">
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => handleToggleStatus(guardian.id, isActive)}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <span className={`text-xs font-medium ${
                          isActive ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>

                    {/* Informações adicionais */}
                    {guardian.uniqueCode && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Código:</span>
                          <code className="text-xs bg-white px-2 py-1 rounded border font-mono text-orange-600">
                            {guardian.uniqueCode}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Informações sobre o controle de acesso */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Controle de Acesso</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Ativo:</strong> Responsável pode fazer login e usar o aplicativo</p>
                <p>• <strong>Inativo:</strong> Responsável não consegue acessar o aplicativo</p>
                <p>• Use esta funcionalidade para controlar quem tem acesso ao sistema</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};