'use client';
import { Boleto } from '@/types';
import { DollarSign, AlertTriangle, CheckCircle2, Wallet } from 'lucide-react';

interface Props {
  boletos: Boleto[];
}

export default function SummaryCards({ boletos }: Props) {
  const hoje = new Date();

  // Lógica de cálculo
  const totais = boletos.reduce(
    (acc, b) => {
      const valor = b.valor;
      const vencimento = new Date(b.data_vencimento);

      if (b.data_pagamento) {
        acc.pago += valor;
      } else {
        acc.aberto += valor;
        if (vencimento < hoje) {
          acc.vencido += valor;
        }
      }
      return acc;
    },
    { pago: 0, aberto: 0, vencido: 0 }
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const cards = [
    {
      title: 'Total Pago',
      value: formatCurrency(totais.pago),
      icon: <CheckCircle2 className="text-green-600" />,
      bg: 'bg-green-50',
      border: 'border-green-100',
    },
    {
      title: 'A Pagar (Total)',
      value: formatCurrency(totais.aberto),
      icon: <Wallet className="text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      title: 'Total Vencido',
      value: formatCurrency(totais.vencido),
      icon: <AlertTriangle className="text-red-600" />,
      bg: 'bg-red-50',
      border: 'border-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`p-6 rounded-2xl border ${card.border} ${card.bg} flex items-center justify-between shadow-sm`}
        >
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{card.value}</h3>
          </div>
          <div className="p-3 bg-white rounded-xl shadow-inner">
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}