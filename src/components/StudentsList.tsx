
import { useState } from 'react';
import { User, MapPin, School, ArrowLeft, Plus, Edit, Trash2, Home, Phone } from 'lucide-react';
import { Student, School as SchoolType } from '@/types/driver';
import { StudentConfigDialog } from './StudentConfigDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardBadge, CardAvatar } from '@/components/ui/card';
import { EmptyStudents } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

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

  const getStudentInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-neutral-200/50 p-4 shadow-sm">
        <div className="container-responsive">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost"
                size="icon-sm"
                onClick={onBack} 
                className="text-neutral-600 hover:text-neutral-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-h3 text-neutral-800">Estudantes</h1>
            </div>
            <Button
              onClick={onAddStudent}
              size="icon"
              className="shadow-lg"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container-responsive py-6">
        {!Array.isArray(students) || students.length === 0 ? (
          <EmptyStudents onAction={onAddStudent} />
        ) : (
          <div className="space-y-4 max-w-md mx-auto">
            {students.map((student, index) => (
              <Card 
                key={student.id} 
                interactive 
                className="group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-4">
                  {/* Header com avatar e info básica */}
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => handleStudentClick(student)}
                    >
                      {/* Avatar */}
                      <CardAvatar
                        fallback={getStudentInitials(student.name)}
                        size="lg"
                        className="ring-2 ring-white shadow-md bg-blue-100 text-blue-600"
                      />

                      {/* Info básica */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-h4 text-neutral-900 truncate">
                          {student.name}
                        </h3>
                        <div className="flex items-center gap-1 text-body-sm text-neutral-600 mt-1">
                          <School className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{getSchoolName(student.schoolId)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditStudent(student);
                        }}
                        className="text-neutral-600 hover:text-orange-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(student);
                        }}
                        className="text-neutral-600 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Informações de localização */}
                  <div 
                    className="space-y-2 cursor-pointer"
                    onClick={() => handleStudentClick(student)}
                  >
                    <div className="flex items-center gap-2 text-body-sm text-neutral-600">
                      <MapPin className="w-4 h-4 flex-shrink-0 text-neutral-400" />
                      <span className="truncate">{student.pickupPoint}</span>
                    </div>
                    
                    {/* Informações do responsável */}
                    {student.guardianPhone && (
                      <div className="flex items-center gap-2 text-body-sm text-neutral-600">
                        <Phone className="w-4 h-4 flex-shrink-0 text-neutral-400" />
                        <span className="truncate">{student.guardianPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Tipo de entrega */}
                  {student.dropoffLocation && (
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <CardBadge 
                        variant={student.dropoffLocation === 'home' ? 'info' : 'success'}
                        className="text-xs"
                      >
                        {student.dropoffLocation === 'home' ? (
                          <>
                            <Home className="w-3 h-3 mr-1" />
                            Desembarque em Casa
                          </>
                        ) : (
                          <>
                            <School className="w-3 h-3 mr-1" />
                            Embarque em Casa
                          </>
                        )}
                      </CardBadge>
                    </div>
                  )}

                  {/* Indicador de hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-50/0 via-orange-50/50 to-orange-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
                </CardContent>
              </Card>
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
