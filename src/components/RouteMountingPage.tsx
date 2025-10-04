import { useState } from 'react';
import { ArrowLeft, User, School as SchoolIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Student, School } from '@/types/driver';

interface RouteItem {
  id: string;
  type: 'student' | 'school';
  item: Student | School;
  direction?: 'embarque' | 'desembarque';
}

interface RouteMountingPageProps {
  routeName: string;
  students: Student[];
  schools: School[];
  onBack: () => void;
  onSaveRoute: (routeItems: RouteItem[]) => void;
  onUpdateStudent?: (studentId: string, studentData: { name: string; address: string; schoolId: string; guardianId: string; guardianPhone: string; guardianEmail: string; dropoffLocation?: 'home' | 'school'; }) => void;
}

export const RouteMountingPage = ({
  routeName,
  students,
  schools,
  onBack,
  onSaveRoute,
  onUpdateStudent
}: RouteMountingPageProps) => {
  const [routeItems, setRouteItems] = useState<RouteItem[]>([]);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [showStudentConfirmDialog, setShowStudentConfirmDialog] = useState(false);
  const [showSchoolConfirmDialog, setShowSchoolConfirmDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [studentPickupType, setStudentPickupType] = useState<'pickup' | 'dropoff'>('pickup');

  // Filtrar estudantes e escolas que já não estão na rota
  const availableStudents = students.filter(
    student => !routeItems.some(item => item.type === 'student' && item.id === student.id)
  );
  
  const availableSchools = schools.filter(
    school => !routeItems.some(item => item.type === 'school' && item.id === school.id)
  );

  const handleAddStudent = () => {
    setShowStudentDialog(true);
  };

  const handleAddSchool = () => {
    setShowSchoolDialog(true);
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentDialog(false);
    setShowStudentConfirmDialog(true);
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setShowSchoolDialog(false);
    setShowSchoolConfirmDialog(true);
  };

  const handleConfirmStudent = () => {
    if (selectedStudent) {
      // Atualizar o dropoffLocation do estudante baseado na seleção
      const newDropoffLocation = studentPickupType === 'pickup' ? 'school' : 'home';
      
      // Atualizar o estudante se a função estiver disponível
      if (onUpdateStudent) {
        onUpdateStudent(selectedStudent.id, {
          name: selectedStudent.name,
          address: selectedStudent.pickupPoint,
          schoolId: selectedStudent.schoolId,
          guardianId: selectedStudent.guardianId,
          guardianPhone: '', // Estes campos podem ser vazios pois não estão sendo alterados
          guardianEmail: '',
          dropoffLocation: newDropoffLocation
        });
      }
      
      const newItem: RouteItem = {
        id: selectedStudent.id,
        type: 'student',
        item: { ...selectedStudent, dropoffLocation: newDropoffLocation },
        direction: studentPickupType === 'pickup' ? 'embarque' : 'desembarque'
      };
      setRouteItems(prev => [...prev, newItem]);
      setShowStudentConfirmDialog(false);
      setSelectedStudent(null);
    }
  };

  const handleConfirmSchool = () => {
    if (selectedSchool) {
      const newItem: RouteItem = {
        id: selectedSchool.id,
        type: 'school',
        item: selectedSchool
      };
      setRouteItems(prev => [...prev, newItem]);
      setShowSchoolConfirmDialog(false);
      setSelectedSchool(null);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setRouteItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSaveRoute = () => {
    onSaveRoute(routeItems);
  };

  const getSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : 'Escola não encontrada';
  };

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
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          Montagem da rota "{routeName}"
        </h1>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Monte abaixo o percurso do motorista, indicando a ordem de embarque ou desembarque nas casas dos alunos e das paradas nas escolas.
          </p>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-4">Itens da Rota</h2>

        {/* Add Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={handleAddStudent}
            variant="outline"
            className="w-full py-4 border-2 border-blue-300 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md"
          >
            <User className="w-5 h-5" />
            Adicionar estudante
          </Button>


        </div>

        {/* Route Items List */}
        {routeItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Esta rota não tem itens</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {routeItems.map((item, index) => (
              <div key={`${item.type}-${item.id}`} className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.type === 'student' ? (
                    <User className="w-5 h-5 text-gray-600" />
                  ) : (
                    <SchoolIcon className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {item.type === 'student' ? (item.item as Student).name : (item.item as School).name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.type === 'student' 
                        ? item.direction === 'embarque' ? 'Embarque em casa' : 'Desembarque em casa'
                        : 'Parada na escola'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        <div className="space-y-3">
          <Button
            onClick={handleSaveRoute}
            disabled={routeItems.length === 0}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 disabled:bg-gray-300"
          >
            Salvar
          </Button>

          <Button
            onClick={onBack}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 py-4"
          >
            Voltar
          </Button>
        </div>
      </div>

      {/* Student Selection Dialog */}
      <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Estudante</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {availableStudents.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Todos os estudantes já foram adicionados à rota
              </p>
            ) : (
              availableStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <h3 className="font-medium text-gray-800">{student.name}</h3>
                  <p className="text-sm text-gray-500">
                    Escola: {getSchoolName(student.schoolId)}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* School Selection Dialog */}
      <Dialog open={showSchoolDialog} onOpenChange={setShowSchoolDialog}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Escola</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {availableSchools.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Todas as escolas já foram adicionadas à rota
              </p>
            ) : (
              availableSchools.map((school) => (
                <div
                  key={school.id}
                  onClick={() => handleSchoolSelect(school)}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <h3 className="font-medium text-gray-800">{school.name}</h3>
                  <p className="text-sm text-gray-500">{school.address}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Confirmation Dialog */}
      <Dialog open={showStudentConfirmDialog} onOpenChange={setShowStudentConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Estudante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedStudent && (
              <>
                <div className="text-center">
                  <h3 className="font-medium text-gray-800 mb-2">{selectedStudent.name}</h3>
                  <p className="text-sm text-gray-500">
                    Escola: {getSchoolName(selectedStudent.schoolId)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="pickup"
                      name="pickupType"
                      checked={studentPickupType === 'pickup'}
                      onChange={() => setStudentPickupType('pickup')}
                    />
                    <label htmlFor="pickup" className="text-sm">Embarcar em casa</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="dropoff"
                      name="pickupType"
                      checked={studentPickupType === 'dropoff'}
                      onChange={() => setStudentPickupType('dropoff')}
                    />
                    <label htmlFor="dropoff" className="text-sm">Desembarcar em casa</label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleConfirmStudent}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  >
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowStudentConfirmDialog(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* School Confirmation Dialog */}
      <Dialog open={showSchoolConfirmDialog} onOpenChange={setShowSchoolConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Escola</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSchool && (
              <>
                <div className="text-center">
                  <h3 className="font-medium text-gray-800 mb-2">{selectedSchool.name}</h3>
                  <p className="text-sm text-gray-500">{selectedSchool.address}</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleConfirmSchool}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  >
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSchoolConfirmDialog(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};