import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { WelcomeDialog } from './WelcomeDialog';
import SEOHead from './SEOHead';

type AuthView = 'login' | 'register';

export const AuthFlow = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [driverName, setDriverName] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  // Detectar a rota atual e definir a view apropriada
  useEffect(() => {
    if (location.pathname === '/register') {
      setCurrentView('register');
    } else {
      setCurrentView('login');
    }
  }, [location.pathname]);

  // Função de login
  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Aqui você implementaria a lógica de autenticação
      console.log('🚀 Login attempt:', { email, password });
      
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Criar dados do motorista
      const driverData = {
        id: Date.now().toString(),
        name: email.split('@')[0], // Use parte do email como nome temporário
        email,
        phone: '',
        address: '',
        photo: '/placeholder.svg'
      };
      
      console.log('💾 Salvando dados do motorista:', driverData);
      
      // Salvar dados do motorista no localStorage
      localStorage.setItem('driverData', JSON.stringify(driverData));
      localStorage.setItem('hasLoggedInBefore', 'true');
      
      // Verificar se os dados foram salvos corretamente
      const savedDriverData = localStorage.getItem('driverData');
      const savedHasLoggedIn = localStorage.getItem('hasLoggedInBefore');
      
      console.log('✅ Verificação pós-salvamento:', {
        driverDataSaved: !!savedDriverData,
        hasLoggedInSaved: !!savedHasLoggedIn,
        savedDriverData: savedDriverData ? JSON.parse(savedDriverData) : null,
        savedHasLoggedIn
      });
      
      // Verificar se é o primeiro login (simulado)
      const isFirstLogin = !localStorage.getItem('firstLoginCompleted');
      
      if (isFirstLogin) {
        console.log('🎉 Primeiro login detectado, mostrando boas-vindas');
        localStorage.setItem('firstLoginCompleted', 'true');
        setDriverName(email.split('@')[0]);
        setShowWelcome(true);
      } else {
        console.log('🔄 Login recorrente, navegando diretamente');
        navigate('/driver');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      alert('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função de login do responsável
  const handleGuardianLogin = async (code: string) => {
    setIsLoading(true);
    try {
      // Aqui você implementaria a validação do código
      console.log('Guardian login attempt:', { code });
      
      // Simular chamada de API para validar código
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Buscar responsável pelo código único no sistema
      const savedGuardians = localStorage.getItem('guardians');
      let guardians = [];
      
      console.log('🔍 Dados salvos no localStorage:', savedGuardians);
      
      if (savedGuardians) {
        try {
          guardians = JSON.parse(savedGuardians);
          console.log('📋 Responsáveis carregados:', guardians);
        } catch (error) {
          console.error('❌ Erro ao carregar responsáveis:', error);
        }
      } else {
        console.log('⚠️ Nenhum responsável encontrado no localStorage');
      }
      
      // Procurar responsável com o código fornecido
      console.log('🔎 Procurando responsável com código:', code);
      console.log('📊 Total de responsáveis:', guardians.length);
      
      // Debug: mostrar todos os códigos disponíveis
      guardians.forEach((g: any, index: number) => {
        console.log(`👤 Responsável ${index + 1}:`, {
          name: g.name,
          uniqueCode: g.uniqueCode,
          isActive: g.isActive !== false // Considera true se não definido
        });
      });
      
      // Primeiro, buscar responsável apenas pelo código
      const guardianByCode = guardians.find((g: any) => g.uniqueCode === code);
      console.log('🔍 Responsável encontrado por código:', guardianByCode);
      
      if (!guardianByCode) {
        console.log('❌ Código não encontrado na base de dados');
        throw new Error('Código não encontrado');
      }
      
      // Verificar se o responsável está ativo
      const isActive = guardianByCode.isActive !== false; // Default é true se não definido
      console.log('🔒 Status do responsável:', { isActive, rawStatus: guardianByCode.isActive });
      
      if (!isActive) {
        console.log('⚠️ Responsável encontrado mas está inativo');
        throw new Error('INACTIVE_GUARDIAN');
      }
      
      const guardian = guardianByCode;
      
      // Salvar dados do responsável logado
      const guardianData = {
        id: guardian.id,
        code: guardian.uniqueCode,
        name: guardian.name,
        email: guardian.email,
        phone: guardian.phone || '',
        codeGeneratedAt: guardian.codeGeneratedAt
      };
      
      localStorage.setItem('guardianData', JSON.stringify(guardianData));
      localStorage.setItem('guardianLoggedIn', 'true');
      
      console.log(`✅ Login do responsável ${guardian.name} realizado com sucesso usando código ${code}`);
      
      // Redirecionar para a aplicação do responsável
      navigate('/guardian');
    } catch (error) {
      console.error('Erro no login do responsável:', error);
      throw error; // Re-throw para ser capturado pelo componente
    } finally {
      setIsLoading(false);
    }
  };

  // Função de cadastro
  const handleRegister = async (name: string, email: string, phone: string, password: string) => {
    setIsLoading(true);
    try {
      // Aqui você implementaria a lógica de cadastro
      console.log('Register attempt:', { name, email, phone, password });
      
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Salvar dados do motorista no localStorage (temporário)
      const driverData = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        address: '', // Será preenchido depois no perfil
        photo: '/placeholder.svg'
      };
      localStorage.setItem('driverData', JSON.stringify(driverData));
      
      // Primeiro cadastro sempre mostra boas-vindas
      setDriverName(name);
      setShowWelcome(true);
      localStorage.setItem('hasLoggedInBefore', 'true');
    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };



  // Função para recuperação de senha
  const handleForgotPassword = async () => {
    // Aqui você pode implementar um diálogo para coletar o email
    const email = prompt('Digite seu e-mail para recuperação:');
    if (!email) return;
    setIsLoading(true);
    try {
      // Aqui você implementaria a lógica de recuperação de senha
      console.log('Forgot password for:', email);
      
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('E-mail de recuperação enviado!');
    } catch (error) {
      console.error('Erro ao enviar e-mail de recuperação:', error);
      alert('Erro ao enviar e-mail de recuperação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentView === 'login') {
    return (
      <>
        <SEOHead
          title="Login - VaiMogi"
          description="Faça login na plataforma VaiMogi para acessar sua conta de motorista ou responsável. Acesso seguro e rápido."
          keywords="login, entrar, acesso, conta, motorista, responsável, VaiMogi"
          url="https://vaimogi.com/auth"
          type="website"
        />
        <LoginPage
          onLogin={handleLogin}
          onGuardianLogin={handleGuardianLogin}
          onNavigateToRegister={() => navigate('/register')}
          onForgotPassword={handleForgotPassword}
        />
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Cadastro - VaiMogi"
        description="Crie sua conta na VaiMogi e comece a usar nossa plataforma de transporte escolar. Cadastro rápido e seguro para motoristas e responsáveis."
        keywords="cadastro, registro, criar conta, motorista, responsável, transporte escolar, VaiMogi"
        url="https://vaimogi.com/auth"
        type="website"
      />
      <RegisterPage
        onRegister={handleRegister}
        onNavigateToLogin={() => navigate('/login')}
      />
      
      <WelcomeDialog
        isOpen={showWelcome}
        onClose={() => {
          setShowWelcome(false);
          navigate('/driver');
        }}
        driverName={driverName}
      />
    </>
  );
};