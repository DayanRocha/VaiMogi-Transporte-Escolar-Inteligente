# 🧪 Teste de Sincronização - Passo a Passo

## ⚠️ IMPORTANTE: Siga EXATAMENTE esta ordem

### Passo 1: Preparar o Ambiente

1. **Abra 2 abas do navegador:**
   - Aba 1: App do Motorista (http://localhost:5173)
   - Aba 2: App do Responsável (http://localhost:5173/guardian?code=SEU_CODIGO)

2. **Abra o Console (F12) em AMBAS as abas**

### Passo 2: Verificar Estado Inicial

**Na Aba do Responsável (Console):**

```javascript
// Cole este código:
const routes = JSON.parse(localStorage.getItem('routes') || '[]');
console.log('📋 Rotas cadastradas:', routes.length);
if (routes.length > 0) {
  console.log('📊 Primeira rota:', routes[0].name);
  console.log('👥 Estudantes na rota:', routes[0].students.length);
  routes[0].students.forEach(s => console.log('  -', s.name));
}

// Verificar marcadores no mapa
setTimeout(() => {
  const markers = document.querySelectorAll('.student-marker');
  console.log('🗺️ Marcadores no mapa:', markers.length);
}, 2000);
```

**Resultado esperado:**
```
📋 Rotas cadastradas: 1
📊 Primeira rota: Rota da manhã
👥 Estudantes na rota: 2
  - ARTHUR DA SILVA ROCHA
  - MIKAELLA DA SILVA ROCHA
🗺️ Marcadores no mapa: 1 (agrupados no mesmo endereço)
```

### Passo 3: Remover Aluno da Rota

**Na Aba do Motorista:**

1. Vá para a rota
2. Clique no **X vermelho** ao lado de MIKAELLA
3. Clique em **"Salvar Mudanças"**
4. **OBSERVE O CONSOLE** - Deve aparecer:
   ```
   Mudanças salvas na rota: {id: '...', students: Array(1)}
   📢 Disparando evento de atualização de estudantes da rota
   📊 Estudantes na rota: 1
   ```

### Passo 4: Verificar se Evento Foi Disparado

**Na Aba do Motorista (Console):**

```javascript
// Cole este código IMEDIATAMENTE após clicar em "Salvar Mudanças":
console.log('✅ Evento disparado com sucesso!');
console.log('Aguardando atualização no mapa do responsável...');
```

### Passo 5: Verificar Atualização no Mapa

**Na Aba do Responsável:**

**AGUARDE 2-3 SEGUNDOS** e então cole este código no console:

```javascript
// Verificar se evento foi recebido
console.log('🔍 Verificando atualização...');

// Verificar localStorage
const routes = JSON.parse(localStorage.getItem('routes') || '[]');
console.log('👥 Estudantes na rota (localStorage):', routes[0].students.length);
routes[0].students.forEach(s => console.log('  -', s.name));

// Verificar marcadores no DOM
setTimeout(() => {
  const markers = document.querySelectorAll('.student-marker');
  const badges = document.querySelectorAll('.student-count-badge');
  
  console.log('🗺️ Marcadores no mapa:', markers.length);
  console.log('🔢 Badges:', badges.length);
  
  badges.forEach(badge => {
    console.log('  Badge mostra:', badge.textContent);
  });
  
  if (routes[0].students.length === 1 && badges.length === 0) {
    console.log('✅ SUCESSO! Mapa atualizado corretamente!');
    console.log('✅ Badge removido (apenas 1 aluno, não precisa badge)');
  } else if (routes[0].students.length === 1 && markers.length === 1) {
    console.log('✅ SUCESSO! Mapa atualizado corretamente!');
  } else {
    console.log('❌ FALHA! Mapa não atualizou');
    console.log('Esperado: 1 estudante');
    console.log('Encontrado:', markers.length, 'marcadores');
  }
}, 2000);
```

### Passo 6: Forçar Atualização (Se Necessário)

**Se o mapa NÃO atualizou, cole este código na Aba do Responsável:**

```javascript
console.log('🔄 Forçando atualização manual...');

// Disparar evento manualmente
const routes = JSON.parse(localStorage.getItem('routes') || '[]');
window.dispatchEvent(new CustomEvent('studentsDataUpdated', { 
  detail: { 
    students: routes[0].students,
    routeId: routes[0].id
  } 
}));

console.log('📢 Evento disparado manualmente');
console.log('Aguarde 2 segundos...');

setTimeout(() => {
  const markers = document.querySelectorAll('.student-marker');
  console.log('🗺️ Marcadores após forçar:', markers.length);
  
  if (markers.length === 1) {
    console.log('✅ Atualização manual funcionou!');
  } else {
    console.log('❌ Ainda não funcionou. Recarregue a página (F5)');
  }
}, 2000);
```

## 🔍 Diagnóstico de Problemas

### Problema 1: Console do Motorista não mostra "📢 Disparando evento"

**Causa:** O código não está sendo executado

**Solução:**
1. Verifique se você clicou em "Salvar Mudanças"
2. Recarregue a página do motorista (F5)
3. Tente novamente

### Problema 2: Console do Responsável não mostra "🔄 Evento recebido"

**Causa:** O listener não está ativo

**Solução:**

```javascript
// Na aba do responsável, cole:
console.log('🔧 Registrando listener manualmente...');

window.addEventListener('studentsDataUpdated', (event) => {
  console.log('🔄 Evento studentsDataUpdated recebido!');
  console.log('📊 Dados:', event.detail);
  
  // Forçar reload da página
  setTimeout(() => {
    console.log('🔄 Recarregando dados...');
    location.reload();
  }, 1000);
});

console.log('✅ Listener registrado! Tente salvar mudanças novamente.');
```

### Problema 3: Evento é recebido mas mapa não atualiza

**Causa:** O useGuardianData não está atualizando os dados

**Solução:**

```javascript
// Na aba do responsável, cole:
console.log('🔄 Recarregando página para forçar atualização...');
location.reload();
```

### Problema 4: Marcadores ainda mostram 2 estudantes

**Causa:** Cache antigo ou dados não sincronizados

**Solução:**

```javascript
// Limpar tudo e recomeçar
console.log('🧹 Limpando cache...');
localStorage.removeItem('geocodingCache');
sessionStorage.clear();

console.log('🔄 Recarregando...');
location.reload();
```

## 📊 Checklist de Verificação

Marque cada item conforme testa:

- [ ] Abri 2 abas (motorista e responsável)
- [ ] Abri console (F12) em ambas
- [ ] Verifiquei estado inicial (2 estudantes)
- [ ] Removi 1 estudante no app do motorista
- [ ] Cliquei em "Salvar Mudanças"
- [ ] Vi log "📢 Disparando evento" no console do motorista
- [ ] Vi log "📊 Estudantes na rota: 1" no console do motorista
- [ ] Aguardei 2-3 segundos
- [ ] Verifiquei console do responsável
- [ ] Vi log "🔄 Evento recebido" no console do responsável
- [ ] Verifiquei marcadores no mapa (deve ser 1)
- [ ] Badge removido ou mostra "1"

## 🎯 Resultado Esperado

### Antes de Remover:
```
Rota: 2 estudantes (ARTHUR + MIKAELLA)
Mapa: 1 marcador com badge "2"
```

### Depois de Remover e Salvar:
```
Rota: 1 estudante (ARTHUR)
Mapa: 1 marcador SEM badge (ou badge "1")
```

## 🆘 Se Nada Funcionar

### Opção 1: Teste Direto no Código

**Na Aba do Motorista, após salvar mudanças, cole:**

```javascript
// Simular o que deveria acontecer
const routes = JSON.parse(localStorage.getItem('routes') || '[]');
const route = routes[0];

console.log('🧪 TESTE DIRETO');
console.log('Estudantes na rota:', route.students.length);

// Disparar evento manualmente
window.dispatchEvent(new CustomEvent('studentsDataUpdated', { 
  detail: { 
    students: route.students,
    routeId: route.id
  } 
}));

console.log('✅ Evento disparado manualmente');
console.log('Vá para a aba do responsável e aguarde 2 segundos');
```

### Opção 2: Recarregar Ambas as Abas

1. **Aba do Motorista:** F5
2. **Aba do Responsável:** F5
3. Tente novamente do Passo 1

### Opção 3: Verificar se Código Foi Aplicado

**Na Aba do Motorista (Console):**

```javascript
// Verificar se o código está correto
const code = `
  window.dispatchEvent(new CustomEvent('studentsDataUpdated', { 
    detail: { 
      students: updatedRoute.students,
      routeId: updatedRoute.id
    } 
  }));
`;

console.log('Código esperado:', code);
console.log('Se você não vê este código sendo executado, o autofix pode ter removido');
```

## 📞 Reporte o Resultado

Após seguir todos os passos, me informe:

1. **Qual passo falhou?** (1, 2, 3, 4, 5 ou 6)
2. **Quais logs você viu?** (copie e cole)
3. **O mapa atualizou?** (sim/não)
4. **Quantos marcadores aparecem?** (número)
5. **Algum erro no console?** (copie e cole)

Com essas informações, posso identificar exatamente o problema! 🎯
