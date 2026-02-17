'use client';
import { useState } from 'react';
import { Boleto } from '@/types';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { boletoService } from '@/services/api';

interface Props {
  data: Boleto[];
  onUpdate: () => void;
}

export default function BoletosTable({ data, onUpdate }: Props) {
  const [boletoSelecionado, setBoletoSelecionado] = useState<Boleto | null>(null);
  
  const handlePagar = async (id: number) => {
    const hoje = new Date().toISOString().split('T')[0];
    try {
      await boletoService.pagar(id, hoje);
      onUpdate(); // Atualiza a lista no dashboard
    } catch (error) {
      alert("Erro ao processar pagamento.");
    }
  };

  const getStatus = (boleto: Boleto) => {
    if (boleto.data_pagamento) return { label: 'Pago', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={16} /> };
    
    const hoje = new Date();
    const vencimento = new Date(boleto.data_vencimento);
    
    if (vencimento < hoje) return { label: 'Vencido', color: 'bg-red-100 text-red-700', icon: <AlertCircle size={16} /> };
    
    return { label: 'Em Aberto', color: 'bg-blue-100 text-blue-700', icon: <Clock size={16} /> };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="p-4 font-semibold text-gray-600">Empresa</th>
            <th className="p-4 font-semibold text-gray-600">Descrição</th>
            <th className="p-4 font-semibold text-gray-600">Valor</th>
            <th className="p-4 font-semibold text-gray-600">Vencimento</th>
            <th className="p-4 font-semibold text-gray-600">Status</th>
            <th className="p-4 font-semibold text-gray-600">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map((boleto) => {
            const status = getStatus(boleto);
            const nomeEmpresa = boleto.nome_empresa || (boleto as any).empresa_nome || (boleto as any).empresa?.nome || '-';
            return (
              <tr
                key={boleto.id}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => setBoletoSelecionado(boleto)}
              >
                <td className="p-4 font-medium text-gray-800">{nomeEmpresa}</td>
                <td className="p-4 text-gray-600">{boleto.descricao}</td>
                <td className="p-4 font-semibold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(boleto.valor)}
                </td>
                <td className="p-4 text-gray-600">
                  {new Date(boleto.data_vencimento).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-4">
                  <span className={`flex items-center gap-2 w-fit px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                    {status.icon}
                    {status.label}
                  </span>
                </td>
                <td className="p-4">
                  {!boleto.data_pagamento && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePagar(boleto.id);
                      }}
                      className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all"
                    >
                      Pagar
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {boletoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-800">Detalhes do Boleto</h3>
              <button
                onClick={() => setBoletoSelecionado(null)}
                className="text-sm font-bold text-slate-500 hover:text-slate-700"
              >
                Fechar
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Empresa</span>
                <span className="font-semibold text-slate-800">
                  {boletoSelecionado.nome_empresa || (boletoSelecionado as any).empresa_nome || (boletoSelecionado as any).empresa?.nome || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Descricao</span>
                <span className="font-semibold text-slate-800 text-right max-w-[60%]">
                  {boletoSelecionado.descricao}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor</span>
                <span className="font-semibold text-slate-800">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(boletoSelecionado.valor)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vencimento</span>
                <span className="font-semibold text-slate-800">
                  {new Date(boletoSelecionado.data_vencimento).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pagamento</span>
                <span className="font-semibold text-slate-800">
                  {boletoSelecionado.data_pagamento
                    ? new Date(boletoSelecionado.data_pagamento).toLocaleDateString('pt-BR')
                    : 'Nao pago'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Codigo de barras</span>
                <span className="font-semibold text-slate-800 text-right max-w-[60%] break-all">
                  {boletoSelecionado.codigo_barras}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}