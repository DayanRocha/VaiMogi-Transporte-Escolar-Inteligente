import React, { useState, useEffect } from 'react';
import { audioService } from '@/services/audioService';
import { Volume2, VolumeX, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AudioDiagnosticProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioDiagnostic: React.FC<AudioDiagnosticProps> = ({ isOpen, onClose }) => {
  const [diagnostics, setDiagnostics] = useState({
    audioEnabled: false,
    audioContextState: 'unknown',
    fileExists: false,
    canPlayAudio: false,
    hasUserInteracted: false,
    browserSupport: false
  });
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setTestResults([]);
    addTestResult('Iniciando diagnóstico de áudio...');

    try {
      // Teste 1: Verificar se o áudio está habilitado
      const audioEnabled = audioService.isAudioEnabled();
      addTestResult(`Áudio habilitado: ${audioEnabled ? 'SIM' : 'NÃO'}`);

      // Teste 2: Verificar suporte do navegador
      const browserSupport = 'Audio' in window && 'AudioContext' in window;
      addTestResult(`Suporte do navegador: ${browserSupport ? 'SIM' : 'NÃO'}`);

      // Teste 3: Verificar se o arquivo existe
      let fileExists = false;
      try {
        const response = await fetch('/sounds/buzina-van.mp3', { method: 'HEAD' });
        fileExists = response.ok;
        addTestResult(`Arquivo buzina-van.mp3 existe: ${fileExists ? 'SIM' : 'NÃO'} (Status: ${response.status})`);
      } catch (error) {
        addTestResult(`Erro ao verificar arquivo: ${error.message}`);
      }

      // Teste 4: Verificar AudioContext
      let audioContextState = 'unknown';
      try {
        await audioService.init();
        const hasPermission = await audioService.requestAudioPermission();
        audioContextState = hasPermission ? 'running' : 'suspended';
        addTestResult(`AudioContext: ${audioContextState}`);
      } catch (error) {
        addTestResult(`Erro no AudioContext: ${error.message}`);
      }

      // Teste 5: Tentar reproduzir áudio
      let canPlayAudio = false;
      try {
        addTestResult('Tentando reproduzir áudio de teste...');
        await audioService.testSound();
        canPlayAudio = true;
        addTestResult('Reprodução de áudio: SUCESSO');
      } catch (error) {
        addTestResult(`Reprodução de áudio: FALHA - ${error.message}`);
      }

      setDiagnostics({
        audioEnabled,
        audioContextState,
        fileExists,
        canPlayAudio,
        hasUserInteracted: true,
        browserSupport
      });

      addTestResult('Diagnóstico concluído!');
    } catch (error) {
      addTestResult(`Erro geral no diagnóstico: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Volume2 className="w-6 h-6" />
              Diagnóstico de Áudio
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Áudio habilitado</span>
              {getStatusIcon(diagnostics.audioEnabled)}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Suporte do navegador</span>
              {getStatusIcon(diagnostics.browserSupport)}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Arquivo de áudio existe</span>
              {getStatusIcon(diagnostics.fileExists)}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>AudioContext funcionando</span>
              {getStatusIcon(diagnostics.audioContextState === 'running')}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Pode reproduzir áudio</span>
              {getStatusIcon(diagnostics.canPlayAudio)}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Log de Testes:</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-40 overflow-y-auto font-mono text-sm">
              {testResults.map((result, index) => (
                <div key={index}>{result}</div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Executando...' : 'Executar Diagnóstico'}
            </button>
            
            <button
              onClick={async () => {
                try {
                  await audioService.testSound();
                  addTestResult('Teste manual de som executado');
                } catch (error) {
                  addTestResult(`Erro no teste manual: ${error.message}`);
                }
              }}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
            >
              Testar Som
            </button>
            
            <button
              onClick={async () => {
                try {
                  addTestResult('Simulando notificação...');
                  // Simular uma notificação
                  const testNotification = {
                    id: Date.now().toString(),
                    guardianId: 'test',
                    type: 'van_arrived' as const,
                    title: 'Teste de Notificação',
                    message: 'Esta é uma notificação de teste para verificar o áudio.',
                    timestamp: new Date().toISOString(),
                    isRead: false
                  };
                  
                  // Disparar evento customizado
                  window.dispatchEvent(new CustomEvent('realTimeNotification', {
                    detail: testNotification
                  }));
                  
                  addTestResult('Notificação de teste disparada');
                } catch (error) {
                  addTestResult(`Erro ao simular notificação: ${error.message}`);
                }
              }}
              className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
            >
              Simular Notificação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioDiagnostic;