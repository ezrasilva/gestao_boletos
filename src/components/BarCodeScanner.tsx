'use client';
import { useEffect, useRef } from 'react';
import Quagga from '@ericblade/quagga2';


export default function BarcodeScanner({ onScan, onClose }: any) {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    Quagga.init({
  inputStream: {
    type: 'LiveStream',
    constraints: {
      width: { min: 1280 }, // Aumentar a resolução ajuda a distinguir as barras finas
      height: { min: 720 },
      facingMode: 'environment',
      aspectRatio: { min: 1, max: 2 }
    },
    target: scannerRef.current,
  },
  locator: {
    patchSize: 'medium', // 'medium' ou 'small' funcionam melhor para I2of5
    halfSample: false,   // IMPORTANTE: Manter em false para não perder definição
  },
  decoder: {
    readers: ['i2of5_reader'], // Foco exclusivo no padrão FEBRABAN
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
      <div ref={scannerRef} className="relative w-full h-[60vh] bg-gray-900" />
      <button onClick={onClose} className="mt-8 bg-red-600 px-6 py-2 rounded-xl text-white font-bold">
        Fechar Scanner
      </button>
    </div>
  );
}