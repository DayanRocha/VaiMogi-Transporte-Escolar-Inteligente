import { useState } from 'react';
import { Bell, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { realTimeNotificationService } from '@/services/realTimeNotificationService';
import { GuardianNotification } from '@/hooks/useGuardianData';
import { Guardian, Student } from '@/types/driver';

interface NotificationSimulatorProps {
  guardians: Guardian[];
  students: Student[];
  className?: string;
}

export const NotificationSimulator = ({ guardians, students, className = '' }: NotificationSimulatorProps) => {
  const [selectedType, setSelectedType] = useState<string>('van_arrived');
  const [selectedGuardian, setSelectedGuardian] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  // Filtrar apenas responsáveis ativos
  const activeGuardians = guardians.filter(g => g.isActive);
  
  // Obter estudantes do responsável selecionado
  const getGuardianStudents = (guardianId: string) => {
    return students.filter(s => s.guardianId === guardianId);
  };

  const notificationTypes = [
    { value: 'van_arrived', label: 'Van chegou na escola' },
    { value: 'embarked', label: 'Aluno embarcou' },
    { value: 'at_school', label: 'Chegou na escola' },
    { value: 'disembarked', label: 'Aluno desembarcou' }
  ];

  const handleSendNotification = async () => {
    if (isSending || !selectedGuardian) return;
    
    setIsSending(true);
    console.log('📤 Enviando notificação de teste...');
    
    try {
      const selectedNotification = notificationTypes.find(n => n.value === selectedType);
      const guardian = guardians.find(g => g.id === selectedGuardian);
      const guardianStudents = getGuardianStudents(selectedGuardian);
      
      if (!selectedNotification || !guardian) return;
      
      // Usar o primeiro estudante do responsável ou um nome genérico
      const studentName = guardianStudents.length > 0 ? guardianStudents[0].name : 'Estudante';
      
      // Criar notificação de teste
      const testNotification: GuardianNotification = {
        id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: selectedType as any,
        studentName: studentName,
        message: `TESTE: ${selectedNotification.label} - ${studentName}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        location: {
          lat: -23.5505,
          lng: -46.6333
        }
      };
      
      console.log('📱 Notificação de teste criada:', testNotification);
      console.log('👤 Enviando para responsável:', guardian.name, '(', guardian.email, ')');
      
      // Enviar através do serviço de notificações em tempo real
      await realTimeNotificationService.sendNotification(
        testNotification,
        selectedGuardian
      );
      
      console.log('✅ Notificação de teste enviada com sucesso para:', guardian.name);
      alert(`Notificação enviada para ${guardian.name}!`);
      
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de teste:', error);
      alert('Erro ao enviar notificação: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4" />
          Simulador de Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeGuardians.length === 0 ? (
          <div className="text-center py-4">
            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum responsável cadastrado</p>
            <p className="text-xs text-gray-400 mt-1">Cadastre responsáveis para testar notificações</p>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Responsável
              </label>
              <Select value={selectedGuardian} onValueChange={setSelectedGuardian}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {activeGuardians.map((guardian) => {
                    const guardianStudents = getGuardianStudents(guardian.id);
                    return (
                      <SelectItem key={guardian.id} value={guardian.id}>
                        {guardian.name} ({guardianStudents.length} estudante{guardianStudents.length !== 1 ? 's' : ''})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Tipo de Notificação
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        
        {activeGuardians.length > 0 && (
          <>
            <Button
              onClick={handleSendNotification}
              disabled={isSending || !selectedGuardian}
              className="w-full flex items-center gap-2"
              size="sm"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Notificação Teste
                </>
              )}
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              Esta notificação irá testar o som da buzina
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};