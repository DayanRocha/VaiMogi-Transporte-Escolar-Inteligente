# ✅ Verificação: Endereços das Escolas e Mapa

## Status Atual

### ✅ Estrutura de Dados Correta
- `Student.schoolId` → `School.id` (relacionamento funcionando)
- `Student` tem `latitude/longitude` para geocodificação
- `School` tem `latitude/longitude` para geocodificação

### ✅ Funcionalidades Implementadas

#### 1. Popups de Estudantes
- Mostram o nome da escola associada
- Código: `schools.find(school => school.id === student.schoolId)`
- Localização: `GuardianMapboxMap.tsx` linhas 682-691 e 751

#### 2. Popups de Escolas
- Contam quantos alunos estão associados
- Código: `students.filter(student => student.schoolId === school.id).length`
- Localização: `GuardianMapboxMap.tsx` linha 830

#### 3. Marcadores no Mapa
- **Escolas**: Ícone 🏫 laranja (50px)
- **Estudantes**: Ícone 👤 verde (36px)
- **Motorista**: Ícone 🚗 cinza (44px)

#### 4. Geocodificação Automática
- Hook: `useMapboxMap.ts`
- Geocodifica endereços de estudantes e escolas
- Valida coordenadas (região de São Paulo)
- Cache de endereços para evitar requisições duplicadas

## Como Verificar no Navegador

### 1. Abrir Console (F12)

### 2. Procurar por Logs

```
🏫 GuardianMapboxMap: Escolas recebidas: [...]
```

Deve mostrar:
- `temCoordenadas: true`
- `coordenadasValidas: true`
- `lat` e `lng` com valores válidos

### 3. Verificar Marcadores no Mapa

- Escolas devem aparecer com ícone 🏫 laranja
- Estudantes devem aparecer com ícone 👤 verde
- Motorista deve aparecer com ícone 🚗 cinza

### 4. Clicar nos Marcadores

**Popup de Estudante deve mostrar:**
- Nome do estudante
- Endereço
- Ponto de Coleta
- **Escola** (nome da escola associada)
- Responsável
- Status

**Popup de Escola deve mostrar:**
- Nome da escola
- Endereço
- **Quantidade de alunos** associados

## Troubleshooting

### Escolas não aparecem no mapa

1. **Verificar endereço**
   - Abra o console
   - Procure por: `🔍 Geocodificando endereço da escola`
   - Verifique se o endereço está correto

2. **Verificar coordenadas**
   - Procure por: `✅ Coordenadas VÁLIDAS obtidas`
   - Se aparecer `❌ Coordenadas INVÁLIDAS`, o endereço pode estar errado

3. **Verificar região**
   - Coordenadas devem estar em São Paulo:
   - Latitude: entre -25 e -20
   - Longitude: entre -54 e -44

### Estudante não mostra escola no popup

1. **Verificar schoolId**
   - Abra o console
   - Procure por: `🏫 GuardianMapboxMap: Escolas recebidas`
   - Verifique se o `id` da escola corresponde ao `schoolId` do estudante

2. **Verificar dados**
   ```javascript
   // No console do navegador
   const students = JSON.parse(localStorage.getItem('students') || '[]');
   const schools = JSON.parse(localStorage.getItem('schools') || '[]');
   console.log('Estudantes:', students);
   console.log('Escolas:', schools);
   ```

## Código Relevante

### Relacionamento Estudante-Escola

```typescript
// GuardianMapboxMap.tsx linha 682
const studentSchool = schools.find(school => school.id === student.schoolId);

// Popup do estudante linha 691
${studentSchool ? `<div><strong>Escola:</strong> ${studentSchool.name}</div>` : ''}
```

### Contagem de Alunos por Escola

```typescript
// GuardianMapboxMap.tsx linha 830
const studentsInSchool = students.filter(student => student.schoolId === school.id).length;

// Popup da escola linha 841
👨‍🎓 ${studentsInSchool} ${studentsInSchool === 1 ? 'Aluno' : 'Alunos'}
```

### Geocodificação

```typescript
// useMapboxMap.ts linha 137-210
// Geocodifica endereços de escolas
// Valida coordenadas
// Armazena em cache
```

## ✅ Conclusão

O sistema está funcionando corretamente:
- ✅ Relacionamento estudante-escola implementado
- ✅ Popups mostram informações corretas
- ✅ Marcadores aparecem no mapa
- ✅ Geocodificação automática funcionando
- ✅ Validação de coordenadas implementada

Se houver problemas, verifique:
1. Endereços cadastrados
2. Logs no console
3. Dados no localStorage
