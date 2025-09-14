
import { School, MapPin, ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { School as SchoolType } from '@/types/driver';

interface SchoolsListProps {
  schools: SchoolType[];
  onBack: () => void;
  onAddSchool: () => void;
  onEditSchool: (school: SchoolType) => void;
  onDeleteSchool: (schoolId: string) => void;
}

export const SchoolsList = ({ schools, onBack, onAddSchool, onEditSchool, onDeleteSchool }: SchoolsListProps) => {
  const handleDelete = (school: SchoolType) => {
    if (window.confirm(`Tem certeza que deseja excluir a escola "${school.name}"?`)) {
      onDeleteSchool(school.id);
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
            <h1 className="text-xl font-semibold text-gray-800">Escolas</h1>
          </div>
          <button
            onClick={onAddSchool}
            className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto">
        {schools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <School className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="mb-2">Nenhuma escola cadastrada</p>
            <p className="text-sm mb-4">Comece cadastrando sua primeira escola</p>
            <button
              onClick={onAddSchool}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cadastrar Escola
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {schools.map((school) => (
              <div key={school.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <School className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{school.name}</h3>
                    
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span>{school.address}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditSchool(school)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(school)}
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
