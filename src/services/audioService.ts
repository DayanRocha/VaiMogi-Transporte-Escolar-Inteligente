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
    console.log(`🔊 DEBUG: ===== INÍCIO playNotificationSound =====`);
    console.log(`🔊 DEBUG: Tipo de notificação: ${type}`);
    console.log('🔊 DEBUG: AudioService habilitado:', this.isEnabled);
    console.log('🔊 DEBUG: Deve usar arquivos de áudio:', this.useAudioFiles);
    console.log('🔊 DEBUG: AudioContext estado:', this.audioContext?.state);
    console.log('🔊 DEBUG: Permissão de áudio no localStorage:', localStorage.getItem('notificationSoundsEnabled'));
    
    if (!this.isEnabled) {
      console.log('🔇 DEBUG: Sons desabilitados, pulando reprodução');
      return;
    }

    // Verificar se o usuário já interagiu com a página
    console.log('🔊 DEBUG: Verificando interação do usuário...');
    try {
      // Tentar criar um contexto de áudio para verificar permissões
      if (!this.audioContext) {
        console.log('🔊 DEBUG: Criando AudioContext...');
        await this.initAudioContext();
      }
      console.log('🔊 DEBUG: AudioContext criado/verificado, estado:', this.audioContext?.state);
    } catch (error) {
      console.error('🔊 DEBUG: Erro ao inicializar AudioContext:', error);
    }

    // Tentar reproduzir buzina primeiro
    console.log('🔊 DEBUG: Tentando reproduzir arquivo de áudio...');
    const playResult = await this.playAudioFile(type);
    console.log('🔊 DEBUG: Resultado da reprodução:', playResult);
    
    if (playResult) {
      console.log('🔊 DEBUG: ===== Arquivo de áudio reproduzido com SUCESSO =====');
      return; // Buzina reproduzida com sucesso
    }

    // Se a buzina não estiver carregada, tentar carregar e reproduzir
    console.log('⚠️ DEBUG: Buzina não reproduzida, tentando carregar...');
    try {
      await this.loadAllAudioFiles();
      console.log('🔊 DEBUG: Arquivos carregados, tentando reproduzir novamente...');
    } catch (loadError) {
      console.error('🔊 DEBUG: Erro ao carregar arquivos:', loadError);
    }
    
    // Tentar reproduzir novamente após carregar
    const retryResult = await this.playAudioFile(type);
    console.log('🔊 DEBUG: Resultado da segunda tentativa:', retryResult);
    
    if (retryResult) {
      console.log('🔊 DEBUG: ===== Arquivo reproduzido com SUCESSO na segunda tentativa =====');
      return; // Buzina reproduzida com sucesso após carregamento
    }

    // Último recurso: som padrão simples
    console.warn('❌ DEBUG: Não foi possível reproduzir buzina, usando tom padrão');
    try {
      await this.generateTone(800, 0.3);
      console.log('🔊 DEBUG: Tom padrão reproduzido com sucesso');
    } catch (toneError) {
      console.error('❌ DEBUG: Erro ao reproduzir tom padrão:', toneError);
    }
    console.log(`🔊 DEBUG: ===== FIM playNotificationSound =====`);
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
      await this.initAudioContext();
      // Tocar um som muito baixo para ativar o contexto
      await this.generateTone(440, 0.01, 0.01);
      return true;
    } catch (error) {
      console.warn('❌ Permissão de áudio negada:', error);
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
      // Verificar se o usuário já interagiu com a página
      console.log('🔊 DEBUG: Verificando permissões de áudio...');
      
      // Sempre criar uma nova instância da buzina para permitir sobreposição
      console.log('🔊 DEBUG: Criando nova instância de Audio...');
      const audioClone = new Audio('/sounds/buzina-van.mp3');
      console.log('🔊 DEBUG: Audio criado, configurando propriedades...');
      
      audioClone.volume = 0.8; // Volume alto para notificações
      audioClone.playbackRate = 1.0;
      audioClone.currentTime = 0;
      
      // Timeout para detectar arquivos corrompidos ou vazios
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: arquivo pode estar corrompido')), 3000);
      });
      
      // Promise para carregamento do áudio
      const loadPromise = new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          console.log('🔊 DEBUG: Áudio carregado e pronto para reprodução');
          audioClone.removeEventListener('canplay', onCanPlay);
          audioClone.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = (e: any) => {
          console.error('🔊 DEBUG: Erro ao carregar áudio:', e);
          audioClone.removeEventListener('canplay', onCanPlay);
          audioClone.removeEventListener('error', onError);
          reject(new Error('Erro ao carregar arquivo de áudio'));
        };
        
        audioClone.addEventListener('canplay', onCanPlay);
        audioClone.addEventListener('error', onError);
        audioClone.load();
      });
      
      // Aguardar carregamento com timeout
      await Promise.race([loadPromise, timeoutPromise]);
      
      console.log(`🎵 DEBUG: Tentando reproduzir buzina-van.mp3 para ${type}...`);
      console.log('🔊 DEBUG: Caminho do arquivo:', audioClone.src);
      console.log('🔊 DEBUG: Estado do áudio - readyState:', audioClone.readyState);
      console.log('🔊 DEBUG: Estado do áudio - networkState:', audioClone.networkState);
      
      // Tentar reproduzir
      const playPromise = audioClone.play();
      await playPromise;
      
      console.log(`✅ DEBUG: Buzina reproduzida com sucesso para: ${type}`);
      return true;
    } catch (error) {
      console.error(`❌ DEBUG: Erro detalhado ao reproduzir buzina para ${type}:`, error);
      console.error('❌ DEBUG: Tipo do erro:', error.name);
      console.error('❌ DEBUG: Mensagem do erro:', error.message);
      
      // Se for erro de interação do usuário, tentar solicitar permissão
      if (error.name === 'NotAllowedError' || error.message.includes('user activation')) {
        console.warn('⚠️ DEBUG: Erro de permissão de áudio - usuário precisa interagir primeiro');
        console.warn('⚠️ DEBUG: Tentando solicitar permissão...');
        
        try {
          await this.requestAudioPermission();
          console.log('✅ DEBUG: Permissão de áudio obtida, tentando novamente...');
          
          // Tentar novamente após obter permissão
          const audioRetry = new Audio('/sounds/buzina-van.mp3');
          audioRetry.volume = 0.8;
          await audioRetry.play();
          console.log(`✅ DEBUG: Buzina reproduzida com sucesso após permissão para: ${type}`);
          return true;
        } catch (retryError) {
          console.error('❌ DEBUG: Falha mesmo após solicitar permissão:', retryError);
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