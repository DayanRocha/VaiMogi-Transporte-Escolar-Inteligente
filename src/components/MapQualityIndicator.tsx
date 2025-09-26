import React from 'react';

interface MapQualityIndicatorProps {
  quality: 'high' | 'medium' | 'low';
  onQualityChange: (quality: 'high' | 'medium' | 'low') => void;
}

export const MapQualityIndicator: React.FC<MapQualityIndicatorProps> = ({ 
  quality, 
  onQualityChange 
}) => {
  const getQualityText = (quality: 'high' | 'medium' | 'low') => {
    switch (quality) {
      case 'high':
        return { text: 'Máxima', color: 'text-green-600' };
      case 'medium':
        return { text: 'Média', color: 'text-yellow-600' };
      case 'low':
        return { text: 'Baixa', color: 'text-red-600' };
      default:
        return { text: 'Média', color: 'text-yellow-600' };
    }
  };

  const qualityInfo = getQualityText(quality);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Qualidade:</span>
        <span className={`text-sm font-bold ${qualityInfo.color}`}>
          {qualityInfo.text}
        </span>
      </div>
      
      <div className="flex gap-1">
        <button
          onClick={() => onQualityChange('low')}
          className={`px-2 py-1 text-xs rounded ${
            quality === 'low' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Baixa
        </button>
        <button
          onClick={() => onQualityChange('medium')}
          className={`px-2 py-1 text-xs rounded ${
            quality === 'medium' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Média
        </button>
        <button
          onClick={() => onQualityChange('high')}
          className={`px-2 py-1 text-xs rounded ${
            quality === 'high' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Máxima
        </button>
      </div>
    </div>
  );
};