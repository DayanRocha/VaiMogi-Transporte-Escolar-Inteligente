import { useEffect } from 'react';
import { notificationService } from '@/services/notificationService';
import { TripStudent, Student, School } from '@/types/driver';

interface UseNotificationIntegrationProps {
  students: Student[];
  schools: School[];
}

export const useNotificationIntegration = ({ students, schools }: UseNotificationIntegrationProps) => {
  
  // Função para obter nome da escola
  const getSchoolName = (schoolId: string): string => {
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : 'Escola';
  };

  // Função para obter localização atual (sem fallback fixo)
  const getCurrentLocation = (): Promise<{ lat: number; lng: number } | undefined> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          () => {
            // Sem fallback para localização simulada
            resolve(undefined);
          }
        );
      } else {
        resolve(undefined);
      }
    });
  };

  // Função para notificar início da rota
  const notifyRouteStarted = async (tripStudents: TripStudent[]) => {
    console.log('🚀 Notificando início da rota para', tripStudents.length, 'estudantes');
    
    for (const tripStudent of tripStudents) {
      const student = students.find(s => s.id === tripStudent.studentId);
      if (student) {
        notificationService.notifyRouteStarted(
          student.id,
          student.name,
          tripStudent.direction
        );
      }
    }
  };

  // Função para notificar chegada da van
  const notifyVanArrived = async (studentId: string, direction: 'to_school' | 'to_home') => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    console.log('🚐 Notificando chegada da van para', student.name);
    
    const location = await getCurrentLocation();
    notificationService.notifyVanArrived(
      student.id,
      student.name,
      direction,
      location
    );
  };

  // Função para notificar embarque
  const notifyEmbarked = async (studentId: string, direction: 'to_school' | 'to_home') => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    console.log('👤 Notificando embarque de', student.name);
    
    const location = await getCurrentLocation();
    notificationService.notifyEmbarked(
      student.id,
      student.name,
      direction,
      location
    );
  };

  // Função para notificar chegada na escola
  const notifyAtSchool = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    console.log('🏫 Notificando chegada na escola de', student.name);
    
    const schoolName = getSchoolName(student.schoolId);
    const location = await getCurrentLocation();
    
    notificationService.notifyAtSchool(
      student.id,
      student.name,
      schoolName,
      location
    );
  };

  // Função para notificar desembarque
  const notifyDisembarked = async (studentId: string, direction: 'to_school' | 'to_home') => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    console.log('🚪 Notificando desembarque de', student.name);
    
    const location = await getCurrentLocation();
    
    if (direction === 'to_school') {
      // Desembarque na escola
      const schoolName = getSchoolName(student.schoolId);
      notificationService.notifyDisembarked(
        student.id,
        student.name,
        direction,
        schoolName,
        undefined,
        location
      );
    } else {
      // Desembarque em casa
      notificationService.notifyDisembarked(
        student.id,
        student.name,
        direction,
        undefined,
        student.pickupPoint,
        location
      );
    }
  };

  // Função para notificar desembarque em grupo
  const notifyGroupDisembarked = async (studentIds: string[], direction: 'to_school' | 'to_home') => {
    console.log('👥 Notificando desembarque em grupo de', studentIds.length, 'estudantes');
    
    for (const studentId of studentIds) {
      await notifyDisembarked(studentId, direction);
    }
  };

  // Função para notificar fim da rota
  const notifyRouteFinished = (direction: 'to_school' | 'to_home') => {
    console.log('🏁 Notificando fim da rota:', direction);
    notificationService.notifyRouteFinished(direction);
  };

  return {
    notifyRouteStarted,
    notifyVanArrived,
    notifyEmbarked,
    notifyAtSchool,
    notifyDisembarked,
    notifyGroupDisembarked,
    notifyRouteFinished
  };
};