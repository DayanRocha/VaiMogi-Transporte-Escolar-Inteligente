import { useState, useEffect } from 'react';
import { Driver, Van, Student, Trip, TripStudent, Guardian } from '@/types/driver';
import { notificationService } from '@/services/notificationService';
import { realTimeNotificationService } from '@/services/realTimeNotificationService';
import { audioService, NotificationSoundType } from '@/services/audioService';
import { routeTrackingService } from '@/services/routeTrackingService';

export interface GuardianNotification {
  id: string;
  type: 'van_arrived' | 'embarked' | 'at_school' | 'disembarked';
  studentName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}

// Função para carregar dados do responsável logado (com suporte a múltiplas abas via query param)
// Regras:
// - Prioriza o código único do responsável na URL (?code=...)
// - Se não houver código, aceita ?guardianId=...
// - Fallback para 'guardianData' em localStorage (modo legado)
const getLoggedGuardian = (): Guardian | null => {
  // 1) Tentar obter o código único pela URL (?code=...)
  try {
    const search = new URLSearchParams(window.location.search);
    const urlGuardianCode = search.get('code');
    if (urlGuardianCode) {
      // Procurar responsável na lista persistida usando o código único
      const savedGuardians = localStorage.getItem('guardians');
      if (savedGuardians) {
        try {
          const guardians = JSON.parse(savedGuardians) as Guardian[];
          const foundByCode = guardians.find(g => (g.uniqueCode || '').toString() === urlGuardianCode);
          if (foundByCode) {
            console.log('👤 Guardian carregado via URL (code):', foundByCode);
            const guardianResolved: Guardian = {
              id: foundByCode.id,
              name: foundByCode.name || 'Responsável',
              email: foundByCode.email || '',
              phone: foundByCode.phone || '',
              uniqueCode: foundByCode.uniqueCode || urlGuardianCode,
              codeGeneratedAt: foundByCode.codeGeneratedAt,
              isActive: foundByCode.isActive ?? true
            };
            // Isolar por aba
            sessionStorage.setItem('currentGuardianKey', `code:${guardianResolved.uniqueCode}`);
            sessionStorage.setItem('currentGuardianId', guardianResolved.id);
            // Evitar conflito com legado quando usar ?code=
            try { localStorage.removeItem('guardianData'); } catch {}
            return guardianResolved;
          }
        } catch (e) {
          console.warn('⚠️ Lista de responsáveis inválida no localStorage:', e);
        }
      }
      // Se não encontrou na lista, criar objeto mínimo a partir do código
      console.log('👤 Guardian mínimo criado via URL (code):', urlGuardianCode);
      const guardianResolved: Guardian = {
        id: `guardian-${urlGuardianCode}`,
        name: `Responsável ${urlGuardianCode}`,
        email: '',
        phone: '',
        uniqueCode: urlGuardianCode,
        codeGeneratedAt: undefined,
        isActive: true
      } as Guardian;
      sessionStorage.setItem('currentGuardianKey', `code:${guardianResolved.uniqueCode}`);
      sessionStorage.setItem('currentGuardianId', guardianResolved.id);
      try { localStorage.removeItem('guardianData'); } catch {}
      return guardianResolved;
    }

    // 2) Alternativamente, suportar ?guardianId=... (modo anterior)
    const urlGuardianId = search.get('guardianId');
    if (urlGuardianId) {
      // Tentar encontrar esse responsável em uma lista persistida (se existir)
      const savedGuardians = localStorage.getItem('guardians');
      if (savedGuardians) {
        try {
          const guardians = JSON.parse(savedGuardians) as Guardian[];
          const found = guardians.find(g => g.id === urlGuardianId);
          if (found) {
            console.log('👤 Guardian carregado via URL (lista):', found);
            const guardianResolved: Guardian = {
              id: found.id,
              name: found.name || 'Responsável',
              email: found.email || '',
              phone: found.phone || '',
              uniqueCode: found.uniqueCode || '',
              codeGeneratedAt: found.codeGeneratedAt,
              isActive: found.isActive ?? true
            };
            sessionStorage.setItem('currentGuardianKey', `id:${guardianResolved.id}`);
            sessionStorage.setItem('currentGuardianId', guardianResolved.id);
            return guardianResolved;
          }
        } catch (e) {
          console.warn('⚠️ Lista de responsáveis inválida no localStorage:', e);
        }
      }
      // Se não há lista, construir um responsável mínimo a partir do ID da URL
      console.log('👤 Guardian mínimo criado via URL:', urlGuardianId);
      const guardianResolved: Guardian = {
        id: urlGuardianId,
        name: `Responsável ${urlGuardianId}`,
        email: '',
        phone: '',
        uniqueCode: '',
        codeGeneratedAt: undefined,
        isActive: true
      } as Guardian;
      sessionStorage.setItem('currentGuardianKey', `id:${guardianResolved.id}`);
      sessionStorage.setItem('currentGuardianId', guardianResolved.id);
      return guardianResolved;
    }
  } catch (e) {
    console.warn('⚠️ Não foi possível ler guardianId da URL:', e);
  }

  // 2) Fallback: usar 'guardianData' único salvo (comportamento atual)
  const savedGuardianData = localStorage.getItem('guardianData');
  if (savedGuardianData) {
    try {
      const guardianData = JSON.parse(savedGuardianData);
      return {
        id: guardianData.id || '1',
        name: guardianData.name || 'Responsável',
        email: guardianData.email || '',
        phone: guardianData.phone || '',
        uniqueCode: guardianData.code || '',
        codeGeneratedAt: guardianData.codeGeneratedAt,
        isActive: true
      } as Guardian;
    } catch (error) {
      console.error('Erro ao carregar dados do responsável:', error);
    }
  }
  
  console.log('❌ Nenhum responsável encontrado no localStorage');
  return null;
};

// Função para buscar dados do motorista do localStorage
const getDriverData = (guardianId: string): Driver | null => {
  // Primeiro tentar buscar dados individuais do motorista
  const savedDriverData = localStorage.getItem('driverData');
  const savedDrivers = localStorage.getItem('drivers');
  
  console.log('🔍 Buscando dados do motorista para responsável:', guardianId);
  console.log('🔍 DriverData encontrado:', !!savedDriverData);
  console.log('🔍 Drivers encontrado:', !!savedDrivers);
  
  // Primeiro tentar driverData (dados individuais)
  if (savedDriverData) {
    try {
      const driverData = JSON.parse(savedDriverData);
      console.log('📊 Dados do motorista individual:', driverData);
      
      // Converter para formato Driver se necessário
      const driver: Driver = {
        id: driverData.id || '1',
        name: driverData.name || 'Motorista',
        email: driverData.email || '',
        phone: driverData.phone || '',
        address: driverData.address || '',
        photo: driverData.photo || '/placeholder.svg'
      };
      
      console.log('✅ Motorista encontrado (individual):', driver.name);
      return driver;
    } catch (error) {
      console.error('❌ Erro ao carregar driverData:', error);
    }
  }
  
  // Se não encontrou individual, tentar lista de drivers
  if (savedDrivers) {
    try {
      const drivers = JSON.parse(savedDrivers);
      console.log('📊 Motoristas disponíveis:', drivers.length);
      console.log('📊 Dados dos motoristas:', drivers);
      
      if (drivers.length > 0) {
        // Primeiro, tentar encontrar por associação com estudantes/rotas
        const savedStudents = localStorage.getItem('students');
        if (savedStudents) {
          const students = JSON.parse(savedStudents);
          console.log('👥 Estudantes cadastrados:', students.length);
          
          // Encontrar estudantes do responsável
          const guardianStudents = students.filter((s: Student) => s.guardianId === guardianId);
          console.log('👶 Estudantes do responsável:', guardianStudents.length);
          
          if (guardianStudents.length > 0) {
            // Buscar rotas que contenham esses estudantes
            const savedRoutes = localStorage.getItem('routes');
            if (savedRoutes) {
              const routes = JSON.parse(savedRoutes);
              console.log('🛣️ Rotas disponíveis:', routes.length);
              
              // Encontrar rota que contém os estudantes do responsável
              const relevantRoute = routes.find((route: any) => 
                route.students && route.students.some((routeStudent: any) => 
                  guardianStudents.some(gs => gs.id === routeStudent.id)
                )
              );
              
              if (relevantRoute) {
                console.log('✅ Rota encontrada:', relevantRoute.name, 'Motorista ID:', relevantRoute.driverId);
                
                // Encontrar o motorista dessa rota
                const driver = drivers.find((d: Driver) => d.id === relevantRoute.driverId);
                if (driver) {
                  console.log('🚗 Motorista encontrado por rota:', driver.name);
                  return driver;
                }
              }
            }
          }
        }
        
        // Se não encontrou por rota, pegar o primeiro motorista disponível
        const driver = drivers[0];
        console.log('⚠️ Usando primeiro motorista disponível:', driver.name);
        return driver;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do motorista:', error);
    }
  } else {
    console.log('❌ Nenhum motorista encontrado no localStorage');
  }
  
  console.log('❌ Nenhum motorista encontrado, retornando null');
  return null;
};

// Função para buscar dados da van do localStorage
const getVanData = (driverId: string): Van | null => {
  console.log('🚐 Buscando van do motorista:', driverId);
  
  // A van pode estar salva junto com os dados do motorista ou separadamente
  // Primeiro, verificar se há dados da van no useDriverData (que usa mockVan)
  const savedDriverData = localStorage.getItem('driverData');
  if (savedDriverData) {
    try {
      const driverData = JSON.parse(savedDriverData);
      // Se o driver tem uma van associada, usar ela
      if (driverData.van) {
        console.log('✅ Van encontrada nos dados do motorista:', driverData.van.model);
        return {
          id: driverData.van.id || '1',
          driverId: driverId,
          model: driverData.van.model || 'Modelo não informado',
          plate: driverData.van.plate || 'Placa não informada',
          capacity: driverData.van.capacity || 0,
          observations: driverData.van.observations || '',
          photo: driverData.van.photo || '/placeholder.svg',
          drivingPermitDocument: driverData.van.drivingPermitDocument
        };
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados da van do motorista:', error);
    }
  }
  
  // Tentar buscar em lista de vans
  const savedVans = localStorage.getItem('vans');
  if (savedVans) {
    try {
      const vans = JSON.parse(savedVans);
      console.log('🚐 Vans disponíveis:', vans.length);
      console.log('🚐 Dados das vans:', vans);
      
      // Buscar van do motorista específico
      const van = vans.find((v: Van) => v.driverId === driverId);
      if (van) {
        console.log('✅ Van encontrada na lista:', van.model, van.plate);
        return {
          id: van.id,
          driverId: van.driverId,
          model: van.model || 'Modelo não informado',
          plate: van.plate || 'Placa não informada',
          capacity: van.capacity || 0,
          observations: van.observations || '',
          photo: van.photo || '/placeholder.svg',
          drivingPermitDocument: van.drivingPermitDocument
        };
      } else {
        console.log('⚠️ Van não encontrada para motorista específico:', driverId);
        
        // Se não encontrou van específica, pegar a primeira disponível
        if (vans.length > 0) {
          const firstVan = vans[0];
          console.log('⚠️ Usando primeira van disponível:', firstVan.model);
          return {
            id: firstVan.id,
            driverId: firstVan.driverId,
            model: firstVan.model || 'Modelo não informado',
            plate: firstVan.plate || 'Placa não informada',
            capacity: firstVan.capacity || 0,
            observations: firstVan.observations || '',
            photo: firstVan.photo || '/placeholder.svg',
            drivingPermitDocument: firstVan.drivingPermitDocument
          };
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados da van:', error);
    }
  } else {
    console.log('❌ Nenhuma van encontrada no localStorage');
  }
  
  console.log('❌ Nenhuma van encontrada, retornando null');
  return null;
};

// Função para buscar filhos do responsável logado (usa apenas o ID do responsável)
const getGuardianChildren = (guardianId: string): Student[] => {
  const savedStudents = localStorage.getItem('students');
  
  if (savedStudents) {
    try {
      const students = JSON.parse(savedStudents);
      return students.filter((student: Student) => student.guardianId === guardianId);
    } catch (error) {
      console.error('Erro ao carregar estudantes:', error);
    }
  }
  
  console.log('❌ Nenhum estudante encontrado no localStorage');
  return [];
};

// Função para buscar escolas do localStorage e filtrar logicamente pelos filhos do responsável
const getSchools = (guardianId: string, guardianStudents: Student[]) => {
  console.log('🏫 Buscando escolas relacionadas ao responsável:', guardianId);
  const savedSchoolsRaw = localStorage.getItem('schools');
  const savedSchools = savedSchoolsRaw ? JSON.parse(savedSchoolsRaw) : [];
  console.log('🏫 Escolas disponíveis no storage:', savedSchools.length);

  // Conjunto de schoolIds dos filhos do responsável
  const guardianSchoolIds = new Set(guardianStudents.map(s => s.schoolId).filter(Boolean));
  console.log('🏫 schoolIds dos filhos:', Array.from(guardianSchoolIds));

  if (savedSchools.length === 0) {
    console.log('❌ Nenhuma escola no storage. Verifique se o motorista já cadastrou as escolas.');
    return [];
  }

  // Filtrar escolas por schoolIds dos filhos
  const filtered = savedSchools.filter((s: any) => guardianSchoolIds.has(s.id));
  console.log('🏫 Escolas filtradas para o responsável:', filtered.map((s: any) => ({ id: s.id, name: s.name })));

  // Diagnóstico: IDs sem correspondência
  const missing = Array.from(guardianSchoolIds).filter(id => !filtered.some((s: any) => s.id === id));
  if (missing.length > 0) {
    console.warn('⚠️ schoolIds de estudantes sem correspondência em schools:', missing);
  }

  return filtered;
};

export const useGuardianData = () => {
  const guardian = getLoggedGuardian();
  
  // Se não há guardian logado, retornar valores padrão
  if (!guardian) {
    return {
      guardian: { id: '1', name: 'Responsável', email: '', isActive: true },
      driver: null,
      van: null,
      students: [],
      schools: [],
      activeTrip: null,
      notifications: [],
      markNotificationAsRead: () => {},
      deleteNotification: () => {},
      deleteNotifications: () => {},
      getUnreadCount: () => 0
    };
  }
  
  // Debug: mostrar dados do guardian
  console.log('👤 Guardian logado:', guardian);
  
  const [driver, setDriver] = useState<Driver | null>(() => {
    const driverData = getDriverData(guardian.id);
    console.log('🚗 Driver inicial:', driverData);
    return driverData;
  });
  
  const [van, setVan] = useState<Van | null>(() => {
    const initialDriver = getDriverData(guardian.id);
    if (!initialDriver) return null;
    const vanData = getVanData(initialDriver.id);
    console.log('🚐 Van inicial:', vanData);
    return vanData;
  });
  
  const [students, setStudents] = useState<Student[]>(() => getGuardianChildren(guardian.id));
  const [schools, setSchools] = useState(() => getSchools(guardian.id, getGuardianChildren(guardian.id)));
  const [activeTrip, setActiveTrip] = useState<Trip | null>(() => {
    // Verificar se há uma rota ativa no routeTrackingService
    const activeRoute = routeTrackingService.getActiveRoute();
    if (activeRoute) {
      // Converter ActiveRoute para Trip (conforme tipos/driver.ts)
      const tripStudents = (activeRoute.studentPickups || []).map((p: any) => ({
        studentId: p.studentId,
        direction: activeRoute.direction,
        status: p.status === 'picked_up' ? 'embarked' : (p.status === 'dropped_off' ? 'disembarked' : 'waiting')
      }));

      const dateISO = new Date(activeRoute.startTime).toISOString();
      return {
        id: activeRoute.id,
        routeId: activeRoute.id,
        date: dateISO,
        status: activeRoute.isActive ? 'in_progress' : 'planned',
        students: tripStudents
      } as Trip;
    }
    return null;
  });
  const [notifications, setNotifications] = useState<GuardianNotification[]>(() => {
    // Carregar notificações reais do localStorage
    const storedNotifications = notificationService.getStoredNotifications();
    console.log('📱 Notificações carregadas do localStorage:', storedNotifications.length);
    return storedNotifications;
  });

  // Atualizar dados quando houver mudanças no localStorage
  useEffect(() => {
    const updateData = () => {
      const newDriver = getDriverData(guardian.id);
      console.log('Debug: Driver encontrado in guardian:', !!newDriver);
      if (!newDriver) {
        console.log('Debug: Motivo driver não encontrado: Nenhum dado no localStorage ou sem match para guardian ' + guardian.id);
      }
      // Verificar e atualizar activeTrip baseado na rota ativa
      const activeRoute = routeTrackingService.getActiveRoute();
      console.log('Debug: Rota ativa detectada no guardian hook:', activeRoute ? 'SIM' : 'NÃO');
      if (activeRoute) {
        console.log('Debug: Route details in guardian:', { isActive: activeRoute.isActive, driverName: activeRoute.driverName });
        // Converter ActiveRoute para Trip (conforme types/driver.ts) e atualizar estado
        const tripStudents: TripStudent[] = (activeRoute.studentPickups || []).map((p: any) => {
          const status: TripStudent['status'] =
            p.status === 'picked_up' ? 'embarked'
            : p.status === 'dropped_off' ? 'disembarked'
            : 'waiting';
          return {
            studentId: p.studentId,
            direction: activeRoute.direction,
            status
          };
        });
        const tripData: Trip = {
          id: activeRoute.id,
          routeId: activeRoute.id,
          date: new Date(activeRoute.startTime).toISOString(),
          status: activeRoute.isActive ? 'in_progress' : (activeRoute.endTime ? 'completed' : 'planned'),
          students: tripStudents
        };
        setActiveTrip(tripData);
      } else {
        setActiveTrip(null);
      }
      const newVan = newDriver ? getVanData(newDriver.id) : null;
      const newStudents = getGuardianChildren(guardian.id);
      const newSchools = getSchools(guardian.id, newStudents);
      
      setDriver(newDriver);
      setVan(newVan);
      setStudents(newStudents);
      setSchools(newSchools);
    };

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'drivers' || e.key === 'vans' || e.key === 'students' || e.key === 'schools') {
        updateData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Também verificar periodicamente para mudanças na mesma aba (mais frequente para tempo real)
    const interval = setInterval(updateData, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [guardian.id]);

  // Escutar mudanças na rota ativa do routeTrackingService
  useEffect(() => {
    const handleRouteChange = (activeRoute: any) => {
      console.log('🔄 Mudança na rota detectada no guardian hook:', activeRoute ? 'ATIVA' : 'INATIVA');
      if (activeRoute) {
        const tripStudents = (activeRoute.studentPickups || []).map((p: any) => ({
          studentId: p.studentId,
          direction: activeRoute.direction,
          status: p.status === 'picked_up' ? 'embarked' : (p.status === 'dropped_off' ? 'disembarked' : 'waiting')
        }));
        const dateISO = new Date(activeRoute.startTime).toISOString();
        const tripData: Trip = {
          id: activeRoute.id,
          routeId: activeRoute.id,
          date: dateISO,
          status: activeRoute.isActive ? 'in_progress' : 'planned',
          students: tripStudents
        };
        setActiveTrip(tripData);
        console.log('✅ ActiveTrip atualizado no guardian hook:', tripData.id);
      } else {
        setActiveTrip(null);
        console.log('❌ ActiveTrip removido no guardian hook');
      }
    };

    // Adicionar listener para mudanças na rota
    routeTrackingService.addListener(handleRouteChange);

    // Verificar rota ativa imediatamente
    const currentRoute = routeTrackingService.getActiveRoute();
    handleRouteChange(currentRoute);

    return () => {
      routeTrackingService.removeListener(handleRouteChange);
    };
  }, []);

  // Inicializar e escutar notificações reais do serviço (apenas tempo real para evitar duplicatas)
  useEffect(() => {
    // Inicializar o serviço de notificações em tempo real
    console.log('🔧 DEBUG: Inicializando realTimeNotificationService...');
    realTimeNotificationService.init();
    console.log('✅ DEBUG: realTimeNotificationService inicializado');
    
    // Set para rastrear IDs de notificações já processadas
    const processedNotifications = new Set<string>();
    
    const handleNewNotification = async (notification: GuardianNotification, source: string = 'unknown') => {
      console.log(`📱 Nova notificação recebida de ${source}:`, notification);
      
      // Verificar se já foi processada
      if (processedNotifications.has(notification.id)) {
        console.log(`⚠️ Notificação duplicada ignorada de ${source}:`, notification.id);
        return;
      }
      
      // Marcar como processada
      processedNotifications.add(notification.id);
      
      // Verificar se a notificação já existe no estado
      setNotifications(prev => {
        const exists = prev.some(n => n.id === notification.id);
        if (exists) {
          console.log('⚠️ Notificação já existe no estado:', notification.id);
          return prev;
        }
        console.log(`✅ Adicionando nova notificação de ${source}:`, notification.id);
        return [notification, ...prev];
      });
      
      // Reproduzir som da buzina ao receber notificação
      console.log('🔊 DEBUG: ===== INÍCIO REPRODUÇÃO DE SOM =====');
      try {
        const soundType: NotificationSoundType = notification.type as NotificationSoundType;
        console.log('🔊 DEBUG: Tipo de som:', soundType);
        console.log('🔊 DEBUG: AudioService habilitado:', audioService.isAudioEnabled());
        console.log('🔊 DEBUG: Deve usar arquivos de áudio:', audioService.shouldUseAudioFiles());
        
        // Verificar se o audioService já foi inicializado
        console.log('🔊 DEBUG: Inicializando audioService...');
        await audioService.init();
        console.log('🔊 DEBUG: AudioService inicializado com sucesso');
        
        // Tentar solicitar permissão se necessário
        console.log('🔊 DEBUG: Verificando permissões de áudio...');
        const hasPermission = await audioService.requestAudioPermission();
        console.log('🔊 DEBUG: Permissão de áudio:', hasPermission ? 'CONCEDIDA' : 'NEGADA');
        
        console.log('🔊 DEBUG: Chamando playNotificationSound...');
        await audioService.playNotificationSound(soundType);
        console.log('✅ DEBUG: Som reproduzido com SUCESSO!');
        console.log('🔊 DEBUG: ===== FIM REPRODUÇÃO DE SOM =====');
      } catch (error) {
        console.error('❌ DEBUG: ===== ERRO NA REPRODUÇÃO DE SOM =====');
        console.error('❌ DEBUG: Erro detalhado:', error);
        console.error('❌ DEBUG: Tipo do erro:', typeof error);
        console.error('❌ DEBUG: Stack trace:', error instanceof Error ? error.stack : 'N/A');
        console.error('❌ DEBUG: Message:', error instanceof Error ? error.message : String(error));
        console.error('❌ DEBUG: ===== FIM ERRO =====');
        
        // Tentar fallback com tom sintético
        try {
          console.log('🔊 DEBUG: Tentando fallback com tom sintético...');
          // Criar um tom simples como fallback
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          
          console.log('✅ DEBUG: Fallback de tom sintético reproduzido');
        } catch (fallbackError) {
          console.error('❌ DEBUG: Falha no fallback também:', fallbackError);
        }
      }
    };
  
    // Registrar apenas no serviço de tempo real (que já inclui o tradicional)
    const realTimeHandler = (notification: GuardianNotification) => 
      handleNewNotification(notification, 'realTime');
    
    realTimeNotificationService.addListener(realTimeHandler);
  
    // Cleanup: remover listener quando componente for desmontado
    return () => {
      realTimeNotificationService.removeListener(realTimeHandler);
      processedNotifications.clear();
    };
  }, []);

  const markNotificationAsRead = (notificationId: string) => {
    // Marcar como lida no serviço (localStorage)
    notificationService.markAsRead(notificationId);
    
    // Atualizar estado local
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const deleteNotification = (notificationId: string) => {
    // Excluir no serviço (localStorage)
    notificationService.deleteNotification(notificationId);
    
    // Atualizar estado local
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const deleteNotifications = (notificationIds: string[]) => {
    // Excluir múltiplas no serviço (localStorage)
    notificationService.deleteNotifications(notificationIds);
    
    // Atualizar estado local
    setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  return {
    guardian,
    driver,
    van,
    students,
    schools,
    activeTrip,
    notifications,
    markNotificationAsRead,
    deleteNotification,
    deleteNotifications,
    getUnreadCount
  };
};