import { X, Phone, MapPin, Mail, Truck, User, Users, Baby, School } from 'lucide-react';
import { Driver, Van, Guardian, Student, School as SchoolType } from '@/types/driver';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GuardianMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  van: Van;
  guardian: Guardian;
  children: Student[];
  schools: SchoolType[];
}

export const GuardianMenuModal = ({ 
  isOpen, 
  onClose, 
  driver, 
  van, 
  guardian, 
  children,
  schools 
}: GuardianMenuModalProps) => {
  // Verificações de segurança para evitar erros quando dados são null
  if (!driver || !van || !guardian) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Informações
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Carregando informações...</p>
              <p className="text-sm text-gray-400 mt-1">
                Aguarde enquanto carregamos os dados
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  const getSchoolName = (schoolId: string) => {
    console.log('🏫 Buscando escola com ID:', schoolId);
    console.log('🏫 Escolas disponíveis:', schools);
    
    const school = schools.find(s => s.id === schoolId);
    console.log('🏫 Escola encontrada:', school);
    
    return school ? school.name : `Escola ${schoolId}`;
  };
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Informações
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="guardian" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guardian" className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Meu Perfil
            </TabsTrigger>
            <TabsTrigger value="children" className="flex items-center gap-1">
              <Baby className="w-4 h-4" />
              Filhos
            </TabsTrigger>
            <TabsTrigger value="driver" className="flex items-center gap-1">
              <Truck className="w-4 h-4" />
              Motorista
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Guardian Profile Tab */}
            <TabsContent value="guardian" className="space-y-4 mt-0">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{guardian.name}</h3>
                    <p className="text-sm text-gray-600">Responsável</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{guardian.email}</span>
                  </div>

                  {guardian.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{guardian.phone}</span>
                    </div>
                  )}

                  {guardian.uniqueCode && (
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">Código de Acesso:</span>
                      </div>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-blue-600">
                        {guardian.uniqueCode}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Children Tab */}
            <TabsContent value="children" className="space-y-4 mt-0">
              {children.length > 0 ? (
                <div className="space-y-3">
                  {children.map((child) => (
                    <div key={child.id} className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <Baby className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{child.name}</h4>
                          <p className="text-sm text-gray-600">Aluno</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <School className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-gray-500">Escola:</span>
                            <p className="text-gray-700">{getSchoolName(child.schoolId)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-gray-500">Ponto de Embarque:</span>
                            <p className="text-gray-700">{child.pickupPoint}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            child.status === 'waiting' ? 'bg-yellow-500' :
                            child.status === 'embarked' ? 'bg-blue-500' :
                            'bg-green-500'
                          }`}></div>
                          <span className="text-gray-700 capitalize">
                            {child.status === 'waiting' ? 'Aguardando' :
                             child.status === 'embarked' ? 'Embarcado' :
                             'Na escola'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Baby className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum filho cadastrado</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Entre em contato com o motorista para cadastrar seus filhos
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Driver Tab */}
            <TabsContent value="driver" className="space-y-3 mt-0">
              {/* Driver Information */}
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={driver.photo || '/placeholder.svg'}
                    alt={`Foto de ${driver.name}`}
                    className="w-14 h-14 rounded-full object-cover border-2 border-orange-200"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{driver.name}</h3>
                    <p className="text-sm text-gray-600">Motorista Escolar</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800 text-sm border-b pb-1">Contato</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{driver.phone}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCall(driver.phone)}
                      className="bg-green-500 hover:bg-green-600 text-white h-8 px-3 text-xs"
                    >
                      Ligar
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">{driver.email}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmail(driver.email)}
                      className="h-8 px-3 text-xs"
                    >
                      Email
                    </Button>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-tight">{driver.address}</span>
                  </div>
                </div>
              </div>

              {/* Van Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 text-sm border-b pb-1 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Informações da Van
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={van.photo || '/placeholder.svg'}
                      alt={`Foto da van ${van.model}`}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{van.model}</p>
                      <p className="text-sm text-gray-600">Placa: {van.plate}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-2 border">
                      <span className="text-gray-500 text-xs">Capacidade:</span>
                      <p className="font-medium text-gray-800">{van.capacity} passageiros</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <span className="text-gray-500 text-xs">Status:</span>
                      <p className="font-medium text-green-600">Ativa</p>
                    </div>
                  </div>

                  {van.observations && (
                    <div className="bg-white rounded-lg p-2 border">
                      <span className="text-gray-500 text-xs">Observações:</span>
                      <p className="text-sm text-gray-700 mt-1">{van.observations}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Info */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-medium text-red-800 mb-1 text-sm">Em caso de emergência</h4>
                <p className="text-xs text-red-700">
                  Entre em contato imediatamente com o motorista ou ligue para 190/192
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};