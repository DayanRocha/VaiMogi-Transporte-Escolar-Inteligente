import React from 'react';
import { Loader2, Truck, Users, Route, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateModernProps {
  message?: string;
  progress?: number;
  type?: 'default' | 'route' | 'students' | 'map' | 'trip';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const loadingConfig = {
  default: {
    icon: Loader2,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    message: 'Carregando...'
  },
  route: {
    icon: Route,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    message: 'Carregando rotas...'
  },
  students: {
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    message: 'Carregando estudantes...'
  },
  map: {
    icon: MapPin,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    message: 'Carregando mapa...'
  },
  trip: {
    icon: Truck,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    message: 'Iniciando viagem...'
  }
};

const sizeConfig = {
  sm: {
    container: 'p-4',
    icon: 'w-8 h-8',
    iconContainer: 'w-16 h-16',
    text: 'text-sm',
    progress: 'text-xs'
  },
  md: {
    container: 'p-8',
    icon: 'w-12 h-12',
    iconContainer: 'w-20 h-20',
    text: 'text-base',
    progress: 'text-sm'
  },
  lg: {
    container: 'p-12',
    icon: 'w-16 h-16',
    iconContainer: 'w-24 h-24',
    text: 'text-lg',
    progress: 'text-base'
  }
};

export const LoadingStateModern: React.FC<LoadingStateModernProps> = ({
  message,
  progress,
  type = 'default',
  size = 'md',
  className
}) => {
  const config = loadingConfig[type];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;
  const displayMessage = message || config.message;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      sizeStyles.container,
      className
    )}>
      {/* Icon container with animated background */}
      <div className="relative mb-6">
        {/* Animated background */}
        <div className={cn(
          "rounded-full flex items-center justify-center",
          sizeStyles.iconContainer,
          config.bgColor,
          "animate-pulse"
        )}>
          {/* Spinning icon */}
          <Icon className={cn(
            sizeStyles.icon,
            config.color,
            type === 'default' ? 'animate-spin' : 'animate-bounce'
          )} />
        </div>

        {/* Progress circle overlay */}
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className={cn(sizeStyles.iconContainer, "transform -rotate-90")}
              viewBox="0 0 100 100"
            >
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-neutral-200"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className={config.color}
                style={{
                  transition: 'stroke-dashoffset 0.3s ease-in-out'
                }}
              />
            </svg>
            
            {/* Progress percentage */}
            <div className={cn(
              "absolute inset-0 flex items-center justify-center font-bold",
              sizeStyles.progress,
              config.color
            )}>
              {progress}%
            </div>
          </div>
        )}

        {/* Pulse effect */}
        <div className={cn(
          "absolute inset-0 rounded-full animate-ping opacity-20",
          config.bgColor
        )} />
      </div>

      {/* Loading message */}
      <div className="space-y-2">
        <p className={cn(
          "font-semibold text-neutral-900",
          sizeStyles.text
        )}>
          {displayMessage}
        </p>
        
        {progress !== undefined && (
          <p className="text-sm text-neutral-600">
            {progress < 30 && "Preparando..."}
            {progress >= 30 && progress < 70 && "Processando..."}
            {progress >= 70 && progress < 100 && "Finalizando..."}
            {progress === 100 && "Concluído!"}
          </p>
        )}
      </div>

      {/* Loading dots animation */}
      <div className="flex items-center gap-1 mt-4">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full animate-bounce",
              config.color.replace('text-', 'bg-')
            )}
            style={{
              animationDelay: `${index * 0.1}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Skeleton loading components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("bg-white rounded-2xl border border-neutral-200 p-4 animate-pulse", className)}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-neutral-200 rounded-full" />
        <div>
          <div className="w-32 h-5 bg-neutral-200 rounded mb-2" />
          <div className="w-24 h-4 bg-neutral-200 rounded" />
        </div>
      </div>
      <div className="w-16 h-6 bg-neutral-200 rounded-full" />
    </div>
    <div className="space-y-2 mb-4">
      <div className="w-full h-4 bg-neutral-200 rounded" />
      <div className="w-3/4 h-4 bg-neutral-200 rounded" />
    </div>
    <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-neutral-200 rounded" />
        <div className="w-8 h-8 bg-neutral-200 rounded" />
      </div>
      <div className="w-20 h-8 bg-neutral-200 rounded" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className 
}) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

export default LoadingStateModern;