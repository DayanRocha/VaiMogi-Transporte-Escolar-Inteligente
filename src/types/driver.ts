
export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  photo?: string;
}

export interface Van {
  id: string;
  driverId: string;
  model: string;
  plate: string;
  capacity: number;
  observations?: string;
  photo?: string;
  drivingPermitDocument?: string; // Documento de permissão para dirigir (JPG)
}

export interface RouteStudentConfig {
  studentId: string;
  direction: 'embarque' | 'desembarque';
}

export interface Route {
  id: string;
  driverId: string;
  name: string;
  startTime: string;
  weekDays: string[];
  students: Student[];
  studentConfigs?: RouteStudentConfig[]; // Configurações específicas por rota
}

export interface Student {
  id: string;
  name: string;
  address: string;
  guardianId: string;
  guardianPhone: string;
  guardianEmail: string;
  pickupPoint: string;
  schoolId: string;
  status: 'waiting' | 'embarked' | 'at_school';
  dropoffLocation?: 'home' | 'school'; // Where to drop off the student (home or school)
}

export interface Guardian {
  id: string;
  name: string;
  email: string;
  phone?: string;
  uniqueCode?: string;
  codeGeneratedAt?: string;
  isActive?: boolean;
}

export interface School {
  id: string;
  name: string;
  address: string;
}

export interface Trip {
  id: string;
  routeId: string;
  date: string;
  status: 'planned' | 'in_progress' | 'completed';
  students: TripStudent[];
}

export interface TripStudent {
  studentId: string;
  status: 'waiting' | 'van_arrived' | 'embarked' | 'at_school' | 'disembarked';
  direction: 'to_school' | 'to_home'; // Direction of the trip
  pickupTime?: string;
  dropoffTime?: string;
}
