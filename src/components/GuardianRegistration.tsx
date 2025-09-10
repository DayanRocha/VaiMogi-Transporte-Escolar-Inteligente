
import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserCheck, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Guardian } from '@/types/driver';

interface GuardianRegistrationProps {
  onBack: () => void;
  onSave: (guardianData: { name: string; email: string; phone: string }) => void;
  editingGuardian?: Guardian;
}

export const GuardianRegistration = ({ onBack, onSave, editingGuardian }: GuardianRegistrationProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (editingGuardian) {
      setFormData({
        name: editingGuardian.name,
        email: editingGuardian.email,
        phone: editingGuardian.phone || ''
      });
    }
  }, [editingGuardian]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.email.trim()) {
      onSave(formData);
      if (!editingGuardian) {
        // Reset form after save only for new guardians
        setFormData({ name: '', email: '', phone: '' });
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            {editingGuardian ? 'Editar Responsável' : 'Cadastrar Responsável'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome Completo */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-gray-700">
              <UserCheck className="w-4 h-4" />
              Nome Completo
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Digite o nome completo do responsável"
              required
              className="w-full"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Digite o email do responsável"
              required
              className="w-full"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4" />
              Telefone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full"
            />
          </div>

          {/* Botão Cadastrar/Atualizar */}
          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={!formData.name.trim() || !formData.email.trim()}
          >
            {editingGuardian ? 'Atualizar Responsável' : 'Cadastrar Responsável'}
          </Button>
        </form>
      </div>
    </div>
  );
};
