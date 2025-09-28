import React from 'react';
import { 
  Users, 
  Route, 
  School, 
  MapPin, 
  Plus, 
  Search,
  Truck,
  UserPlus,
  Navigation,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  type?: 'students' | 'routes' | 'schools' | 'trips' | 'search' | 'guardians' | 'custom';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const emptyStateConfig = {
  students: {
    icon: Users,
    title: 'Nenhum estudante cadastrado',
    description: 'Comece adicionando os estudantes que você transporta para criar suas rotas.',
    actionLabel: 'Cadastrar Estudante',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
  routes: {
    icon: Route,
    title: 'Nenhuma rota criada',
    description: 'Crie sua primeira rota para começar a organizar o transporte dos estudantes.',
    actionLabel: 'Criar Rota',
    color: 'text-green-500',
    bgColor: 'bg-green-50'
  },
  schools: {
    icon: School,
    title: 'Nenhuma escola cadastrada',
    description: 'Adicione as escolas onde você faz o transporte dos estudantes.',
    actionLabel: 'Cadastrar Escola',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50'
  },
  guardians: {
    icon: UserPlus,
    title: 'Nenhum responsável cadastrado',
    description: 'Cadastre os responsáveis pelos estudantes para manter a comunicação.',
    actionLabel: 'Cadastrar Responsável',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50'
  },
  trips: {
    icon: Navigation,
    title: 'Nenhuma viagem ativa',
    description: 'Inicie uma rota para começar a transportar os estudantes.',
    actionLabel: 'Iniciar Viagem',
    color: 'text-red-500',
    bgColor: 'bg-red-50'
  },
  search: {
    icon: Search,
    title: 'Nenhum resultado encontrado',
    description: 'Tente ajustar os filtros ou termos de busca para encontrar o que procura.',
    actionLabel: 'Limpar Filtros',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50'
  },
  custom: {
    icon: BookOpen,
    title: 'Nada para mostrar',
    description: 'Não há itens para exibir no momento.',
    actionLabel: 'Atualizar',
    color: 'text-neutral-500',
    bgColor: 'bg-neutral-50'
  }
};

const sizeConfig = {
  sm: {
    container: 'p-6',
    iconContainer: 'w-16 h-16',
    icon: 'w-8 h-8',
    title: 'text-lg',
    description: 'text-sm',
    spacing: 'space-y-3'
  },
  md: {
    container: 'p-8',
    iconContainer: 'w-20 h-20',
    icon: 'w-10 h-10',
    title: 'text-xl',
    description: 'text-base',
    spacing: 'space-y-4'
  },
  lg: {
    container: 'p-12',
    iconContainer: 'w-24 h-24',
    icon: 'w-12 h-12',
    title: 'text-2xl',
    description: 'text-lg',
    spacing: 'space-y-6'
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'custom',
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
  size = 'md'
}) => {
  const config = emptyStateConfig[type];
  const sizeStyles = sizeConfig[size];
  const Icon = icon ? () => icon : config.icon;
  
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayActionLabel = actionLabel || config.actionLabel;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center animate-fade-in",
      sizeStyles.container,
      className
    )}>
      <div className={cn("flex flex-col items-center", sizeStyles.spacing)}>
        {/* Icon container */}
        <div className={cn(
          "rounded-full flex items-center justify-center mb-2",
          sizeStyles.iconContainer,
          config.bgColor,
          "relative overflow-hidden"
        )}>
          <Icon className={cn(sizeStyles.icon, config.color)} />
          
          {/* Subtle animation */}
          <div className={cn(
            "absolute inset-0 rounded-full opacity-20 animate-pulse",
            config.bgColor
          )} />
        </div>

        {/* Content */}
        <div className={sizeStyles.spacing}>
          <h3 className={cn(
            "font-semibold text-neutral-900 mb-2",
            sizeStyles.title
          )}>
            {displayTitle}
          </h3>
          
          <p className={cn(
            "text-neutral-600 max-w-sm mx-auto leading-relaxed",
            sizeStyles.description
          )}>
            {displayDescription}
          </p>
        </div>

        {/* Action button */}
        {onAction && (
          <Button
            onClick={onAction}
            className="mt-2 animate-scale-in"
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
          >
            <Plus className="w-4 h-4 mr-2" />
            {displayActionLabel}
          </Button>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating dots */}
        <div className={cn(
          "absolute top-1/4 left-1/4 w-2 h-2 rounded-full opacity-20 animate-bounce",
          config.color.replace('text-', 'bg-')
        )} style={{ animationDelay: '0s', animationDuration: '3s' }} />
        
        <div className={cn(
          "absolute top-1/3 right-1/4 w-1 h-1 rounded-full opacity-30 animate-bounce",
          config.color.replace('text-', 'bg-')
        )} style={{ animationDelay: '1s', animationDuration: '3s' }} />
        
        <div className={cn(
          "absolute bottom-1/3 left-1/3 w-1.5 h-1.5 rounded-full opacity-25 animate-bounce",
          config.color.replace('text-', 'bg-')
        )} style={{ animationDelay: '2s', animationDuration: '3s' }} />
      </div>
    </div>
  );
};

// Specialized empty state components
export const EmptyStudents: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="students" {...props} />
);

export const EmptyRoutes: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="routes" {...props} />
);

export const EmptySchools: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="schools" {...props} />
);

export const EmptyGuardians: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="guardians" {...props} />
);

export const EmptyTrips: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="trips" {...props} />
);

export const EmptySearch: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="search" {...props} />
);

export default EmptyState;