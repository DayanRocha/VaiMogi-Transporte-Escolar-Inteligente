import { useState } from 'react';
import { ArrowLeft, User, School as SchoolIcon, Home, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Route, Student, School } from '@/types/driver';

interface RouteItem {
    id: string;
    type: 'student' | 'school';
    name: string;
    details: string;
    studentData?: Student;
    schoolData?: School;
}

interface RouteExecutionScreenProps {
    route: Route;
    students: Student[];
    schools: School[];
    onBack: () => void;
    onSaveChanges: (routeItems: RouteItem[]) => void;
    onStartRoute: () => void;
}

export const RouteExecutionScreen = ({
    route,
    students,
    schools,
    onBack,
    onSaveChanges,
    onStartRoute
}: RouteExecutionScreenProps) => {
    const [routeItems, setRouteItems] = useState<RouteItem[]>([
        // Inicializar com os estudantes já cadastrados na rota
        ...route.students.map(student => ({
            id: student.id,
            type: 'student' as const,
            name: student.name || 'Nome não informado',
            details: student.dropoffLocation === 'school' ? 'Embarque em casa' : 'Desembarque em casa',
            studentData: student
        }))
    ]);

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
            const newItem: RouteItem = {
                id: selectedStudent.id,
                type: 'student',
                name: selectedStudent.name || 'Nome não informado',
                details: studentPickupType === 'pickup' ? 'Embarque em casa' : 'Desembarque em casa',
                studentData: {
                    ...selectedStudent,
                    dropoffLocation: studentPickupType === 'pickup' ? 'school' : 'home'
                }
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
                name: selectedSchool.name || 'Escola não informada',
                details: 'Parada',
                schoolData: selectedSchool
            };
            setRouteItems(prev => [...prev, newItem]);
            setShowSchoolConfirmDialog(false);
            setSelectedSchool(null);
        }
    };

    const handleRemoveItem = (itemId: string) => {
        setRouteItems(prev => prev.filter(item => item.id !== itemId));
    };

    const getSchoolName = (schoolId: string) => {
        const school = schools.find(s => s.id === schoolId);
        return school ? school.name : 'Escola não encontrada';
    };

    const getStudentInitials = (name: string) => {
        if (!name) return 'N/A';
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 2);
    };

    const getItemColor = (index: number) => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-orange-500',
            'bg-gray-500'
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 pt-12">
                <button onClick={onBack} className="text-white">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-white font-semibold text-xl">{route.name}</h1>
            </div>

            {/* Content */}
            <div className="bg-gray-100 min-h-screen rounded-t-3xl p-4">
                {/* Route Items List */}
                <div className="space-y-3 mb-6">
                    {routeItems.map((item, index) => (
                        <div key={`${item.type}-${item.id}`} className="bg-white rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {item.type === 'student' ? (
                                    <div className={`w-12 h-12 ${getItemColor(index)} rounded-full flex items-center justify-center`}>
                                        <span className="text-white font-bold text-sm">
                                            {getStudentInitials(item.name)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className={`w-12 h-12 ${getItemColor(index)} rounded-full flex items-center justify-center`}>
                                        <SchoolIcon className="w-6 h-6 text-white" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                                    <p className="text-sm text-gray-500">{item.details}</p>
                                    {item.type === 'student' && item.studentData && (
                                        <p className="text-xs text-gray-400">
                                            {getSchoolName(item.studentData.schoolId)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.type === 'student' && item.studentData ? (
                                    // Embarque em casa (dropoffLocation = 'school'): Casa → Escola
                                    // Desembarque em casa (dropoffLocation = 'home'): Escola → Casa
                                    item.studentData.dropoffLocation === 'school' ? (
                                        <>
                                            <Home className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-400">→</span>
                                            <SchoolIcon className="w-5 h-5 text-gray-400" />
                                        </>
                                    ) : (
                                        <>
                                            <SchoolIcon className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-400">→</span>
                                            <Home className="w-5 h-5 text-gray-400" />
                                        </>
                                    )
                                ) : (
                                    // Para escolas, manter o padrão casa → escola
                                    <>
                                        <Home className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-400">→</span>
                                        <SchoolIcon className="w-5 h-5 text-gray-400" />
                                    </>
                                )}
                                <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="ml-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Buttons */}
                <div className="space-y-3 mb-6">
                    <Button
                        onClick={handleAddStudent}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-full flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Adicionar Estudante
                    </Button>

                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={() => onSaveChanges(routeItems)}
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 rounded-full shadow-md hover:shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                    >
                        Salvar Mudanças
                    </Button>
                    <Button
                        onClick={onStartRoute}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-full shadow-md hover:shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95
"
                    >
                        Iniciar Rota
                    </Button>
                </div>
            </div>

            {/* Student Selection Dialog */}
            <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Selecionar Estudante</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        {availableStudents.map(student => (
                            <div
                                key={student.id}
                                onClick={() => handleStudentSelect(student)}
                                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{student.name}</h4>
                                        <p className="text-sm text-gray-500">{student.address}</p>
                                        <p className="text-xs text-gray-400">{getSchoolName(student.schoolId)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* School Selection Dialog */}
            <Dialog open={showSchoolDialog} onOpenChange={setShowSchoolDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Selecionar Escola</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        {availableSchools.map(school => (
                            <div
                                key={school.id}
                                onClick={() => handleSchoolSelect(school)}
                                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                        <SchoolIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{school.name}</h4>
                                        <p className="text-sm text-gray-500">{school.address}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Student Confirmation Dialog */}
            <Dialog open={showStudentConfirmDialog} onOpenChange={setShowStudentConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurar Estudante</DialogTitle>
                    </DialogHeader>
                    {selectedStudent && (
                        <div className="space-y-4">
                            <div className="p-3 border rounded-lg">
                                <h4 className="font-medium">{selectedStudent.name}</h4>
                                <p className="text-sm text-gray-500">{selectedStudent.address}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tipo de parada:</label>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setStudentPickupType('pickup')}
                                        variant={studentPickupType === 'pickup' ? 'default' : 'outline'}
                                        className="flex-1"
                                    >
                                        Embarque
                                    </Button>
                                    <Button
                                        onClick={() => setStudentPickupType('dropoff')}
                                        variant={studentPickupType === 'dropoff' ? 'default' : 'outline'}
                                        className="flex-1"
                                    >
                                        Desembarque
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setShowStudentConfirmDialog(false)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleConfirmStudent}
                                    className="flex-1"
                                >
                                    Adicionar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>


        </div>
    );
};