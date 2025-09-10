
import React, { useState, useEffect } from 'react';
import { ArrowLeft, School, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { School as SchoolType } from '@/types/driver';

interface SchoolRegistrationProps {
  onBack: () => void;
  onSave: (schoolData: { name: string; address: string }) => void;
  editingSchool?: SchoolType;
}

export const SchoolRegistration = ({ onBack, onSave, editingSchool }: SchoolRegistrationProps) => {
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  });

  useEffect(() => {
    if (editingSchool) {
      setFormData({
        name: editingSchool.name,
        address: editingSchool.address
      });
    }
  }, [editingSchool]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.address.trim()) {
      onSave(formData);
      if (!editingSchool) {
        // Reset form after save only for new schools
        setFormData({ name: '', address: '' });
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
            {editingSchool ? 'Editar Escola' : 'Cadastrar Escola'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome da Escola */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-gray-700">
              <School className="w-4 h-4" />
              Nome da Escola
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Digite o nome da escola"
              required
              className="w-full"
            />
          </div>

          {/* Endereço Completo */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4" />
              Endereço Completo
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Digite o endereço completo da escola (rua, número, bairro, cidade, CEP)"
              required
              className="w-full min-h-[80px]"
            />
          </div>

          {/* Botão Cadastrar/Atualizar */}
          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={!formData.name.trim() || !formData.address.trim()}
          >
            {editingSchool ? 'Atualizar Escola' : 'Cadastrar Escola'}
          </Button>
        </form>
      </div>
    </div>
  );
};
