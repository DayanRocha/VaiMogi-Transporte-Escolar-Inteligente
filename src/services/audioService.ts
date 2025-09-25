export type NotificationSoundType = 
  | 'route_started' 
  | 'van_arrived' 
  | 'embarked' 
  | 'at_school' 
  | 'disembarked' 
  | 'route_finished'
  | 'default';

class AudioService {
  private static instance: AudioService;
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private audioFiles: Map<NotificationSoundType, HTMLAudioElement> = new Map();
  private useAudioFiles: boolean = true;

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  // Inicializar contexto de áudio (necessário após interação do usuário)
  private async initAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      } catch (error) {
        console.warn('❌ Não foi possível inicializar contexto de áudio:', error);
      }
    }
  }

  // Gerar tom usando Web Audio API
  private async generateTone(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.isEnabled) return;
    
    try {
      await this.initAudioContext();
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

    } catch (error) {
      console.warn('❌ Erro ao reproduzir som:', error);
    }
  }

  // Tocar sequência de tons
  private async playToneSequence(tones: { frequency: number; duration: number; delay?: number }[]) {
    for (let i = 0; i < tones.length; i++) {
      const tone = tones[i];
      const delay = tone.delay || 0;
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      await this.generateTone(tone.frequency, tone.duration);
      
      // Pequena pausa entre tons
      if (i < tones.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // Sons específicos para cada tipo de notificação - sempre usa buzina
  async playNotificationSound(type: NotificationSoundType) {
    if (!this.isEnabled) {
      return;
    }

    try {
      // Tentar criar um contexto de áudio para verificar permissões
      if (!this.audioContext) {
        await this.initAudioContext();
      }

      // Tentar reproduzir buzina primeiro
      const playResult = await this.playAudioFile(type);
      
      if (playResult) {
        console.log('🔊 Buzina reproduzida com sucesso');
        return; // Buzina reproduzida com sucesso
      }

      // Se a buzina não estiver carregada, tentar carregar e reproduzir
      try {
        await this.loadAllAudioFiles();
      } catch (loadError) {
        console.warn('⚠️ Erro ao carregar arquivos de áudio:', loadError);
      }
      
      // Tentar reproduzir novamente após carregar
      const retryResult = await this.playAudioFile(type);
      
      if (retryResult) {
        console.log('🔊 Buzina reproduzida com sucesso na segunda tentativa');
        return; // Buzina reproduzida com sucesso após carregamento
      }

      // Último recurso: som padrão simples
      console.warn('⚠️ Usando tom padrão como fallback');
      await this.generateTone(800, 0.3);
    } catch (error) {
      console.error('❌ Erro ao reproduzir som de notificação:', error);
    }
  }

  // Ativar/desativar sons
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('notificationSoundsEnabled', enabled.toString());
    console.log('🔊 Sons de notificação:', enabled ? 'ativados' : 'desativados');
  }

  // Verificar se sons estão ativados
  isAudioEnabled(): boolean {
    const saved = localStorage.getItem('notificationSoundsEnabled');
    return saved !== null ? saved === 'true' : true; // Padrão: ativado
  }

  // Inicializar configurações
  async init() {
    this.isEnabled = this.isAudioEnabled();
    this.useAudioFiles = true; // Sempre usar buzina
    
    console.log('🔊 AudioService inicializado - buzina habilitada');
    
    // Tentar carregar arquivo de buzina (não bloquear se falhar)
    try {
      await this.loadAllAudioFiles();
    } catch (error) {
      console.warn('⚠️ Erro ao carregar buzina na inicialização:', error);
    }
  }

  // Testar som da buzina (para configurações)
  async testSound() {
    console.log('🧪 Testando buzina...');
    await this.playNotificationSound('default');
  }

  // Solicitar permissão de áudio (deve ser chamado após interação do usuário)
  async requestAudioPermission(): Promise<boolean> {
    try {
      // Inicializar contexto de áudio
      await this.initAudioContext();
      
      if (!this.audioContext) {
        return false;
      }
      
      // Tentar resumir o contexto se estiver suspenso
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Tocar um som muito baixo para ativar o contexto
      await this.generateTone(440, 0.05, 0.1);
      
      // Tentar carregar e reproduzir um pequeno trecho da buzina
      try {
        const testAudio = new Audio('/sounds/buzina-van.mp3');
        testAudio.volume = 0.1;
        testAudio.currentTime = 0;
        
        const playPromise = testAudio.play();
        if (playPromise) {
          await playPromise;
          // Parar rapidamente
          testAudio.pause();
          testAudio.currentTime = 0;
        }
      } catch (testError) {
        console.warn('⚠️ Teste de buzina falhou, mas contexto pode estar ativo');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão de áudio:', error);
      return false;
    }
  }

  // Usar apenas um arquivo de áudio para todas as notificações
  private getAudioFilePath(type: NotificationSoundType): string {
    // Usar sempre o mesmo arquivo de buzina para todas as notificações
    return '/sounds/buzina-van.mp3';
  }

  // Carregar arquivo de áudio do projeto
  private async loadAudioFile(type: NotificationSoundType): Promise<HTMLAudioElement | null> {
    try {
      const audioPath = this.getAudioFilePath(type);
      const audio = new Audio(audioPath);
      
      // Configurar áudio
      audio.volume = 0.7;
      audio.preload = 'auto';
      
      // Aguardar carregamento
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve);
        audio.addEventListener('error', reject);
        audio.load();
      });
      
      console.log(`✅ Arquivo de áudio carregado: ${audioPath}`);
      return audio;
    } catch (error) {
      console.warn(`⚠️ Erro ao carregar arquivo de áudio para ${type}:`, error);
      return null;
    }
  }

  // Carregar o arquivo de áudio único
  private async loadAllAudioFiles() {
    console.log('🔄 Tentando carregar buzina-van.mp3...');
    
    try {
      const audio = new Audio('/sounds/buzina-van.mp3');
      audio.volume = 1.0;  // Corrigido para volume máximo válido
      audio.preload = 'auto';
      
      // Aguardar carregamento com timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout ao carregar áudio'));
        }, 10000);
        
        audio.addEventListener('canplaythrough', () => {
          clearTimeout(timeout);
          console.log('✅ Buzina carregada com sucesso!');
          resolve(true);
        });
        
        audio.addEventListener('error', (e) => {
          clearTimeout(timeout);
          console.error('❌ Erro ao carregar buzina:', e);
          reject(e);
        });
      });
      
      this.audioFiles.set('default', audio);
    } catch (error) {
      console.warn('⚠️ Erro ao carregar buzina-van.mp3:', error);
    }
  }

  // Reproduzir arquivo de áudio da buzina com fallback robusto
  private async playAudioFile(type: NotificationSoundType): Promise<boolean> {
    console.log(`🔊 DEBUG: playAudioFile chamado para: ${type}`);
    
    try {
      // Verificar se o contexto de áudio está disponível
      if (!this.audioContext) {
        console.log('🔊 DEBUG: AudioContext não disponível, tentando inicializar...');
        await this.initAudioContext();
      }
      
      // Sempre criar uma nova instância da buzina para permitir sobreposição
      console.log('🔊 DEBUG: Criando nova instância de Audio...');
      const audioClone = new Audio();
      
      // Configurar propriedades antes de definir src
      audioClone.volume = 1.0; // Volume máximo
      audioClone.playbackRate = 1.0;
      audioClone.preload = 'auto';
      audioClone.crossOrigin = 'anonymous';
      
      console.log('🔊 DEBUG: Configurando src do áudio...');
      audioClone.src = '/sounds/buzina-van.mp3';
      
      // Promise para carregamento do áudio com timeout mais longo
      const loadPromise = new Promise<void>((resolve, reject) => {
        let resolved = false;
        
        const onCanPlay = () => {
          if (resolved) return;
          resolved = true;
          console.log('🔊 DEBUG: Áudio carregado e pronto para reprodução');
          cleanup();
          resolve();
        };
        
        const onLoadedData = () => {
          if (resolved) return;
          resolved = true;
          console.log('🔊 DEBUG: Dados do áudio carregados');
          cleanup();
          resolve();
        };
        
        const onError = (e: any) => {
          if (resolved) return;
          resolved = true;
          console.error('🔊 DEBUG: Erro ao carregar áudio:', e);
          cleanup();
          reject(new Error(`Erro ao carregar arquivo de áudio: ${e.message || 'Desconhecido'}`));
        };
        
        const cleanup = () => {
          audioClone.removeEventListener('canplay', onCanPlay);
          audioClone.removeEventListener('loadeddata', onLoadedData);
          audioClone.removeEventListener('error', onError);
        };
        
        audioClone.addEventListener('canplay', onCanPlay);
        audioClone.addEventListener('loadeddata', onLoadedData);
        audioClone.addEventListener('error', onError);
        
        // Timeout mais longo para carregamento
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            reject(new Error('Timeout: arquivo demorou muito para carregar'));
          }
        }, 5000);
        
        audioClone.load();
      });
      
      // Aguardar carregamento
      await loadPromise;
      
      console.log(`🎵 DEBUG: Tentando reproduzir buzina-van.mp3 para ${type}...`);
      console.log('🔊 DEBUG: Caminho do arquivo:', audioClone.src);
      console.log('🔊 DEBUG: Estado do áudio - readyState:', audioClone.readyState);
      console.log('🔊 DEBUG: Estado do áudio - networkState:', audioClone.networkState);
      console.log('🔊 DEBUG: Volume:', audioClone.volume);
      console.log('🔊 DEBUG: Duration:', audioClone.duration);
      
      // Tentar reproduzir com retry
      let playAttempts = 0;
      const maxAttempts = 3;
      
      while (playAttempts < maxAttempts) {
        try {
          playAttempts++;
          console.log(`🔊 DEBUG: Tentativa de reprodução ${playAttempts}/${maxAttempts}`);
          
          const playPromise = audioClone.play();
          if (playPromise) {
            await playPromise;
          }
          
          console.log(`✅ DEBUG: Buzina reproduzida com sucesso para: ${type} (tentativa ${playAttempts})`);
          return true;
        } catch (playError) {
          console.error(`❌ DEBUG: Erro na tentativa ${playAttempts}:`, playError);
          
          if (playAttempts === maxAttempts) {
            throw playError;
          }
          
          // Aguardar um pouco antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      return false;
    } catch (error) {
      console.error(`❌ DEBUG: Erro detalhado ao reproduzir buzina para ${type}:`, error);
      console.error('❌ DEBUG: Tipo do erro:', error.name);
      console.error('❌ DEBUG: Mensagem do erro:', error.message);
      
      // Tentar fallback com Web Audio API
      if (this.audioContext && this.audioContext.state === 'running') {
        console.log('🔊 DEBUG: Tentando fallback com Web Audio API...');
        try {
          await this.generateTone(800, 0.5, 0.8);
          console.log('✅ DEBUG: Fallback com Web Audio API funcionou');
          return true;
        } catch (fallbackError) {
          console.error('❌ DEBUG: Fallback também falhou:', fallbackError);
        }
      }
      
      return false;
    }
  }

  // Verificar se tem arquivo de áudio para um tipo
  hasAudioFile(type: NotificationSoundType): boolean {
    return this.audioFiles.has(type);
  }

  // Sempre usar arquivo de áudio se disponível
  setUseAudioFiles(use: boolean) {
    this.useAudioFiles = use;
    localStorage.setItem('useNotificationAudioFiles', use.toString());
    console.log('🎵 Buzina de notificação:', use ? 'ativada' : 'desativada');
  }

  // Sempre usar arquivo de áudio por padrão
  shouldUseAudioFiles(): boolean {
    const saved = localStorage.getItem('useNotificationAudioFiles');
    return saved !== null ? saved === 'true' : true; // Padrão: sempre usar buzina
  }
}

export const audioService = AudioService.getInstance();