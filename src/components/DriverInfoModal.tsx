import { X, Phone, MapPin, Mail, Truck, User } from 'lucide-react';
import { Driver, Van } from '@/types/driver';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DriverInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  van: Van;
}

export const DriverInfoModal = ({ isOpen, onClose, driver, van }: DriverInfoModalProps) => {
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Informações do Motorista
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 py-2 overflow-y-auto flex-1 min-h-0">
          {/* Driver Photo and Basic Info */}
          <div className="flex items-center gap-4">
            <img
              src={driver.photo || '/placeholder.svg'}
              alt={`Foto de ${driver.name}`}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{driver.name}</h3>
              <p className="text-sm text-gray-600">Motorista Escolar</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 border-b pb-2">Contato</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{driver.phone}</span>
              </div>
              <Button
                size="sm"
                onClick={() => handleCall(driver.phone)}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Ligar
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{driver.email}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEmail(driver.email)}
              >
                Email
              </Button>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <span className="text-sm text-gray-700">{driver.address}</span>
            </div>
          </div>

          {/* Van Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 border-b pb-2 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Informações da Van
            </h4>
            
            <div className="flex items-center gap-4">
              <img
                src={van.photo || '/placeholder.svg'}
                alt={`Foto da van ${van.model}`}
                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
              />
              <div>
                <p className="font-medium text-gray-800">{van.model}</p>
                <p className="text-sm text-gray-600">Placa: {van.plate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Capacidade:</span>
                <p className="font-medium">{van.capacity} passageiros</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="font-medium text-green-600">Ativa</p>
              </div>
            </div>

            {van.observations && (
              <div>
                <span className="text-gray-500 text-sm">Observações:</span>
                <p className="text-sm text-gray-700 mt-1">{van.observations}</p>
              </div>
            )}
          </div>

          {/* Emergency Info */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="font-medium text-red-800 mb-2">Em caso de emergência</h4>
            <p className="text-sm text-red-700">
              Entre em contato imediatamente com o motorista ou ligue para 190/192
            </p>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t bg-white flex-shrink-0">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};