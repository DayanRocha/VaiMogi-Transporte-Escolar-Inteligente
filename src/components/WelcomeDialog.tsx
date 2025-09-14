import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  driverName?: string;
}

export const WelcomeDialog = ({ isOpen, onClose, driverName }: WelcomeDialogProps) => {
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
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center">
              <img src="/vai-mogi.png" alt="VaiMogi" className="w-12 h-12 object-contain" />
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-gray-800">
            🎉 Bem-vindo ao VaiMogi!
          </DialogTitle>
          
          <DialogDescription className="text-lg text-gray-600 space-y-2">
            <p>
              Olá {driverName ? driverName : 'motorista'}! 
            </p>
            <p>
              Seja bem-vindo ao aplicativo que vai transformar 
              sua experiência como motorista escolar.
            </p>
            <p className="text-sm">
              Agora você pode gerenciar suas rotas, alunos e 
              comunicação com os responsáveis de forma simples e eficiente.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={onClose}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            Vamos começar! 🚐
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};