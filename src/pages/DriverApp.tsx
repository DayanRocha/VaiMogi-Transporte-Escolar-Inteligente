import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientsPage } from '@/components/ClientsPage';
import { DriversPage } from '@/components/DriversPage';
import { SettingsPage } from '@/components/SettingsPage';
import { DriverProfile } from '@/components/DriverProfile';
import { VanRegistration } from '@/components/VanRegistration';
import { RouteRegistration } from '@/components/RouteRegistration';
import { RoutesList } from '@/components/RoutesList';
import { RoutesListPage } from '@/components/RoutesListPage';
import { RouteFormPage } from '@/components/RouteFormPage';
import { RouteSetupPage } from '@/components/RouteSetupPage';
import { RouteExecutionPage } from '@/components/RouteExecutionPage';
import { RouteMountingPage } from '@/components/RouteMountingPage';
import { SavedRoutesList } from '@/components/SavedRoutesList';
import { RouteExecutionScreen } from '@/components/RouteExecutionScreen';
import { RouteHistoryPage } from '@/components/RouteHistoryPage';
import { StudentsList } from '@/components/StudentsList';
import { StudentRegistration } from '@/components/StudentRegistration';
import { GuardiansList } from '@/components/GuardiansList';
import { GuardianRegistration } from '@/components/GuardianRegistration';
import { GuardianCodesManager } from '@/components/GuardianCodesManager';
import { GuardianStatusManager } from '@/components/GuardianStatusManager';
import { SchoolsList } from '@/components/SchoolsList';
import { SchoolRegistration } from '@/components/SchoolRegistration';
import { ActiveTrip } from '@/components/ActiveTrip';
import { BottomNavigation } from '@/components/BottomNavigation';
import { useDriverData } from '@/hooks/useDriverData';
import { realTimeNotificationService } from '@/services/realTimeNotificationService';
import { Route, Student, Guardian, School as SchoolType } from '@/types/driver';
import SEOHead from '@/components/SEOHead';



export default function DriverApp() {
  const navigate = useNavigate();
  
  // Função para recuperar estado persistido
  const getPersistedState = () => {
    try {
      const savedActiveTab = localStorage.getItem('driverApp_activeTab');
      const savedNavigationStack = localStorage.getItem('driverApp_navigationStack');
      const savedShowStates = localStorage.getItem('driverApp_showStates');
      
      return {
        activeTab: savedActiveTab || 'home',
        navigationStack: savedNavigationStack ? JSON.parse(savedNavigationStack) : ['home'],
        showStates: savedShowStates ? JSON.parse(savedShowStates) : {}
      };
    } catch (error) {
      console.error('Erro ao recuperar estado persistido:', error);
      return {
        activeTab: 'home',
        navigationStack: ['home'],
        showStates: {}
      };
    }
  };
  
  const persistedState = getPersistedState();
  
  const [activeTab, setActiveTab] = useState(persistedState.activeTab);
  const [navigationStack, setNavigationStack] = useState<string[]>(persistedState.navigationStack);
  const [showRouteForm, setShowRouteForm] = useState(persistedState.showStates.showRouteForm || false);
  const [showStudentForm, setShowStudentForm] = useState(persistedState.showStates.showStudentForm || false);
  const [showGuardianForm, setShowGuardianForm] = useState(persistedState.showStates.showGuardianForm || false);
  const [showGuardianCodes, setShowGuardianCodes] = useState(persistedState.showStates.showGuardianCodes || false);
  const [showSchoolForm, setShowSchoolForm] = useState(persistedState.showStates.showSchoolForm || false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [editingSchool, setEditingSchool] = useState<SchoolType | null>(null);
  const [showClients, setShowClients] = useState(persistedState.showStates.showClients || false);
  const [showDrivers, setShowDrivers] = useState(persistedState.showStates.showDrivers || false);
  const [showSettings, setShowSettings] = useState(persistedState.showStates.showSettings || false);
  const [activeTopButton, setActiveTopButton] = useState<'clients' | 'drivers' | 'settings' | 'trip' | null>(persistedState.showStates.activeTopButton || null);

  const [showRoutesListPage, setShowRoutesListPage] = useState(persistedState.showStates.showRoutesListPage || false);
  const [showRouteFormPage, setShowRouteFormPage] = useState(persistedState.showStates.showRouteFormPage || false);
  const [showRouteSetupPage, setShowRouteSetupPage] = useState(persistedState.showStates.showRouteSetupPage || false);
  const [showRouteExecutionPage, setShowRouteExecutionPage] = useState(persistedState.showStates.showRouteExecutionPage || false);
  const [showRouteMountingPage, setShowRouteMountingPage] = useState(persistedState.showStates.showRouteMountingPage || false);
  const [showSavedRoutesList, setShowSavedRoutesList] = useState(persistedState.showStates.showSavedRoutesList || false);
  const [showRouteExecutionScreen, setShowRouteExecutionScreen] = useState(persistedState.showStates.showRouteExecutionScreen || false);
  const [showRouteHistoryPage, setShowRouteHistoryPage] = useState(persistedState.showStates.showRouteHistoryPage || false);
  const [executingRoute, setExecutingRoute] = useState<Route | null>(null);
  const [newRouteData, setNewRouteData] = useState<{ name: string; time: string; selectedDays: string[] } | null>(null);

  const addToNavigationStack = (screen: string) => {
    setNavigationStack(prev => [...prev, screen]);
    // Add to browser history
    window.history.pushState({ screen }, '', '/driver');
  };

  const handleBackNavigation = () => {
    if (navigationStack.length > 1) {
      const newStack = navigationStack.slice(0, -1);
      const previousScreen = newStack[newStack.length - 1];

      setNavigationStack(newStack);

      // Reset all states first
      setShowStudentForm(false);
      setShowGuardianForm(false);
      setShowGuardianCodes(false);
      setShowSchoolForm(false);
      setShowRouteForm(false);
      setShowRoutesListPage(false);
      setShowRouteFormPage(false);
      setShowRouteSetupPage(false);
      setShowRouteExecutionPage(false);
      setShowRouteMountingPage(false);
      setShowRouteHistoryPage(false);
      setEditingStudent(null);
      setEditingGuardian(null);
      setEditingSchool(null);
      setEditingRoute(null);
      setExecutingRoute(null);
      setNewRouteData(null);
      setShowClients(false);
      setShowDrivers(false);
      setShowSettings(false);
      setActiveTopButton(null);

      // Navigate to the specific screen
      switch (previousScreen) {
        case 'clients':
          setShowClients(true);
          setActiveTopButton('clients');
          break;
        case 'drivers':
          setShowDrivers(true);
          setActiveTopButton('drivers');
          break;
        case 'settings':
          setShowSettings(true);
          setActiveTopButton('settings');
          break;
        default:
          setActiveTab(previousScreen);
          break;
      }
    }
  };

  // Persistir estado no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('driverApp_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('driverApp_navigationStack', JSON.stringify(navigationStack));
  }, [navigationStack]);

  useEffect(() => {
    const showStates = {
      showRouteForm,
      showStudentForm,
      showGuardianForm,
      showGuardianCodes,
      showSchoolForm,
      showClients,
      showDrivers,
      showSettings,
      activeTopButton,
      showRoutesListPage,
      showRouteFormPage,
      showRouteSetupPage,
      showRouteExecutionPage,
      showRouteMountingPage,
      showSavedRoutesList,
      showRouteExecutionScreen,
      showRouteHistoryPage
    };
    localStorage.setItem('driverApp_showStates', JSON.stringify(showStates));
  }, [showRouteForm, showStudentForm, showGuardianForm, showGuardianCodes, showSchoolForm, showClients, showDrivers, showSettings, activeTopButton, showRoutesListPage, showRouteFormPage, showRouteSetupPage, showRouteExecutionPage, showRouteMountingPage, showSavedRoutesList, showRouteExecutionScreen, showRouteHistoryPage]);

  // Handle browser back button (mas não durante refresh)
  useEffect(() => {
    let isRefresh = false;
    
    // Detectar se é um refresh da página
    const handleBeforeUnload = () => {
      isRefresh = true;
    };
    
    const handlePopState = (event: PopStateEvent) => {
      // Se não é um refresh, então é navegação do botão voltar
      if (!isRefresh) {
        handleBackNavigation();
      }
      isRefresh = false; // Reset flag
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigationStack]);

  const {
    driver,
    van,
    routes,
    students,
    schools,
    guardians,
    activeTrip,
    updateDriver,
    updateVan,
    addRoute,
    updateRoute,
    deleteRoute,
    startTrip,
    updateStudentStatus,
    updateMultipleStudentsStatus,
    finishTrip,
    addStudent,
    updateStudent,
    toggleStudentDropoffType,
    deleteStudent,
    addGuardian,
    updateGuardian,
    deleteGuardian,
    addSchool,
    updateSchool,
    deleteSchool
  } = useDriverData();

  const navigateToScreen = (screen: string) => {
    // Reset all states first
    setShowStudentForm(false);
    setShowGuardianForm(false);
    setShowGuardianCodes(false);
    setShowSchoolForm(false);
    setShowRouteForm(false);
    setShowRoutesListPage(false);
    setShowRouteFormPage(false);
    setShowRouteSetupPage(false);
    setShowRouteExecutionPage(false);
    setShowRouteMountingPage(false);
    setShowSavedRoutesList(false);
    setShowRouteExecutionScreen(false);
    setEditingStudent(null);
    setEditingGuardian(null);
    setEditingSchool(null);
    setEditingRoute(null);
    setExecutingRoute(null);
    setNewRouteData(null);
    setShowClients(false);
    setShowDrivers(false);
    setShowSettings(false);
    setActiveTopButton(null);

    // Navigate to the specific screen
    switch (screen) {
      case 'clients':
        setShowClients(true);
        setActiveTopButton('clients');
        break;
      case 'drivers':
        setShowDrivers(true);
        setActiveTopButton('drivers');
        break;
      case 'settings':
        setShowSettings(true);
        setActiveTopButton('settings');
        break;
      default:
        setActiveTab(screen);
        break;
    }
  };

  const handleTabChange = (tab: string) => {
    addToNavigationStack(tab);
    navigateToScreen(tab);
  };

  const handleBackToHome = () => {
    setNavigationStack(['home']);
    navigateToScreen('home');
  };

  const handleClientsClick = () => {
    addToNavigationStack('clients');
    navigateToScreen('clients');
  };

  const handleDriversClick = () => {
    addToNavigationStack('drivers');
    setShowDrivers(true);
    setActiveTopButton('drivers');
    setShowClients(false);
    setShowSettings(false);
  };

  const handleSettingsClick = () => {
    addToNavigationStack('settings');
    navigateToScreen('settings');
  };

  const handleSaveRoute = (routeData: Omit<Route, 'id'>) => {
    if (editingRoute) {
      updateRoute(editingRoute.id, routeData);
      setEditingRoute(null);
    } else {
      addRoute(routeData);
    }
    setShowRouteForm(false);
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setShowRouteForm(true);
  };

  const handleExecuteRoute = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (route) {
      setExecutingRoute(route);
      setShowRouteExecutionPage(true);
    }
  };

  const handleBackFromRouteExecution = () => {
    setShowRouteExecutionPage(false);
    setExecutingRoute(null);
  };

  const handleSaveStudent = (studentData: {
    name: string;
    address: string;
    schoolId: string;
    guardianId: string;
    guardianPhone: string;
    guardianEmail: string;
  }) => {
    if (editingStudent) {
      updateStudent(editingStudent.id, studentData);
      setEditingStudent(null);
    } else {
      addStudent(studentData);
    }
    setShowStudentForm(false);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowStudentForm(true);
    addToNavigationStack('student-form');
  };

  const handleSaveGuardian = (guardianData: { name: string; email: string; phone: string }) => {
    if (editingGuardian) {
      updateGuardian(editingGuardian.id, guardianData);
      setEditingGuardian(null);
    } else {
      addGuardian(guardianData);
    }
    setShowGuardianForm(false);
  };

  const handleEditGuardian = (guardian: Guardian) => {
    setEditingGuardian(guardian);
    setShowGuardianForm(true);
    addToNavigationStack('guardian-form');
  };

  const handleSaveSchool = (schoolData: { name: string; address: string }) => {
    if (editingSchool) {
      updateSchool(editingSchool.id, schoolData);
      setEditingSchool(null);
    } else {
      addSchool(schoolData);
    }
    setShowSchoolForm(false);
  };

  const handleEditSchool = (school: SchoolType) => {
    setEditingSchool(school);
    setShowSchoolForm(true);
    addToNavigationStack('school-form');
  };

  const handleRoutesListBack = () => {
    setShowRoutesListPage(false);
    setActiveTab('home');
  };

  const handleCreateRoute = () => {
    setShowRoutesListPage(false);
    setShowRouteFormPage(true);
  };

  const handleRouteFormBack = () => {
    setShowRouteFormPage(false);
    setShowRoutesListPage(true);
  };

  const handleRouteFormNext = () => {
    setShowRouteFormPage(false);
    setShowRouteSetupPage(true);
  };

  const handleRouteSetupBack = () => {
    setShowRouteSetupPage(false);
    setShowRouteFormPage(true);
  };

  const handleRouteSetupSave = (routeItems?: any[]) => {
    if (routeItems && routeItems.length > 0) {
      // Extrair configurações dos estudantes
      const studentConfigs = routeItems
        .filter(item => item.type === 'student' && item.direction)
        .map(item => ({
          studentId: item.item.id,
          direction: item.direction
        }));
      
      // Criar nova rota com configurações
      const newRoute = {
        driverId: driver.id,
        name: `Rota ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        startTime: '07:00',
        weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        students: routeItems
          .filter(item => item.type === 'student')
          .map(item => item.item),
        studentConfigs: studentConfigs
      };
      
      addRoute(newRoute);
      console.log('🚐 Rota criada com configurações específicas:', newRoute);
    }
    
    setShowRouteSetupPage(false);
    setShowRoutesListPage(true);
  };

  const renderContent = () => {
    if (showRouteExecutionScreen && executingRoute) {
      return (
        <RouteExecutionScreen
          route={executingRoute}
          students={students}
          schools={schools}
          onBack={() => {
            setShowRouteExecutionScreen(false);
            setExecutingRoute(null);
            handleBackNavigation();
          }}
          onSaveChanges={(routeItems) => {
            // Detectar novos alunos adicionados
            const currentStudentIds = executingRoute.students.map(s => s.id);
            const newStudents = routeItems
              .filter(item => item.type === 'student')
              .map(item => item.studentData!)
              .filter(student => !currentStudentIds.includes(student.id));
            
            // Atualizar a rota com os novos itens
            const updatedRoute = {
              ...executingRoute,
              students: routeItems
                .filter(item => item.type === 'student')
                .map(item => item.studentData!)
            };
            updateRoute(executingRoute.id, updatedRoute);
            
            // Armazenar os IDs dos novos alunos para usar no restart
            if (newStudents.length > 0) {
              setExecutingRoute(prev => ({
                ...updatedRoute,
                newStudentIds: newStudents.map(s => s.id)
              } as any));
              console.log('Novos alunos adicionados:', newStudents.map(s => s.name));
            }
            
            console.log('Mudanças salvas na rota:', updatedRoute);
          }}
          onStartRoute={() => {
            // Verificar se há novos alunos para notificar seletivamente
            const newStudentIds = (executingRoute as any)?.newStudentIds;
            
            if (newStudentIds && newStudentIds.length > 0) {
              // Reiniciar rota com notificações apenas para novos alunos
              startTrip(executingRoute.id, newStudentIds);
              console.log('Rota reiniciada com notificações para novos alunos:', newStudentIds);
            } else {
              // Iniciar rota normalmente (primeira vez)
              startTrip(executingRoute.id);
              console.log('Rota iniciada:', executingRoute.name);
            }
            
            setShowRouteExecutionScreen(false);
            setExecutingRoute(null);
            setActiveTab('trip');
          }}
        />
      );
    }

    if (showRouteExecutionPage) {
      return (
        <RouteExecutionPage
          route={executingRoute}
          students={students}
          schools={schools}
          onBack={handleBackFromRouteExecution}
          onAddStudent={() => setShowStudentForm(true)}
          onAddSchool={() => setShowSchoolForm(true)}
          onRemoveStudent={(studentId) => console.log('Remove student:', studentId)}
          onUpdateStudent={(studentId, studentData) => {
            updateStudent(studentId, studentData);
            console.log(`✅ Estudante ${studentId} atualizado:`, studentData);
          }}
        />
      );
    }

    if (showRouteMountingPage && newRouteData) {
      return (
        <RouteMountingPage
          routeName={newRouteData.name}
          students={students}
          schools={schools}
          onBack={() => {
            setShowRouteMountingPage(false);
            setShowRoutesListPage(true);
            setNewRouteData(null);
            handleBackNavigation();
          }}
          onSaveRoute={(routeItems) => {
            // Criar a rota completa com os itens selecionados
            const newRoute = {
              driverId: driver?.id || 'temp-driver-id',
              name: newRouteData.name,
              startTime: newRouteData.time,
              weekDays: newRouteData.selectedDays,
              students: routeItems
                .filter(item => item.type === 'student')
                .map(item => item.item as Student)
            };

            addRoute(newRoute);
            setShowRouteMountingPage(false);
            setNewRouteData(null);
            // Voltar para a lista de rotas salvas
            setActiveTab('routes');
            console.log('Rota cadastrada com sucesso!', newRoute);
          }}
        />
      );
    }

    if (showRoutesListPage) {
      return (
        <RoutesListPage
          onBack={handleRoutesListBack}
          onCreateRoute={handleCreateRoute}
          onActiveRoutes={() => {
            if (activeTrip) {
              setShowRoutesListPage(false);
              setActiveTab('trip');
              addToNavigationStack('trip');
            } else {
              // Mostrar mensagem quando não há viagens ativas
              alert('Nenhuma viagem ativa no momento. Inicie uma rota para começar.');
            }
          }}
          onRouteHistory={() => {
            setShowRoutesListPage(false);
            setShowRouteHistoryPage(true);
            addToNavigationStack('routeHistory');
          }}
          onRouteCreated={(routeData) => {
            setNewRouteData(routeData);
            setShowRoutesListPage(false);
            setShowRouteMountingPage(true);
            addToNavigationStack('route-mounting');
          }}
        />
      );
    }

    if (showRouteFormPage) {
      return (
        <RouteFormPage
          onBack={handleRouteFormBack}
          onNext={handleRouteFormNext}
        />
      );
    }

    if (showRouteSetupPage) {
      return (
        <RouteSetupPage
          onBack={handleRouteSetupBack}
          onSave={handleRouteSetupSave}
          onAddStudent={() => { }}
          onAddSchool={() => { }}
          students={students}
          schools={schools}
          onUpdateStudent={updateStudent}
        />
      );
    }

    if (showRouteHistoryPage) {
      return (
        <RouteHistoryPage
          onBack={() => {
            setShowRouteHistoryPage(false);
            setShowRoutesListPage(true);
            handleBackNavigation();
          }}
        />
      );
    }

    if (showClients) {
      return (
        <ClientsPage
          onTabChange={handleTabChange}
          onBack={handleBackToHome}
          onClientsClick={handleClientsClick}
          onDriversClick={handleDriversClick}
          onSettingsClick={handleSettingsClick}
          onTripClick={() => {
            if (activeTrip) {
              setActiveTab('trip');
              setShowClients(false);
              addToNavigationStack('trip');
            } else {
              alert('Nenhuma viagem ativa no momento.');
            }
          }}
          onLogout={() => navigate('/auth')}
          activeTopButton={activeTopButton}
          hasActiveTrip={!!activeTrip}
        />
      );
    }

    if (showDrivers) {
      return (
        <DriversPage
          onTabChange={handleTabChange}
          onBack={handleBackToHome}
          onClientsClick={handleClientsClick}
          onDriversClick={handleDriversClick}
          onSettingsClick={handleSettingsClick}
          onTripClick={() => {
            if (activeTrip) {
              setActiveTab('trip');
              setShowDrivers(false);
              addToNavigationStack('trip');
            } else {
              alert('Nenhuma viagem ativa no momento.');
            }
          }}
          onRoutesClick={() => {
            setActiveTab('routes');
            setShowDrivers(false);
            addToNavigationStack('routes');
          }}
          onLogout={() => navigate('/auth')}
          activeTopButton={activeTopButton}
          hasActiveTrip={!!activeTrip}
        />
      );
    }

    if (showSettings) {
      return (
        <SettingsPage
          onTabChange={handleTabChange}
          onBack={handleBackToHome}
          onClientsClick={handleClientsClick}
          onDriversClick={handleDriversClick}
          onSettingsClick={handleSettingsClick}
          onTripClick={() => {
            if (activeTrip) {
              setActiveTab('trip');
              setShowSettings(false);
              addToNavigationStack('trip');
            } else {
              alert('Nenhuma viagem ativa no momento.');
            }
          }}
          onLogout={() => navigate('/auth')}
          activeTopButton={activeTopButton}
          hasActiveTrip={!!activeTrip}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <ClientsPage
            onTabChange={handleTabChange}
            onBack={handleBackToHome}
            onClientsClick={handleClientsClick}
            onDriversClick={handleDriversClick}
            onSettingsClick={handleSettingsClick}
            onTripClick={() => {
              if (activeTrip) {
                setActiveTab('trip');
                addToNavigationStack('trip');
              } else {
                alert('Nenhuma viagem ativa no momento.');
              }
            }}
            onLogout={() => navigate('/auth')}
            activeTopButton={activeTopButton}
            hasActiveTrip={!!activeTrip}
          />
        );

      case 'profile':
        return <DriverProfile driver={driver} onUpdate={updateDriver} onBack={handleBackNavigation} onLogout={() => navigate('/auth')} />;

      case 'van':
        return <VanRegistration van={van} onUpdate={updateVan} onBack={handleBackNavigation} onLogout={() => navigate('/auth')} />;

      case 'routes':
        // Resetar estados quando navegar para a aba rotas
        if (showRoutesListPage || showRouteFormPage || showRouteSetupPage || showRouteMountingPage || showRouteExecutionScreen) {
          // Se algum sub-estado estiver ativo, renderizar a tela correspondente
          // mas isso será tratado no renderContent() antes do switch
        }

        if (showRouteForm || editingRoute) {
          return (
            <RouteRegistration
              onSave={handleSaveRoute}
              driverId={driver.id}
              students={students}
              schools={schools}
              editingRoute={editingRoute}
              onBack={() => {
                setShowRouteForm(false);
                setEditingRoute(null);
                handleBackNavigation();
              }}
              onUpdateStudent={(studentId, studentData) => {
                const student = students.find(s => s.id === studentId);
                if (student) {
                  updateStudent(studentId, { 
                    ...student, 
                    ...studentData 
                  });
                  console.log(`✅ Estudante ${studentId} atualizado em Editar Informações:`, studentData);
                }
              }}
            />
          );
        }

        // Por padrão, sempre mostrar a lista de rotas salvas
        return (
          <SavedRoutesList
            routes={routes}
            onAddRoute={() => {
              setShowRoutesListPage(true);
              addToNavigationStack('routes-list');
            }}
            onExecuteRoute={(route) => {
              setExecutingRoute(route);
              setShowRouteExecutionScreen(true);
              addToNavigationStack('route-execution-screen');
            }}
            onEditRoute={(route) => {
              setEditingRoute(route);
              setShowRouteForm(true);
              addToNavigationStack('route-edit');
            }}
            onDeleteRoute={deleteRoute}
            onBack={handleBackNavigation}
          />
        );

      case 'students':
        if (showStudentForm) {
          return (
            <StudentRegistration
              schools={schools}
              guardians={guardians}
              onSave={handleSaveStudent}
              onBack={() => {
                setShowStudentForm(false);
                setEditingStudent(null);
                handleBackNavigation();
              }}
              editingStudent={editingStudent}
            />
          );
        }
        return (
          <StudentsList
            students={students}
            schools={schools}
            onBack={handleBackNavigation}
            onAddStudent={() => {
              setShowStudentForm(true);
              addToNavigationStack('student-form');
            }}
            onEditStudent={handleEditStudent}
            onDeleteStudent={deleteStudent}
            onUpdateStudent={(studentId, dropoffLocation) => {
              const student = students.find(s => s.id === studentId);
              if (student) {
                updateStudent(studentId, { 
                  ...student, 
                  dropoffLocation 
                });
              }
            }}
          />
        );

      case 'guardians':
        if (showGuardianForm) {
          return (
            <GuardianRegistration
              onSave={handleSaveGuardian}
              onBack={() => {
                setShowGuardianForm(false);
                setEditingGuardian(null);
                handleBackNavigation();
              }}
              editingGuardian={editingGuardian}
            />
          );
        }
        return (
          <GuardiansList
            guardians={guardians}
            onBack={handleBackNavigation}
            onAddGuardian={() => {
              setShowGuardianForm(true);
              addToNavigationStack('guardian-form');
            }}
            onEditGuardian={handleEditGuardian}
            onDeleteGuardian={deleteGuardian}
          />
        );

      case 'guardian-codes':
        return (
          <GuardianCodesManager
            guardians={guardians}
            onBack={handleBackNavigation}
            onUpdateGuardian={updateGuardian}
          />
        );

      case 'guardian-status':
        return (
          <GuardianStatusManager
            guardians={guardians}
            onBack={handleBackNavigation}
            onUpdateGuardian={updateGuardian}
          />
        );

      case 'schools':
        if (showSchoolForm) {
          return (
            <SchoolRegistration
              onSave={handleSaveSchool}
              onBack={() => {
                setShowSchoolForm(false);
                setEditingSchool(null);
                handleBackNavigation();
              }}
              editingSchool={editingSchool}
            />
          );
        }
        return (
          <SchoolsList
            schools={schools}
            onBack={handleBackNavigation}
            onAddSchool={() => {
              setShowSchoolForm(true);
              addToNavigationStack('school-form');
            }}
            onEditSchool={handleEditSchool}
            onDeleteSchool={deleteSchool}
          />
        );

      case 'trip':
        return (
          <ActiveTrip
            trip={activeTrip}
            students={students}
            schools={schools}
            driver={driver}
            onUpdateStudentStatus={updateStudentStatus}
            onUpdateMultipleStudentsStatus={updateMultipleStudentsStatus}
            onFinishTrip={() => {
              finishTrip();
              setActiveTab('routes');
              console.log('Viagem encerrada, redirecionando para Suas Rotas');
            }}
            onBack={handleBackNavigation}
            onLogout={() => navigate('/auth')}
          />
        );

      default:
        return (
          <ClientsPage
            onTabChange={handleTabChange}
            onBack={handleBackToHome}
            onClientsClick={handleClientsClick}
            onDriversClick={handleDriversClick}
            onSettingsClick={handleSettingsClick}
            onTripClick={() => {
              if (activeTrip) {
                setActiveTab('trip');
                addToNavigationStack('trip');
              } else {
                alert('Nenhuma viagem ativa no momento.');
              }
            }}
            activeTopButton={activeTopButton}
            hasActiveTrip={!!activeTrip}
          />
        );
    }
  };

  return (
    <>
      <SEOHead
        title="Painel do Motorista - VaiMogi"
        description="Painel completo para motoristas de transporte escolar. Gerencie rotas, estudantes, comunicação com responsáveis e execute viagens com segurança total."
        keywords="motorista, transporte escolar, painel motorista, gestão rotas, estudantes, viagens, segurança, rastreamento"
        url="/"
        type="website"
      />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </>
  );
}
