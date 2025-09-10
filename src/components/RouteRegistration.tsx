
import { useState } from 'react';
import { Save, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StudentSelector } from '@/components/StudentSelector';
import { Route, Student, School } from '@/types/driver';

interface RouteRegistrationProps {
  onSave: (route: Omit<Route, 'id'>) => void;
  driverId: string;
  students: Student[];
  schools: School[];
  editingRoute?: Route | null;
  onBack: () => void;
  onUpdateStudent?: (studentId: string, studentData: { dropoffLocation?: 'home' | 'school' }) => void;
}

const weekDays = [
  { id: 'Mon', label: 'Seg' },
  { id: 'Tue', label: 'Ter' },
  { id: 'Wed', label: 'Qua' },
  { id: 'Thu', label: 'Qui' },
  { id: 'Fri', label: 'Sex' },
  { id: 'Sat', label: 'Sáb' },
  { id: 'Sun', label: 'Dom' }
];

export const RouteRegistration = ({ 
  onSave, 
  driverId, 
  students, 
  schools,
  editingRoute,
  onBack,
  onUpdateStudent
}: RouteRegistrationProps) => {
  const [formData, setFormData] = useState({
    name: editingRoute?.name || '',
    startTime: editingRoute?.startTime || '',
    weekDays: editingRoute?.weekDays || [] as string[]
  });
  
  const [selectedStudents, setSelectedStudents] = useState<Student[]>(
    editingRoute?.students || []
  );
  
  // Função para atualizar um estudante e também atualizar o estado local
  const handleUpdateStudent = (studentId: string, studentData: { dropoffLocation?: 'home' | 'school' }) => {
    // Atualizar no sistema principal
    if (onUpdateStudent) {
      onUpdateStudent(studentId, studentData);
    }
    
    // Atualizar também no estado local selectedStudents
    setSelectedStudents(prev => 
      prev.map(student => 
        student.id === studentId 
          ? { ...student, ...studentData }
          : student
      )
    );
  };

  const handleWeekDayToggle = (dayId: string) => {
    setFormData(prev => ({
      ...prev,
      weekDays: prev.weekDays.includes(dayId)
        ? prev.weekDays.filter(d => d !== dayId)
        : [...prev.weekDays, dayId]
    }));
  };

  const handleStudentToggle = (student: Student) => {
    setSelectedStudents(prev => {
      const isSelected = prev.some(s => s.id === student.id);
      if (isSelected) {
        return prev.filter(s => s.id !== student.id);
      } else {
        return [...prev, student];
      }
    });
  };

  const handleSave = () => {
    if (formData.name && formData.startTime && formData.weekDays.length > 0) {
      // Buscar os dados atualizados dos estudantes do array principal
      const updatedSelectedStudents = selectedStudents.map(selectedStudent => {
        const currentStudent = students.find(s => s.id === selectedStudent.id);
        return currentStudent || selectedStudent;
      });
      
      onSave({
        driverId,
        name: formData.name,
        startTime: formData.startTime,
        weekDays: formData.weekDays,
        students: updatedSelectedStudents
      });
      
      console.log('🔄 Rota salva com estudantes atualizados:', updatedSelectedStudents.map(s => `${s.name}: ${s.dropoffLocation}`));
      
      // Reset form
      setFormData({
        name: '',
        startTime: '',
        weekDays: []
      });
      setSelectedStudents([]);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-blue-600" />
          {editingRoute ? 'Editar Rota' : 'Cadastrar Rota'}
        </h1>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="name">Nome da Rota</Label>
          <Input
            id="name"
            placeholder="Ex: Rota Manhã"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="startTime" className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Horário de Início
          </Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
          />
        </div>

        <div>
          <Label>Dias da Semana</Label>
          <div className="grid grid-cols-7 gap-2 mt-2">
            {weekDays.map((day) => (
              <button
                key={day.id}
                onClick={() => handleWeekDayToggle(day.id)}
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.weekDays.includes(day.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <StudentSelector
          students={students}
          schools={schools}
          selectedStudents={selectedStudents}
          onStudentToggle={handleStudentToggle}
          onUpdateStudent={handleUpdateStudent}
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={!formData.name || !formData.startTime || formData.weekDays.length === 0}
        className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
      >
        <Save className="w-4 h-4 mr-2" />
        {editingRoute ? 'Atualizar Rota' : 'Salvar Rota'}
      </Button>
    </div>
  );
};
