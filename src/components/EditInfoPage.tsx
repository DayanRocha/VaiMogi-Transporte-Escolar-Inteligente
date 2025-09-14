
import { useState } from 'react';
import { User, School as SchoolIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Student, School } from '@/types/driver';

interface EditInfoPageProps {
  onBack: () => void;
  onConfirm: (direction: 'embarque' | 'desembarque') => void;
  selectedItem: Student | School | null;
  type: 'student' | 'school';
  onUpdateStudent?: (studentId: string, studentData: { name: string; address: string; schoolId: string; guardianId: string; guardianPhone: string; guardianEmail: string; dropoffLocation?: 'home' | 'school'; }) => void;
}

export const EditInfoPage = ({ onBack, onConfirm, selectedItem, type, onUpdateStudent }: EditInfoPageProps) => {
  // Para estudantes, determinar a direção inicial baseada no dropoffLocation
  const getInitialDirection = (): 'embarque' | 'desembarque' | null => {
    if (type === 'student' && selectedItem && 'dropoffLocation' in selectedItem) {
      const student = selectedItem as Student;
      if (student.dropoffLocation === 'school') return 'embarque';
      if (student.dropoffLocation === 'home') return 'desembarque';
    }
    return null;
  };

  const [selectedDirection, setSelectedDirection] = useState<'embarque' | 'desembarque' | null>(getInitialDirection());

  if (!selectedItem) return null;

  const handleConfirm = () => {
    if (type === 'school') {
      // Para escolas, podemos usar 'embarque' como padrão ou não precisar de direção
      onConfirm('embarque');
    } else if (selectedDirection && selectedItem && 'dropoffLocation' in selectedItem) {
      // Para estudantes, atualizar o dropoffLocation baseado na direção selecionada
      const student = selectedItem as Student;
      const newDropoffLocation = selectedDirection === 'embarque' ? 'school' : 'home';
      
      // Atualizar o estudante se a função estiver disponível
      if (onUpdateStudent) {
        console.log(`📝 Atualizando ${student.name}: ${selectedDirection} (dropoffLocation: ${newDropoffLocation})`);
        
        onUpdateStudent(student.id, {
          name: student.name,
          address: student.pickupPoint,
          schoolId: student.schoolId,
          guardianId: student.guardianId,
          guardianPhone: '',
          guardianEmail: '',
          dropoffLocation: newDropoffLocation
        });
      }
      
      onConfirm(selectedDirection);
    }
  };

  // Para escolas, o botão sempre deve estar habilitado
  // Para estudantes, só habilita se tiver direção selecionada
  const isConfirmDisabled = type === 'student' && !selectedDirection;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-center p-4 pt-12">
        <img 
          src="/lovable-uploads/13ad1463-722e-40c8-b16d-03c288d5ef24.png" 
          alt="Logo" 
          className="w-32 h-32 object-contain"
        />
      </div>

      {/* Content */}
      <div className="bg-gray-100 min-h-screen rounded-t-3xl p-4">
        <h1 className="text-xl font-bold text-gray-800 mb-6">
          Montagem da rota "Rota da Manhã"
        </h1>

        {/* Modal-like container */}
        <div className="bg-white rounded-lg shadow-lg p-6 mx-auto max-w-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Editar informações</h2>
            <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Item info */}
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              {type === 'student' ? (
                <User className="w-6 h-6 text-blue-600" />
              ) : (
                <SchoolIcon className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{selectedItem.name}</h3>
            </div>
          </div>

          {/* Direction options - only for students */}
          {type === 'student' && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Direção</h4>
              <RadioGroup 
                value={selectedDirection || ''} 
                onValueChange={(value) => setSelectedDirection(value as 'embarque' | 'desembarque')}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="embarque" id="embarque" />
                  <label htmlFor="embarque" className="cursor-pointer flex-1">
                    Embarque em casa
                  </label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="desembarque" id="desembarque" />
                  <label htmlFor="desembarque" className="cursor-pointer flex-1"> 
                    Desembarque em casa
                  </label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Info text for schools */}
          {type === 'school' && (
            <div className="mb-6">
              <div className="text-center text-sm text-gray-500">
                Parada na escola
              </div>
            </div>
          )}

          {/* Time info */}
          {type === 'student' && (
            <div className="text-center text-sm text-gray-500 mb-6">
              Tempo aproximado do evento
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Confirmar
            </Button>
            
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full border-gray-300 text-gray-700"
            >
              Reordenar
            </Button>
            
            <Button
              variant="destructive"
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              Excluir
            </Button>
          </div>

          <Button
            onClick={onBack}
            variant="outline"
            className="w-full mt-4 border-gray-300 text-gray-700"
          >
            Voltar
          </Button>
        </div>


      </div>
    </div>
  );
};
