import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  onLoadStart?: () => void;
  onLoadedData?: () => void;
  onError?: (error: Event) => void;
}

export const VideoPlayer = ({
  src,
  poster,
  title = 'Vídeo',
  className = '',
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
  preload = 'metadata',
  onLoadStart,
  onLoadedData,
  onError
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // Intersection Observer para lazy loading (exceto quando autoPlay está ativo)
  useEffect(() => {
    // Se autoPlay estiver ativo, carrega o vídeo imediatamente
    if (autoPlay) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [autoPlay]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    onLoadStart?.();
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    onLoadedData?.();
  };

  const handleError = (error: Event) => {
    setHasError(true);
    setIsLoading(false);
    onError?.(error);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  // Garantir autoplay quando o vídeo estiver carregado
  useEffect(() => {
    if (autoPlay && isInView && videoRef.current && !hasError) {
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
          setIsPlaying(true);
        } catch (error) {
          console.log('Autoplay foi bloqueado pelo navegador:', error);
        }
      };
      playVideo();
    }
  }, [autoPlay, isInView, hasError]);

  return (
    <div className={`relative group ${className}`}>
      {/* Loading Placeholder */}
      {!isInView && (
        <div 
          className="w-full bg-gray-200 rounded-xl flex items-center justify-center"
          style={{ aspectRatio: '16/9', minHeight: '300px' }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-500">Carregando vídeo...</p>
          </div>
        </div>
      )}

      {/* Video Element */}
      {isInView && (
        <>
          <video
            ref={videoRef}
            className="w-full h-auto rounded-xl"
            poster={poster}
            autoPlay={autoPlay}
            muted={muted}
            loop={loop}
            preload={preload}
            onLoadStart={handleLoadStart}
            onLoadedData={handleLoadedData}
            onError={handleError}
            onPlay={handlePlay}
            onPause={handlePause}
            style={{ maxHeight: '500px' }}
            aria-label={title}
          >
            <source src={src} type="video/mp4" />
            <p className="text-center text-gray-600 p-8">
              Seu navegador não suporta a reprodução de vídeos HTML5.
              <br />
              <a href={src} className="text-primary hover:underline">
                Clique aqui para baixar o vídeo
              </a>
            </p>
          </video>

          {/* Custom Controls Overlay */}
          {controls && !hasError && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-xl">
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={togglePlay}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200"
                    aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-gray-800" />
                    ) : (
                      <Play className="w-5 h-5 text-gray-800" />
                    )}
                  </button>
                  
                  <button
                    onClick={toggleMute}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200"
                    aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-gray-800" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-gray-800" />
                    )}
                  </button>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200"
                  aria-label="Tela cheia"
                >
                  <Maximize className="w-5 h-5 text-gray-800" />
                </button>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl">
              <div className="text-white text-center">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                <p>Carregando...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-xl">
              <div className="text-center text-gray-600">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-gray-500" />
                </div>
                <p className="mb-2">Erro ao carregar o vídeo</p>
                <a 
                  href={src} 
                  className="text-primary hover:underline"
                  download
                >
                  Baixar vídeo
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};