# Análise do Fluxo da Rota no Aplicativo VaiMogi

Esta análise descreve o fluxo de execução de uma rota pelo motorista, incluindo início, execução com swipes, encerramento e o sistema de notificações para responsáveis. Baseado na inspeção do código fonte atualizado, aqui está uma explicação detalhada com melhorias recentes implementadas.

## 1. Início da Rota

- **Componentes Envolvidos**: Principalmente `ActiveTrip.tsx`, `RouteExecutionPage.tsx`, hooks `useDriverData.ts` e `useRouteTracking.ts`, além do serviço `routeTrackingService.ts`.
- **Fluxo**:
  - O motorista seleciona ou inicia uma rota ativa pela interface de execução.
  - A rota é marcada como ativa via serviços (ex.: `routeTrackingService.startRoute(...)`) e os hooks sincronizam o estado.
  - **Sistema de Resiliência**: Múltiplas verificações garantem inicialização correta (rechecagens em ~500ms e ~2s em `useRouteTracking`).
  - **Rastreamento de Localização**: Inicia automaticamente com intervalo de 10 segundos, com persistência em `localStorage`.
  - **Notificações**: Envia `route_started` via integração de notificações (ver seção 4).
  - **Logs Detalhados**: Debug consistente com informações de motorista, localização e status da rota.
- **Integrações**: `realtimeDataService` para sincronização e recálculo, `notificationService` e `realTimeNotificationService` para alertas, e `audioService` para sons.
- **Observação**: `ActiveTripExecution.tsx` existe como tela auxiliar/demonstração; a execução principal usa `ActiveTrip.tsx` e `RouteExecutionPage.tsx`.

## 2. Execução da Rota e Swipes

- **Componentes Envolvidos**: `ActiveTrip.tsx`, `useRouteTracking.ts`, `routeTrackingService.ts` e `realtimeDataService.ts`.
- **Fluxo Geral**:
  - Durante a rota, o motorista visualiza uma lista de alunos com status dinâmicos (runtime: `waiting`, `van_arrived`, `embarked`, `at_school`, `disembarked`).
  - **Sistema de Swipes (em `ActiveTrip.tsx`)**:
    - **Swipe para Esquerda**: Van chegou ao ponto (status → `van_arrived`). Aciona notificação `van_arrived`.
    - **Swipe para Direita**: Confirma embarque (status → `embarked`). Aciona notificação `embarked`.
    - **Threshold real**: 80px para validar gestos touch/mouse com precisão.
  - **Navegação Inteligente**: Abertura rápida do Google Maps com a geolocalização atual, especialmente disponível em embarque em casa (`to_school`).
  - **Rastreamento Contínuo**: 
    - Atualização de localização a cada 10 segundos.
    - Sincronização em tempo real com verificações redundantes de consistência.
    - Recálculo automático de rota quando necessário via `realtimeDataService` (por desvio significativo ou verificação periódica ~5 minutos).
  - **Sistema de Recuperação**: Restauração automática após recarregamento ou perda de foco.
- **Direções**:
  - `to_school`: Embarque em casa → Desembarque na escola.
  - `to_home`: Embarque na escola → Desembarque em casa.

## 3. Encerramento da Rota

- **Componentes Envolvidos**: `ActiveTrip.tsx`, `routeTrackingService.ts`, `useDriverData.ts` e utilitários de encerramento.
- **Fluxo**:
  - **Verificação Inteligente**: Valida que todos os alunos estão no status final correto (no runtime, `disembarked`).
  - **Opções de Finalização**: 
    - Normal: verificação completa e chamada a `routeTrackingService.endRoute(...)`.
    - Forçada: utilitário `forceEndRoute()` para debug/emergência quando o encerramento normal falha.
  - **Processo de Finalização**:
    - Define `endTime` da rota.
    - Para o rastreamento de localização.
    - Limpa os dados persistidos de forma segura.
    - Adiciona a rota ao histórico via `routeHistoryService`.
    - Notificações: integração em tempo real usa `route_completed`; o broadcast geral usa `route_finished`.
  - **Limpeza de Estado**: Remove notificações processadas e reseta contadores.
- **Política de Persistência**: 
  - Rotas não são encerradas automaticamente (background, unload, etc.).
  - Apenas encerramento manual pelo motorista.
  - Logs detalhados facilitam auditoria.

## 4. Sistema de Notificações para Responsáveis

- **Componentes Envolvidos**: `notificationService.ts`, `realTimeNotificationService.ts`, `audioService.ts`, hooks `useNotificationIntegration.ts`, `useGuardianData.ts` e `useRealTimeNotifications.ts`.
- **Fluxo de Notificações**:
  - **Eventos Suportados**: `route_started`, `van_arrived`, `embarked`, `at_school`, `disembarked`, `route_finished`. Em tempo real, também é usado `route_completed` para fechamento granular.
  - **Armazenamento**: 
    - `guardianNotifications_{id}` no `localStorage` (até 50 mais recentes, por responsável).
    - Canal adicional `realTimeNotifications_{id}` para sincronização em tempo real e espelhamento de eventos.
  - **Polling e Sincronização**:
    - Polling de 1 segundo em `notificationService` quando há listeners ativos.
    - Heartbeats a cada 15 segundos via `BroadcastChannel` e escuta de `storage`/`CustomEvent` em `realTimeNotificationService`.
  - **Mensagens Dinâmicas**: Personalizadas por tipo de evento e direção da rota.
  - **Deduplicação**: Baseada em timestamps (`lastNotificationCheck_{id}`) e janelas de tempo em eventos de storage (últimos ~5s), em vez de IDs únicos.

## 5. Sistema de Áudio Avançado

- **Componente Principal**: `audioService.ts` com logs detalhados de debug.
- **Funcionalidades**:
  - **Buzina Personalizada**: Arquivo `buzina-van.mp3` para todas as notificações.
  - **Fallback Inteligente**: Tom sintético (800Hz, ~0.3s) quando o arquivo não está disponível ou falha.
  - **Gerenciamento de Permissões**: Inicialização do `AudioContext` e testes leves após interação do usuário.
  - **Debug Extensivo**: Logs detalhados para troubleshooting de áudio.
  - **Configurações Persistentes**: Preferências salvas no `localStorage` via chaves `notificationSoundsEnabled` e `useNotificationAudioFiles`.
  - **Múltiplas Instâncias**: Criação de instâncias novas por reprodução para permitir sobreposição.
- **Tratamento de Erros**: Captura e log de erros (ex.: `NotAllowedError`) e fallback via Web Audio API (tom sintetizado).

## 6. Melhorias de Resiliência e Debug

- **Sistema de Logs**: Logs detalhados em todos os componentes críticos para facilitar debugging.
- **Recuperação Automática**: Restauração de rotas após recarregamento ou perda de conexão.
- **Verificações Múltiplas**: Timeouts e verificações redundantes para garantir inicialização correta.
- **Monitoramento de Estado**: Tracking contínuo de status de componentes e serviços.
- **Tratamento de Ciclo de Vida**: Gerenciamento adequado de eventos de aplicação (background, foreground, unload).

## 7. Persistência e Modelos de Status

- **Persistência de Rota**: `routeTrackingService` salva `activeRoute`, `routeLastSave` e `routePersistenceFlag` no `localStorage` para garantir continuidade.
- **Modelos de Status**:
  - **Runtime (execução em `ActiveTrip.tsx`)**: `waiting` → `van_arrived` → `embarked` → `at_school` → `disembarked`.
  - **Histórico (armazenamento em `routeHistoryService.ts`)**: `pending` → `picked_up` → `dropped_off`.
  - Observação: há um mapeamento conceitual entre os modelos; o runtime é mais granular, enquanto o histórico resume embarque/desembarque.

Esta análise foi alinhada ao código atual, corrigindo nomenclaturas, eventos e detalhes de persistência. O sistema possui robustez, melhor debugging e experiência de usuário aprimorada.