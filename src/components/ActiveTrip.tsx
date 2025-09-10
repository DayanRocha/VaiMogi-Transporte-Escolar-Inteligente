
import { useState, useRef } from 'react';
import { ArrowRight, ArrowLeft, MapPin, School, CheckCircle, Navigation, User, Bell, Home, Map, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Trip, Student, School as SchoolType, TripStudent, Driver } from '@/types/driver';
import { routeTrackingService } from '@/services/routeTrackingService';


interface ActiveTripProps {
  trip: Trip | null;
  students: Student[];
  schools: SchoolType[];
  driver: Driver;
  onUpdateStudentStatus: (studentId: string, status: TripStudent['status']) => void;
  onUpdateMultipleStudentsStatus: (studentIds: string[], status: TripStudent['status']) => void;
  onFinishTrip: () => void;
  onBack: () => void;
  onLogout?: () => void;
}

// Componente de item de estudante com swipe
interface SwipeableStudentItemProps {
  student: Student;
  tripData: TripStudent;
  school: SchoolType;
  driver: Driver;
  isGettingLocation: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onShowLocationMessage: (message: string, duration?: number) => void;
  onSetIsGettingLocation: (value: boolean) => void;
  onStudentClick?: () => void;
}

const SwipeableStudentItem = ({ student, tripData, school, driver, isGettingLocation, onSwipeLeft, onSwipeRight, onShowLocationMessage, onSetIsGettingLocation, onStudentClick }: SwipeableStudentItemProps) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (tripData.status !== 'waiting' && tripData.status !== 'van_arrived') return;
    
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    setDragX(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaX = currentX.current - startX.current;
    const threshold = 80; // Distância mínima para ativar o swipe
    
    if (Math.abs(deltaX) > threshold) {
      setIsAnimating(true);
      
      if (deltaX < 0 && tripData.status === 'waiting') {
        // Swipe para esquerda - Van chegou
        setSwipeDirection('left');
        setDragX(-300); // Animação para fora da tela
        setTimeout(() => {
          onSwipeLeft();
          setIsAnimating(false);
          setDragX(0);
          setSwipeDirection(null);
        }, 300);
      } else if (deltaX > 0 && tripData.status === 'van_arrived') {
        // Swipe para direita - Embarcar
        setSwipeDirection('right');
        setDragX(300); // Animação para fora da tela
        setTimeout(() => {
          onSwipeRight();
          setIsAnimating(false);
          setDragX(0);
          setSwipeDirection(null);
        }, 300);
      } else {
        // Volta para posição original com animação
        setDragX(0);
      }
    } else {
      // Volta para posição original com animação
      setDragX(0);
    }
    
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tripData.status !== 'waiting' && tripData.status !== 'van_arrived') return;
    
    setIsDragging(true);
    startX.current = e.clientX;
    currentX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.clientX;
    const deltaX = currentX.current - startX.current;
    setDragX(deltaX);
  };

  const handleMapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    onSetIsGettingLocation(true);
    
    // Determinar origem e destino baseado no modo da rota ativa
    // to_school = "Embarque em casa" - origem: endereço do motorista → destino: casa do aluno
    // to_home = "Desembarcar em casa" - origem: endereço do motorista → destino: escola
    const isEmbarcarEmCasa = tripData.direction === 'to_school';
    const originAddress = driver.address; // Sempre parte do endereço do motorista
    const destinationAddress = isEmbarcarEmCasa ? student.pickupPoint : school.address;
    const destinationName = isEmbarcarEmCasa ? `casa de ${student.name}` : school.name;
    const modeDescription = isEmbarcarEmCasa ? 'Embarcar em casa' : 'Desembarcar em casa';
    
    console.log(`🗺️ Modo: ${modeDescription}`);
    console.log(`🗺️ Origem: Endereço do motorista (${originAddress})`);
    console.log(`🗺️ Destino: ${destinationName} (${destinationAddress})`);
    
    // Verificar se geolocalização está disponível
    if (!navigator.geolocation) {
      console.error('❌ Geolocalização não suportada neste navegador');
      onShowLocationMessage('Geolocalização não suportada neste dispositivo. Não foi possível iniciar a navegação.');
      onSetIsGettingLocation(false);
      return;
    }
    
    // Solicitar localização atual
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const destination = encodeURIComponent(destinationAddress);
        
        // Usar coordenadas atuais como origem
        const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destination}&travelmode=driving`;
        
        console.log(`🗺️ Abrindo rota no Google Maps:`);
        console.log(`  📍 Origem (Localização Atual do Motorista): ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        console.log(`  🎯 Destino (${destinationName}): ${destinationAddress}`);
        console.log(`  📊 Precisão: ${position.coords.accuracy}m`);
        console.log(`  🚐 Modo: ${modeDescription} - ${isEmbarcarEmCasa ? 'Motorista → Casa do Aluno' : 'Motorista → Escola'}`);
        
        onShowLocationMessage(`Localização obtida! Rota para ${destinationName}`, 2000);
        window.open(url, '_blank');
        onSetIsGettingLocation(false);
      },
      (error) => {
        console.error('❌ Erro ao obter localização:', error);
        
        let errorMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada. Usando endereço cadastrado.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível. Usando endereço cadastrado.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo limite excedido. Usando endereço cadastrado.';
            break;
          default:
            errorMessage = 'Erro ao obter localização. Usando endereço cadastrado.';
            break;
        }
        
        onShowLocationMessage(errorMessage, 4000);
        onSetIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true, // Usar GPS se disponível para maior precisão
        timeout: 10000, // 10 segundos de timeout
        maximumAge: 60000 // Cache de 1 minuto (localização pode mudar rapidamente)
      }
    );
  };





  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const deltaX = currentX.current - startX.current;
    const threshold = 80;
    
    if (Math.abs(deltaX) > threshold) {
      setIsAnimating(true);
      
      if (deltaX < 0 && tripData.status === 'waiting') {
        setSwipeDirection('left');
        setDragX(-300);
        setTimeout(() => {
          onSwipeLeft();
          setIsAnimating(false);
          setDragX(0);
          setSwipeDirection(null);
        }, 300);
      } else if (deltaX > 0 && tripData.status === 'van_arrived') {
        setSwipeDirection('right');
        setDragX(300);
        setTimeout(() => {
          onSwipeRight();
          setIsAnimating(false);
          setDragX(0);
          setSwipeDirection(null);
        }, 300);
      } else {
        setDragX(0);
      }
    } else {
      setDragX(0);
    }
    
    setIsDragging(false);
  };

  const getStudentInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-gray-500';
      case 'van_arrived': return 'bg-orange-500';
      case 'embarked': return 'bg-green-500';
      case 'at_school': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string, isToHome: boolean = false) => {
    const result = (() => {
      switch (status) {
        case 'waiting': 
          return isToHome ? 'Desembarque em casa' : 'Embarque em casa';
        case 'van_arrived': 
          return isToHome ? 'Van chegou na escola' : 'Van chegou';
        case 'embarked': 
          return isToHome ? 'Embarcado para casa' : 'Embarcado';
        case 'at_school': 
          return 'Na escola';
        case 'disembarked':
          return isToHome ? 'Desembarcado em casa' : 'Desembarcado na escola';
        default: 
          return isToHome ? 'Desembarque em casa' : 'Embarque em casa';
      }
    })();
    
    return result;
  };

  const showNotificationIcon = tripData.status === 'van_arrived';

  const getSwipeProgress = () => {
    const maxDrag = 120;
    return Math.min(Math.abs(dragX) / maxDrag, 1);
  };

  const getBackgroundGradient = () => {
    const progress = getSwipeProgress();
    
    if (dragX < -30 && tripData.status === 'waiting') {
      return `linear-gradient(90deg, rgba(249, 115, 22, ${progress * 0.2}) 0%, rgba(255, 255, 255, 1) 50%)`;
    } else if (dragX > 30 && tripData.status === 'van_arrived') {
      return `linear-gradient(270deg, rgba(34, 197, 94, ${progress * 0.2}) 0%, rgba(255, 255, 255, 1) 50%)`;
    }
    return 'white';
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background indicators */}
      {dragX < -30 && tripData.status === 'waiting' && (
        <div 
          className="absolute left-0 top-0 h-full flex items-center justify-start pl-4 z-0"
          style={{ 
            width: `${Math.min(Math.abs(dragX) + 60, 200)}px`,
            background: 'linear-gradient(90deg, #f97316, #fb923c)',
            opacity: getSwipeProgress() * 0.9
          }}
        >
          <div className="flex items-center gap-2 text-white">
            <Bell className="w-5 h-5" />
            <span className="font-medium">
              {tripData.direction === 'to_school' ? 'Van no ponto!' : 'Van chegou!'}
            </span>
          </div>
        </div>
      )}
      
      {dragX > 30 && tripData.status === 'van_arrived' && (
        <div 
          className="absolute right-0 top-0 h-full flex items-center justify-end pr-4 z-0"
          style={{ 
            width: `${Math.min(dragX + 60, 200)}px`,
            background: 'linear-gradient(270deg, #22c55e, #4ade80)',
            opacity: getSwipeProgress() * 0.9
          }}
        >
          <div className="flex items-center gap-2 text-white">
            <span className="font-medium">
              {tripData.direction === 'to_school' ? 'À escola!' : 'Embarcar!'}
            </span>
            <User className="w-5 h-5" />
          </div>
        </div>
      )}

      <div 
        className={`bg-white rounded-lg p-4 shadow-lg relative z-10 ${
          isDragging ? 'cursor-grabbing shadow-xl' : 'cursor-grab'
        } ${isAnimating ? 'transition-all duration-300 ease-out' : ''}`}
        style={{ 
          transform: `translateX(${dragX}px) ${isDragging ? 'scale(1.02)' : 'scale(1)'}`,
          background: getBackgroundGradient(),
          boxShadow: isDragging ? '0 10px 25px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleMapClick} 
              disabled={isGettingLocation}
              className={`p-2 rounded-full transition-colors ${
                isGettingLocation 
                  ? 'bg-gray-200 cursor-not-allowed' 
                  : 'hover:bg-gray-100'
              }`}
              title={isGettingLocation ? 'Obtendo localização...' : 
                `Ver rota do motorista até ${tripData.direction === 'to_school' ? `casa de ${student.name}` : school.name}`
              }
            >
              <Map className={`w-6 h-6 ${
                isGettingLocation ? 'text-gray-400 animate-pulse' : 'text-orange-500'
              }`} />
            </button>
            <div className={`w-12 h-12 ${getStatusColor(tripData.status)} rounded-full flex items-center justify-center relative transition-all duration-200 ${
              isDragging ? 'scale-110' : 'scale-100'
            }`}>
              <span className="text-white font-bold text-sm">
                {getStudentInitials(student.name)}
              </span>
              {showNotificationIcon && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <Bell className="w-3 h-3 text-white animate-bounce" />
                </div>
              )}
              
              {/* Efeito de swipe no círculo */}
              {isDragging && dragX < -30 && tripData.status === 'waiting' && (
                <div className="absolute inset-0 bg-orange-500 rounded-full flex items-center justify-center opacity-80">
                  <Bell className="w-4 h-4 text-white animate-pulse" />
                </div>
              )}
              
              {isDragging && dragX > 30 && tripData.status === 'van_arrived' && (
                <div className="absolute inset-0 bg-green-500 rounded-full flex items-center justify-center opacity-80">
                  <User className="w-4 h-4 text-white animate-pulse" />
                </div>
              )}
            </div>
            
            <div className={`transition-all duration-200 ${isDragging ? 'scale-105' : 'scale-100'}`} 
                 onClick={onStudentClick}>
              <h4 className={`font-medium text-gray-800 ${onStudentClick ? 'cursor-pointer hover:text-blue-600' : ''}`}>
                {student.name}
              </h4>
              <p className="text-sm text-gray-500">{getStatusText(tripData.status, tripData.direction === 'to_home')}</p>
              <p className="text-xs text-gray-400">{school.name}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
            {tripData.direction === 'to_school' ? (
              <>
                <School className="w-5 h-5 text-gray-400" />
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <Home className="w-5 h-5 text-gray-400" />
              </>
            ) : (
              <>
                <Home className="w-5 h-5 text-gray-400" />
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <School className="w-5 h-5 text-gray-400" />
              </>
            )}
          </div>
        </div>

        {/* Indicadores de swipe animados */}
        {isDragging && (
          <div className="mt-3 text-center">
            {dragX < -40 && tripData.status === 'waiting' && (
              <div className="flex items-center justify-center gap-2 text-orange-600 animate-pulse">
                <ArrowLeft className="w-4 h-4 animate-bounce" />
                <span className="text-sm font-medium">
                  {tripData.direction === 'to_school' 
                    ? 'Deslize para notificar - Van chegou no ponto' 
                    : 'Deslize para notificar chegada'
                  }
                </span>
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
            )}
            {dragX > 40 && tripData.status === 'van_arrived' && (
              <div className="flex items-center justify-center gap-2 text-green-600 animate-pulse">
                <User className="w-4 h-4 animate-bounce" />
                <span className="text-sm font-medium">
                  {tripData.direction === 'to_school' 
                    ? 'Deslize para embarcar - Rumo à escola' 
                    : 'Deslize para embarcar'
                  }
                </span>
                <ArrowRight className="w-4 h-4 animate-bounce" />
              </div>
            )}
          </div>
        )}

        {/* Efeito de sucesso */}
        {swipeDirection && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
            <div className={`flex items-center gap-2 ${
              swipeDirection === 'left' ? 'text-orange-600' : 'text-green-600'
            } animate-pulse`}>
              {swipeDirection === 'left' ? (
                <>
                  <Bell className="w-6 h-6 animate-bounce" />
                  <span className="font-semibold">
                    {tripData.direction === 'to_school' 
                      ? 'Responsáveis notificados - Van chegou!' 
                      : 'Responsáveis notificados!'
                    }
                  </span>
                </>
              ) : (
                <>
                  <User className="w-6 h-6 animate-bounce" />
                  <span className="font-semibold">
                    {tripData.direction === 'to_school' 
                      ? 'Aluno embarcado - A caminho da escola!' 
                      : 'Aluno embarcado!'
                    }
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ActiveTrip = ({ trip, students, schools, driver, onUpdateStudentStatus, onUpdateMultipleStudentsStatus, onFinishTrip, onBack, onLogout }: ActiveTripProps) => {
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showGroupDisembarkDialog, setShowGroupDisembarkDialog] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [selectedStudentsForDisembark, setSelectedStudentsForDisembark] = useState<string[]>([]);
  const [isDisembarking, setIsDisembarking] = useState(false);
  const [showHomeDropoffDialog, setShowHomeDropoffDialog] = useState(false);
  const [selectedStudentForHome, setSelectedStudentForHome] = useState<Student | null>(null);
  const [disembarkType, setDisembarkType] = useState<'school' | 'home'>('school');
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const showLocationMessage = (message: string, duration: number = 3000) => {
    setLocationMessage(message);
    setTimeout(() => setLocationMessage(null), duration);
  };

  if (!trip) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }}>
        <div className="flex items-center justify-between p-4 pt-12">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <span className="text-white font-semibold text-lg">Executando rota</span>
          </div>
          <span className="text-white text-sm">Nenhuma rota</span>
        </div>
        
        <div className="bg-gray-100 min-h-screen rounded-t-3xl p-4">
          <div className="text-center py-12 text-gray-500">
            <Navigation className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma viagem ativa</p>
            <p className="text-sm">Inicie uma rota para começar</p>
          </div>
        </div>
      </div>
    );
  }

  const getStudent = (studentId: string) => students.find(s => s.id === studentId);
  const getSchool = (schoolId: string) => schools.find(s => s.id === schoolId);
  
  const getStudentTripData = (studentId: string) => 
    trip.students.find(s => s.studentId === studentId);

  // Agrupar estudantes por escola
  const groupStudentsBySchool = () => {
    const groups: { [schoolId: string]: { school: SchoolType; students: { student: Student; tripData: TripStudent }[] } } = {};
    
    trip.students.forEach((tripStudent) => {
      const student = getStudent(tripStudent.studentId);
      if (!student) return;
      
      const school = getSchool(student.schoolId);
      if (!school) return;
      
      if (!groups[school.id]) {
        groups[school.id] = { school, students: [] };
      }
      
      groups[school.id].students.push({ student, tripData: tripStudent });
    });
    
    return Object.values(groups);
  };

  const handleSwipe = (studentId: string, direction: 'left' | 'right') => {
    const tripStudent = getStudentTripData(studentId);
    if (!tripStudent) return;

    if (direction === 'right') {
      if (tripStudent.status === 'van_arrived') {
        onUpdateStudentStatus(studentId, 'embarked');
      } else if (tripStudent.status === 'at_school') {
        onUpdateStudentStatus(studentId, 'disembarked');
      }
    } else {
      if (tripStudent.status === 'waiting') {
        onUpdateStudentStatus(studentId, 'van_arrived');
      }
    }
  };

  const handleSchoolDisembark = (school: SchoolType) => {
    const schoolStudents = trip.students.filter(tripStudent => {
      const student = getStudent(tripStudent.studentId);
      return student && student.schoolId === school.id && tripStudent.status === 'at_school';
    });

    console.log(`🏫 Abrindo diálogo de desembarque para ${school.name}`);
    console.log(`📋 Alunos na escola:`, schoolStudents.map(ts => {
      const student = getStudent(ts.studentId);
      return `${student?.name} (${ts.status})`;
    }));

    if (schoolStudents.length === 0) {
      console.log('⚠️ Nenhum aluno na escola para desembarcar');
      return;
    }

    setDisembarkType('school');
    setSelectedSchool(school);
    setSelectedAddress(null);
    // Ao abrir o diálogo, todos os alunos da escola são pré-selecionados
    setSelectedStudentsForDisembark(schoolStudents.map(ts => ts.studentId));
    setShowGroupDisembarkDialog(true);
  };

  const handleSchoolEmbark = (school: SchoolType) => {
    const schoolStudents = trip.students.filter(tripStudent => {
      const student = getStudent(tripStudent.studentId);
      return student && student.schoolId === school.id && tripStudent.status === 'embarked';
    });

    console.log(`🏫 Abrindo diálogo de desembarque para ${school.name}`);
    console.log(`📋 Alunos embarcados para desembarcar:`, schoolStudents.map(ts => {
      const student = getStudent(ts.studentId);
      return `${student?.name} (${ts.status})`;
    }));

    if (schoolStudents.length === 0) {
      console.log('⚠️ Nenhum aluno embarcado para desembarcar nesta escola');
      return;
    }

    setDisembarkType('school');
    setSelectedSchool(school);
    setSelectedAddress(null);
    // Ao abrir o diálogo, todos os alunos embarcados são pré-selecionados para desembarque
    setSelectedStudentsForDisembark(schoolStudents.map(ts => ts.studentId));
    setShowGroupDisembarkDialog(true);
  };

  const handleConfirmGroupDisembark = async () => {
    if (disembarkType === 'home') {
      await handleConfirmGroupHomeDropoff();
    } else {
      const studentsToDisembark = selectedStudentsForDisembark.map(id => getStudent(id)).filter(Boolean);
      
      setIsDisembarking(true);
      console.log(`🚌 DESEMBARQUE EM GRUPO: ${studentsToDisembark.length} alunos na ${selectedSchool?.name}:`);
      studentsToDisembark.forEach(student => console.log(`  - ${student?.name}`));
      
      try {
        // Usar a função de atualização em grupo para processar todos de uma vez
        console.log('🏫 Processando desembarque EM GRUPO usando updateMultipleStudentsStatus...');
        onUpdateMultipleStudentsStatus(selectedStudentsForDisembark, 'disembarked');
        
        console.log(`✅ DESEMBARQUE EM GRUPO CONCLUÍDO! ${studentsToDisembark.length} alunos desembarcados JUNTOS na ${selectedSchool?.name}`);
        console.log('📱 Todos os responsáveis sendo notificados simultaneamente...');
        
        // Pequeno delay apenas para mostrar o feedback visual
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } finally {
        setIsDisembarking(false);
        setShowGroupDisembarkDialog(false);
        setSelectedSchool(null);
        setSelectedStudentsForDisembark([]);
        setSelectedAddress(null);
        setDisembarkType('school');
      }
    }
  };


  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentsForDisembark(prev => {
      const isSelected = prev.includes(studentId);
      if (isSelected) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleStudentHomeDropoff = (student: Student) => {
    // Encontrar todos os alunos no mesmo endereço
    const studentsAtSameAddress = trip.students
      .filter(tripStudent => {
        const s = getStudent(tripStudent.studentId);
        return s && 
               s.pickupPoint === student.pickupPoint && 
               tripStudent.status === 'embarked' && 
               tripStudent.direction === 'to_home';
      })
      .map(tripStudent => getStudent(tripStudent.studentId))
      .filter(Boolean) as Student[];

    if (studentsAtSameAddress.length > 1) {
      // Múltiplos alunos no mesmo endereço - abrir diálogo de grupo
      setDisembarkType('home');
      setSelectedAddress(student.pickupPoint);
      setSelectedStudentsForDisembark(studentsAtSameAddress.map(s => s.id));
      setShowGroupDisembarkDialog(true);
      console.log(`🏠 Desembarque em grupo no endereço: ${student.pickupPoint}`);
      console.log(`👥 Alunos no mesmo endereço:`, studentsAtSameAddress.map(s => s.name));
    } else {
      // Apenas um aluno - usar diálogo individual
      setSelectedStudentForHome(student);
      setShowHomeDropoffDialog(true);
    }
  };

  const handleConfirmHomeDropoff = () => {
    if (selectedStudentForHome) {
      console.log(`🏠 Desembarque em casa confirmado para ${selectedStudentForHome.name}`);
      onUpdateStudentStatus(selectedStudentForHome.id, 'disembarked');
      setShowHomeDropoffDialog(false);
      setSelectedStudentForHome(null);
    }
  };

  const handleConfirmGroupHomeDropoff = async () => {
    const studentsToDisembark = selectedStudentsForDisembark.map(id => getStudent(id)).filter(Boolean);
    
    setIsDisembarking(true);
    console.log(`🏠 DESEMBARQUE EM GRUPO EM CASA: ${studentsToDisembark.length} alunos no mesmo endereço:`);
    studentsToDisembark.forEach(student => console.log(`  - ${student?.name}`));
    
    try {
      // Usar a função de atualização em grupo para processar todos de uma vez
      console.log('🏠 Processando desembarque EM GRUPO em casa usando updateMultipleStudentsStatus...');
      onUpdateMultipleStudentsStatus(selectedStudentsForDisembark, 'disembarked');
      
      const address = studentsToDisembark[0]?.pickupPoint || 'endereço';
      console.log(`✅ DESEMBARQUE EM GRUPO CONCLUÍDO! ${studentsToDisembark.length} alunos desembarcados JUNTOS no endereço: ${address}`);
      console.log('📱 Todos os responsáveis sendo notificados simultaneamente...');
      
      // Pequeno delay apenas para mostrar o feedback visual
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } finally {
      setIsDisembarking(false);
      setShowGroupDisembarkDialog(false);
      setSelectedStudentsForDisembark([]);
      setSelectedAddress(null);
      setDisembarkType('school');
    }
  };



  // Status que indicam que um estudante foi desembarcado (em casa ou na escola)
  const completedStatuses = ['disembarked', 'at_school', 'dropped_off'];
  
  // Função para verificar se a rota está completa de forma robusta
  const checkRouteCompletion = () => {
    // Verificação 1: Trip students
    const tripCompleted = trip.students.every(s => completedStatuses.includes(s.status));
    
    // Verificação 2: Route tracking service
    const activeRoute = routeTrackingService.getActiveRoute();
    const routeCompleted = activeRoute ? 
      activeRoute.studentPickups.every(s => s.status === 'dropped_off') : 
      false;
    
    // Verificação 3: Contagem manual (checagem adicional)
    const completedCount = trip.students.filter(s => completedStatuses.includes(s.status)).length;
    const totalCount = trip.students.length;
    const countCompleted = completedCount === totalCount && totalCount > 0;
    
    return {
      tripCompleted,
      routeCompleted,
      countCompleted,
      isComplete: tripCompleted || routeCompleted || countCompleted
    };
  };
  
  const routeCompletion = checkRouteCompletion();
  const isRouteComplete = routeCompletion.isComplete;
  

  
  // Agrupar estudantes por endereço para desembarque em casa
  const groupStudentsByAddress = () => {
    const groups: { [address: string]: { address: string; students: { student: Student; tripData: TripStudent }[] } } = {};
    
    trip.students
      .filter(tripStudent => tripStudent.status === 'embarked' && tripStudent.direction === 'to_home')
      .forEach((tripStudent) => {
        const student = getStudent(tripStudent.studentId);
        if (!student) return;
        
        const address = student.pickupPoint;
        if (!groups[address]) {
          groups[address] = { address, students: [] };
        }
        
        groups[address].students.push({ student, tripData: tripStudent });
      });
    
    return Object.values(groups);
  };

  // Recalcular grupos sempre que o estado da viagem mudar
  const schoolGroups = groupStudentsBySchool();
  const addressGroups = groupStudentsByAddress();



  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="text-white font-semibold text-lg">Executando rota</span>
        </div>
        <span className="text-white text-sm">Rota da manhã</span>
      </div>



      {/* Content */}
      <div className="bg-gray-100 min-h-screen rounded-t-3xl p-4">
        {/* Escolas para desembarque */}
        {schoolGroups.map((group) => {
          const studentsAtSchool = group.students.filter(s => s.tripData.status === 'at_school');
          const studentsDisembarked = group.students.filter(s => s.tripData.status === 'disembarked');
          
          console.log(`🏫 Escola ${group.school.name}:`, {
            total: group.students.length,
            atSchool: studentsAtSchool.length,
            disembarked: studentsDisembarked.length,
            students: group.students.map(s => `${s.student.name}: ${s.tripData.status}`)
          });
          
          if (studentsAtSchool.length === 0 && studentsDisembarked.length === 0) return null;

          return (
            <div key={`school-${group.school.id}`} className="mb-4">
              <div 
                className={`bg-white rounded-lg p-4 shadow-sm ${studentsAtSchool.length > 0 ? 'cursor-pointer' : ''}`}
                onClick={() => studentsAtSchool.length > 0 && handleSchoolDisembark(group.school)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${studentsAtSchool.length > 0 ? 'bg-blue-500' : 'bg-gray-400'} rounded-full flex items-center justify-center`}>
                      <School className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{group.school.name}</h3>
                      <p className="text-sm text-gray-500">
                        {studentsAtSchool.length > 0 ? `Desembarque (${studentsAtSchool.length})` : `Todos desembarcaram (${studentsDisembarked.length})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <School className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Lista de estudantes embarcados agrupados por escola */}
        <div className="space-y-3 mb-6">
          {groupStudentsBySchool()
            .filter(group => {
              // Filtrar apenas grupos que têm alunos embarcados
              const embarkedStudents = group.students.filter(s => s.tripData.status === 'embarked');
              if (embarkedStudents.length === 0) return false;
              
              // Verificar se há pelo menos um aluno que é de "embarque em casa"
              // (ou seja, alunos que devem ser desembarcados na escola)
              const hasSchoolDropoffStudents = embarkedStudents.some(s => s.tripData.direction === 'to_school');
              return hasSchoolDropoffStudents;
            })
            .map((group) => {
              const embarkedStudents = group.students.filter(s => s.tripData.status === 'embarked');
              
              return (
                <div key={`embarked-${group.school.id}`} className="bg-white rounded-lg p-4 shadow-sm cursor-pointer hover:bg-gray-50"
                     onClick={() => handleSchoolEmbark(group.school)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <School className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{group.school.name}</h3>
                        <p className="text-sm text-gray-500">Embarcados ({embarkedStudents.length})</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        {/* Lista de estudantes para embarque */}
        <div className="space-y-3 mb-6">
          {trip.students
            .filter(tripStudent => {
              const status = tripStudent.status;
              return status === 'waiting' || status === 'van_arrived';
            })
            .map((tripStudent) => {
              const student = getStudent(tripStudent.studentId);
              const school = student ? getSchool(student.schoolId) : null;
              
              if (!student || !school) return null;

              // Verificar se é "embarque em casa" (direction: 'to_school')
              const isEmbarqueEmCasa = tripStudent.direction === 'to_school';

              return (
                <SwipeableStudentItem
                  key={student.id}
                  student={student}
                  tripData={tripStudent}
                  school={school}
                  driver={driver}
                  isGettingLocation={isGettingLocation}
                  onSwipeLeft={() => {
                    onUpdateStudentStatus(student.id, 'van_arrived');
                    if (isEmbarqueEmCasa) {
                      console.log(`🔔 EMBARQUE EM CASA: Responsáveis de ${student.name} notificados que a van chegou no ponto de embarque`);
                    } else {
                      console.log(`🔔 Notificação enviada: A van chegou no ponto de ${student.name}`);
                    }
                  }}
                  onSwipeRight={() => {
                    onUpdateStudentStatus(student.id, 'embarked');
                    if (isEmbarqueEmCasa) {
                      console.log(`🚌 EMBARQUE EM CASA: ${student.name} embarcou na van - Responsáveis notificados que está a caminho da escola`);
                    } else {
                      console.log(`🚌 ${student.name} embarcou na van`);
                    }
                  }}
                  onShowLocationMessage={showLocationMessage}
                  onSetIsGettingLocation={setIsGettingLocation}
                />
              );
            })}
        </div>

        {/* Lista de estudantes embarcados agrupados por endereço para desembarque em casa */}
        <div className="space-y-3 mb-6">
          {addressGroups.map((group) => (
            <div key={`address-${group.address}`} className="space-y-2">
              {/* Cabeçalho do grupo de endereço */}
              {group.students.length > 1 && (
                <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {group.students.length} alunos no mesmo endereço
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1 truncate">{group.address}</p>
                </div>
              )}
              
              {/* Lista de alunos no endereço */}
              {group.students.map(({ student, tripData }) => {
                const school = getSchool(student.schoolId);
                if (!school) return null;

                return (
                  <SwipeableStudentItem
                    key={`home-${student.id}`}
                    student={student}
                    tripData={tripData}
                    school={school}
                    driver={driver}
                    isGettingLocation={isGettingLocation}
                    onSwipeLeft={() => {
                      onUpdateStudentStatus(student.id, 'van_arrived');
                      console.log(`🔔 Notificação enviada: A van chegou no ponto de ${student.name}`);
                    }}
                    onSwipeRight={() => {
                      onUpdateStudentStatus(student.id, 'embarked');
                      console.log(`🚌 ${student.name} embarcou na van`);
                    }}
                    onShowLocationMessage={showLocationMessage}
                    onSetIsGettingLocation={setIsGettingLocation}
                    onStudentClick={() => handleStudentHomeDropoff(student)}
                  />
                );
              })}
            </div>
          ))}
        </div>





        {/* Status da Rota Completa */}
        {isRouteComplete && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Rota Pronta para Encerramento</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              ✅ Todos os estudantes foram desembarcados. Você pode encerrar a rota agora.
            </p>
          </div>
        )}

        {/* Botão Finalizar Rota - APENAS quando todos foram desembarcados */}
        {isRouteComplete && (
          <div className="mt-6 mb-4">
            <Button
              onClick={() => setConfirmFinish(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold animate-pulse"
            >
              ✅ Encerrar Rota Completa
            </Button>
            <p className="text-xs text-green-600 text-center font-medium mt-2">
              Todos os estudantes foram desembarcados
            </p>
          </div>
        )}


      </div>

      {/* Location Message */}
      {locationMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{locationMessage}</span>
          </div>
        </div>
      )}

      {/* Group Disembark Dialog */}
      <Dialog open={showGroupDisembarkDialog} onOpenChange={setShowGroupDisembarkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {disembarkType === 'home' 
                ? 'Desembarque em Casa' 
                : `Desembarque: ${selectedSchool?.name}`
              }
            </DialogTitle>
            <DialogDescription>
              {disembarkType === 'home' 
                ? `Alunos no endereço: ${selectedAddress}` 
                : 'Selecione os alunos para desembarcar.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Botão para selecionar/desselecionar todos */}
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium text-gray-700">Alunos para desembarcar:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const filteredStudents = trip.students.filter(tripStudent => {
                    const student = getStudent(tripStudent.studentId);
                    if (!student) return false;
                    
                    if (disembarkType === 'home') {
                      return student.pickupPoint === selectedAddress && 
                             tripStudent.status === 'embarked' && 
                             tripStudent.direction === 'to_home';
                    } else {
                      return student.schoolId === selectedSchool?.id && 
                             (tripStudent.status === 'at_school' || tripStudent.status === 'embarked');
                    }
                  });
                  const allSelected = filteredStudents.every(ts => selectedStudentsForDisembark.includes(ts.studentId));
                  if (allSelected) {
                    setSelectedStudentsForDisembark([]);
                  } else {
                    setSelectedStudentsForDisembark(filteredStudents.map(ts => ts.studentId));
                  }
                }}
              >
                {(() => {
                  const filteredStudents = trip.students.filter(tripStudent => {
                    const student = getStudent(tripStudent.studentId);
                    if (!student) return false;
                    
                    if (disembarkType === 'home') {
                      return student.pickupPoint === selectedAddress && 
                             tripStudent.status === 'embarked' && 
                             tripStudent.direction === 'to_home';
                    } else {
                      return student.schoolId === selectedSchool?.id && 
                             (tripStudent.status === 'at_school' || tripStudent.status === 'embarked');
                    }
                  });
                  const allSelected = filteredStudents.every(ts => selectedStudentsForDisembark.includes(ts.studentId));
                  return allSelected ? 'Desmarcar Todos' : 'Selecionar Todos';
                })()}
              </Button>
            </div>
            
            {/* Lista de alunos filtrados por tipo */}
            {trip.students
              .filter(tripStudent => {
                const student = getStudent(tripStudent.studentId);
                if (!student) return false;
                
                if (disembarkType === 'home') {
                  return student.pickupPoint === selectedAddress && 
                         tripStudent.status === 'embarked' && 
                         tripStudent.direction === 'to_home';
                } else {
                  return student.schoolId === selectedSchool?.id && 
                         (tripStudent.status === 'at_school' || tripStudent.status === 'embarked');
                }
              })
              .map((tripStudent) => {
                const student = getStudent(tripStudent.studentId);
                if (!student) return null;

                return (
                  <div key={student.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={student.id}
                      checked={selectedStudentsForDisembark.includes(student.id)}
                      onCheckedChange={() => handleStudentToggle(student.id)}
                    />
                    <label htmlFor={student.id} className="text-sm font-medium">
                      {student.name}
                    </label>
                  </div>
                );
              })}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleConfirmGroupDisembark}
                disabled={selectedStudentsForDisembark.length === 0 || isDisembarking}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
              >
                {isDisembarking ? (
                  disembarkType === 'home' ? 'Desembarcando em Casa...' : 'Desembarcando...'
                ) : selectedStudentsForDisembark.length === 1 ? (
                  disembarkType === 'home' ? 'Desembarcar em Casa' : 'Desembarcar Aluno'
                ) : (
                  disembarkType === 'home' 
                    ? `Desembarcar ${selectedStudentsForDisembark.length} Alunos em Casa`
                    : `Desembarcar ${selectedStudentsForDisembark.length} Alunos`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGroupDisembarkDialog(false)}
                disabled={isDisembarking}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* Map Options Dialog - Comentado pois estamos usando versão simples
      <Dialog open={showMapOptions} onOpenChange={setShowMapOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escolher aplicativo de mapa</DialogTitle>
            <DialogDescription>
              Rota: {driver.address} → {selectedStudentForMap?.name} ({selectedStudentForMap?.pickupPoint})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              onClick={() => openMap('google')}
              className="w-full flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Map className="w-5 h-5" />
              Google Maps
            </Button>
            
            <Button
              onClick={() => openMap('waze')}
              className="w-full flex items-center gap-3 bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Navigation className="w-5 h-5" />
              Waze
            </Button>
            
            <Button
              onClick={() => openMap('apple')}
              className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-900 text-white"
            >
              <MapPin className="w-5 h-5" />
              Apple Maps
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowMapOptions(false)}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finish Trip Confirmation Dialog */}
      <Dialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Encerrar rota?</DialogTitle>
            <DialogDescription>A rota será encerrada e não será possível desfazer essa ação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirmar Encerramento</h3>
              <p className="text-sm text-gray-600">
                Todos os alunos foram entregues. Deseja finalizar a rota?
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setConfirmFinish(false)}
                className="flex-1 text-orange-500 border-orange-500 hover:bg-orange-50"
              >
                NÃO ENCERRAR
              </Button>
              <Button
                onClick={() => {
                  onFinishTrip();
                  setConfirmFinish(false);
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                ENCERRAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Home Dropoff Dialog */}
      <Dialog open={showHomeDropoffDialog} onOpenChange={setShowHomeDropoffDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStudentForHome ? 
                `Desembarque em Casa: ${selectedStudentForHome.name}` : 
                'Desembarque em Casa'
              }
            </DialogTitle>
            <DialogDescription>
              Confirme o desembarque do aluno na residência.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium text-gray-700">Confirmar desembarque em casa:</span>
            </div>
            
            {selectedStudentForHome && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <Home className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedStudentForHome.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      📍 {selectedStudentForHome.pickupPoint}
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    ℹ️ Este aluno será desembarcado em casa (não na escola)
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleConfirmHomeDropoff}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Confirmar Desembarque em Casa
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHomeDropoffDialog(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
