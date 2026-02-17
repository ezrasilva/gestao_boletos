'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, Camera, Building2 } from 'lucide-react';
import { empresaService,boletoService} from '@/services/api';
import BarcodeScanner from './BarCodeScanner'; // Certifique-se de ter criado este arquivo
import { extrairDadosBoleto } from '@/utils/boletoUtils';

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;

}

function converterParaLinhaDigitavel(codigo44: string): string {
  if (codigo44.length !== 44) return codigo44;

  const bbb = codigo44.substring(0, 3);
  const m = codigo44.substring(3, 4);
  const campoLivre1 = codigo44.substring(19, 24);
  const campoLivre2 = codigo44.substring(24, 34);
  const campoLivre3 = codigo44.substring(34, 44);
  const dvGeral = codigo44.substring(4, 5);
  const fatorVenc = codigo44.substring(5, 9);
  const valor = codigo44.substring(9, 19);

  // Bloco 1: BBB + M + 5 primeiros do campo livre + DV
  const b1 = bbb + m + campoLivre1;
  const dv1 = calcularMod10(b1);
  
  // Bloco 2: Próximos 10 do campo livre + DV
  const b2 = campoLivre2;
  const dv2 = calcularMod10(b2);
  
  // Bloco 3: Últimos 10 do campo livre + DV
  const b3 = campoLivre3;
  const dv3 = calcularMod10(b3);

  // Montagem final formatada
  return `${b1.substring(0, 5)}.${b1.substring(5)}${dv1} ${b2.substring(0, 5)}.${b2.substring(5)}${dv2} ${b3.substring(0, 5)}.${b3.substring(5)}${dv3} ${dvGeral} ${fatorVenc}${valor}`;
}

function calcularMod10(bloco: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = bloco.length - 1; i >= 0; i--) {
    let mult = parseInt(bloco.charAt(i)) * peso;
    if (mult > 9) mult = (mult % 10) + Math.floor(mult / 10);
    soma += mult;
    peso = peso === 2 ? 1 : 2;
  }
  const resto = soma % 10;
  return resto === 0 ? 0 : 10 - resto;
}

function calculaMod10(bloco: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = bloco.length - 1; i >= 0; i--) {
    let mult = parseInt(bloco.charAt(i)) * peso;
    if (mult > 9) mult = Math.floor(mult / 10) + (mult % 10);
    soma += mult;
    peso = peso === 2 ? 1 : 2;
  }
  const resto = soma % 10;
  return resto === 0 ? 0 : 10 - resto;
}


export default function BoletoFormModal({ isOpen, onClose, onSuccess }: Props) {
  // Estados de Dados
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [formData, setFormData] = useState({
    empresa_id: '',
    descricao: '',
    valor: '',
    data_vencimento: '',
    codigo_barras: ''
  });

  // Estados de UI
  const [estaPago, setEstaPago] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Busca empresas ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      async function carregarEmpresas() {
        try {
          setLoadingEmpresas(true);
          const response = await empresaService.listar();
          setEmpresas(response.data);
        } catch (error) {
          console.error("Erro ao carregar fornecedores:", error);
        } finally {
          setLoadingEmpresas(false);
        }
      }
      carregarEmpresas();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        empresa_id: parseInt(formData.empresa_id),
        valor: parseFloat(formData.valor),
        // Se marcado como pago, envia a data de hoje para o banco
        data_pagamento: estaPago ? new Date().toISOString().split('T')[0] : null
      };

      await boletoService.cadastrar(payload);
      setMostrarSucesso(true);

      // Feedback visual antes de fechar
      setTimeout(() => {
        setMostrarSucesso(false);
        setEstaPago(false);
        setFormData({ empresa_id: '', descricao: '', valor: '', data_vencimento: '', codigo_barras: '' });
        onSuccess();
        onClose();
      }, 2000);

    } catch (error: any) {
      const msg = error.response?.data?.detail || "Erro ao salvar boleto.";
      alert(typeof msg === 'string' ? msg : "Erro nos dados enviados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden border border-gray-100">
        
        {/* OVERLAY DE SUCESSO */}
        {mostrarSucesso && (
          <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Cadastrado com sucesso!</h3>
            <p className="text-gray-500 text-sm mt-1">Sincronizando com o banco...</p>
          </div>
        )}

        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Novo Boleto</h2>
            <p className="text-xs text-gray-400">Preencha ou escaneie o código</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* SELECT DE EMPRESA */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Empresa Fornecedora</label>
            <div className="relative">
              <select
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                value={formData.empresa_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, empresa_id: e.target.value})}
                disabled={loadingEmpresas}
              >
                <option value="">Selecione uma empresa...</option>
                {empresas.map((emp: Empresa) => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
              <Building2 className="absolute right-4 top-3.5 text-gray-300" size={18} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor (R$)</label>
              <input
                type="number" step="0.01" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0,00"
                value={formData.valor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, valor: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vencimento</label>
              <input
                type="date" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.data_vencimento}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, data_vencimento: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Peças para manutenção"
              value={formData.descricao}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, descricao: e.target.value})}
            />
          </div>

          {/* STATUS DE PAGAMENTO */}
          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={estaPago}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstaPago(e.target.checked)}
            />
            <div className="select-none">
              <p className="text-sm font-bold text-slate-700">Marcar como Pago</p>
              <p className="text-[10px] text-slate-400">O boleto será salvo com a data de hoje</p>
            </div>
          </label>

          {/* CÓDIGO DE BARRAS COM SCANNER */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código de Barras</label>
            <div className="flex gap-2">
              <input
                type="text" required
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-[10px]"
                placeholder="00000.00000..."
                value={formData.codigo_barras}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, codigo_barras: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="bg-indigo-50 text-indigo-600 p-3 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
              >
                <Camera size={20} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || loadingEmpresas}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Salvar Boleto"}
          </button>
        </form>
      </div>

      {/* COMPONENTE DE SCANNER */}
      {isScannerOpen && (
        <BarcodeScanner 
          onScan={(code: string) => {
         
            const dados = extrairDadosBoleto(code); // Remove tudo que não for número para extrair os dados
            const formartado = converterParaLinhaDigitavel(code);
            if (dados) {
              setFormData({ 
                ...formData, 
                codigo_barras: formartado, // Preenche o código de barras formatado
                valor: dados.valorFinal,         // Preenche o valor automático!
                data_vencimento: dados.dataFormatada // Preenche a data automática!
              });
            } else {
              setFormData({ ...formData, codigo_barras: code });
            }
            
            setIsScannerOpen(false);
          }}
        />
      )}
    </div>
  );
}