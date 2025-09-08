import { useState, useEffect } from 'react';
import { Driver, Van, Route, Student, School, Guardian, Trip, TripStudent } from '@/types/driver';
import { useNotificationIntegration } from '@/hooks/useNotificationIntegration';
import { realTimeNotificationService } from '@/services/realTimeNotificationService';
import { routeTrackingService } from '@/services/routeTrackingService';

export const useDriverData = () => {
  // Carregar dados do motorista do localStorage se existirem
  const getInitialDriver = (): Driver | null => {
    const savedDriverData = localStorage.getItem('driverData');
    if (savedDriverData) {
      try {
        const parsedData = JSON.parse(savedDriverData);
        return parsedData;
      } catch (error) {
        console.error('Erro ao carregar dados do motorista:', error);
      }
    }
    return null;
  };

  // Carregar dados dos responsáveis do localStorage se existirem
  const getInitialGuardians = (): Guardian[] => {
    const savedGuardians = localStorage.getItem('guardians');
    if (savedGuardians) {
      try {
        const parsedData = JSON.parse(savedGuardians);
        console.log('📋 Responsáveis carregados do localStorage:', parsedData);
        return parsedData;
      } catch (error) {
        console.error('Erro ao carregar dados dos responsáveis:', error);
      }
    }
    console.log('📋 Nenhum responsável encontrado no localStorage');
    return [];
  };

  // Estados principais
  const [driver, setDriver] = useState<Driver | null>(getInitialDriver());
  const [van, setVan] = useState<Van | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>(getInitialGuardians());
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [notifiedGuardians, setNotifiedGuardians] = useState<Set<string>>(new Set());

  // Hook de integração de notificações
  const { sendNotification } = useNotificationIntegration({ students, schools });

  // Salvar responsáveis no localStorage sempre que a lista for atualizada
  useEffect(() => {
    localStorage.setItem('guardians', JSON.stringify(guardians));
    console.log('💾 Responsáveis salvos no localStorage:', guardians);
  }, [guardians]);

  // Função para adicionar responsável
  const addGuardian = (guardianData: { name: string; email: string; phone: string }) => {
    const newGuardian: Guardian = {
      id: Date.now().toString(),
      name: guardianData.name,
      email: guardianData.email,
      phone: guardianData.phone,
      isActive: true // Novos responsáveis são ativos por padrão
    };
    setGuardians(prev => [...prev, newGuardian]);
    console.log(`👤 Novo responsável cadastrado: ${guardianData.name}`);
  };

  // Função para adicionar estudante
  const addStudent = (studentData: {
    name: string;
    address: string;
    schoolId: string;
    guardianId: string;
    guardianPhone: string;
    guardianEmail: string;
  }) => {
    console.log(`🔄 addStudent chamada com dados:`, studentData);
    
    const newStudent: Student = {
      id: Date.now().toString(),
      name: studentData.name,
      address: studentData.address,
      guardianId: studentData.guardianId,
      guardianPhone: studentData.guardianPhone,
      guardianEmail: studentData.guardianEmail,
      pickupPoint: studentData.address,
      schoolId: studentData.schoolId,
      status: 'waiting'
    };
    
    console.log(`📚 Criando novo aluno:`, newStudent);
    
    setStudents(prev => {
      const updatedStudents = [...prev, newStudent];
      console.log(`✅ Lista de alunos atualizada. Total: ${updatedStudents.length}`);
      return updatedStudents;
    });
    
    console.log(`✅ Novo aluno cadastrado: ${studentData.name}`);
  };

  // Função para adicionar escola
  const addSchool = (schoolData: { name: string; address: string }) => {
    const newSchool: School = {
      id: Date.now().toString(),
      name: schoolData.name,
      address: schoolData.address
    };
    setSchools(prev => [...prev, newSchool]);
    console.log(`🏫 Nova escola cadastrada: ${schoolData.name}`);
  };

  const updateGuardian = (guardianId: string, guardianData: Partial<Guardian>) => {
    setGuardians(prev => {
      const updated = prev.map(guardian => 
        guardian.id === guardianId 
          ? { ...guardian, ...guardianData }
          : guardian
      );
      console.log(`👤 Responsável atualizado:`, {
        id: guardianId,
        data: guardianData,
        updatedGuardian: updated.find(g => g.id === guardianId)
      });
      return updated;
    });
  };

  const updateSchool = (schoolId: string, schoolData: { name: string; address: string }) => {
    setSchools(prev => prev.map(school => 
      school.id === schoolId ? { ...school, ...schoolData } : school
    ));
    console.log(`🏫 Escola atualizada: ${schoolId}`);
  };

  const deleteSchool = (schoolId: string) => {
    setSchools(prev => prev.filter(school => school.id !== schoolId));
    console.log(`🏫 Escola removida: ${schoolId}`);
  };

  const deleteGuardian = (guardianId: string) => {
    setGuardians(prev => prev.filter(guardian => guardian.id !== guardianId));
    console.log(`👤 Responsável removido: ${guardianId}`);
  };

  const updateDriver = (updatedDriver: Partial<Driver>) => {
    const newDriverData = { ...driver, ...updatedDriver };
    setDriver(newDriverData);
    // Salvar no localStorage
    localStorage.setItem('driverData', JSON.stringify(newDriverData));
  };

  const updateVan = (updatedVan: Partial<Van>) => {
    const newVanData = { ...van, ...updatedVan };
    setVan(newVanData);
    
    // Atualizar também os dados do motorista se existirem
    if (driver) {
      const updatedDriver = { ...driver, van: newVanData };
      setDriver(updatedDriver);
      localStorage.setItem('driverData', JSON.stringify(updatedDriver));
    } else {
      // Salvar van junto com os dados do motorista
      const currentDriverData = JSON.parse(localStorage.getItem('driverData') || '{}');
      const updatedDriverData = {
        ...currentDriverData,
        van: newVanData
      };
      localStorage.setItem('driverData', JSON.stringify(updatedDriverData));
    }
    console.log('💾 Van salva junto com dados do motorista:', newVanData);
  };

  const addRoute = (route: Omit<Route, 'id'>) => {
    const newRoute = { ...route, id: Date.now().toString() };
    setRoutes(prev => [...prev, newRoute]);
  };

  const updateRoute = (routeId: string, updates: Partial<Route>) => {
    setRoutes(prev => prev.map(route => 
      route.id === routeId ? { ...route, ...updates } : route
    ));
  };

  const deleteRoute = (routeId: string) => {
    setRoutes(prev => prev.filter(route => route.id !== routeId));
  };

  const updateStudent = (studentId: string, studentData: {
    name: string;
    address: string;
    schoolId: string;
    guardianId: string;
    guardianPhone: string;
    guardianEmail: string;
    dropoffLocation?: 'home' | 'school';
  }) => {
    console.log(`🔄 Atualizando estudante ${studentData.name} com dropoffLocation: ${studentData.dropoffLocation}`);
    
    setStudents(prev => {
      const updatedStudents = prev.map(student => 
        student.id === studentId 
          ? {
              ...student,
              name: studentData.name,
              pickupPoint: studentData.address,
              schoolId: studentData.schoolId,
              guardianId: studentData.guardianId,
              dropoffLocation: studentData.dropoffLocation !== undefined ? studentData.dropoffLocation : student.dropoffLocation
            }
          : student
      );
      
      // Verificar se a atualização foi aplicada
      const updatedStudent = updatedStudents.find(s => s.id === studentId);
      console.log(`✅ ${updatedStudent?.name} atualizado: dropoffLocation = ${updatedStudent?.dropoffLocation}`);
      
      return updatedStudents;
    });
  };

  const toggleStudentDropoffType = (studentId: string) => {
    setStudents(prev => {
      const updatedStudents = prev.map(student => 
        student.id === studentId 
          ? {
              ...student,
              dropoffLocation: (student.dropoffLocation === 'home' ? 'school' : 'home') as 'home' | 'school'
            }
          : student
      );
      
      const updatedStudent = updatedStudents.find(s => s.id === studentId);
      const newType = updatedStudent?.dropoffLocation === 'home' ? 'Desembarque em casa' : 'Embarque em casa';
      console.log(`🔄 ${updatedStudent?.name} alterado para: ${newType}`);
      
      return updatedStudents;
    });
  };

  const deleteStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setStudents(prev => prev.filter(student => student.id !== studentId));
    console.log(`🗑️ Estudante removido: ${student?.name}`);
  };

  const startTrip = (routeId: string, newStudentIds?: string[]) => {
    const route = routes.find(r => r.id === routeId);
    if (route) {
      const tripStudents = route.students.map(student => ({
        studentId: student.id,
        status: 'waiting' as const,
        direction: student.dropoffLocation === 'home' ? 'to_home' : 'to_school' as 'to_school' | 'to_home'
      }));
      
      const newTrip = {
        id: Date.now().toString(),
        routeId: route.id,
        startTime: new Date().toISOString(),
        students: tripStudents,
        status: 'active' as const
      };
      
      setActiveTrip(newTrip);
      console.log(`🚐 Viagem iniciada: ${route.name}`);
    }
  };

  const updateStudentStatus = async (studentId: string, status: 'waiting' | 'picked_up' | 'dropped_off') => {
    if (activeTrip) {
      const updatedTrip = {
        ...activeTrip,
        students: activeTrip.students.map(student => 
          student.studentId === studentId ? { ...student, status } : student
        )
      };
      setActiveTrip(updatedTrip);
      console.log(`📱 Status do estudante ${studentId} atualizado para: ${status}`);
    }
  };

  const updateMultipleStudentsStatus = async (studentIds: string[], status: 'waiting' | 'picked_up' | 'dropped_off') => {
    if (activeTrip) {
      const updatedTrip = {
        ...activeTrip,
        students: activeTrip.students.map(student => 
          studentIds.includes(student.studentId) ? { ...student, status } : student
        )
      };
      setActiveTrip(updatedTrip);
      console.log(`📱 Status de ${studentIds.length} estudantes atualizado para: ${status}`);
    }
  };

  // Função para finalizar viagem
  const finishTrip = async () => {
    if (!activeTrip) {
      console.error('❌ Nenhuma viagem ativa para finalizar');
      return;
    }

    if (!driver) {
      console.error('❌ Dados do motorista não encontrados');
      return;
    }

    console.log('🏁 Iniciando finalização da viagem:', activeTrip.id);

    try {
      // Marcar rota como concluída
      setActiveTrip({ ...activeTrip, status: 'completed' });
      console.log('✅ Rota marcada como concluída');
      
      // Finalizar completamente a viagem após 2 segundos
      setTimeout(() => {
        setActiveTrip(null);
        console.log('🏁 Viagem finalizada completamente');
      }, 2000);
      
      // Limpar notificações para permitir novas notificações na próxima viagem
      setNotifiedGuardians(new Set());
      console.log('🔄 Histórico de notificações limpo - próxima viagem poderá enviar notificações novamente');
    } catch (error) {
      console.error('❌ Erro ao finalizar viagem:', error);
    }
  };

  return {
    driver,
    van,
    routes,
    students,
    schools,
    guardians,
    activeTrip,
    addStudent,
    updateStudent,
    toggleStudentDropoffType,
    deleteStudent,
    addGuardian,
    updateGuardian,
    deleteGuardian,
    addSchool,
    updateSchool,
    deleteSchool,
    updateDriver,
    updateVan,
    addRoute,
    updateRoute,
    deleteRoute,
    startTrip,
    updateStudentStatus,
    updateMultipleStudentsStatus,
    finishTrip
  };
};