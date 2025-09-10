
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, MapPin, School, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { School as SchoolType, Student, Guardian } from '@/types/driver';

interface StudentRegistrationProps {
  schools: SchoolType[];
  guardians: Guardian[];
  onBack: () => void;
  onSave: (studentData: {
    name: string;
    address: string;
    schoolId: string;
    guardianId: string;
    guardianPhone: string;
    guardianEmail: string;
  }) => void;
  editingStudent?: Student;
}

export const StudentRegistration = ({ schools, guardians, onBack, onSave, editingStudent }: StudentRegistrationProps) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    schoolId: '',
    guardianId: '',
    guardianPhone: '',
    guardianEmail: ''
  });

  useEffect(() => {
    if (editingStudent) {
      setFormData({
        name: editingStudent.name,
        address: editingStudent.pickupPoint,
        schoolId: editingStudent.schoolId,
        guardianId: editingStudent.guardianId,
        guardianPhone: '',
        guardianEmail: ''
      });
    }
  }, [editingStudent]);

  // Auto-update email and phone when guardian is selected
  useEffect(() => {
    if (formData.guardianId) {
      const selectedGuardian = guardians.find(guardian => guardian.id === formData.guardianId);
      if (selectedGuardian) {
        setFormData(prev => ({ 
          ...prev, 
          guardianEmail: selectedGuardian.email,
          guardianPhone: selectedGuardian.phone || ''
        }));
      }
    }
  }, [formData.guardianId, guardians]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.address && formData.schoolId && formData.guardianId) {
      onSave({
        name: formData.name,
        address: formData.address,
        schoolId: formData.schoolId,
        guardianId: formData.guardianId,
        guardianPhone: formData.guardianPhone,
        guardianEmail: formData.guardianEmail
      });
      if (!editingStudent) {
        // Reset form after save only for new students
        setFormData({
          name: '',
          address: '',
          schoolId: '',
          guardianId: '',
          guardianPhone: '',
          guardianEmail: ''
        });
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
            {editingStudent ? 'Editar Estudante' : 'Cadastrar Estudante'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome do Aluno */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4" />
              Nome do Aluno
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Digite o nome completo do aluno"
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
              placeholder="Digite o endereço completo (rua, número, bairro, cidade)"
              required
              className="w-full min-h-[80px]"
            />
          </div>

          {/* Escola Associada */}
          <div className="space-y-2">
            <Label htmlFor="school" className="flex items-center gap-2 text-gray-700">
              <School className="w-4 h-4" />
              Escola Associada
            </Label>
            <Select value={formData.schoolId} onValueChange={(value) => handleChange('schoolId', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a escola" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsável Vinculado */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-gray-700">
              <UserCheck className="w-4 h-4" />
              Responsável Vinculado
            </Label>
            
            <div className="space-y-3 pl-6">
              <div className="space-y-2">
                <Label htmlFor="guardian" className="text-sm text-gray-600">
                  Responsável
                </Label>
                <Select value={formData.guardianId} onValueChange={(value) => handleChange('guardianId', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {guardians.map((guardian) => (
                      <SelectItem key={guardian.id} value={guardian.id}>
                        {guardian.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guardianPhone" className="text-sm text-gray-600">
                  Telefone do Responsável
                </Label>
                <Input
                  id="guardianPhone"
                  type="tel"
                  value={formData.guardianPhone}
                  onChange={(e) => handleChange('guardianPhone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guardianEmail" className="text-sm text-gray-600">
                  Email do Responsável
                </Label>
                <Input
                  id="guardianEmail"
                  type="email"
                  value={formData.guardianEmail}
                  onChange={(e) => handleChange('guardianEmail', e.target.value)}
                  placeholder="responsavel@email.com"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Botão Cadastrar/Atualizar */}
          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={!formData.name || !formData.address || !formData.schoolId || !formData.guardianId}
          >
            {editingStudent ? 'Atualizar Aluno' : 'Cadastrar Aluno'}
          </Button>
        </form>
      </div>
    </div>
  );
};
