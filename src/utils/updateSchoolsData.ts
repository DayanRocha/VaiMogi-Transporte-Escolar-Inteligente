// Função utilitária para atualizar os dados das escolas no localStorage
import { School } from '@/types/driver';

// Dados fornecidos pelo usuário
// Importante: não definir latitude/longitude fixas aqui.
// Deixe o fluxo de geocodificação (useMapboxMap -> useGeocoding -> realtimeDataService)
const newSchoolsData: School[] = [
  {
    id: '1757514957931',
    name: 'CRECHE',
    address: 'Av. Expedicionário José Barca, 182 - Fazenda Rodeio, Mogi das cruzes - SP, 08775-600'
  },
  // Adicionar também a escola com o ID referenciado pelos estudantes nos logs
  {
    id: '1759492459747',
    name: 'CRECHE',
    address: 'Av. Expedicionário José Barca, 182 - Fazenda Rodeio, Mogi das cruzes - SP, 08775-600'
  }
];

export const updateSchoolsData = (): void => {
  try {
    console.log(' Atualizando dados das escolas no localStorage...');
    
    // Carregar escolas existentes (se houver)
    const existingSchoolsRaw = localStorage.getItem('schools');
    const existingSchools: School[] = existingSchoolsRaw ? JSON.parse(existingSchoolsRaw) : [];
    console.log(' Dados existentes carregados:', existingSchools.length);
    
    // Criar mapa por id para mesclar sem duplicar
    const byId = new Map<string, School>();
    existingSchools.forEach(s => byId.set(s.id, s));
    newSchoolsData.forEach(s => byId.set(s.id, { ...byId.get(s.id), ...s }));
    
    const merged = Array.from(byId.values());
    
    // Salvar mesclado
    localStorage.setItem('schools', JSON.stringify(merged));
    console.log(' Dados das escolas mesclados e salvos:', merged);
    
    // Verificação
    const savedData = localStorage.getItem('schools');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log(' Verificação - Dados salvos:', parsedData);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        const school = parsedData[0];
        console.log(' Validação bem-sucedida (primeira escola):');
        console.log(`   - ID: ${school.id}`);
        console.log(`   - Nome: ${school.name}`);
        console.log(`   - Endereço: ${school.address}`);
        console.log(`   - Latitude: ${school.latitude}`);
        console.log(`   - Longitude: ${school.longitude}`);
      }
    }
    
    // Notificar componentes sobre a atualização
    window.dispatchEvent(new CustomEvent('schoolsDataUpdated', { 
      detail: { schools: merged } 
    }));
    
  } catch (error) {
    console.error(' Erro ao atualizar dados das escolas:', error);
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