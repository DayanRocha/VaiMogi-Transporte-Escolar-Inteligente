/**
 * Função de teste para atualizar escola e verificar se o mapa atualiza
 * Use no console do navegador para testar
 */

import { School } from '@/types/driver';

export const testSchoolUpdate = (schoolId: string, newAddress: string) => {
  console.log('🧪 ===== TESTE DE ATUALIZAÇÃO DE ESCOLA =====');
  console.log('🧪 School ID:', schoolId);
  console.log('🧪 Novo endereço:', newAddress);
  
  try {
    // 1. Carregar escolas atuais
    const schoolsData = localStorage.getItem('schools');
    if (!schoolsData) {
      console.error('❌ Nenhuma escola encontrada no localStorage');
      return;
    }
    
    const schools: School[] = JSON.parse(schoolsData);
    console.log('📚 Total de escolas:', schools.length);
    
    // 2. Encontrar a escola
    const schoolIndex = schools.findIndex(s => s.id === schoolId);
    if (schoolIndex === -1) {
      console.error('❌ Escola não encontrada:', schoolId);
      console.log('📚 IDs disponíveis:', schools.map(s => s.id));
      return;
    }
    
    const school = schools[schoolIndex];
    console.log('🏫 Escola encontrada:', school.name);
    console.log('📍 Endereço antigo:', school.address);
    console.log('📍 Coordenadas antigas:', { lat: school.latitude, lng: school.longitude });
    
    // 3. Atualizar endereço e REMOVER coordenadas antigas
    schools[schoolIndex] = {
      ...school,
      address: newAddress,
      latitude: undefined, // IMPORTANTE: Remover para forçar re-geocodificação
      longitude: undefined
    };
    
    console.log('📝 Escola atualizada (sem coordenadas)');
    
    // 4. Salvar no localStorage
    localStorage.setItem('schools', JSON.stringify(schools));
    console.log('💾 Salvo no localStorage');
    
    // 5. Disparar evento customizado
    window.dispatchEvent(new CustomEvent('schoolsDataUpdated', { 
      detail: { schools } 
    }));
    console.log('📢 Evento schoolsDataUpdated disparado');
    
    // 6. Aguardar e verificar
    console.log('⏳ Aguardando geocodificação (3 segundos)...');
    setTimeout(() => {
      const updatedSchools = JSON.parse(localStorage.getItem('schools') || '[]');
      const updated = updatedSchools.find((s: School) => s.id === schoolId);
      
      console.log('🧪 ===== RESULTADO DO TESTE =====');
      console.log('🏫 Escola:', updated.name);
      console.log('📍 Novo endereço:', updated.address);
      console.log('📍 Novas coordenadas:', { lat: updated.latitude, lng: updated.longitude });
      
      if (updated.latitude && updated.longitude) {
        console.log('✅ SUCESSO! Escola geocodificada e atualizada');
        console.log('🗺️ Verifique o mapa - o marcador deve estar na nova posição');
      } else {
        console.log('⚠️ Coordenadas ainda não foram geocodificadas');
        console.log('💡 Aguarde mais alguns segundos e verifique novamente');
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// Expor globalmente para uso no console
(window as any).testSchoolUpdate = testSchoolUpdate;

console.log('🧪 Função de teste carregada!');
console.log('💡 Use: testSchoolUpdate("school-id", "Novo endereço")');
