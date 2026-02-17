'use client';
import { useEffect, useRef } from 'react';
import Quagga from '@ericblade/quagga2';


export default function BarcodeScanner({ onScan, onClose }: any) {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    // No teu BarCodeScanner.tsx
Quagga.init({
  inputStream: {
    type: 'LiveStream',
    constraints: {
      width: { min: 1920, ideal: 1920 }, // Tenta forçar 1080p
      height: { min: 1080, ideal: 1080 },
      facingMode: 'environment',
      aspectRatio: { min: 1.777, max: 1.778 }, // Força 16:9
      // Propriedades avançadas para o foco
    // PULO DO GATO: Tenta forçar o foco automático contínuo
      advanced: [
        { focusMode: "continuous" } as any,
        { exposureMode: "continuous" } as any
      ]
    } ,
    target: scannerRef.current,
  },
  numOfWorkers: navigator.hardwareConcurrency || 4, // Usa o máximo de núcleos do teu telemóvel
  locator: {
    patchSize: 'medium',
    halfSample: false, // Mantém false para não perder definição
  },
  decoder: {
    readers: ['i2of5_reader'], 
  },
  locate: true,
}, (err) => {
  if (err) return console.error(err);
  Quagga.start();
});

Quagga.onDetected((data) => {
      if (data.codeResult.code) {
        onScan(data.codeResult.code);
        console.log("Código detectado:", data.codeResult.code);
        Quagga.stop();
      }
    });

    return () => {
      Quagga.stop();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black z-[70] flex flex-col items-center justify-center">
      <div ref={scannerRef} className="scanner relative w-full h-[70vh] bg-gray-900 rounded-xl overflow-hidden" />
      <style jsx>{`
        .scanner :global(video),
        .scanner :global(canvas) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
      <button onClick={onClose} className="mt-8 bg-red-600 px-6 py-2 rounded-xl text-white font-bold">
        Fechar Scanner
      </button>
    </div>
  );
}

interface AdvancedMediaConstraints extends MediaTrackConstraintSet {
  focusMode?: ConstrainDOMString;
  exposureMode?: ConstrainDOMString;
}