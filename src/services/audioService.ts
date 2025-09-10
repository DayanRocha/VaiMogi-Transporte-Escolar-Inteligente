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
    if (!this.isEnabled) return;

    console.log('🔊 Reproduzindo buzina para notificação:', type);

    // Sempre tentar reproduzir a buzina primeiro
    if (await this.playAudioFile(type)) {
      return; // Buzina reproduzida com sucesso
    }

    // Se a buzina não estiver carregada, tentar carregar e reproduzir
    console.log('⚠️ Buzina não carregada, tentando carregar...');
    await this.loadAllAudioFiles();
    
    // Tentar reproduzir novamente após carregar
    if (await this.playAudioFile(type)) {
      return; // Buzina reproduzida com sucesso após carregamento
    }

    // Último recurso: som padrão simples
    console.warn('❌ Não foi possível reproduzir buzina, usando tom padrão');
    await this.generateTone(800, 0.3);
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

  // Reproduzir arquivo de áudio da buzina
  private async playAudioFile(type: NotificationSoundType): Promise<boolean> {
    console.log(`🔊 Tentando reproduzir buzina para: ${type}`);
    
    try {
      // Sempre criar uma nova instância da buzina para permitir sobreposição
      const audioClone = new Audio('/sounds/buzina-van.mp3');
      audioClone.volume = 0.8; // Volume alto para notificações
      audioClone.playbackRate = 1.0;
      audioClone.currentTime = 0;
      
      console.log(`🎵 Reproduzindo buzina-van.mp3 para ${type}...`);
      await audioClone.play();
      console.log(`✅ Buzina reproduzida com sucesso para: ${type}`);
      return true;
    } catch (error) {
      console.warn(`❌ Erro ao reproduzir buzina para ${type}:`, error);
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