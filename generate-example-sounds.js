// Script Node.js para gerar sons de exemplo usando Web Audio API
// Execute com: node generate-example-sounds.js

const fs = require('fs');
const path = require('path');

console.log('🎵 Gerador de Sons de Exemplo para Notificações');
console.log('===============================================');
console.log('');
console.log('Este script cria arquivos de exemplo que você pode usar como base.');
console.log('Para usar sons reais, substitua os arquivos na pasta public/sounds/');
console.log('');

const soundsDir = path.join(__dirname, 'public', 'sounds');

// Verificar se a pasta existe
if (!fs.existsSync(soundsDir)) {
  console.log('❌ Pasta public/sounds/ não encontrada!');
  console.log('   Certifique-se de estar na raiz do projeto.');
  process.exit(1);
}

const soundFiles = [
  {
    name: 'route-started.mp3',
    description: '🚀 Som de início da rota',
    suggestion: 'Substitua por: som de motor ligando, campainha ascendente'
  },
  {
    name: 'van-arrived.mp3', 
    description: '🚐 Som de chegada da van',
    suggestion: 'Substitua por: buzina amigável, sino de chegada'
  },
  {
    name: 'embarked.mp3',
    description: '👤 Som de embarque',
    suggestion: 'Substitua por: "ding" de confirmação, porta fechando'
  },
  {
    name: 'at-school.mp3',
    description: '🏫 Som de chegada na escola', 
    suggestion: 'Substitua por: sino escolar, música alegre curta'
  },
  {
    name: 'disembarked.mp3',
    description: '🚪 Som de desembarque',
    suggestion: 'Substitua por: "ta-da" de conclusão, campainha descendente'
  },
  {
    name: 'route-finished.mp3',
    description: '🏁 Som de fim da rota',
    suggestion: 'Substitua por: fanfarra curta, música de finalização'
  },
  {
    name: 'default.mp3',
    description: '🔔 Som padrão',
    suggestion: 'Substitua por: notificação genérica, tom neutro'
  }
];

console.log('📁 Arquivos de som necessários:');
console.log('');

soundFiles.forEach((sound, index) => {
  const filePath = path.join(soundsDir, sound.name);
  const exists = fs.existsSync(filePath) && fs.statSync(filePath).size > 100; // Mais que 100 bytes
  
  console.log(`${index + 1}. ${sound.description}`);
  console.log(`   Arquivo: ${sound.name}`);
  console.log(`   Status: ${exists ? '✅ Existe' : '❌ Placeholder'}`);
  console.log(`   ${sound.suggestion}`);
  console.log('');
});

console.log('🔧 Para adicionar sons reais:');
console.log('');
console.log('1. Baixe arquivos MP3 de 1-3 segundos cada');
console.log('2. Renomeie com os nomes exatos acima');
console.log('3. Substitua os arquivos na pasta public/sounds/');
console.log('4. Reinicie a aplicação (npm run dev)');
console.log('5. Teste no painel: Config → Sons de Notificação');
console.log('');

console.log('🌐 Sites recomendados para sons gratuitos:');
console.log('• freesound.org - Sons Creative Commons');
console.log('• zapsplat.com - Biblioteca profissional');
console.log('• pixabay.com - Sons livres de direitos');
console.log('• YouTube Audio Library - Google');
console.log('');

console.log('✨ Exemplo de busca:');
console.log('• "notification sound short"');
console.log('• "bell chime 1 second"');
console.log('• "success sound effect"');
console.log('• "school bell ring"');
console.log('');

console.log('🎯 Dica: Use Audacity (gratuito) para editar e normalizar os sons!');