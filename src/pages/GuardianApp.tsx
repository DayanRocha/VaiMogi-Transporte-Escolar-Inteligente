
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuardianMapboxMap } from '../components/GuardianMapboxMap';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GuardianHeader } from '@/components/GuardianHeader';
import { GuardianMenuModal } from '@/components/GuardianMenuModal';
import { NotificationPanel } from '@/components/NotificationPanel';
import { GuardianWelcomeDialog } from '@/components/GuardianWelcomeDialog';
import SEOHead from '@/components/SEOHead';

import { useGuardianData } from '@/hooks/useGuardianData';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { audioService } from '@/services/audioService';
import { initNotificationCleanup } from '@/utils/notificationCleanup';
import '@/utils/clearGeocodingCache'; // Importar para expor funções globalmente

export const GuardianApp = () => {
  const navigate = useNavigate();
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  // Estado para qualidade do mapa
  const [mapQuality, setMapQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const { 
    guardian, 
    driver, 
    van, 
    students, 
    schools,
    activeTrip, 
    notifications: legacyNotifications,
    markNotificationAsRead,
    deleteNotification,
    deleteNotifications
  } = useGuardianData();

  // Hook para rastreamento de rota
  const { hasActiveRoute, activeRoute, driverLocation: routeDriverLocation } = useRouteTracking();

  // Mapear localização do motorista (lat/lng -> latitude/longitude) para o componente do mapa
  const mappedDriverLocation = routeDriverLocation
    ? {
        latitude: routeDriverLocation.lat,
        longitude: routeDriverLocation.lng,
        timestamp: routeDriverLocation.timestamp,
      }
    : undefined;

  // Mapear rota ativa para estrutura consumida pelo GuardianMapboxMap
  const mappedActiveRoute = activeRoute
    ? {
        id: activeRoute.id,
        name: activeRoute.driverName || 'Rota ativa',
        coordinates: [
          // Incluir localização atual do motorista primeiro, se existir
          ...(activeRoute.currentLocation
            ? [[activeRoute.currentLocation.lng, activeRoute.currentLocation.lat] as [number, number]]
            : []),
          // Em seguida, pontos dos estudantes (quando disponíveis)
          ...activeRoute.studentPickups
            .filter(s => typeof s.lat === 'number' && typeof s.lng === 'number')
            .map(s => [s.lng as number, s.lat as number] as [number, number])
        ],
        status: activeRoute.isActive ? 'active' : activeRoute.endTime ? 'completed' : 'inactive' as 'active' | 'inactive' | 'completed'
      }
    : undefined;

  // Notificações em tempo real
  const {
    notifications: realTimeNotifications,
    unreadCount: realTimeUnreadCount,
    markAsRead: markRealTimeAsRead,
    markAllAsRead: markAllRealTimeAsRead,
    deleteNotification: deleteRealTimeNotification
  } = useRealTimeNotifications(guardian.id);

  // Filtrar notificações legadas que podem ser duplicadas
  const filteredLegacyNotifications = legacyNotifications.filter(legacy => {
    // Verificar se há uma notificação em tempo real similar
    const hasSimilarRealTime = realTimeNotifications.some(rt => 
      rt.message.includes(legacy.studentName || '') && 
      Math.abs(new Date(rt.timestamp).getTime() - new Date(legacy.timestamp).getTime()) < 60000 // 1 minuto
    );
    return !hasSimilarRealTime;
  });

  // Combinar notificações (priorizando tempo real)
  const allNotifications = [...realTimeNotifications, ...filteredLegacyNotifications];
  const totalUnreadCount = realTimeUnreadCount + filteredLegacyNotifications.filter(n => !n.isRead).length;

  // Verificar se o responsável ainda está ativo
  useEffect(() => {
    const checkGuardianStatus = () => {
      const savedGuardians = localStorage.getItem('guardians');
      if (savedGuardians) {
        try {
          const guardians = JSON.parse(savedGuardians);
          const currentGuardian = guardians.find((g: any) => g.id === guardian.id);
          
          if (currentGuardian && currentGuardian.isActive === false) {
            console.log('🚫 Responsável foi desativado pelo motorista');
            alert('Seu acesso foi desativado pelo motorista. Você será redirecionado para a tela de login.');
            
            // Limpar dados e redirecionar
            localStorage.removeItem('guardianData');
            localStorage.removeItem('guardianLoggedIn');
            navigate('/auth');
            return;
          }
        } catch (error) {
          console.error('Erro ao verificar status do responsável:', error);
        }
      }
    };

    // Verificar status imediatamente
    checkGuardianStatus();
    
    // Verificar status a cada 30 segundos
    const interval = setInterval(checkGuardianStatus, 30000);
    
    return () => clearInterval(interval);
  }, [guardian.id, navigate]);

  // Verificar se é o primeiro acesso do responsável
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(`guardianWelcome_${guardian.id}`);
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, [guardian.id]);

  // Removido: não sobrescrever dados das escolas cadastrados pelo motorista

  // Inicializar serviço de áudio e limpeza de notificações
  useEffect(() => {
    const initAudio = async () => {
      await audioService.init();
    };
    
    initAudio();
    
    // Inicializar limpeza de notificações
    initNotificationCleanup();
    
    // Configurar múltiplos listeners para garantir que o áudio seja habilitado
    const handleFirstInteraction = async (eventType: string) => {
      try {
        const hasPermission = await audioService.requestAudioPermission();
        
        // Testar reprodução de áudio
        await audioService.testSound();
        
        // Remover todos os listeners após primeira interação bem-sucedida
        document.removeEventListener('click', handleClick);
        document.removeEventListener('touchstart', handleTouch);
        document.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('scroll', handleScroll);
        
        console.log('✅ Áudio habilitado com sucesso');
      } catch (error) {
        console.warn('⚠️ Erro ao habilitar áudio:', error);
      }
    };

    const handleClick = () => handleFirstInteraction('click');
    const handleTouch = () => handleFirstInteraction('touchstart');
    const handleKeydown = () => handleFirstInteraction('keydown');
    const handleScroll = () => handleFirstInteraction('scroll');

    // Adicionar múltiplos tipos de listeners para capturar qualquer interação
    document.addEventListener('click', handleClick, { once: true });
    document.addEventListener('touchstart', handleTouch, { once: true });
    document.addEventListener('keydown', handleKeydown, { once: true });
    document.addEventListener('scroll', handleScroll, { once: true });

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm('Tem certeza que deseja sair?');
    
    if (confirmLogout) {
      // Limpar dados do responsável do localStorage
      localStorage.removeItem('guardianData');
      localStorage.removeItem('guardianLoggedIn');
      
      console.log('🚪 Logout do responsável realizado');
      
      // Redirecionar para a tela de login
      navigate('/auth');
    }
  };

  const handleWelcomeClose = () => {
    // Marcar que o responsável já viu as boas-vindas
    localStorage.setItem(`guardianWelcome_${guardian.id}`, 'true');
    setShowWelcome(false);
    console.log(`👋 Boas-vindas mostradas para ${guardian.name}`);
  };

  // DEBUG: verificar escolas relacionadas ao responsável atual
  useEffect(() => {
    try {
      const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
      const allSchools = JSON.parse(localStorage.getItem('schools') || '[]');
      const myStudents = (Array.isArray(allStudents) ? allStudents : []).filter((s: any) => s.guardianId === guardian.id);
      const guardianSchoolIds = [...new Set(myStudents.map((s: any) => s.schoolId))];
      const present = (Array.isArray(allSchools) ? allSchools : []).filter((s: any) => guardianSchoolIds.includes(s.id));
      const missing = guardianSchoolIds.filter((id: string) => !present.some((s: any) => s.id === id));
      console.log('🔎 DEBUG Escolas por responsável:', {
        guardianId: guardian.id,
        studentsOfGuardian: myStudents.map((s: any) => ({ id: s.id, name: s.name, schoolId: s.schoolId })),
        guardianSchoolIds,
        presentSchools: present.map((s: any) => ({ id: s.id, name: s.name })),
        missingSchoolIds: missing
      });
    } catch (e) {
      console.warn('⚠️ DEBUG Escolas por responsável: erro ao ler localStorage', e);
    }
  }, [guardian.id]);

  return (
    <>
      <SEOHead
        title="Painel do Responsável - VaiMogi"
        description="Acompanhe o transporte escolar do seu filho em tempo real. Receba notificações, visualize a localização da van e mantenha comunicação direta com o motorista."
        keywords="responsável, pais, transporte escolar, rastreamento tempo real, localização van, notificações, segurança estudante"
        url="/guardian"
        type="website"
      />
      <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <GuardianHeader
        guardian={guardian}
        notifications={allNotifications}
        unreadCount={totalUnreadCount}
        onMenuClick={() => setShowMenuModal(true)}
        onNotificationClick={() => setShowNotifications(true)}
        onLogout={handleLogout}
      />

      {/* Main Map View */}
      {hasActiveRoute ? (
        <div className="h-[calc(100vh-64px)] relative z-0">
          <ErrorBoundary>
            <GuardianMapboxMap
              driverLocation={mappedDriverLocation}
              activeRoute={mappedActiveRoute}
              students={students}
              schools={schools}
              mapQuality={mapQuality}
              onMapQualityChange={setMapQuality}
            />
          </ErrorBoundary>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-100">
          <div className="text-center p-4">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Nenhuma rota ativa no momento</h2>
            <p className="text-gray-500">O mapa será exibido aqui quando o motorista iniciar uma viagem.</p>
          </div>
        </div>
      )}

      {/* Guardian Menu Modal */}
      <GuardianMenuModal
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        driver={driver}
        van={van}
        guardian={guardian}
        children={students}
        schools={schools}
      />

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={filteredLegacyNotifications}
        realTimeNotifications={realTimeNotifications}
        onMarkAsRead={markNotificationAsRead}
        onMarkRealTimeAsRead={markRealTimeAsRead}
        onMarkAllRealTimeAsRead={markAllRealTimeAsRead}
        onDeleteRealTimeNotification={deleteRealTimeNotification}
        onDeleteNotification={deleteNotification}
        onDeleteNotifications={deleteNotifications}
      />

      {/* Welcome Dialog */}
      <GuardianWelcomeDialog
        isOpen={showWelcome}
        onClose={handleWelcomeClose}
        guardianName={guardian.name}
      />
      </div>
    </>
  );
};
