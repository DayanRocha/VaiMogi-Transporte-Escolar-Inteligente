import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Shield, 
  Clock, 
  Users, 
  Smartphone, 
  Bell,
  Route,
  Eye,
  Key,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import SEOHead from './SEOHead';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [showGuardianDialog, setShowGuardianDialog] = useState(false);
  const [guardianCode, setGuardianCode] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guardianCodeError, setGuardianCodeError] = useState('');

  const handleGuardianAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guardianCode.trim()) {
      setGuardianCodeError('Código é obrigatório');
      return;
    }

    if (guardianCode.length < 4) {
      setGuardianCodeError('Código deve ter pelo menos 4 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      // Simular validação do código
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar responsável pelo código
      const savedGuardians = localStorage.getItem('guardians');
      let guardians = [];
      
      if (savedGuardians) {
        guardians = JSON.parse(savedGuardians);
      }
      
      const guardian = guardians.find((g: any) => g.uniqueCode === guardianCode.trim());
      
      if (!guardian) {
        setGuardianCodeError('Código não encontrado');
        return;
      }
      
      if (guardian.isActive === false) {
        setGuardianCodeError('Acesso não autorizado');
        return;
      }
      
      // Salvar dados do responsável logado
      localStorage.setItem('currentGuardian', JSON.stringify(guardian));
      navigate('/guardian');
    } catch (error) {
      setGuardianCodeError('Erro ao validar código');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <MapPin className="w-12 h-12 text-primary" />,
      title: "Rastreamento em Tempo Real",
      description: "Acompanhe a localização da van escolar em tempo real através do GPS integrado, garantindo total transparência sobre o trajeto dos estudantes."
    },
    {
      icon: <Shield className="w-12 h-12 text-primary" />,
      title: "Segurança Garantida",
      description: "Sistema completo de segurança com verificação de identidade, códigos únicos para responsáveis e monitoramento constante das rotas."
    },
    {
      icon: <Bell className="w-12 h-12 text-primary" />,
      title: "Notificações Inteligentes",
      description: "Receba alertas automáticos sobre chegada, saída, atrasos e outras informações importantes sobre o transporte escolar."
    },
    {
      icon: <Users className="w-12 h-12 text-primary" />,
      title: "Gestão de Passageiros",
      description: "Controle completo de embarque e desembarque com lista de presença digital e confirmação automática para os responsáveis."
    },
    {
      icon: <Route className="w-12 h-12 text-primary" />,
      title: "Otimização de Rotas",
      description: "Rotas inteligentes que consideram trânsito, condições climáticas e pontos de parada para maior eficiência e pontualidade."
    },
    {
      icon: <Smartphone className="w-12 h-12 text-primary" />,
      title: "Interface Intuitiva",
      description: "Aplicativo fácil de usar tanto para motoristas quanto para responsáveis, com design moderno e funcionalidades acessíveis."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <SEOHead 
        title="VaiMogi - Transporte Escolar Inteligente"
        description="Sistema completo de gestão e rastreamento de transporte escolar com segurança, praticidade e tecnologia de ponta."
      />
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center">
                <img 
                  src="/vai-mogi.png" 
                  alt="VaiMogi Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="text-gray-700 hover:text-primary"
              >
                Entrar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                Cadastrar
              </Button>
              <Button 
                onClick={() => setShowGuardianDialog(true)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Key className="w-4 h-4 mr-2" />
                Acesso para Responsáveis
              </Button>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                  className="justify-start text-gray-700 hover:text-primary"
                >
                  Entrar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                  className="justify-start border-primary text-primary hover:bg-primary hover:text-white"
                >
                  Cadastrar
                </Button>
                <Button 
                  onClick={() => {
                    setShowGuardianDialog(true);
                    setIsMenuOpen(false);
                  }}
                  className="justify-start bg-primary hover:bg-primary/90 text-white"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Acesso para Responsáveis
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Transporte Escolar
            <span className="text-primary block">Inteligente e Seguro</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Conecte motoristas, responsáveis e escolas em uma plataforma completa 
            de gestão de transporte escolar com rastreamento em tempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setShowGuardianDialog(true)}
              className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 text-lg"
            >
              <Eye className="w-5 h-5 mr-2" />
              Acompanhar Transporte
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubra como o VaiMogi revoluciona o transporte escolar com tecnologia de ponta
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para Transformar o Transporte Escolar?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Junte-se a centenas de motoristas e responsáveis que já confiam no VaiMogi
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="bg-white text-primary hover:bg-gray-100 px-8 py-3 text-lg"
            >
              Cadastrar como Motorista
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setShowGuardianDialog(true)}
              className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-primary px-8 py-3 text-lg font-semibold"
            >
              Sou Responsável
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src="/vai-mogi.png" 
                  alt="VaiMogi Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold">VaiMogi</span>
            </div>
            <p className="text-gray-400 mb-4">
              Transporte escolar inteligente e seguro para toda a família
            </p>
            <p className="text-sm text-gray-500">
              © 2025 VaiMogi. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Guardian Access Dialog */}
      <Dialog open={showGuardianDialog} onOpenChange={setShowGuardianDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Acesso para Responsáveis
            </DialogTitle>
            <DialogDescription>
              Digite o código único fornecido pelo motorista para acompanhar o transporte do seu filho.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleGuardianAccess} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guardianCode">Código de Acesso</Label>
              <Input
                id="guardianCode"
                type="text"
                placeholder="Digite seu código único"
                value={guardianCode}
                onChange={(e) => {
                  setGuardianCode(e.target.value);
                  setGuardianCodeError('');
                }}
                className={guardianCodeError ? 'border-red-500' : ''}
              />
              {guardianCodeError && (
                <p className="text-sm text-red-500">{guardianCodeError}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowGuardianDialog(false);
                  setGuardianCode('');
                  setGuardianCodeError('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Verificando...' : 'Acessar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};