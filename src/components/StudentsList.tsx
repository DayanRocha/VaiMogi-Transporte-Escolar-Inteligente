
import { useState } from 'react';
import { User, MapPin, School, ArrowLeft, Plus, Edit, Trash2, Home } from 'lucide-react';
import { Student, School as SchoolType } from '@/types/driver';
import { StudentConfigDialog } from './StudentConfigDialog';

interface StudentsListProps {
  students: Student[];
  schools: SchoolType[];
  onBack: () => void;
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onUpdateStudent: (studentId: string, dropoffLocation: 'home' | 'school') => void;
}

export const StudentsList = ({ students, schools, onBack, onAddStudent, onEditStudent, onDeleteStudent, onUpdateStudent }: StudentsListProps) => {
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const getSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school?.name || 'Escola não encontrada';
  };

  const getSchool = (schoolId: string) => {
    return schools.find(s => s.id === schoolId) || null;
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setShowConfigDialog(true);
  };

  const handleConfigConfirm = (studentId: string, dropoffLocation: 'home' | 'school') => {
    onUpdateStudent(studentId, dropoffLocation);
    setShowConfigDialog(false);
    setSelectedStudent(null);
  };

  const handleDelete = (student: Student) => {
    if (window.confirm(`Tem certeza que deseja excluir o estudante "${student.name}"?`)) {
      onDeleteStudent(student.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack} 
              className="text-gray-600 hover:text-gray-800 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Alunos Cadastrados</h1>
          </div>
          <button
            onClick={onAddStudent}
            className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-md mx-auto">
        {students.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum aluno cadastrado</h3>
            <p className="text-gray-500 mb-6 leading-relaxed">Comece cadastrando seu primeiro aluno para gerenciar suas rotas</p>
            <button
              onClick={onAddStudent}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg font-medium"
            >
              Cadastrar Primeiro Aluno
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start">
                  <div 
                    className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 cursor-pointer hover:bg-blue-200 transition-colors"
                    onClick={() => handleStudentClick(student)}
                  >
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleStudentClick(student)}
                  >
                    <h3 className="font-semibold text-gray-800">{student.name}</h3>
                    
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {student.pickupPoint}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <School className="w-4 h-4 mr-1" />
                      {getSchoolName(student.schoolId)}
                    </div>
                    {student.dropoffLocation && (
                      <div className="flex items-center text-xs mt-1">
                        {student.dropoffLocation === 'home' ? (
                          <div className="flex items-center text-blue-600">
                            <Home className="w-3 h-3 mr-1" />
                            <span>Desembarque em casa</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600">
                            <Home className="w-3 h-3 mr-1" />
                            <span>Embarque em casa</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStudent(student);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(student);
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Config Dialog */}
      <StudentConfigDialog
        open={showConfigDialog}
        onClose={() => {
          setShowConfigDialog(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        school={selectedStudent ? getSchool(selectedStudent.schoolId) : null}
        onConfirm={handleConfigConfirm}
      />
    </div>
  );
};
