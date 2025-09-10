
import { useState } from 'react';
import { ArrowLeft, Plus, Play, Calendar, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface RoutesListPageProps {
  onBack: () => void;
  onCreateRoute: () => void;
  onActiveRoutes: () => void;
  onRouteHistory: () => void;
  onRouteCreated: (routeData: { name: string; time: string; selectedDays: string[] }) => void;
}

export const RoutesListPage = ({
  onBack,
  onCreateRoute,
  onActiveRoutes,
  onRouteHistory,
  onRouteCreated
}: RoutesListPageProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    time: '',
    selectedDays: [] as string[]
  });

  const weekDays = [
    { id: 'monday', label: 'Segunda-feira' },
    { id: 'tuesday', label: 'Terça-feira' },
    { id: 'wednesday', label: 'Quarta-feira' },
    { id: 'thursday', label: 'Quinta-feira' },
    { id: 'friday', label: 'Sexta-feira' },
    { id: 'saturday', label: 'Sábado' },
    { id: 'sunday', label: 'Domingo' }
  ];

  const handleDayToggle = (dayId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayId)
        ? prev.selectedDays.filter(d => d !== dayId)
        : [...prev.selectedDays, dayId]
    }));
  };

  const handleSelectAllWeek = () => {
    setFormData(prev => ({
      ...prev,
      selectedDays: weekDays.map(day => day.id)
    }));
  };

  const handleSelectWeekdays = () => {
    setFormData(prev => ({
      ...prev,
      selectedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }));
  };

  const handleSaveRoute = () => {
    if (formData.name && formData.time && formData.selectedDays.length > 0) {
      console.log('Salvando rota:', formData);
      onRouteCreated(formData);
      setIsDialogOpen(false);
      setFormData({ name: '', time: '', selectedDays: [] });
    }
  };

  const isFormValid = formData.name && formData.time && formData.selectedDays.length > 0;

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
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-100 min-h-screen rounded-t-3xl p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Lista de Rotas</h1>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Cadastrar rota
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Rota</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Nome da rota */}
                <div className="space-y-2">
                  <Label htmlFor="routeName">Nome da rota</Label>
                  <Input
                    id="routeName"
                    placeholder="Digite o nome da rota"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* Horário da rota */}
                <div className="space-y-2">
                  <Label htmlFor="routeTime">Horário da rota</Label>
                  <Input
                    id="routeTime"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>

                {/* Dias da semana */}
                <div className="space-y-3">
                  <Label>Dias da semana</Label>

                  {/* Botões de seleção rápida */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllWeek}
                      className="text-xs"
                    >
                      Semana toda
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectWeekdays}
                      className="text-xs"
                    >
                      Dias úteis
                    </Button>
                  </div>

                  {/* Lista de dias */}
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {weekDays.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.id}
                          checked={formData.selectedDays.includes(day.id)}
                          onCheckedChange={() => handleDayToggle(day.id)}
                        />
                        <Label htmlFor={day.id} className="text-sm font-normal">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveRoute}
                    disabled={!isFormValid}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={onActiveRoutes}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50 py-4 rounded-lg flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Rotas em execução
          </Button>

          <Button
            onClick={onRouteHistory}
            variant="outline"
            className="border-gray-400 text-gray-600 hover:bg-gray-50 py-4 rounded-lg flex items-center justify-center gap-2"
          >
            <History className="w-5 h-5" />
            Histórico de rotas
          </Button>
        </div>

        {/* Mensagem quando não há rotas */}
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhuma rota cadastrada</h3>
          <p className="text-sm">Clique em "Cadastrar rota" para criar sua primeira rota</p>
        </div>
      </div>
    </div>
  );
};
