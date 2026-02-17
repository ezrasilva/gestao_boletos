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
          width: { min: 1280, ideal: 1920 },
          height: { min: 720, ideal: 1080 },
          facingMode: { ideal: 'environment' },
          aspectRatio: { min: 1.3, max: 1.9 }
        },
        target: scannerRef.current,
      },
      locator: {
        patchSize: 'large',
        halfSample: false,
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