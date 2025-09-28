import React from 'react';
import { Edit, MapPin, School, Phone, Mail, MoreVertical, User } from 'lucide-react';
import { Card, CardContent, CardBadge, CardAvatar } from '@/components/ui/card-modern';
import { Button } from '@/components/ui/button-modern';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  school: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  status: 'active' | 'inactive' | 'pending';
  dropoffType?: 'home' | 'school';
  profileImage?: string;
}

interface StudentCardModernProps {
  student: Student;
  onEdit: (student: Student) => void;
  onToggleStatus: (student: Student) => void;
  onViewLocation?: (student: Student) => void;
  onContactGuardian?: (student: Student) => void;
  className?: string;
}

const statusConfig = {
  active: {
    label: 'Ativo',
    variant: 'success' as const,
    color: 'bg-green-500',
    textColor: 'text-green-600'
  },
  inactive: {
    label: 'Inativo',
    variant: 'error' as const,
    color: 'bg-red-500',
    textColor: 'text-red-600'
  },
  pending: {
    label: 'Pendente',
    variant: 'warning' as const,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600'
  }
};

export const StudentCardModern: React.FC<StudentCardModernProps> = ({
  student,
  onEdit,
  onToggleStatus,
  onViewLocation,
  onContactGuardian,
  className
}) => {
  const status = statusConfig[student.status];
  const initials = student.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card 
      interactive 
      className={cn("group overflow-hidden", className)}
    >
      <CardContent className="p-4">
        {/* Header com avatar e status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <CardAvatar
                src={student.profileImage}
                alt={student.name}
                fallback={initials}
                size="lg"
                className="ring-2 ring-white shadow-md"
              />
              {/* Status indicator */}
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                status.color
              )} />
            </div>

            {/* Info básica */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-neutral-900 truncate">
                {student.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-neutral-600 mt-1">
                <School className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{student.school}</span>
              </div>
            </div>
          </div>

          {/* Status badge */}
          <CardBadge variant={status.variant}>
            {status.label}
          </CardBadge>
        </div>

        {/* Informações de contato */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <MapPin className="w-4 h-4 flex-shrink-0 text-neutral-400" />
            <span className="truncate">{student.address}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <User className="w-4 h-4 flex-shrink-0 text-neutral-400" />
            <span className="truncate">{student.guardianName}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Phone className="w-4 h-4 flex-shrink-0 text-neutral-400" />
            <span className="truncate">{student.guardianPhone}</span>
          </div>
        </div>

        {/* Tipo de entrega */}
        {student.dropoffType && (
          <div className="mb-4">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded-lg text-xs font-medium text-neutral-700">
              {student.dropoffType === 'home' ? (
                <>
                  <MapPin className="w-3 h-3" />
                  Entrega em Casa
                </>
              ) : (
                <>
                  <School className="w-3 h-3" />
                  Entrega na Escola
                </>
              )}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            {/* Botão de localização */}
            {onViewLocation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewLocation(student)}
                className="text-neutral-600 hover:text-blue-600"
              >
                <MapPin className="w-4 h-4" />
              </Button>
            )}

            {/* Botão de contato */}
            {onContactGuardian && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onContactGuardian(student)}
                className="text-neutral-600 hover:text-green-600"
              >
                <Phone className="w-4 h-4" />
              </Button>
            )}

            {/* Botão de edição */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(student)}
              className="text-neutral-600 hover:text-orange-600"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>

          {/* Botão de toggle status */}
          <Button
            variant={student.status === 'active' ? 'outline' : 'default'}
            size="sm"
            onClick={() => onToggleStatus(student)}
            className={cn(
              "min-w-[80px]",
              student.status === 'active' 
                ? "border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500" 
                : "bg-green-500 hover:bg-green-600 text-white"
            )}
          >
            {student.status === 'active' ? 'Desativar' : 'Ativar'}
          </Button>
        </div>

        {/* Indicador de hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-50/0 via-orange-50/50 to-orange-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </CardContent>
    </Card>
  );
};

export default StudentCardModern;