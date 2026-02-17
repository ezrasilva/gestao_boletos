'use client';

import { useState } from 'react';
import { X, CheckCircle, Loader2, Building2 } from 'lucide-react';
import {empresaService } from '@/services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmpresaFormModal({ isOpen, onClose, onSuccess }: Props) {
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await empresaService.cadastrar({ nome, cnpj });
      setMostrarSucesso(true);

      setTimeout(() => {
        setMostrarSucesso(false);
        setNome('');
        setCnpj('');
        onSuccess();
        onClose();
      }, 2000);
    } catch (error: any) {
      alert(error.response?.data?.detail || "Erro ao cadastrar empresa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden">
        
        {mostrarSucesso && (
          <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <CheckCircle size={48} className="text-green-600 mb-2" />
            <h3 className="text-xl font-bold text-gray-900">Empresa Cadastrada!</h3>
          </div>
        )}

        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <Building2 className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">Nova Empresa</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Razão Social / Nome</label>
            <input
              type="text"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: PMZ Peças"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CNPJ</label>
            <input
              type="text"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              placeholder="00.000.000/0001-00"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Cadastrar Fornecedor"}
          </button>
        </form>
      </div>
    </div>
  );
}