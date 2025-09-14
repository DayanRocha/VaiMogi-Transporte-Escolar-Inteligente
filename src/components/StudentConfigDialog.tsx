import { useState } from 'react';
import { User, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Student, School as SchoolType } from '@/types/driver';

interface StudentConfigDialogProps {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  school: SchoolType | null;
  onConfirm: (studentId: string, dropoffLocation: 'home' | 'school') => void;
}

export const StudentConfigDialog = ({ 
  open, 
  onClose, 
  student, 
  school, 
  onConfirm 
}: StudentConfigDialogProps) => {
  const [selectedOption, setSelectedOption] = useState<'embarque' | 'desembarque' | null>(
    student?.dropoffLocation === 'school' ? 'embarque' : 
    student?.dropoffLocation === 'home' ? 'desembarque' : null
  );

  const handleConfirm = () => {
    if (student && selectedOption) {
      const newDropoffLocation = selectedOption === 'embarque' ? 'school' : 'home';
      onConfirm(student.id, newDropoffLocation);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!student || !school) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">Configurar Estudante</DialogTitle>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Student Info */}
          <div className="text-center">
            <h3 className="font-semibold text-gray-800">{student.name}</h3>
            <p className="text-sm text-gray-600">Escola: {school.name}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <RadioGroup 
              value={selectedOption || ''} 
              onValueChange={(value) => setSelectedOption(value as 'embarque' | 'desembarque')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="embarque" id="embarque" className="text-orange-500" />
                <label htmlFor="embarque" className="cursor-pointer flex-1 text-sm">
                  Embarcar em casa
                </label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="desembarque" id="desembarque" className="text-orange-500" />
                <label htmlFor="desembarque" className="cursor-pointer flex-1 text-sm">
                  Desembarcar em casa
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleConfirm}
              disabled={!selectedOption}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Confirmar
            </Button>
            
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};