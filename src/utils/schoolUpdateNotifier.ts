import { School } from '@/types/driver';

/**
 * Notifica o mapa sobre atualizações nas escolas
 * Dispara um evento customizado que o useMapboxMap escuta
 */
export const notifySchoolUpdate = (schools: School[]) => {
  console.log('📢 Notificando atualização de escolas:', schools.length);
  
  // Disparar evento customizado
  window.dispatchEvent(new CustomEvent('schoolsDataUpdated', { 
    detail: { schools } 
  }));
  
  // Salvar no localStorage
  try {
    localStorage.setItem('schools', JSON.stringify(schools));
    console.log('💾 Escolas salvas no localStorage');
  } catch (error) {
    console.error('❌ Erro ao salvar escolas:', error);
  }
};

/**
 * Força a re-geocodificação de uma escola específica
 * Remove as coordenadas para que o hook re-geocodifique
 */
export const forceSchoolRegeocoding = (schoolId: string) => {
  try {
    const schoolsData = localStorage.getItem('schools');
    if (!schoolsData) return;
    
    const schools: School[] = JSON.parse(schoolsData);
    const updatedSchools = schools.map(school => {
      if (school.id === schoolId) {
        console.log('🔄 Forçando re-geocodificação da escola:', school.name);
        return {
          ...school,
          latitude: undefined,
          longitude: undefined
        };
      }
      return school;
    });
    
    notifySchoolUpdate(updatedSchools);
  } catch (error) {
    console.error('❌ Erro ao forçar re-geocodificação:', error);
  }
};

/**
 * Atualiza o endereço de uma escola e força re-geocodificação
 */
export const updateSchoolAddress = (schoolId: string, newAddress: string) => {
  try {
    const schoolsData = localStorage.getItem('schools');
    if (!schoolsData) return;
    
    const schools: School[] = JSON.parse(schoolsData);
    const updatedSchools = schools.map(school => {
      if (school.id === schoolId) {
        console.log('📝 Atualizando endereço da escola:', school.name);
        console.log('   De:', school.address);
        console.log('   Para:', newAddress);
        return {
          ...school,
          address: newAddress,
          latitude: undefined, // Remover coordenadas antigas
          longitude: undefined // Forçar re-geocodificação
        };
      }
      return school;
    });
    
    notifySchoolUpdate(updatedSchools);
    console.log('✅ Endereço atualizado! O mapa será atualizado automaticamente.');
  } catch (error) {
    console.error('❌ Erro ao atualizar endereço:', error);
  }
};
