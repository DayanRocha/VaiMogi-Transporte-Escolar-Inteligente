import React, { useState } from 'react';
import { Camera, Edit, Save, X, ArrowLeft, LogOut, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Driver } from '@/types/driver';

interface DriverProfileProps {
  driver: Driver;
  onUpdate: (updates: Partial<Driver>) => void;
  onBack: () => void;
  onLogout?: () => void;
}

export const DriverProfile = ({ driver, onUpdate, onBack, onLogout }: DriverProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(driver);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    console.log('🔄 Salvando dados do motorista:', formData);
    
    // Validar dados antes de salvar
    if (!formData.name || !formData.phone) {
      alert("⚠️ Por favor, preencha pelo menos o nome e telefone!");
      return;
    }
    
    try {
      // Verificar se localStorage está disponível (pode não estar no celular em modo privado)
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage não disponível');
      }
      
      onUpdate(formData);
      setIsEditing(false);
      
      // Múltiplas formas de mostrar sucesso
      setShowSuccessMessage(true);
      
      // Toast
      try {
        toast({
          title: "✅ Sucesso!",
          description: "Perfil do motorista salvo com sucesso!",
          duration: 3000,
        });
      } catch (toastError) {
        console.warn('Toast não disponível:', toastError);
      }
      
      // Alert como fallback
      alert("✅ Perfil do motorista salvo com sucesso!");
      
      // Esconder mensagem após 3 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      console.log('✅ Todas as notificações enviadas');
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      alert(`❌ Erro ao salvar o perfil: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleCancel = () => {
    setFormData(driver);
    setIsEditing(false);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target?.result as string;
        setFormData(prev => ({ ...prev, photo: photoUrl }));
        if (!isEditing) {
          onUpdate({ photo: photoUrl });
          toast({
            title: "✅ Sucesso!",
            description: "Foto do perfil atualizada com sucesso!",
            duration: 3000,
          });
        }
      };
      reader.readAsDataURL(file);
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
            <h1 className="text-2xl font-bold text-gray-800">Perfil do Motorista</h1>
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
      
        {/* Profile Photo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-4">
            <img
              src={formData.photo || '/placeholder.svg'}
              alt="Foto do perfil"
              className="w-full h-full rounded-full object-cover border-4 border-blue-100"
            />
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
              <Camera className="w-4 h-4 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome Completo do Motorista</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50" : ""}
              placeholder="Ex: João da Silva"
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50" : ""}
              placeholder="exemplo@email.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone / WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50" : ""}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="address">Endereço Completo</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50" : ""}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>
        </div>

        {/* Mensagem de Sucesso Visual */}
        {showSuccessMessage && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">✅ Perfil do motorista salvo com sucesso!</span>
          </div>
        )}

        {/* Botão de Teste Toast removido conforme solicitado */}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>


    </div>
  );
};