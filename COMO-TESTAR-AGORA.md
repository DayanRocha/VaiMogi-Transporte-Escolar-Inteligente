# 🚀 Como Testar AGORA - Guia Rápido

## 📋 Pré-requisitos

- ✅ 2 abas abertas (Motorista + Responsável)
- ✅ Console aberto (F12) em ambas
- ✅ Rota com pelo menos 2 alunos

## 🧪 Teste em 3 Passos

### 1️⃣ Preparar Listener (Aba do Responsável)

**Abra o console (F12) e cole:**

```javascript
window.addEventListener('studentsDataUpdated', (e) => {
  console.log('✅ EVENTO RECEBIDO!', e.detail.students.length, 'estudantes');
  setTimeout(() => location.reload(), 1000);
});
console.log('✅ Listener ativo! Vá para aba do motorista.');
```

### 2️⃣ Remover Aluno (Aba do Motorista)

1. Vá para a rota
2. Clique no **X** para remover um aluno
3. Clique em **"Salvar Mudanças"**
4. **Veja o console** - deve mostrar:
   ```
   📢 Disparando evento de atualização de estudantes da rota
   📊 Estudantes na rota: 1
   ```

### 3️⃣ Verificar Resultado (Aba do Responsável)

- A página deve **recarregar automaticamente**
- Veja o mapa: deve mostrar apenas 1 aluno

## ❌ Se Não Funcionar

### Opção A: Disparar Evento Manualmente

**Na aba do MOTORISTA, cole:**

```javascript
const routes = JSON.parse(localStorage.getItem('routes') || '[]');
window.dispatchEvent(new CustomEvent('studentsDataUpdated', { 
  detail: { students: routes[0].students, routeId: routes[0].id } 
}));
console.log('✅ Evento disparado!');
```

### Opção B: Recarregar Tudo

1. **Aba do Motorista:** F5
2. **Aba do Responsável:** F5
3. Tente novamente

## 🎯 Resultado Esperado

### Antes:
- Rota: 2 alunos
- Mapa: Badge "2"

### Depois:
- Rota: 1 aluno
- Mapa: Sem badge (ou badge "1")

## 📞 Me Diga

Após testar, me informe:

1. **Viu "📢 Disparando evento" no console do motorista?** (sim/não)
2. **Viu "✅ EVENTO RECEBIDO" no console do responsável?** (sim/não)
3. **O mapa atualizou?** (sim/não)
4. **Quantos marcadores aparecem?** (número)

Com essas 4 respostas, posso te ajudar! 🎯
