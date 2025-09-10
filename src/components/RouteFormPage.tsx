
import { useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RouteFormPageProps {
  onBack: () => void;
  onNext: () => void;
}

export const RouteFormPage = ({ onBack, onNext }: RouteFormPageProps) => {
  const [formData, setFormData] = useState({
    name: '',
    van: '',
    startTime: '',
    weekDays: 'weekdays' // 'weekdays', 'monday-saturday', 'all-days'
  });

  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const weekDayOptions = [
    { id: 'Mon', label: 'Segunda-Feira' },
    { id: 'Tue', label: 'Terça-Feira' },
    { id: 'Wed', label: 'Quarta-Feira' },
    { id: 'Thu', label: 'Quinta-Feira' },
    { id: 'Fri', label: 'Sexta-Feira' },
    { id: 'Sat', label: 'Sábado' },
    { id: 'Sun', label: 'Domingo' }
  ];

  const handleWeekDayPreset = (preset: string) => {
    setFormData(prev => ({ ...prev, weekDays: preset }));
    
    switch (preset) {
      case 'weekdays':
        setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
        break;
      case 'monday-saturday':
        setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
        break;
      case 'all-days':
        setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
        break;
    }
  };

  const handleDayToggle = (dayId: string) => {
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  const isFormValid = formData.name && formData.van && formData.startTime && selectedDays.length > 0;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-center p-4 pt-12">
        <img 
          src="/lovable-uploads/13ad1463-722e-40c8-b16d-03c288d5ef24.png" 
          alt="Logo" 
          className="w-32 h-32 object-contain"
        />
      </div>

      {/* Breadcrumb */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 text-white text-sm">
          <button onClick={onBack} className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Início
          </button>
          <span>/</span>
          <span>Rotas</span>
          <span>/</span>
          <span>Cadastrar Rota</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-100 min-h-screen rounded-t-3xl p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Cadastro de Rota</h1>

        <div className="space-y-6">
          {/* Nome */}
          <div>
            <Label htmlFor="name" className="text-gray-700 font-medium">Nome</Label>
            <Input
              id="name"
              placeholder=""
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1"
            />
          </div>

          {/* Van */}
          <div>
            <Label htmlFor="van" className="text-gray-700 font-medium">Van</Label>
            <select
              id="van"
              value={formData.van}
              onChange={(e) => setFormData(prev => ({ ...prev, van: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Selecione a van</option>
              <option value="tia-be">Tia Be</option>
              <option value="van-2">Van 2</option>
            </select>
          </div>

          {/* Horário de início */}
          <div>
            <Label htmlFor="startTime" className="text-gray-700 font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horário de início
            </Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              className="mt-1"
            />
          </div>

          {/* Dias da semana */}
          <div>
            <Label className="text-gray-700 font-medium">Dias da semana</Label>
            
            {/* Preset options */}
            <div className="mt-3 space-y-2">
              <button
                onClick={() => handleWeekDayPreset('weekdays')}
                className={`w-full p-3 rounded-lg border text-left ${
                  formData.weekDays === 'weekdays' 
                    ? 'bg-orange-100 border-orange-300 text-orange-800' 
                    : 'bg-white border-gray-300'
                }`}
              >
                Dias úteis
              </button>
              <button
                onClick={() => handleWeekDayPreset('monday-saturday')}
                className={`w-full p-3 rounded-lg border text-left ${
                  formData.weekDays === 'monday-saturday' 
                    ? 'bg-orange-100 border-orange-300 text-orange-800' 
                    : 'bg-white border-gray-300'
                }`}
              >
                Segunda a sábado
              </button>
              <button
                onClick={() => handleWeekDayPreset('all-days')}
                className={`w-full p-3 rounded-lg border text-left ${
                  formData.weekDays === 'all-days' 
                    ? 'bg-orange-100 border-orange-300 text-orange-800' 
                    : 'bg-white border-gray-300'
                }`}
              >
                Todos os dias
              </button>
            </div>

            {/* Individual day selection */}
            <div className="mt-4 space-y-2">
              {weekDayOptions.map((day) => (
                <button
                  key={day.id}
                  onClick={() => handleDayToggle(day.id)}
                  className={`w-full p-3 rounded-lg border text-left ${
                    selectedDays.includes(day.id)
                      ? 'bg-orange-100 border-orange-300 text-orange-800'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <Button
              onClick={onNext}
              disabled={!isFormValid}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 disabled:bg-gray-300"
            >
              Avançar
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
              className="px-8 py-3 border-gray-300 text-gray-700"
            >
              Voltar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
