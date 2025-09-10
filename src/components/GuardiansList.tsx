
import { UserCheck, ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { Guardian } from '@/types/driver';

interface GuardiansListProps {
  guardians: Guardian[];
  onBack: () => void;
  onAddGuardian: () => void;
  onEditGuardian: (guardian: Guardian) => void;
  onDeleteGuardian: (guardianId: string) => void;
}

export const GuardiansList = ({ guardians, onBack, onAddGuardian, onEditGuardian, onDeleteGuardian }: GuardiansListProps) => {
  const handleDelete = (guardian: Guardian) => {
    if (window.confirm(`Tem certeza que deseja excluir o responsável "${guardian.name}"?`)) {
      onDeleteGuardian(guardian.id);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Responsáveis</h1>
          </div>
          <button
            onClick={onAddGuardian}
            className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto">
        {guardians.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="mb-2">Nenhum responsável cadastrado</p>
            <p className="text-sm mb-4">Comece cadastrando seu primeiro responsável</p>
            <button
              onClick={onAddGuardian}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cadastrar Responsável
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {guardians.map((guardian) => (
              <div key={guardian.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{guardian.name}</h3>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditGuardian(guardian)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(guardian)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
