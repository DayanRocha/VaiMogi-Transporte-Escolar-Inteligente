/**
 * Utilitário para limpar cache de geocodificação e forçar nova geocodificação
 */

/**
 * Limpa o cache de geocodificação armazenado no localStorage
 */
export const clearGeocodingCache = (): void => {
  try {
    // Limpar coordenadas dos estudantes
    const studentsData = localStorage.getItem('students');
    if (studentsData) {
      const students = JSON.parse(studentsData);
      const studentsWithoutCoords = students.map((student: any) => ({
        ...student,
        latitude: undefined,
        longitude: undefined,
        lat: undefined,
        lng: undefined
      }));
      localStorage.setItem('students', JSON.stringify(studentsWithoutCoords));
      console.log('✅ Cache de coordenadas dos estudantes limpo');
    }

    // Limpar coordenadas das escolas
    const schoolsData = localStorage.getItem('schools');
    if (schoolsData) {
      const schools = JSON.parse(schoolsData);
      const schoolsWithoutCoords = schools.map((school: any) => ({
        ...school,
        latitude: undefined,
        longitude: undefined,
        lat: undefined,
        lng: undefined
      }));
      localStorage.setItem('schools', JSON.stringify(schoolsWithoutCoords));
      console.log('✅ Cache de coordenadas das escolas limpo');
    }

    console.log('🗑️ Cache de geocodificação limpo com sucesso!');
    console.log('🔄 Recarregue a página para forçar nova geocodificação');
  } catch (error) {
    console.error('❌ Erro ao limpar cache de geocodificação:', error);
  }
};

/**
 * Atualiza manualmente as coordenadas de um estudante
 */
export const updateStudentCoordinates = (
  studentId: string,
  latitude: number,
  longitude: number
): void => {
  try {
    const studentsData = localStorage.getItem('students');
    if (!studentsData) {
      console.error('❌ Nenhum estudante encontrado no localStorage');
      return;
    }

    const students = JSON.parse(studentsData);
    const updatedStudents = students.map((student: any) => {
      if (student.id === studentId) {
        return {
          ...student,
          latitude,
          longitude,
          lat: latitude,
          lng: longitude
        };
      }
      return student;
    });

    localStorage.setItem('students', JSON.stringify(updatedStudents));
    console.log('✅ Coordenadas do estudante atualizadas:', { studentId, latitude, longitude });
  } catch (error) {
    console.error('❌ Erro ao atualizar coordenadas do estudante:', error);
  }
};

/**
 * Atualiza manualmente as coordenadas de uma escola
 */
export const updateSchoolCoordinates = (
  schoolId: string,
  latitude: number,
  longitude: number
): void => {
  try {
    const schoolsData = localStorage.getItem('schools');
    if (!schoolsData) {
      console.error('❌ Nenhuma escola encontrada no localStorage');
      return;
    }

    const schools = JSON.parse(schoolsData);
    const updatedSchools = schools.map((school: any) => {
      if (school.id === schoolId) {
        return {
          ...school,
          latitude,
          longitude,
          lat: latitude,
          lng: longitude
        };
      }
      return school;
    });

    localStorage.setItem('schools', JSON.stringify(updatedSchools));
    console.log('✅ Coordenadas da escola atualizadas:', { schoolId, latitude, longitude });
  } catch (error) {
    console.error('❌ Erro ao atualizar coordenadas da escola:', error);
  }
};

/**
 * Lista todas as escolas com seus endereços e coordenadas
 */
export const listSchools = (): void => {
  try {
    const schoolsData = localStorage.getItem('schools');
    if (!schoolsData) {
      console.log('❌ Nenhuma escola encontrada no localStorage');
      return;
    }

    const schools = JSON.parse(schoolsData);
    console.log('🏫 Escolas cadastradas:', schools.length);
    console.table(schools.map((school: any) => ({
      id: school.id,
      nome: school.name,
      endereço: school.address,
      latitude: school.latitude || 'Não geocodificado',
      longitude: school.longitude || 'Não geocodificado',
      temCoordenadas: !!(school.latitude && school.longitude),
      coordenadasValidas: school.latitude && school.longitude && 
        school.latitude >= -25 && school.latitude <= -20 &&
        school.longitude >= -50 && school.longitude <= -44
    })));
  } catch (error) {
    console.error('❌ Erro ao listar escolas:', error);
  }
};

/**
 * Força re-geocodificação de uma escola específica
 */
export const regeocodeSchool = (schoolId: string): void => {
  try {
    const schoolsData = localStorage.getItem('schools');
    if (!schoolsData) {
      console.error('❌ Nenhuma escola encontrada no localStorage');
      return;
    }

    const schools = JSON.parse(schoolsData);
    const updatedSchools = schools.map((school: any) => {
      if (school.id === schoolId) {
        console.log('🔄 Removendo coordenadas da escola para forçar re-geocodificação:', school.name);
        return {
          ...school,
          latitude: undefined,
          longitude: undefined,
          lat: undefined,
          lng: undefined
        };
      }
      return school;
    });

    localStorage.setItem('schools', JSON.stringify(updatedSchools));
    console.log('✅ Escola marcada para re-geocodificação. Recarregue a página.');
    console.log('💡 Execute: location.reload()');
  } catch (error) {
    console.error('❌ Erro ao marcar escola para re-geocodificação:', error);
  }
};

/**
 * Lista todos os estudantes com seus endereços e coordenadas
 */
export const listStudents = (): void => {
  try {
    const studentsData = localStorage.getItem('students');
    if (!studentsData) {
      console.log('❌ Nenhum estudante encontrado no localStorage');
      return;
    }

    const students = JSON.parse(studentsData);
    console.log('👨‍🎓 Estudantes cadastrados:', students.length);
    console.table(students.map((student: any) => ({
      id: student.id,
      nome: student.name,
      endereço: student.address,
      latitude: student.latitude || 'Não geocodificado',
      longitude: student.longitude || 'Não geocodificado',
      temCoordenadas: !!(student.latitude && student.longitude)
    })));
  } catch (error) {
    console.error('❌ Erro ao listar estudantes:', error);
  }
};

/**
 * Verifica marcadores no mapa
 */
export const checkMapMarkers = (): void => {
  console.log('🔍 Verificando marcadores no mapa...');
  
  const schoolMarkers = document.querySelectorAll('.school-marker');
  const studentMarkers = document.querySelectorAll('.student-marker');
  const driverMarkers = document.querySelectorAll('.driver-marker-static');
  
  console.log('🏫 Marcadores de escolas no DOM:', schoolMarkers.length);
  console.log('👨‍🎓 Marcadores de estudantes no DOM:', studentMarkers.length);
  console.log('🚌 Marcadores de motorista no DOM:', driverMarkers.length);
  
  if (schoolMarkers.length > 0) {
    console.log('✅ Marcadores de escolas encontrados:');
    schoolMarkers.forEach((marker, index) => {
      const style = (marker as HTMLElement).style;
      console.log(`  Escola ${index + 1}:`, {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        zIndex: style.zIndex
      });
    });
  } else {
    console.log('❌ Nenhum marcador de escola encontrado no DOM');
  }
};

// Expor funções globalmente para uso no console do navegador
if (typeof window !== 'undefined') {
  (window as any).clearGeocodingCache = clearGeocodingCache;
  (window as any).updateStudentCoordinates = updateStudentCoordinates;
  (window as any).updateSchoolCoordinates = updateSchoolCoordinates;
  (window as any).listSchools = listSchools;
  (window as any).listStudents = listStudents;
  (window as any).regeocodeSchool = regeocodeSchool;
  (window as any).checkMapMarkers = checkMapMarkers;
}
