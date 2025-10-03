import fs from 'fs';

const filePath = 'src/components/GuardianMapboxMap.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Removendo emojis dos popups...\n');

// Remover emojis dos títulos dos popups
content = content.replace(/🚌 Motorista/g, 'Motorista');
content = content.replace(/👨‍🎓 \$\{student\.name\}/g, '${student.name}');
content = content.replace(/🏫 \$\{school\.name\}/g, '${school.name}');

// Remover emojis dos badges/status
content = content.replace(/📍 Endereço:/g, 'Endereço:');
content = content.replace(/📍 Tempo Real/g, 'Tempo Real');
content = content.replace(/📍 Localização Atualizada/g, 'Localização Atualizada');
content = content.replace(/📍 Posição Atualizada/g, 'Posição Atualizada');
content = content.replace(/📍 \$\{student\.status/g, '${student.status');

// Salvar
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Emojis removidos com sucesso!');
console.log('\nEmojis removidos:');
console.log('  - 🚌 dos popups do motorista');
console.log('  - 👨‍🎓 dos popups dos estudantes');
console.log('  - 🏫 dos popups das escolas');
console.log('  - 📍 dos badges de status');
console.log('\nAgora recarregue o navegador (F5)');
