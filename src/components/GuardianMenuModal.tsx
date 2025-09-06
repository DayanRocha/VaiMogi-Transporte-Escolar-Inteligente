import { X, Phone, MapPin, Mail, Truck, User, Users, Baby, School, Download } from 'lucide-react';
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
  // Função para fazer download do documento de permissão
  const handleDownloadDocument = () => {
    if (!van.drivingPermitDocument) return;
    
    const link = document.createElement('a');
    link.href = van.drivingPermitDocument;
    
    // Determinar o nome do arquivo baseado no tipo
    const isPdf = van.drivingPermitDocument.startsWith('data:application/pdf');
    const fileName = `documento_permissao_${van.plate}_${driver.name.replace(/\s+/g, '_')}.${isPdf ? 'pdf' : 'jpg'}`;
    
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // Verificações de segurança para evitar erros quando dados são null
  if (!driver || !van || !guardian) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Informações
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center py-8 px-6">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Carregando informações...</p>
              <p className="text-sm text-gray-400 mt-1">
                Aguarde enquanto carregamos os dados
              </p>
            </div>
          </div>
          <div className="flex justify-end px-6 py-4 border-t bg-white flex-shrink-0">
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
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Informações
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="guardian" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 mx-4 flex-shrink-0 h-12">
            <TabsTrigger value="guardian" className="flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Meu Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="children" className="flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium">
              <Baby className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Filhos</span>
            </TabsTrigger>
            <TabsTrigger value="driver" className="flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium">
              <Truck className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Motorista</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            {/* Guardian Profile Tab */}
            <TabsContent value="guardian" className="space-y-4 mt-0">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{guardian.name}</h3>
                    <p className="text-sm text-gray-600">Responsável</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 break-all">{guardian.email}</span>
                    </div>
                  </div>

                  {guardian.phone && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{guardian.phone}</span>
                      </div>
                    </div>
                  )}

                  {guardian.uniqueCode && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Código de Acesso:</span>
                      </div>
                      <code className="text-sm bg-gray-100 px-3 py-2 rounded-md font-mono text-blue-600 block text-center">
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
                    <div key={child.id} className="bg-green-50 rounded-lg p-4 border border-green-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                          <Baby className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">{child.name}</h4>
                          <p className="text-sm text-gray-600">Aluno</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start gap-3">
                            <School className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Escola:</span>
                              <p className="text-sm text-gray-700 font-medium">{getSchoolName(child.schoolId)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Ponto de Embarque:</span>
                              <p className="text-sm text-gray-700 font-medium">{child.pickupPoint}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              child.status === 'waiting' ? 'bg-yellow-500' :
                              child.status === 'embarked' ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}></div>
                            <div className="flex-1">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Status:</span>
                              <span className="text-sm text-gray-700 font-medium capitalize">
                                {child.status === 'waiting' ? 'Aguardando' :
                                 child.status === 'embarked' ? 'Embarcado' :
                                 'Na escola'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Baby className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-500 mb-2">Nenhum filho cadastrado</h3>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto">
                    Entre em contato com o motorista para cadastrar seus filhos
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Driver Tab */}
            <TabsContent value="driver" className="space-y-4 mt-0">
              {/* Driver Information */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={driver.photo || '/placeholder.svg'}
                    alt={`Foto de ${driver.name}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-orange-200 shadow-md"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{driver.name}</h3>
                    <p className="text-sm text-gray-600">Motorista Escolar</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <h4 className="font-medium text-gray-800 text-xs uppercase tracking-wide mb-3 border-b pb-2">Contato</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{driver.phone}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCall(driver.phone)}
                          className="bg-green-500 hover:bg-green-600 text-white h-8 px-3 text-xs ml-2"
                        >
                          Ligar
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{driver.email}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEmail(driver.email)}
                          className="h-8 px-3 text-xs ml-2 flex-shrink-0"
                        >
                          Email
                        </Button>
                      </div>

                      <div className="flex items-start gap-3 pt-2 border-t">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Endereço:</span>
                          <span className="text-sm text-gray-700 leading-tight">{driver.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Van Information */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
                <h4 className="font-medium text-gray-800 text-xs uppercase tracking-wide mb-4 pb-2 border-b flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Informações da Van
                </h4>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-4">
                      <img
                        src={van.photo || '/placeholder.svg'}
                        alt={`Foto da van ${van.model}`}
                        className="w-14 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0 shadow-sm"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-1">{van.model}</p>
                        <p className="text-sm text-gray-600">Placa: <span className="font-medium">{van.plate}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Capacidade:</span>
                      <p className="text-sm font-semibold text-gray-800">{van.capacity} passageiros</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Status:</span>
                      <p className="text-sm font-semibold text-green-600">Ativa</p>
                    </div>
                  </div>

                  {van.observations && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Observações:</span>
                      <p className="text-sm text-gray-700 leading-relaxed">{van.observations}</p>
                    </div>
                  )}

                  {van.drivingPermitDocument && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Documento de Permissão:</span>
                        <Button
                          onClick={handleDownloadDocument}
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Baixar
                        </Button>
                      </div>
                      <div className="mt-3">
                        {van.drivingPermitDocument.startsWith('data:application/pdf') ? (
                          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                               onClick={() => window.open(van.drivingPermitDocument, '_blank')}>
                            <svg className="w-10 h-10 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 mb-1">Documento PDF</p>
                              <p className="text-xs text-gray-500">Clique para visualizar</p>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={van.drivingPermitDocument}
                            alt="Documento de permissão para dirigir"
                            className="w-full max-w-sm rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                            onClick={() => window.open(van.drivingPermitDocument, '_blank')}
                          />
                        )}
                        <p className="text-xs text-gray-500 mt-2 text-center">Clique para {van.drivingPermitDocument.startsWith('data:application/pdf') ? 'visualizar' : 'ampliar'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Info */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-red-800 mb-2 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Em caso de emergência
                </h4>
                <p className="text-sm text-red-700 leading-relaxed">
                  Entre em contato imediatamente com o motorista ou ligue para <span className="font-semibold">190/192</span>
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end px-6 py-4 border-t bg-white flex-shrink-0">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};