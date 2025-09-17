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

  // Carregar dados dos estudantes do localStorage se existirem
  const getInitialStudents = (): Student[] => {
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      try {
        const parsedData = JSON.parse(savedStudents);
        console.log('👨‍🎓 Estudantes carregados do localStorage:', parsedData);
        return parsedData;
      } catch (error) {
        console.error('Erro ao carregar dados dos estudantes:', error);
      }
    }
    console.log('👨‍🎓 Nenhum estudante encontrado no localStorage');
    return [];
  };

  // Carregar dados da van do localStorage se existirem
  const getInitialVan = (): Van | null => {
    const savedDriverData = localStorage.getItem('driverData');
    if (savedDriverData) {
      try {
        const driverData = JSON.parse(savedDriverData);
        if (driverData.van) {
          console.log('🚐 Van carregada do localStorage:', driverData.van);
          return driverData.van;
        }
      } catch (error) {
        console.error('Erro ao carregar dados da van:', error);
      }
    }
    console.log('🚐 Nenhuma van encontrada no localStorage');
    return null;
  };

  // Carregar dados das escolas do localStorage se existirem
  const getInitialSchools = (): School[] => {
    const savedSchools = localStorage.getItem('schools');
    if (savedSchools) {
      try {
        const parsedData = JSON.parse(savedSchools);
        console.log('🏫 Escolas carregadas do localStorage:', parsedData);
        return parsedData;
      } catch (error) {
        console.error('Erro ao carregar dados das escolas:', error);
      }
    }
    console.log('🏫 Nenhuma escola encontrada no localStorage');
    return [];
  };

  // Carregar dados das rotas do localStorage se existirem
  const getInitialRoutes = (): Route[] => {
    const savedRoutes = localStorage.getItem('routes');
    if (savedRoutes) {
      try {
        const parsedData = JSON.parse(savedRoutes);
        console.log('🛣️ Rotas carregadas do localStorage:', parsedData);
        return parsedData;
      } catch (error) {
        console.error('Erro ao carregar dados das rotas:', error);
      }
    }
    console.log('🛣️ Nenhuma rota encontrada no localStorage');
    return [];
  };

  // Carregar activeTrip do localStorage se existir
  const getInitialActiveTrip = (): Trip | null => {
    const savedActiveTrip = localStorage.getItem('activeTrip');
    if (savedActiveTrip) {
      try {
        const parsedTrip = JSON.parse(savedActiveTrip);
        console.log('🚐 Viagem ativa carregada do localStorage:', parsedTrip);
        return parsedTrip;
      } catch (error) {
        console.error('Erro ao carregar viagem ativa:', error);
      }
    }
    console.log('🚐 Nenhuma viagem ativa no localStorage');
    return null;
  };

  // Carregar notifiedGuardians do localStorage se existirem
  const getInitialNotifiedGuardians = (): string[] => {
    const savedNotified = localStorage.getItem('notifiedGuardians');
    if (savedNotified) {
      try {
        const parsedData = JSON.parse(savedNotified);
        console.log('🔔 Notified guardians carregados do localStorage:', parsedData);
        return parsedData;
      } catch (error) {
        console.error('Erro ao carregar notified guardians:', error);
      }
    }
    console.log('🔔 Nenhum notified guardian encontrado no localStorage');
    return [];
  };

  // Estados principais
  const [driver, setDriver] = useState<Driver | null>(getInitialDriver());
  const [van, setVan] = useState<Van | null>(getInitialVan());
  const [routes, setRoutes] = useState<Route[]>(getInitialRoutes());
  const [students, setStudents] = useState<Student[]>(getInitialStudents());
  const [schools, setSchools] = useState<School[]>(getInitialSchools());
  const [guardians, setGuardians] = useState<Guardian[]>(getInitialGuardians());
  const [activeTrip, setActiveTrip] = useState<Trip | null>(getInitialActiveTrip());
  const [notifiedGuardians, setNotifiedGuardians] = useState<Set<string>>(new Set(getInitialNotifiedGuardians()));

  // Hook de integração de notificações
  const { sendNotification } = useNotificationIntegration({ students, schools });

  // Salvar responsáveis no localStorage sempre que a lista for atualizada
  useEffect(() => {
    localStorage.setItem('guardians', JSON.stringify(guardians));
    console.log('💾 Responsáveis salvos no localStorage:', guardians);
  }, [guardians]);

  // Salvar estudantes no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
    console.log('💾 Estudantes salvos no localStorage:', students);
  }, [students]);

  // Salvar escolas no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('schools', JSON.stringify(schools));
    console.log('💾 Escolas salvas no localStorage:', schools);
  }, [schools]);

  // Salvar rotas no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('routes', JSON.stringify(routes));
    console.log('💾 Rotas salvas no localStorage:', routes);
  }, [routes]);

  // Salvar activeTrip no localStorage sempre que mudar
  useEffect(() => {
    if (activeTrip) {
      localStorage.setItem('activeTrip', JSON.stringify(activeTrip));
      console.log('💾 Viagem ativa salva no localStorage:', activeTrip);
    } else {
      localStorage.removeItem('activeTrip');
      console.log('🗑️ Viagem ativa removida do localStorage');
    }
  }, [activeTrip]);

  // Salvar notifiedGuardians no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('notifiedGuardians', JSON.stringify(Array.from(notifiedGuardians)));
    console.log('💾 Notified guardians salvos no localStorage:', Array.from(notifiedGuardians));
  }, [notifiedGuardians]);

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
      status: 'waiting',
      dropoffLocation: 'school'
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

  const startTrip = async (routeId: string, newStudentIds?: string[]) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;
    console.log('Debug: Verificando route.students antes de map:', Array.isArray(route.students), route.students?.length, route.students);

    const tripStudents = route.students.map(student => ({
      studentId: student.id,
      status: 'waiting' as const,
      direction: student.dropoffLocation === 'home' ? 'to_home' : 'to_school' as 'to_school' | 'to_home'
    }));
    console.log('Debug: tripStudents após map:', Array.isArray(tripStudents), tripStudents.length, tripStudents);

    const newTrip = {
      id: Date.now().toString(),
      routeId: route.id,
      startTime: new Date().toISOString(),
      students: tripStudents,
      status: 'active' as const
    };

    setActiveTrip(newTrip);

    // Determinar direção geral da rota
    console.log('Debug: Verificando tripStudents antes de filter:', Array.isArray(tripStudents), tripStudents?.length, tripStudents);
    const toHomeCount = tripStudents.filter(s => s.direction === 'to_home').length;
    const toSchoolCount = tripStudents.length - toHomeCount;
    const overallDirection = toSchoolCount >= toHomeCount ? 'to_school' : 'to_home';

    // Enviar notificações para novos estudantes
    const studentsToNotify = newStudentIds 
      ? route.students.filter(s => newStudentIds.includes(s.id))
      : route.students;

    for (const student of studentsToNotify) {
      if (student.guardianId && !notifiedGuardians.has(student.guardianId)) {
        const direction = tripStudents.find(ts => ts.studentId === student.id)?.direction || overallDirection;
        let location = '';
        if (direction === 'to_school') {
          location = student.pickupPoint || student.address;
        } else {
          const school = schools.find(s => s.id === student.schoolId);
          location = school?.address || '';
        }

        await realTimeNotificationService.sendNotificationToGuardian(student.guardianId, {
          type: 'route_started',
          details: {
            studentId: student.id,
            direction,
            location
          }
        });

        setNotifiedGuardians(prev => new Set([...prev, student.guardianId]));
      }
    }

    // Iniciar rastreamento da rota
    const mappedStudents = tripStudents.map(ts => {
      const student = students.find(s => s.id === ts.studentId);
      return {
        id: ts.studentId,
        name: student?.name || '',
        address: student?.address || student?.pickupPoint || '',
        lat: student?.lat || 0,
        lng: student?.lng || 0,
        direction: ts.direction
      };
    });

    await routeTrackingService.startRoute(
      driver?.id || '',
      driver?.name || '',
      overallDirection,
      mappedStudents
    );

    console.log(`🚐 Viagem iniciada: ${route.name}`);
  };

  const updateStudentStatus = async (studentId: string, status: 'waiting' | 'van_arrived' | 'embarked' | 'at_school' | 'disembarked') => {
  if (activeTrip) {
    const updatedTrip = {
      ...activeTrip,
      students: activeTrip.students.map(student => 
        student.studentId === studentId ? { ...student, status } : student
      )
    };
    setActiveTrip(updatedTrip);
    console.log(`📱 Status do estudante ${studentId} atualizado para: ${status}`);
    console.log(`🔍 DEBUG: Procurando tripStudent para studentId: ${studentId}`);
    console.log(`🔍 DEBUG: Estudantes na viagem:`, updatedTrip.students.map(s => ({ id: s.studentId, status: s.status })));

    const tripStudent = updatedTrip.students.find(s => s.studentId === studentId);
    console.log(`🔍 DEBUG: TripStudent encontrado:`, tripStudent);
    if (tripStudent) {
      const studentData = students.find(s => s.id === studentId);
      console.log(`🔍 DEBUG: StudentData encontrado:`, studentData);
      if (studentData && studentData.guardianId) {
        console.log(`🔍 DEBUG: GuardianId encontrado: ${studentData.guardianId}`);
        let type = '';
        const direction = tripStudent.direction;
        if (status === 'van_arrived') type = 'van_arrived';
        if (status === 'embarked') type = 'embarked';
        if (status === 'at_school') type = 'at_school';
        if (status === 'disembarked') type = 'disembarked';
        if (!type) {
          console.log(`❌ DEBUG: Tipo de notificação não encontrado para status: ${status}`);
          return;
        }

        let location = '';
        if (direction === 'to_school') {
          location = status === 'at_school' ? schools.find(s => s.id === studentData.schoolId)?.address || '' : studentData.pickupPoint || studentData.address;
        } else {
          location = status === 'disembarked' ? studentData.address : schools.find(s => s.id === studentData.schoolId)?.address || '';
        }

        console.log(`🔔 DEBUG: Enviando notificação - Type: ${type}, Direction: ${direction}, Location: ${location}`);
        await realTimeNotificationService.sendNotificationToGuardian(studentData.guardianId, {
          type,
          details: {
            studentId,
            studentName: studentData.name,
            direction,
            location
          }
        });
        console.log(`✅ DEBUG: Notificação enviada com sucesso para guardian ${studentData.guardianId}`);
      }
    }
  }
};

  const updateMultipleStudentsStatus = async (studentIds: string[], status: 'waiting' | 'van_arrived' | 'embarked' | 'at_school' | 'disembarked') => {
  if (activeTrip) {
    const updatedTrip = {
      ...activeTrip,
      students: activeTrip.students.map(student => 
        studentIds.includes(student.studentId) ? { ...student, status } : student
      )
    };
    setActiveTrip(updatedTrip);
    console.log(`📱 Status de ${studentIds.length} estudantes atualizado para: ${status}`);
    console.log(`🔍 DEBUG MÚLTIPLOS: Atualizando status de ${studentIds.length} estudantes para: ${status}`);
    console.log(`🔍 DEBUG MÚLTIPLOS: StudentIds:`, studentIds);

    for (const studentId of studentIds) {
      const tripStudent = updatedTrip.students.find(s => s.studentId === studentId);
      if (tripStudent) {
        const studentData = students.find(s => s.id === studentId);
        if (studentData && studentData.guardianId) {
          let type = '';
          const direction = tripStudent.direction;
          if (status === 'van_arrived') type = 'van_arrived';
          if (status === 'embarked') type = 'embarked';
          if (status === 'at_school') type = 'at_school';
          if (status === 'disembarked') type = 'disembarked';
          if (!type) {
            console.log(`❌ DEBUG MÚLTIPLOS: Tipo de notificação não encontrado para status: ${status}`);
            continue;
          }

          let location = '';
          if (direction === 'to_school') {
            location = status === 'at_school' ? schools.find(s => s.id === studentData.schoolId)?.address || '' : studentData.pickupPoint || studentData.address;
          } else {
            location = status === 'disembarked' ? studentData.address : schools.find(s => s.id === studentData.schoolId)?.address || '';
          }
          
          console.log(`🔔 DEBUG MÚLTIPLOS: Enviando notificação para ${studentData.name} - Type: ${type}, Direction: ${direction}, Location: ${location}`);

          await realTimeNotificationService.sendNotificationToGuardian(studentData.guardianId, {
            type,
            details: {
              studentId,
              studentName: studentData.name,
              direction,
              location
            }
          });
          console.log(`✅ DEBUG MÚLTIPLOS: Notificação enviada com sucesso para guardian ${studentData.guardianId} do estudante ${studentData.name}`);
        }
      }
    }
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
      // Determinar direção geral
      const toHomeCount = activeTrip.students.filter(s => s.direction === 'to_home').length;
      const toSchoolCount = activeTrip.students.length - toHomeCount;
      const overallDirection = toSchoolCount >= toHomeCount ? 'to_school' : 'to_home';

      // Enviar notificações de rota concluída
      for (const ts of activeTrip.students) {
        const student = students.find(s => s.id === ts.studentId);
        if (student && student.guardianId) {
          const direction = ts.direction;
          let location = '';
          if (direction === 'to_school') {
            location = schools.find(s => s.id === student.schoolId)?.address || '';
          } else {
            location = student.address;
          }
          await realTimeNotificationService.sendNotificationToGuardian(student.guardianId, {
            type: 'route_completed',
            details: {
              studentId: student.id,
              direction,
              location
            }
          });
        }
      }

      // Finalizar rota no serviço de rastreamento
      await routeTrackingService.endRoute({ driverId: driver.id });

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