import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
  X,
  Phone,
  PhoneCall,
  Camera,
  Mail
} from 'lucide-react';
import SEOHead from './SEOHead';
import { VideoPlayer } from './VideoPlayer';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);




  const features = [
    {
      icon: <MapPin className="w-10 h-10" />,
      title: "Rastreamento em Tempo Real",
      description: "Acompanhe a localização da van escolar em tempo real através do GPS integrado, garantindo total transparência sobre o trajeto dos estudantes.",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: <Shield className="w-10 h-10" />,
      title: "Segurança Garantida",
      description: "Sistema completo de segurança com verificação de identidade, códigos únicos para responsáveis e monitoramento constante das rotas.",
      gradient: "from-green-500 to-green-600"
    },
    {
      icon: <Bell className="w-10 h-10" />,
      title: "Notificações Inteligentes",
      description: "Receba alertas automáticos sobre chegada, saída, atrasos e outras informações importantes sobre o transporte escolar.",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: "Gestão de Passageiros",
      description: "Controle completo de embarque e desembarque com lista de presença digital e confirmação automática para os responsáveis.",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: <Route className="w-10 h-10" />,
      title: "Otimização de Rotas",
      description: "Rotas inteligentes que consideram trânsito, condições climáticas e pontos de parada para maior eficiência e pontualidade.",
      gradient: "from-red-500 to-pink-500"
    },
    {
      icon: <Smartphone className="w-10 h-10" />,
      title: "Interface Intuitiva",
      description: "Aplicativo fácil de usar tanto para motoristas quanto para responsáveis, com design moderno e funcionalidades acessíveis.",
      gradient: "from-indigo-500 to-indigo-600"
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
                onClick={() => navigate('/login')}
                className="text-gray-700 hover:text-primary"
              >
                Entrar
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/register')}
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                Cadastrar
              </Button>
              <Button
                onClick={() => navigate('/login', { state: { openGuardianDialog: true } })}
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
                    navigate('/login');
                    setIsMenuOpen(false);
                  }}
                  className="justify-start text-gray-700 hover:text-primary"
                >
                  Entrar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate('/register');
                    setIsMenuOpen(false);
                  }}
                  className="justify-start border-primary text-primary hover:bg-primary hover:text-white"
                >
                  Cadastrar
                </Button>
                <Button
                  onClick={() => {
                    navigate('/login', { state: { openGuardianDialog: true } });
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
      <section className="relative py-20 overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <VideoPlayer
            src="/videos/d8071030-4df3-4c91-bd24-528f67f35fff.mp4"
            poster="/vai-mogi.png"
            title="Demonstração do VaiMogi"
            className="w-full h-full object-cover"
            autoPlay={true}
            muted={true}
            loop={true}
            controls={false}
            preload="auto"
            onError={() => console.log('Erro ao carregar vídeo')}
          />
        </div>

        {/* White Overlay for Text Readability */}
        <div className="absolute inset-0 bg-white/40 z-10"></div>

        {/* Content */}
        <div className="relative z-20 container-responsive text-center mt-[110px] animate-fade-in">
          <h1 className="text-display text-neutral-900 mb-6 drop-shadow-2xl">
            <span className="drop-shadow-lg">Transporte Escolar</span>
            <span className="text-primary block drop-shadow-lg">Inteligente e Seguro</span>
          </h1>
          <p className="text-body-lg md:text-2xl text-neutral-800 mb-8 max-w-4xl mx-auto font-semibold drop-shadow-lg leading-relaxed">
            Conecte motoristas, responsáveis e escolas em uma plataforma completa
            de gestão de transporte escolar com rastreamento em tempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              className="px-8 py-4 text-lg shadow-2xl"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login', { state: { openGuardianDialog: true } })}
              className="px-8 py-4 text-lg shadow-2xl bg-white/90"
            >
              <Eye className="w-5 h-5 mr-2" />
              Acompanhar Transporte
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-neutral-50">
        <div className="container-responsive">
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-sm mb-4">
              ✨ Funcionalidades Principais
            </div>
            <h2 className="text-h1 text-neutral-900 mb-6 leading-tight">
              Tecnologia que <span className="text-primary">Transforma</span>
              <br />o Transporte Escolar
            </h2>
            <p className="text-body-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Descubra como o VaiMogi revoluciona o transporte escolar com soluções inteligentes,
              seguras e fáceis de usar para toda a comunidade escolar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-interactive group overflow-hidden backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-50/50 to-neutral-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neutral-100/40 to-neutral-200/20 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-neutral-100/30 to-neutral-200/10 rounded-tr-full transform -translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500"></div>

                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                <div className="relative z-10 flex flex-col items-center text-center p-8">
                  {/* Icon container with enhanced styling */}
                  <div className={`mb-6 p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 relative`}>
                    <div className="text-white transition-all duration-300">
                      {feature.icon}
                    </div>
                    {/* Icon glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}></div>
                  </div>

                  {/* Title with enhanced typography */}
                  <h3 className="text-h3 text-neutral-900 mb-4 group-hover:text-neutral-800 transition-all duration-300 leading-tight">
                    {feature.title}
                  </h3>

                  {/* Description with better spacing */}
                  <p className="text-body-sm text-neutral-600 leading-relaxed group-hover:text-neutral-700 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Enhanced bottom accent with gradient matching icon */}
                  <div className={`mt-6 w-16 h-1 bg-gradient-to-r ${feature.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-x-0 group-hover:scale-x-100`}></div>

                  {/* Subtle pulse effect on hover */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-neutral-100/50 transition-all duration-300"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="container-responsive text-center animate-fade-in">
          <h2 className="text-h1 text-white mb-6">
            Pronto para Transformar o Transporte Escolar?
          </h2>
          <p className="text-body-lg text-orange-100 mb-8">
            Junte-se a centenas de motoristas e responsáveis que já confiam no VaiMogi
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/register')}
              className="bg-white text-primary hover:bg-neutral-100 px-8 py-4 text-lg shadow-xl"
            >
              Cadastrar como Motorista
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login', { state: { openGuardianDialog: true } })}
              className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-primary px-8 py-4 text-lg font-semibold shadow-xl"
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
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <a href="tel:+5511959436403" className="text-gray-300 hover:text-white">(11) 95943-6403</a>
              </div>
              <div className="flex items-center gap-3">
                <a href="https://wa.me/5511959436403" target="_blank" rel="noopener noreferrer">
                  <PhoneCall className="w-5 h-5 text-green-400 hover:text-green-300" title="WhatsApp" />
                </a>
                <a href="https://instagram.com/vai_mogi" target="_blank" rel="noopener noreferrer">
                  <Camera className="w-5 h-5 text-gray-300 hover:text-white" title="Instagram" />
                </a>
                <a href="https://facebook.com/vai_mogi" target="_blank" rel="noopener noreferrer">
                  <Mail className="w-5 h-5 text-gray-300 hover:text-white" title="Facebook" />
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 VaiMogi. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>


    </div>
  );
};