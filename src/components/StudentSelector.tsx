
import { useState } from 'react';
import { User, MapPin, School, Check, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Student, School as SchoolType } from '@/types/driver';

interface StudentSelectorProps {
  students: Student[];
  schools: SchoolType[];
  selectedStudents: Student[];
  onStudentToggle: (student: Student) => void;
  onUpdateStudent?: (studentId: string, studentData: { dropoffLocation?: 'home' | 'school' }) => void;
}

export const StudentSelector = ({ 
  students, 
  schools, 
  selectedStudents, 
  onStudentToggle,
  onUpdateStudent
}: StudentSelectorProps) => {
  const getSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school?.name || 'Escola não encontrada';
  };

  const isStudentSelected = (studentId: string) => {
    return selectedStudents.some(s => s.id === studentId);
  };

  const handleToggleDropoffType = (student: Student) => {
    const newDropoffLocation = student.dropoffLocation === 'home' ? 'school' : 'home';
    if (onUpdateStudent) {
      onUpdateStudent(student.id, { dropoffLocation: newDropoffLocation });
      console.log(`🔄 ${student.name}: dropoffLocation alterado para ${newDropoffLocation}`);
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-3">Selecionar Alunos</h3>
      
      {students.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Nenhum aluno disponível</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {students.map((student) => (
            <div 
              key={student.id} 
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                isStudentSelected(student.id) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onStudentToggle(student)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 text-sm">{student.name}</h4>
                    
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {student.pickupPoint}
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      <School className="w-3 h-3 mr-1" />
                      {getSchoolName(student.schoolId)}
                    </div>
                    
                    {/* Mostrar opções de embarque/desembarque apenas para estudantes selecionados */}
                    {isStudentSelected(student.id) && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant={student.dropoffLocation === 'home' ? 'default' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (student.dropoffLocation !== 'home') {
                              handleToggleDropoffType(student);
                            }
                          }}
                          className="text-xs h-6 px-2"
                        >
                          <Home className="w-3 h-3 mr-1" />
                          Embarque
                        </Button>
                        <Button
                          size="sm"
                          variant={student.dropoffLocation === 'school' ? 'default' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (student.dropoffLocation !== 'school') {
                              handleToggleDropoffType(student);
                            }
                          }}
                          className="text-xs h-6 px-2"
                        >
                          <School className="w-3 h-3 mr-1" />
                          Desembarque
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {isStudentSelected(student.id) && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedStudents.length > 0 && (
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            {selectedStudents.length} aluno(s) selecionado(s)
          </p>
        </div>
      )}
    </div>
  );
};
