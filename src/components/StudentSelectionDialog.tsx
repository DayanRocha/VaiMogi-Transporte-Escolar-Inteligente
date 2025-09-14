
import { useState } from 'react';
import { User, School as SchoolIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Student, School } from '@/types/driver';

interface StudentSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  students: Student[];
  schools: School[];
  onStudentSelect: (student: Student) => void;
  onSchoolSelect: (school: School) => void;
  type: 'student' | 'school';
}

export const StudentSelectionDialog = ({
  open,
  onClose,
  students,
  schools,
  onStudentSelect,
  onSchoolSelect,
  type
}: StudentSelectionDialogProps) => {
  const items = type === 'student' ? students : schools;
  const title = type === 'student' ? 'Selecionar Estudante' : 'Selecionar Escola';

  const handleItemSelect = (item: Student | School) => {
    if (type === 'student') {
      onStudentSelect(item as Student);
    } else {
      onSchoolSelect(item as School);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => handleItemSelect(item)}
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                {type === 'student' ? (
                  <User className="w-5 h-5 text-blue-600" />
                ) : (
                  <SchoolIcon className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">{item.name}</h3>
                {type === 'student' && (
                  <p className="text-sm text-gray-600">{(item as Student).pickupPoint}</p>
                )}
                {type === 'school' && (
                  <p className="text-sm text-gray-600">{(item as School).address}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {items.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p>Nenhum {type === 'student' ? 'estudante' : 'escola'} cadastrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
