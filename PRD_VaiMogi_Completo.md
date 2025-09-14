# PRD - VaiMogi: Sistema de Transporte Escolar

## 📋 Visão Geral do Produto

### Descrição
O **VaiMogi** é um sistema completo de gerenciamento de transporte escolar que conecta motoristas e responsáveis através de uma plataforma web moderna e intuitiva. O sistema oferece rastreamento em tempo real, notificações automáticas e gestão completa de rotas, estudantes e responsáveis.

### Objetivo Principal
Facilitar e modernizar o transporte escolar através de tecnologia, proporcionando:
- **Segurança** para os responsáveis através do acompanhamento em tempo real
- **Eficiência** para os motoristas na gestão de rotas e estudantes
- **Transparência** na comunicação entre todas as partes envolvidas

### Público-Alvo
- **Motoristas de transporte escolar** (usuários principais)
- **Responsáveis por estudantes** (usuários secundários)
- **Estudantes** (beneficiários indiretos)

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico
- **Frontend**: React 18.3.1 com TypeScript
- **Roteamento**: React Router DOM 7.0.0
- **UI Framework**: Tailwind CSS + Shadcn/ui
- **Mapas**: Mapbox GL + Leaflet
- **Gerenciamento de Estado**: React Hooks + LocalStorage
- **Build Tool**: Vite 5.4.1
- **Notificações**: Web Notifications API + BroadcastChannel API
- **Sistema de Áudio**: Web Audio API + HTML5 Audio
- **Rastreamento GPS**: Geolocation API + Vehicle Tracking Service
- **Tempo Real**: Real-time Data Service + Polling System
- **Debug e Logs**: Sistema de logging extensivo para troubleshooting

### Estrutura do Projeto
```
src/
├── components/          # Componentes React reutilizáveis
├── pages/              # Páginas principais da aplicação
├── hooks/              # Hooks customizados
│   ├── useDriverData.ts        # Gerenciamento completo de dados do motorista
│   ├── useGuardianData.ts      # Dados e notificações do responsável
│   ├── useRouteTracking.ts     # Rastreamento de rotas ativas
│   ├── useRealtimeData.ts      # Dados em tempo real
│   ├── useVehicleTracking.ts   # Rastreamento de veículo
│   └── useNotificationIntegration.ts # Integração de notificações
├── services/           # Serviços e APIs
│   ├── audioService.ts         # Sistema de áudio avançado
│   ├── notificationService.ts  # Gerenciamento de notificações
│   ├── realTimeNotificationService.ts # Notificações em tempo real
│   ├── routeTrackingService.ts # Rastreamento de rotas
│   ├── realtimeDataService.ts  # Captura de dados em tempo real
│   ├── vehicleTrackingService.ts # Rastreamento de veículo
│   └── routeHistoryService.ts  # Histórico de rotas
├── types/              # Definições TypeScript
├── lib/                # Utilitários e configurações
└── docs/               # Documentação técnica
```

---

## 👥 Personas e Casos de Uso

### Persona 1: Motorista de Transporte Escolar
**Nome**: João Silva  
**Idade**: 45 anos  
**Experiência**: 10 anos no transporte escolar  
**Necessidades**:
- Gerenciar lista de estudantes e rotas
- Comunicar-se com responsáveis
- Registrar embarques e desembarques
- Acompanhar histórico de viagens

### Persona 2: Responsável/Pai de Família
**Nome**: Maria Santos  
**Idade**: 38 anos  
**Perfil**: Mãe trabalhadora  
**Necessidades**:
- Acompanhar localização do transporte em tempo real
- Receber notificações sobre status do filho
- Ter acesso fácil via código único
- Visualizar histórico de viagens

---

## 🚀 Funcionalidades Principais

### 1. Aplicativo do Motorista

#### 1.1 Autenticação e Perfil
- **Login/Registro**: Email/senha ou Google OAuth
- **Perfil do Motorista**: Gerenciamento de dados pessoais
- **Dados do Veículo**: Cadastro de van (modelo, placa, capacidade)
- **Foto de Perfil**: Upload e edição de imagem

#### 1.2 Gerenciamento de Estudantes
- **Cadastro de Estudantes**: Nome, endereço, escola, responsável
- **Lista de Estudantes**: Visualização e edição
- **Configuração de Embarque/Desembarque**: Definir pontos específicos
- **Status dos Estudantes**: Aguardando, embarcado, na escola

#### 1.3 Gerenciamento de Responsáveis
- **Cadastro de Responsáveis**: Nome, email, telefone
- **Geração de Código Único**: Acesso facilitado para responsáveis
- **Controle de Status**: Ativar/desativar acesso
- **Vinculação com Estudantes**: Associação automática

#### 1.4 Gerenciamento de Escolas
- **Cadastro de Escolas**: Nome e endereço
- **Lista de Escolas**: Visualização e edição
- **Vinculação com Estudantes**: Associação por escola

#### 1.5 Criação e Execução de Rotas
- **Criação de Rotas**: Nome, horário, dias da semana
- **Montagem de Rota**: Sequenciamento de estudantes e escolas
- **Execução de Rota**: Interface para conduzir viagem
- **Rastreamento GPS**: Localização em tempo real
- **Registro de Eventos**: Embarques, desembarques, chegadas

#### 1.6 Histórico e Relatórios
- **Histórico de Viagens**: Registro completo de rotas executadas
- **Relatórios de Estudantes**: Frequência e pontualidade
- **Estatísticas**: Métricas de desempenho

### 2. Aplicativo do Responsável

#### 2.1 Acesso Simplificado
- **Login por Código**: Acesso via código único gerado pelo motorista
- **Sem Cadastro Complexo**: Processo simplificado

#### 2.2 Acompanhamento em Tempo Real
- **Mapa Interativo**: Visualização da localização do transporte
- **Status do Estudante**: Informações atualizadas em tempo real
- **Próximo Destino**: Indicação do próximo ponto da rota

#### 2.3 Sistema de Notificações
- **Notificações Push**: Alertas automáticos sobre eventos
- **Tipos de Notificação**:
  - Rota iniciada
  - Van chegando ao ponto
  - Estudante embarcou
  - Chegada na escola
  - Estudante desembarcou
  - Rota finalizada

#### 2.4 Painel de Notificações
- **Histórico Completo**: Todas as notificações recebidas
- **Filtros e Busca**: Organização por data e tipo
- **Gerenciamento**: Marcar como lida, excluir

---

## 🔧 Funcionalidades Técnicas

### 1. Sistema de Notificações em Tempo Real

#### Arquitetura Multi-Canal
- **BroadcastChannel API**: Comunicação entre abas/janelas
- **Storage Events**: Sincronização via localStorage
- **Polling**: Verificação periódica como fallback
- **Web Notifications**: Notificações nativas do browser

#### Tipos de Notificação
```typescript
type NotificationSoundType = 
  | 'route_started' 
  | 'van_arrived' 
  | 'embarked' 
  | 'at_school' 
  | 'disembarked' 
  | 'route_finished'
  | 'default';
```

#### Recursos Avançados
- **Som Personalizado**: Sistema de buzina personalizada (`buzina-van.mp3`)
- **Fallback Inteligente**: Tom sintético (800Hz, 0.3s) quando arquivo não disponível
- **Gerenciamento de Permissões**: Detecção automática e solicitação de permissões de áudio
- **Debug Extensivo**: Logs detalhados para troubleshooting de problemas de áudio
- **Múltiplas Instâncias**: Permite sobreposição de sons para notificações simultâneas
- **Configurações Persistentes**: Preferências de áudio salvas no localStorage
- **Vibração**: Feedback tátil em dispositivos móveis
- **Persistência**: Armazenamento local das notificações
- **Indicador de Conectividade**: Status da conexão em tempo real

### 2. Sistema de Rastreamento de Rotas

#### Geolocalização
- **GPS Nativo**: Utilização da Geolocation API
- **Precisão Adaptativa**: Ajuste baseado na disponibilidade
- **Fallback**: Localização padrão quando GPS indisponível

#### Persistência de Dados
- **LocalStorage**: Armazenamento local para offline
- **Limpeza Automática**: Remoção de dados antigos
- **Sincronização**: Atualização entre sessões

#### Mapas Interativos
- **Mapbox Integration**: Mapas de alta qualidade
- **Leaflet Fallback**: Alternativa para compatibilidade
- **Marcadores Dinâmicos**: Indicação de motorista e destinos
- **Rotas Visuais**: Traçado do percurso planejado

### 3. Gerenciamento de Estado

#### Hooks Customizados
- **useDriverData**: Gerenciamento completo de dados do motorista
  - Controle de viagens ativas e histórico
  - Sistema de notificações para responsáveis
  - Integração com rastreamento de rotas
  - Gerenciamento de estudantes e status de embarque/desembarque
- **useGuardianData**: Gerenciamento de dados do responsável
  - Sincronização automática via localStorage events
  - Integração com sistema de notificações em tempo real
  - Carregamento de notificações armazenadas
- **useRouteTracking**: Rastreamento de rotas ativas
  - Recuperação automática de rotas após recarregamento
  - Verificação múltipla para garantir inicialização
  - Integração com serviços de rastreamento
- **useRealtimeData**: Captura de dados em tempo real
  - Integração com rastreamento de veículo
  - Gerenciamento de estado de captura
  - Tratamento de erros e loading states
- **useVehicleTracking**: Rastreamento específico de veículo
- **useNotificationIntegration**: Integração completa de notificações

#### Persistência
- **LocalStorage**: Armazenamento principal
- **Session Management**: Controle de sessões
- **Data Validation**: Validação de integridade

### 4. Sistema de Áudio Avançado

#### AudioService
- **Arquivo Principal**: `audioService.ts` com sistema de logs detalhados
- **Buzina Personalizada**: Utiliza arquivo `buzina-van.mp3` para todas as notificações
- **Fallback Inteligente**: Tom sintético quando arquivo não disponível
- **Gerenciamento de Permissões**: Detecção e solicitação automática
- **Debug Extensivo**: Logs detalhados para troubleshooting
- **Múltiplas Instâncias**: Permite sobreposição de sons
- **Configurações Persistentes**: Preferências salvas no localStorage

#### Funcionalidades Técnicas
```typescript
// Tipos de som suportados
type NotificationSoundType = 
  | 'route_started' | 'van_arrived' | 'embarked' 
  | 'at_school' | 'disembarked' | 'route_finished' | 'default';

// Métodos principais
- playNotificationSound(type): Reprodução com logs detalhados
- testSound(): Teste de buzina para configurações
- requestAudioPermission(): Solicitação de permissões
- hasAudioFile(type): Verificação de disponibilidade
```

### 5. Sistema de Rastreamento GPS Aprimorado

#### VehicleTrackingService
- **Rastreamento Avançado**: Configurações de alta precisão
- **Opções Configuráveis**: enableHighAccuracy, timeout, maximumAge
- **Integração com RealtimeDataService**: Captura contínua de dados
- **Tratamento de Erros**: Gerenciamento robusto de falhas de GPS

#### RouteTrackingService
- **Gerenciamento de Rotas Ativas**: Controle completo do ciclo de vida
- **Persistência de Localização**: Armazenamento de pontos GPS
- **Integração com Histórico**: Salvamento automático via routeHistoryService
- **Recuperação Automática**: Restauração de rotas após interrupções

### 6. Melhorias de Resiliência e Debug

#### Sistema de Logs
- **Logs Detalhados**: Em todos os componentes críticos para debugging
- **Categorização**: Diferentes níveis e tipos de log (🔊, 🚗, 📱, etc.)
- **Rastreamento de Fluxo**: Acompanhamento completo de operações

#### Recuperação Automática
- **Restauração de Rotas**: Após recarregamento ou perda de conexão
- **Verificação Múltipla**: Sistema de retry para garantir inicialização
- **Limpeza Inteligente**: Remoção segura de dados antigos
- **Prevenção de Duplicatas**: Sistema robusto usando IDs únicos

---

## 📊 Estrutura de Dados

### Entidades Principais

#### Driver (Motorista)
```typescript
interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  photo?: string;
}
```

#### Van (Veículo)
```typescript
interface Van {
  id: string;
  driverId: string;
  model: string;
  plate: string;
  capacity: number;
  observations?: string;
  photo?: string;
}
```

#### Student (Estudante)
```typescript
interface Student {
  id: string;
  name: string;
  address: string;
  guardianId: string;
  guardianPhone: string;
  guardianEmail: string;
  pickupPoint: string;
  schoolId: string;
  status: 'waiting' | 'embarked' | 'at_school';
  dropoffLocation?: 'home' | 'school';
}
```

#### Guardian (Responsável)
```typescript
interface Guardian {
  id: string;
  name: string;
  email: string;
  phone?: string;
  uniqueCode?: string;
  codeGeneratedAt?: string;
  isActive?: boolean;
}
```

#### Route (Rota)
```typescript
interface Route {
  id: string;
  driverId: string;
  name: string;
  startTime: string;
  weekDays: string[];
  students: Student[];
  studentConfigs?: RouteStudentConfig[];
}
```

#### Trip (Viagem)
```typescript
interface Trip {
  id: string;
  routeId: string;
  date: string;
  status: 'planned' | 'in_progress' | 'completed';
  students: TripStudent[];
  startTime?: string;
  endTime?: string;
  direction: 'to_school' | 'to_home';
}
```

#### Estruturas de Dados Avançadas

##### VehiclePosition
```typescript
interface VehiclePosition {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}
```

##### RouteLocation
```typescript
interface RouteLocation {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
}
```

##### ActiveRoute
```typescript
interface ActiveRoute {
  id: string;
  driverId: string;
  driverName: string;
  direction: 'to_school' | 'to_home';
  startTime: string;
  endTime?: string;
  locations: RouteLocation[];
  students: string[];
}
```

##### RealtimeRouteData
```typescript
interface RealtimeRouteData {
  routeId: string;
  vehiclePosition: VehiclePosition;
  activeStudents: string[];
  nextDestination?: string;
  estimatedArrival?: string;
}
```

---

## 🔐 Autenticação e Autorização

### Fluxo de Autenticação do Motorista
1. **Registro/Login**: Email/senha ou Google OAuth
2. **Validação**: Verificação de credenciais
3. **Sessão**: Armazenamento local da sessão
4. **Boas-vindas**: Tela de primeiro acesso
5. **Redirecionamento**: Acesso ao dashboard principal

### Fluxo de Autenticação do Responsável
1. **Código Único**: Inserção do código gerado pelo motorista
2. **Validação**: Verificação no banco de dados local
3. **Status**: Verificação se o responsável está ativo
4. **Acesso**: Redirecionamento para o app do responsável

### Segurança
- **Códigos Únicos**: Geração automática para responsáveis
- **Controle de Acesso**: Sistema de ativação/desativação
- **Validação de Sessão**: Verificação contínua de autenticidade
- **Logout Seguro**: Limpeza completa de dados da sessão

---

## 🎨 Interface e Experiência do Usuário

### Design System
- **Cores Principais**: Laranja (#F59E0B) e Azul (#3B82F6)
- **Tipografia**: Sistema de fontes nativo
- **Componentes**: Shadcn/ui para consistência
- **Responsividade**: Design mobile-first

### Navegação
- **Bottom Navigation**: Navegação principal no mobile
- **Breadcrumbs**: Navegação hierárquica
- **Modais**: Ações secundárias e formulários
- **Tabs**: Organização de conteúdo relacionado

### Feedback Visual
- **Loading States**: Indicadores de carregamento
- **Success/Error Messages**: Feedback de ações
- **Real-time Indicators**: Status de conectividade
- **Progress Indicators**: Progresso de tarefas

---

## 📱 Recursos Mobile

### PWA (Progressive Web App)
- **Instalação**: Possibilidade de instalar como app nativo
- **Offline**: Funcionalidades básicas sem internet
- **Push Notifications**: Notificações mesmo com app fechado
- **Responsive**: Adaptação automática a diferentes telas

### Recursos Nativos
- **Geolocalização**: GPS para rastreamento
- **Câmera**: Upload de fotos de perfil
- **Vibração**: Feedback tátil para notificações
- **Audio**: Sons personalizados para eventos

---

## 🔄 Fluxos de Trabalho

### Fluxo 1: Cadastro Inicial do Motorista
1. Registro/Login na plataforma
2. Preenchimento do perfil pessoal
3. Cadastro do veículo (van)
4. Cadastro de escolas atendidas
5. Cadastro de estudantes
6. Cadastro de responsáveis
7. Criação da primeira rota

### Fluxo 2: Execução de Rota
1. Seleção da rota a ser executada
2. Início da viagem (ativação do GPS)
3. Navegação pelos pontos da rota
4. Registro de embarques/desembarques
5. Notificações automáticas para responsáveis
6. Finalização da rota
7. Salvamento no histórico

### Fluxo 3: Acompanhamento pelo Responsável
1. Acesso via código único
2. Visualização do mapa em tempo real
3. Recebimento de notificações
4. Consulta ao histórico
5. Visualização de detalhes da viagem

---

## 📈 Métricas e Analytics

### Métricas do Motorista
- **Rotas Executadas**: Quantidade total de viagens
- **Estudantes Atendidos**: Número de estudantes cadastrados
- **Pontualidade**: Cumprimento de horários
- **Distância Percorrida**: Quilometragem total

### Métricas do Sistema
- **Notificações Enviadas**: Volume de comunicações
- **Tempo de Resposta**: Performance do sistema
- **Taxa de Uso**: Engajamento dos usuários
- **Precisão GPS**: Qualidade do rastreamento

---

## 🛠️ Configurações e Personalização

### Configurações do Motorista
- **Perfil Pessoal**: Edição de dados
- **Configurações de Notificação**: Preferências de som
- **Configurações de Rota**: Padrões de embarque/desembarque
- **Backup de Dados**: Exportação/importação

### Configurações do Sistema
- **Tema**: Modo claro/escuro (futuro)
- **Idioma**: Localização (futuro)
- **Precisão GPS**: Configurações de localização
- **Cache**: Gerenciamento de armazenamento local

---

## 🔧 Arquitetura de Serviços Detalhada

### NotificationService
- **Gerenciamento Centralizado**: Controle de todas as notificações do sistema
- **Integração com AudioService**: Reprodução automática de sons
- **Persistência**: Armazenamento local de notificações
- **Métodos Específicos**: `notifyRouteStarted`, `notifyVanArrived`, etc.
- **Prevenção de Duplicatas**: Sistema robusto de controle

### RealTimeNotificationService
- **Notificações em Tempo Real**: Sistema de comunicação instantânea
- **BroadcastChannel**: Comunicação entre abas/janelas
- **Storage Events**: Sincronização via localStorage
- **Tipos Avançados**: route_delayed, arriving_soon, route_completed

### RealtimeDataService
- **Captura Contínua**: Dados de localização e status em tempo real
- **Integração Multi-Serviço**: Coordenação entre diferentes serviços
- **Gerenciamento de Estado**: Controle de captura ativa/inativa
- **Tratamento de Erros**: Sistema robusto de recuperação

### RouteHistoryService
- **Persistência de Histórico**: Armazenamento completo de rotas executadas
- **Métricas Detalhadas**: Tempo, distância, estudantes atendidos
- **Relatórios**: Geração de dados para análise

## 🔄 Fluxos de Dados Detalhados

### Fluxo de Execução de Rota
1. **Inicialização**: `useDriverData.startTrip()` → `routeTrackingService.startRoute()`
2. **Rastreamento**: `vehicleTrackingService` → `realtimeDataService` → `useRealtimeData`
3. **Notificações**: `notificationService` → `audioService` → `realTimeNotificationService`
4. **Finalização**: `routeTrackingService.endRoute()` → `routeHistoryService.saveRoute()`

### Fluxo de Notificações
1. **Evento**: Embarque/desembarque de estudante
2. **Processamento**: `useDriverData` identifica responsáveis
3. **Envio**: `notificationService.sendNotification()`
4. **Áudio**: `audioService.playNotificationSound()`
5. **Tempo Real**: `realTimeNotificationService.broadcast()`
6. **Recepção**: `useGuardianData` recebe via storage events

### Fluxo de Recuperação Automática
1. **Detecção**: `useRouteTracking` verifica localStorage
2. **Validação**: Verificação de integridade dos dados
3. **Restauração**: Reconstrução do estado da aplicação
4. **Sincronização**: Atualização de todos os hooks dependentes

## 🛠️ Configurações de Desenvolvimento e Produção

### Configurações de Debug
- **Logs Extensivos**: Sistema de logging categorizado
- **Console Groups**: Organização visual de logs
- **Performance Monitoring**: Rastreamento de operações críticas
- **Error Boundaries**: Captura e tratamento de erros

### Configurações de Áudio
- **Volume Padrão**: 0.8 para notificações
- **Playback Rate**: 1.0 para reprodução normal
- **Fallback Frequency**: 800Hz para tom sintético
- **Fallback Duration**: 0.3s para tom de backup

### Configurações de GPS
- **High Accuracy**: Habilitado por padrão
- **Timeout**: Configurável por serviço
- **Maximum Age**: Controle de cache de localização
- **Fallback Location**: Coordenadas padrão quando GPS indisponível

---

## 🔮 Roadmap e Funcionalidades Futuras

### Versão 2.0
- **Backend Real**: Migração do localStorage para API
- **Sincronização Multi-dispositivo**: Dados em nuvem
- **Chat Integrado**: Comunicação direta motorista-responsável
- **Pagamentos**: Sistema de cobrança integrado

### Versão 3.0
- **IA e Machine Learning**: Otimização automática de rotas
- **Integração com Escolas**: API para sistemas escolares
- **Relatórios Avançados**: Analytics detalhados
- **App Nativo**: Versões iOS e Android

---

## 🚨 Considerações de Segurança

### Proteção de Dados
- **LGPD Compliance**: Conformidade com lei de proteção de dados
- **Criptografia**: Dados sensíveis protegidos
- **Acesso Controlado**: Permissões granulares
- **Auditoria**: Log de ações críticas

### Segurança Infantil
- **Verificação de Identidade**: Validação de motoristas
- **Rastreamento Seguro**: Localização apenas para responsáveis
- **Comunicação Controlada**: Canais seguros de comunicação
- **Backup de Emergência**: Contatos de emergência

---

## 📋 Requisitos Técnicos

### Requisitos Mínimos
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+
- **JavaScript**: ES2020 support
- **GPS**: Geolocation API support
- **Storage**: 50MB de espaço local

### Requisitos Recomendados
- **Conexão**: 4G ou Wi-Fi estável
- **RAM**: 2GB mínimo
- **Processador**: Dual-core 1.5GHz
- **Tela**: 5" mínimo para mobile

---

## 🎯 Conclusão

O **VaiMogi** representa uma solução completa e moderna para o gerenciamento de transporte escolar, combinando tecnologia avançada com usabilidade intuitiva. O sistema atende às necessidades tanto de motoristas quanto de responsáveis, proporcionando segurança, eficiência e transparência no transporte de estudantes.

Com sua arquitetura robusta, interface amigável e recursos avançados de notificação e rastreamento, o VaiMogi está posicionado para revolucionar o setor de transporte escolar, trazendo mais tranquilidade para as famílias e mais eficiência para os profissionais do setor.

---

---

## 📋 Componentes Específicos e Responsabilidades

### Componentes de Interface
- **ActiveTripExecution**: Interface principal para execução de rotas
  - Integração com `useRouteTracking` e `useDriverData`
  - Controle de swipes para embarque/desembarque
  - Exibição de mapa em tempo real
  - Botões de ação para finalização de rota

### Hooks de Integração
- **useNotificationIntegration**: Orquestração de notificações
  - Coordenação entre diferentes serviços de notificação
  - Gerenciamento de estado de notificações
  - Integração com sistema de áudio

### Serviços de Backup
- **useDriverData_backup**: Versão de backup com funcionalidades alternativas
  - Sistema de fallback para operações críticas
  - Implementação alternativa de lógicas principais

## 🔍 Funcionalidades de Recuperação Automática

### Sistema de Retry
- **Inicialização de Rotas**: Múltiplas tentativas com delays
- **Carregamento de Áudio**: Retry automático em caso de falha
- **Sincronização de Dados**: Verificação periódica de consistência

### Prevenção de Perda de Dados
- **Auto-save**: Salvamento automático de progresso
- **Verificação de Integridade**: Validação contínua de dados
- **Backup Local**: Múltiplas camadas de persistência

### Tratamento de Desconexão
- **Modo Offline**: Funcionalidades básicas sem internet
- **Sincronização Posterior**: Envio de dados quando conexão restaurada
- **Cache Inteligente**: Armazenamento otimizado de dados críticos

---

**Documento gerado em**: Janeiro 2025  
**Versão**: 2.0  
**Status**: Análise Técnica Detalhada com Implementações Específicas