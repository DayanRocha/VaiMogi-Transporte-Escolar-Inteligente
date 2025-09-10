import { useState } from 'react';
import { Camera, Save, Truck, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Van } from '@/types/driver';

interface VanRegistrationProps {
  van: Van | null;
  onUpdate: (updates: Partial<Van>) => void;
  onBack: () => void;
  onLogout?: () => void;
}

export const VanRegistration = ({ van, onUpdate, onBack, onLogout }: VanRegistrationProps) => {
  const [formData, setFormData] = useState<Van>(van || {
    id: '',
    driverId: '',
    model: '',
    plate: '',
    capacity: 0,
    observations: '',
    photo: '',
    drivingPermitDocument: ''
  });

  const handleSave = () => {
    onUpdate(formData);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target?.result as string;
        setFormData(prev => ({ ...prev, photo: photoUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'application/pdf')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const documentUrl = e.target?.result as string;
        setFormData(prev => ({ ...prev, drivingPermitDocument: documentUrl }));
      };
      reader.readAsDataURL(file);
    } else {
      alert('Por favor, selecione apenas arquivos JPG ou PDF para o documento de permissão.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 sm:p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack} 
              className="text-gray-600 hover:text-gray-800 p-2 rounded-xl hover:bg-white/50 transition-all duration-200 active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3">
                <Truck className="w-5 h-5 text-white" />
              </div>
              Cadastro da Van
            </h1>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout} 
              className="text-gray-600 hover:text-gray-800 p-2 rounded-xl hover:bg-white/50 transition-all duration-200 active:scale-95"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="mb-6">
          <Label className="text-gray-700 font-medium">Foto da Van</Label>
          <div className="mt-3 relative">
            <div className="w-full h-40 bg-white rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              {formData?.photo ? (
                <img
                  src={formData.photo}
                  alt="Foto da van"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <Camera className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Adicionar foto da van</p>
                </div>
              )}
            </div>
            <label className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
              <Camera className="w-5 h-5 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="model">Modelo</Label>
            <Input
              id="model"
              value={formData.model || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="Ex: Sprinter 415"
            />
          </div>

          <div>
            <Label htmlFor="plate">Placa</Label>
            <Input
              id="plate"
              value={formData.plate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, plate: e.target.value }))}
              placeholder="Ex: ABC-1234"
            />
          </div>

          <div>
            <Label htmlFor="capacity">Capacidade</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
              placeholder="Ex: 20"
            />
          </div>

          <div>
            <Label htmlFor="observations">Observações</Label>
            <Input
              id="observations"
              value={formData.observations || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Observações adicionais"
            />
          </div>

          <div>
            <Label className="text-gray-700 font-medium">Documento de Permissão para Dirigir</Label>
            <div className="mt-3 relative">
              <div className="w-full h-32 bg-white rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                {formData.drivingPermitDocument ? (
                  formData.drivingPermitDocument.startsWith('data:application/pdf') ? (
                    <div className="flex flex-col items-center justify-center h-full text-green-600">
                      <svg className="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium">PDF Carregado</p>
                      <p className="text-xs">Documento de permissão</p>
                    </div>
                  ) : (
                    <img
                      src={formData.drivingPermitDocument}
                      alt="Documento de permissão"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="text-center text-gray-500">
                    <Camera className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm">Adicionar documento JPG ou PDF</p>
                     <p className="text-xs text-gray-400">Comprovante de permissão</p>
                  </div>
                )}
              </div>
              <label className="absolute bottom-2 right-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/jpeg,application/pdf"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Van
        </Button>
      </div>
    </div>
  );
};