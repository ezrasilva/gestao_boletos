'use client';

import { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';

interface Props {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [cameraAtiva, setCameraAtiva] = useState<string>("");

  useEffect(() => {
    if (!scannerRef.current) return;

    const configurarEIniciarCamera = async () => {
      try {
        // 1. Listar todos os dispositivos de vídeo disponíveis
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        // 2. Lógica de Seleção: Procurar a câmara traseira principal (Wide)
        // Evitamos termos como "ultra", "wide-angle" ou "depth" que costumam ser lentes secundárias
        const mainCamera = videoDevices.find(device => {
          const label = device.label.toLowerCase();
          return (label.includes('back') || label.includes('traseira')) && 
                 !label.includes('ultra') && 
                 !label.includes('wide-angle');
        }) || videoDevices[0]; // Fallback para a primeira câmara se não encontrar pelo nome

        if (mainCamera) {
          setCameraAtiva(mainCamera.label);
        }

        // 3. Inicializar o Quagga2 com o DeviceId específico
        Quagga.init({
          inputStream: {
            type: 'LiveStream',
            constraints: {
              // Forçamos o ID da câmara selecionada
              deviceId: mainCamera ? { exact: mainCamera.deviceId } : undefined,
              width: { min: 1280, ideal: 1920 },
              height: { min: 720, ideal: 1080 },
              facingMode: 'environment',
              // Tentativa de forçar foco contínuo no hardware
              advanced: [{ focusMode: "continuous" } as any]
            },
            target: scannerRef.current || undefined,
            // Definimos uma área de interesse para o algoritmo focar no centro
            area: {
              top: "30%",
              right: "10%",
              left: "10%",
              bottom: "30%",
            },
          },
          numOfWorkers: navigator.hardwareConcurrency || 4,
          locator: {
            patchSize: 'medium', // Melhor equilíbrio para boletos longos
            halfSample: false,   // Mantém a resolução para não perder definição
          },
          decoder: {
            readers: ['i2of5_reader'], // Padrão FEBRABAN para boletos bancários
          },
          locate: true,
        }, (err) => {
          if (err) {
            console.error("Erro ao iniciar Quagga:", err);
            return;
          }
          Quagga.start();
        });

      } catch (err) {
        console.error("Erro ao aceder às câmaras:", err);
      }
    };

    configurarEIniciarCamera();

    // 4. Callback de Detecção
    Quagga.onDetected((data) => {
      const code = data.codeResult.code;
      // Validamos se o código tem o tamanho esperado (44 dígitos para boletos)
      if (code && (code.length === 44 || code.length === 47)) {
        console.log("Código detetado com sucesso:", code);
        onScan(code);
        Quagga.stop();
      }
    });

    // Cleanup ao fechar o componente
    return () => {
      Quagga.stop();
      Quagga.offDetected();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black z-[70] flex flex-col items-center justify-center">
      {/* Container do Vídeo */}
      <div 
        ref={scannerRef} 
        className="relative w-full h-[70vh] bg-gray-900 overflow-hidden"
      >
        {/* Guia Visual (Overlay) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-[85%] h-[120px] border-2 border-indigo-500 rounded-2xl flex items-center justify-center bg-indigo-500/10">
            <div className="w-full h-[1px] bg-red-500/50 animate-pulse shadow-[0_0_8px_red]" />
          </div>
        </div>

        {/* Info da Câmara Ativa (Debug útil para SI) */}
        <div className="absolute top-4 left-4 z-20 bg-black/50 px-3 py-1 rounded-full text-[10px] text-white font-mono">
          Câmara: {cameraAtiva || "A carregar..."}
        </div>
      </div>

      <div className="p-6 text-center w-full max-w-md">
        <p className="text-white text-sm font-bold mb-6">
          Posiciona o código de barras no centro da linha vermelha
        </p>
        
        <button 
          onClick={onClose} 
          className="w-full bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black transition-all border border-white/20 active:scale-95"
        >
          Cancelar Leitura
        </button>
      </div>
    </div>
  );
}