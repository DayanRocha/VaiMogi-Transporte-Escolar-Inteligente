import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Bell, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GuardianWelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  guardianName?: string;
}

export const GuardianWelcomeDialog = ({ isOpen, onClose, guardianName }: GuardianWelcomeDialogProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay to show content after dialog opens
      const timer = setTimeout(() => {
        setShowContent(true);
        triggerConfetti();
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-gray-800">
            🎉 Bem-vindo ao VaiMogi!
          </DialogTitle>
          
          <DialogDescription className="text-lg text-gray-600 space-y-3">
            <p>
              Olá {guardianName ? guardianName.split(' ')[0] : 'responsável'}! 
            </p>
            <p>
              Agora você pode acompanhar a rota escolar do seu filho 
              em tempo real com total segurança e praticidade.
            </p>
          </DialogDescription>
        </DialogHeader>

        {/* Features */}
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
            <MapPin className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-800">Localização em Tempo Real</p>
              <p className="text-xs text-gray-600">Acompanhe onde está a van</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
            <Bell className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-800">Notificações Instantâneas</p>
              <p className="text-xs text-gray-600">Receba atualizações sobre embarques</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
            <Shield className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-800">Segurança Total</p>
              <p className="text-xs text-gray-600">Informações do motorista e van</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            Começar a acompanhar! 👨‍👩‍👧‍👦
          </Button>
        </div>


      </DialogContent>
    </Dialog>
  );
};