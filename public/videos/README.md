# Pasta de Vídeos - VaiMogi

Esta pasta contém os arquivos de vídeo utilizados na aplicação VaiMogi.

## Estrutura Recomendada

- **demo-video.mp4** - Vídeo de demonstração principal para a Landing Page
- **tutorial-*.mp4** - Vídeos tutoriais (se necessário)
- **promotional-*.mp4** - Vídeos promocionais (se necessário)

## Diretrizes para Vídeos

### Formatos Suportados
- **MP4** (recomendado) - Melhor compatibilidade
- **WebM** - Alternativa para navegadores modernos
- **OGV** - Fallback para navegadores mais antigos

### Otimizações Recomendadas
- **Resolução**: 1920x1080 (Full HD) ou 1280x720 (HD)
- **Taxa de bits**: 2-5 Mbps para qualidade balanceada
- **Codec**: H.264 para MP4
- **Duração**: Máximo 2-3 minutos para Landing Page

### Como Adicionar um Vídeo

1. Coloque o arquivo .mp4 nesta pasta
2. O vídeo estará disponível via URL: `/videos/nome-do-arquivo.mp4`
3. Use o componente de vídeo na aplicação para exibir

### Exemplo de Uso no Código

```tsx
<video 
  src="/videos/demo-video.mp4" 
  controls 
  autoPlay 
  muted 
  loop
  className="w-full h-auto"
>
  Seu navegador não suporta vídeos HTML5.
</video>
```

## Notas Importantes

- Mantenha os arquivos de vídeo otimizados para web
- Considere usar lazy loading para melhor performance
- Sempre inclua atributo `muted` para autoplay funcionar
- Teste em diferentes dispositivos e conexões