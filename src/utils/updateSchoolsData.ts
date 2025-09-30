// Função utilitária para atualizar os dados das escolas no localStorage
import { School } from '@/types/driver';

// Dados fornecidos pelo usuário
const newSchoolsData: School[] = [
  {
    id: '1757514957931',
    name: 'CRECHE',
    address: 'Av. Expedicionário José Barca, 182 - Fazenda Rodeio, Mogi das Cruzes - SP, 08775-600',
    latitude: -9.588903,
    longitude: -51.619789
  }
];

export const updateSchoolsData = (): void => {
  try {
    console.log('🏫 Atualizando dados das escolas no localStorage...');
    
    // Verificar dados existentes
    const existingSchools = localStorage.getItem('schools');
    if (existingSchools) {
      console.log('📋 Dados existentes encontrados:', JSON.parse(existingSchools));
    } else {
      console.log('📋 Nenhum dado existente encontrado');
    }
    
    // Salvar novos dados
    localStorage.setItem('schools', JSON.stringify(newSchoolsData));
    
    console.log('✅ Dados das escolas atualizados com sucesso!');
    console.log('📍 Novos dados salvos:', newSchoolsData);
    
    // Verificar se os dados foram salvos corretamente
    const savedData = localStorage.getItem('schools');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log('🔍 Verificação - Dados salvos:', parsedData);
      
      // Validar estrutura dos dados
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        const school = parsedData[0];
        console.log('✅ Validação bem-sucedida:');
        console.log(`   - ID: ${school.id}`);
        console.log(`   - Nome: ${school.name}`);
        console.log(`   - Endereço: ${school.address}`);
        console.log(`   - Latitude: ${school.latitude}`);
        console.log(`   - Longitude: ${school.longitude}`);
      }
    }
    
    // Disparar evento personalizado para notificar componentes sobre a atualização
    window.dispatchEvent(new CustomEvent('schoolsDataUpdated', { 
      detail: { schools: newSchoolsData } 
    }));
    
  } catch (error) {
    console.error('❌ Erro ao atualizar dados das escolas:', error);
    throw error;
  }
};

// Função para obter os dados atualizados das escolas
export const getUpdatedSchoolsData = (): School[] => {
  try {
    const savedSchools = localStorage.getItem('schools');
    if (savedSchools) {
      return JSON.parse(savedSchools);
    }
    return [];
  } catch (error) {
    console.error('❌ Erro ao carregar dados das escolas:', error);
    return [];
  }
};