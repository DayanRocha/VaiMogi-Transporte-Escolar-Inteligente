# Som de Notificação - Buzina da Van

Esta pasta contém o arquivo de áudio usado para todas as notificações do sistema de transporte escolar.

## 📁 Arquivo de Som

### Arquivo Principal:
- **Localização**: `public/buzina-van.mp3`
- **Uso**: Som único para todas as notificações
- **Descrição**: Som de buzina da van escolar

## 🎵 Como Funciona

O sistema usa um único arquivo de áudio (`buzina-van.mp3`) para todas as notificações:
- 🚀 Início da rota
- 🚐 Van chegou no ponto
- 👤 Embarque do aluno
- 🏫 Chegada na escola
- 🚪 Desembarque
- 🏁 Fim da rota

## 🔄 Como Substituir o Som

1. **Substitua o arquivo** `public/buzina-van.mp3` pelo seu arquivo MP3
2. **Mantenha o nome exato**: `buzina-van.mp3`
3. **Recarregue a aplicação** para carregar o novo som
4. **Teste** executando uma rota

## 🎨 Especificações Recomendadas

### Formato:
- **Tipo**: MP3 (recomendado)
- **Duração**: 1-3 segundos
- **Tamanho**: Máximo 1MB
- **Qualidade**: 128-192 kbps
- **Volume**: Normalizado (não muito alto)

### Características do Som:
- **Claro e audível**: Deve ser facilmente ouvido
- **Não agressivo**: Som agradável para uso frequente
- **Curto**: Para não incomodar em notificações seguidas
- **Temático**: Relacionado ao transporte escolar (buzina, sino, etc.)

## 🌐 Onde Encontrar Sons

### Sites Gratuitos:
- **Freesound.org** - Busque "horn", "buzzer", "notification"
- **Pixabay** - Sons livres de direitos
- **YouTube Audio Library** - Efeitos sonoros gratuitos

### Sugestões de Busca:
- "car horn short"
- "school bus horn"
- "notification beep"
- "buzzer sound"
- "alert tone"

## 🧪 Como Testar

1. Coloque seu arquivo MP3 como `public/buzina-van.mp3`
2. Reinicie a aplicação (`npm run dev`)
3. Abra o painel do responsável
4. Execute uma rota no painel do motorista
5. Ouça o som nas notificações

## 📝 Notas Técnicas

- **Carregamento**: O arquivo é carregado automaticamente na inicialização
- **Fallback**: Se o arquivo não carregar, usa tons gerados
- **Performance**: Uma nova instância é criada para cada reprodução
- **Compatibilidade**: Funciona em todos os navegadores modernos
- **Cache**: O navegador pode cachear o arquivo

## 🔧 Solução de Problemas

### Som não toca:
- ✅ Verifique se o arquivo `buzina-van.mp3` existe em `public/`
- ✅ Confirme que é um arquivo MP3 válido
- ✅ Teste o arquivo em um player de áudio
- ✅ Verifique permissões de áudio no navegador
- ✅ Limpe o cache do navegador (Ctrl+F5)

### Som muito baixo/alto:
- 🔧 Use Audacity para ajustar o volume
- 🔧 Normalize o áudio para -3dB
- 🔧 Teste em diferentes dispositivos

### Arquivo não carrega:
- 🔍 Verifique o console do navegador (F12)
- 🔍 Confirme o caminho: `public/buzina-van.mp3`
- 🔍 Teste com arquivo menor
- 🔍 Verifique se não há caracteres especiais no nome

---

**Arquivo atual**: `buzina-van.mp3`  
**Última atualização**: Janeiro 2025  
**Versão**: 3.0 - Som único simplificado