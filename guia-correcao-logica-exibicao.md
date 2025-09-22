# Guia: Como Corrigir Lógica de Exibição em Componentes React

## Visão Geral

Este guia apresenta uma metodologia sistemática para identificar e corrigir problemas de lógica de exibição em componentes React, baseado na experiência da correção realizada no componente `ActiveTrip`.

## Metodologia de Diagnóstico

### 1. Identificação do Problema

**Sintomas Comuns:**
- Interface exibe informações incorretas
- Condicionais não refletem o estado real dos dados
- Ícones ou textos aparecem em contextos inadequados

**Exemplo Identificado:**
```
Problema: Sistema exibia "Escola" quando deveria mostrar "Casa"
Causa: Lógica baseada em status em vez da direção real
```

### 2. Análise da Causa Raiz

**Passos para Investigação:**

1. **Examine as condicionais de renderização**
   ```typescript
   // ❌ Lógica incorreta baseada em estado derivado
   {studentsAtSchool.length > 0 ? (
     // Renderização A
   ) : (
     // Renderização B
   )}
   ```

2. **Identifique a fonte de dados correta**
   ```typescript
   // ✅ Lógica correta baseada na fonte primária
   {group.students[0]?.tripData.direction === 'to_school' ? (
     // Renderização A
   ) : (
     // Renderização B
   )}
   ```

3. **Mapeie o fluxo de dados**
   - Trace de onde vem a informação
   - Identifique transformações intermediárias
   - Verifique se há estados derivados desnecessários

## Processo de Correção

### Etapa 1: Backup e Documentação

```bash
# Criar backup do arquivo
cp src/components/ComponenteProblematico.tsx src/components/ComponenteProblematico.backup.tsx

# Documentar o problema
echo "# Problema identificado em $(date)" > correcao-$(date +%Y%m%d).md
```

### Etapa 2: Análise do Código

**Checklist de Verificação:**
- [ ] Identificar todas as condicionais de renderização
- [ ] Mapear origem dos dados utilizados nas condições
- [ ] Verificar se há lógica duplicada ou conflitante
- [ ] Analisar se as condições refletem o comportamento esperado

### Etapa 3: Implementação da Correção

**Padrão de Correção:**

```typescript
// ANTES: Lógica baseada em estado derivado
const isConditionMet = derivedState.someProperty > 0;

{isConditionMet ? (
  <ComponenteA />
) : (
  <ComponenteB />
)}

// DEPOIS: Lógica baseada na fonte primária
const primaryCondition = primaryData.actualProperty === 'expected_value';

{primaryCondition ? (
  <ComponenteA />
) : (
  <ComponenteB />
)}
```

### Etapa 4: Validação

**Testes Essenciais:**
1. **Teste de Cenários Extremos**
   - Dados vazios
   - Estados de transição
   - Múltiplas condições simultâneas

2. **Teste de Regressão**
   - Verificar se funcionalidades existentes continuam funcionando
   - Validar todos os fluxos de navegação

3. **Teste de Interface**
   - Verificar se a UI reflete corretamente os dados
   - Testar responsividade e acessibilidade

## Boas Práticas

### 1. Princípios de Design

**Single Source of Truth:**
```typescript
// ✅ Bom: Uma única fonte de verdade
const displayMode = trip.direction === 'to_school' ? 'school' : 'home';

// ❌ Ruim: Múltiplas fontes conflitantes
const isSchoolMode = studentsAtSchool.length > 0;
const isHomeMode = !isSchoolMode;
```

**Separação de Responsabilidades:**
```typescript
// ✅ Bom: Lógica separada da apresentação
const getDisplayConfig = (direction: string) => {
  return direction === 'to_school' 
    ? { icon: School, color: 'blue', text: schoolName }
    : { icon: Home, color: 'green', text: 'Casa' };
};

const config = getDisplayConfig(trip.direction);
```

### 2. Estrutura de Código

**Organização Recomendada:**
```typescript
const Component = () => {
  // 1. Estados e dados
  const { trip, students } = useData();
  
  // 2. Lógica de negócio
  const displayConfig = useMemo(() => 
    getDisplayConfiguration(trip.direction), [trip.direction]
  );
  
  // 3. Handlers de eventos
  const handleAction = useCallback(() => {
    // lógica do handler
  }, [dependencies]);
  
  // 4. Renderização
  return (
    <div>
      {/* JSX baseado em displayConfig */}
    </div>
  );
};
```

### 3. Debugging e Monitoramento

**Logs Estratégicos:**
```typescript
// Durante desenvolvimento
console.log('🔍 Debug - Direction:', trip.direction);
console.log('🔍 Debug - Students:', students.length);
console.log('🔍 Debug - Display Config:', displayConfig);

// Para produção (usar biblioteca de logging)
logger.debug('Display logic', { 
  direction: trip.direction, 
  studentsCount: students.length 
});
```

## Checklist de Qualidade

### Antes de Fazer Commit

- [ ] **Funcionalidade**: Todos os cenários testados funcionam corretamente
- [ ] **Performance**: Não há re-renderizações desnecessárias
- [ ] **Acessibilidade**: Elementos têm labels e roles apropriados
- [ ] **Responsividade**: Interface funciona em diferentes tamanhos de tela
- [ ] **Documentação**: Código está comentado e documentado
- [ ] **Testes**: Testes unitários e de integração passam

### Após Deploy

- [ ] **Monitoramento**: Verificar logs de erro em produção
- [ ] **Feedback**: Coletar feedback dos usuários
- [ ] **Métricas**: Acompanhar métricas de performance
- [ ] **Rollback Plan**: Ter plano de rollback preparado

## Exemplo Prático: Correção ActiveTrip

### Problema Original
```typescript
// ❌ Lógica incorreta
{studentsAtSchool.length > 0 ? (
  <SchoolDisplay school={group.school} />
) : (
  <SchoolDisplay school={group.school} />
)}
```

### Solução Implementada
```typescript
// ✅ Lógica correta
{group.students[0]?.tripData.direction === 'to_school' ? (
  <SchoolDisplay 
    icon={School} 
    color="blue" 
    title={group.school.name} 
  />
) : (
  <HomeDisplay 
    icon={Home} 
    color="green" 
    title="Casa" 
  />
)}
```

### Resultado
- ✅ Interface reflete corretamente a direção da viagem
- ✅ Ícones e cores apropriados para cada contexto
- ✅ Texto descritivo correto ("Casa" vs nome da escola)
- ✅ Lógica baseada na fonte primária de dados

## Conclusão

A correção de lógica de exibição requer uma abordagem sistemática que priorize:
1. **Identificação precisa** da causa raiz
2. **Uso da fonte primária** de dados
3. **Separação clara** entre lógica e apresentação
4. **Testes abrangentes** de todos os cenários
5. **Documentação adequada** das mudanças

Seguindo esta metodologia, é possível resolver problemas de interface de forma eficiente e sustentável, evitando regressões futuras.

---

**Autor:** Equipe de Desenvolvimento  
**Data:** $(Get-Date -Format "dd/MM/yyyy")  
**Versão:** 1.0  
**Status:** ✅ Aprovado para uso