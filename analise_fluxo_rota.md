# Análise do Fluxo da Rota no Aplicativo VaiMogi

Esta análise descreve o fluxo de execução de uma rota pelo motorista, incluindo início, execução com swipes, encerramento e o sistema de notificações para responsáveis. Baseado na inspeção do código fonte, aqui está uma explicação detalhada.

## 1. Início da Rota

- **Componentes Envolvidos**: Principalmente `ActiveTripExecution.tsx`, `RouteSetupPage.tsx` e hooks como `useDriverData.ts`.
- **Fluxo**:
  - O motorista seleciona ou inicia uma rota ativa.
  - Funções como `handleStartRoute` são chamadas, que definem o estado da rota como ativa no `routeTrackingService`.
  - Inicia o rastreamento de localização em tempo real, persistindo dados no localStorage para resiliência (ex: contra recarregamentos da página).
  - Envia uma notificação de tipo `route_started` para os responsáveis dos alunos envolvidos, informando que a rota foi iniciada (direção: to_school ou to_home).
- **Integrações**: Usa `realtimeDataService` para sincronização e `notificationService` para envio de alertas.

## 2. Execução da Rota e Swipes

- **Componentes Envolvidos**: `ActiveTrip.tsx`, `useRouteTracking.ts` e serviços como `routeTrackingService.ts`.
- **Fluxo Geral**:
  - Durante a rota, o motorista visualiza uma lista de alunos com status (waiting, van_arrived, embarked, etc.).
  - Para cada aluno:
    - **Swipe para Esquerda**: Usado quando a van chega ao ponto (status muda para 'van_arrived'). Aciona notificação `van_arrived` para o responsável.
    - **Swipe para Direita**: Usado para confirmar embarque (status muda para 'embarked'). Aciona notificação `embarked`.
  - Lógica de swipe implementada com touch/mouse events, com threshold de 80 pixels para validar o gesto.
  - Integração com Google Maps para navegação: Ao clicar em um ícone de mapa, obtém localização atual via geolocation e abre rota no Google Maps (origem: localização do motorista; destino: casa do aluno ou escola).
  - Atualizações em tempo real: O serviço de tracking atualiza localização a cada intervalo, sincronizando com o backend.
- **Direções**:
  - `to_school`: Embarque em casa → Desembarque na escola.
  - `to_home`: Embarque na escola → Desembarque em casa.

## 3. Encerramento da Rota

- **Componentes Envolvidos**: `ActiveTripExecution.tsx`, `ActiveTrip.tsx` e `routeTrackingService.ts`.
- **Fluxo**:
  - Verifica se todos os alunos estão no status final ('at_school' ou 'disembarked') via múltiplas condições (contagem manual, status no serviço).
  - Opções: Finalizar normal (`handleFinishRoute`) ou forçado (`handleForceFinish` para debugging).
  - Ao finalizar: Define `endTime`, para o tracking de localização, limpa dados do localStorage e salva histórico via `routeHistoryService`.
  - Envia notificação `route_finished` para responsáveis.
- **Persistência**: Rotas não são encerradas automaticamente em eventos como background ou unload; apenas manualmente pelo motorista.

## 4. Sistema de Notificações para Responsáveis

- **Componentes Envolvidos**: `notificationService.ts`, `realTimeNotificationService.ts` e hooks como `useNotificationIntegration.ts`.
- **Fluxo**:
  - Notificações são geradas em eventos chave (route_started, van_arrived, embarked, at_school, disembarked, route_finished).
  - Salvas no localStorage por ID do responsável (chave: `guardianNotifications_{id}`), limitadas a 50 mais recentes.
  - Polling a cada 1 segundo verifica novas notificações e notifica listeners (ex: componentes UI).
  - Mensagens personalizadas baseadas no tipo de evento e direção da rota.
  - Integração com áudio: Reproduz som específico para cada tipo de evento via `audioService`.
  - Envio em tempo real via `realTimeNotificationService` para responsividade.
- **Recebimento**: Responsáveis recebem atualizações via polling ou listeners, com sons e mensagens na UI.

Esta análise cobre os principais aspectos do fluxo. Se precisar de mais detalhes ou visualizações, posso refinar.