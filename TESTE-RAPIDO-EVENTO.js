// ========================================
// TESTE RÁPIDO: Verificar se Evento Funciona
// ========================================

// PASSO 1: Cole este código no CONSOLE DO RESPONSÁVEL
// ====================================================

console.log('🧪 INICIANDO TESTE DE EVENTO');
console.log('');

// Registrar listener para o evento
let eventoRecebido = false;

window.addEventListener('studentsDataUpdated', (event) => {
  eventoRecebido = true;
  console.log('');
  console.log('✅ ========================================');
  console.log('✅ EVENTO RECEBIDO COM SUCESSO!');
  console.log('✅ ========================================');
  console.log('');
  console.log('📊 Dados recebidos:', event.detail);
  console.log('👥 Estudantes:', event.detail.students.length);
  event.detail.students.forEach(s => console.log('  -', s.name));
  console.log('');
  console.log('🔄 Aguarde 2 segundos para ver atualização no mapa...');
  
  setTimeout(() => {
    const markers = document.querySelectorAll('.student-marker');
    console.log('🗺️ Marcadores no mapa:', markers.length);
    
    if (markers.length === event.detail.students.length) {
      console.log('✅ MAPA ATUALIZADO CORRETAMENTE!');
    } else {
      console.log('⚠️ Mapa ainda não atualizou. Aguarde mais um pouco...');
    }
  }, 2000);
});

console.log('✅ Listener registrado!');
console.log('');
console.log('📝 PRÓXIMO PASSO:');
console.log('1. Vá para a aba do MOTORISTA');
console.log('2. Remova um aluno da rota (clique no X)');
console.log('3. Clique em "Salvar Mudanças"');
console.log('4. Volte para esta aba e veja o resultado');
console.log('');

// Verificar a cada 5 segundos se evento foi recebido
let checkCount = 0;
const checkInterval = setInterval(() => {
  checkCount++;
  
  if (eventoRecebido) {
    clearInterval(checkInterval);
    return;
  }
  
  if (checkCount >= 12) { // 60 segundos
    console.log('');
    console.log('❌ ========================================');
    console.log('❌ EVENTO NÃO FOI RECEBIDO EM 60 SEGUNDOS');
    console.log('❌ ========================================');
    console.log('');
    console.log('Possíveis causas:');
    console.log('1. Você não clicou em "Salvar Mudanças"');
    console.log('2. O código não está disparando o evento');
    console.log('3. As abas não estão na mesma origem');
    console.log('');
    console.log('🔧 SOLUÇÃO: Cole o código abaixo na aba do MOTORISTA');
    console.log('');
    console.log('// COLE NO CONSOLE DO MOTORISTA:');
    console.log('const routes = JSON.parse(localStorage.getItem("routes") || "[]");');
    console.log('window.dispatchEvent(new CustomEvent("studentsDataUpdated", {');
    console.log('  detail: { students: routes[0].students, routeId: routes[0].id }');
    console.log('}));');
    console.log('console.log("✅ Evento disparado manualmente!");');
    console.log('');
    
    clearInterval(checkInterval);
  } else {
    console.log(`⏳ Aguardando evento... (${checkCount * 5}s)`);
  }
}, 5000);

console.log('⏳ Aguardando evento...');
console.log('');


// ========================================
// PASSO 2: Se o evento não for recebido,
// cole este código no CONSOLE DO MOTORISTA
// ========================================

/*

console.log('🧪 DISPARANDO EVENTO MANUALMENTE');
console.log('');

const routes = JSON.parse(localStorage.getItem('routes') || '[]');

if (routes.length === 0) {
  console.log('❌ Nenhuma rota encontrada!');
  console.log('Cadastre uma rota primeiro.');
} else {
  const route = routes[0];
  console.log('📊 Rota:', route.name);
  console.log('👥 Estudantes:', route.students.length);
  route.students.forEach(s => console.log('  -', s.name));
  console.log('');
  
  window.dispatchEvent(new CustomEvent('studentsDataUpdated', { 
    detail: { 
      students: route.students,
      routeId: route.id
    } 
  }));
  
  console.log('✅ Evento disparado!');
  console.log('Volte para a aba do RESPONSÁVEL e veja o resultado');
}

*/
