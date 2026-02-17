'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Search, Plus, CalendarDays, FileDown, 
  Building2, LayoutDashboard, RefreshCcw 
} from 'lucide-react';
import {boletoService, relatorioService} from '@/services/api';

// Componentes do Projeto
import SummaryCards from '@/components/SummaryCards';
import BoletosTable from '@/components/BoletosTable';
import FinancialChart from '@/components/FinancialChart';
import BoletoFormModal from '@/components/BoletoFormModal';
import EmpresaFormModal from '@/components/EmpresaFormModal';

type RelatorioFinanceiro = {
  detalhe_mensal?: Record<string, { total_valor: number; quantidade: number }>;
  top_5_fornecedores?: Record<string, number>;
};

export default function Dashboard() {
  // Estados de Dados e UI
  const [boletos, setBoletos] = useState<any[]>([]);
  const [relatorio, setRelatorio] = useState<RelatorioFinanceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);

  // Estados de Filtros
  const [buscaEmpresa, setBuscaEmpresa] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [anoFiltro, setAnoFiltro] = useState(2026);

  // Estados dos Modais
  const [isBoletoModalOpen, setIsBoletoModalOpen] = useState(false);
  const [isEmpresaModalOpen, setIsEmpresaModalOpen] = useState(false);

  // 1. Função para buscar dados (Boletos + Métricas do Pandas)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { ano: anoFiltro };
      if (statusFiltro) params.status = statusFiltro;
      if (buscaEmpresa) params.nome_empresa = buscaEmpresa;

      const [resList, resReport] = await Promise.all([
        boletoService.listar(params),
        boletoService.getRelatorio(anoFiltro)
      ]);
      
      setBoletos(resList.data);
      setRelatorio(resReport.data);
    } catch (error) {
      console.error("Erro ao sincronizar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFiltro, buscaEmpresa, anoFiltro]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 400); // Debounce para busca
    return () => clearTimeout(timer);
  }, [fetchData]);

  // 2. Função de Exportação para Excel (Mensal ou Anual)
  const exportarExcel = async (tipo: 'mensal' | 'anual') => {
    setExportando(true);
    try {
      const mesAtual = new Date().getMonth() + 1;
      const url = tipo === 'mensal' 
        ? `/relatorios/exportar/${anoFiltro}/${mesAtual}` 
        : `/relatorios/exportar/${anoFiltro}`;
      
      const response = await relatorioService.exportarExcel(anoFiltro, tipo === 'mensal' ? mesAtual : undefined);
      
      // Lógica de download no navegador
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Relatorio_${tipo}_${anoFiltro}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Erro ao gerar arquivo Excel. Verifique o backend.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F1F5F9] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* CABEÇALHO PRINCIPAL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200 text-white">
              <LayoutDashboard size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Fluxo</h1>
              <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                {loading ? <RefreshCcw size={14} className="animate-spin" /> : "Dados atualizados em tempo real"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* AÇÕES DE EXPORTAÇÃO */}
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
              <button 
                onClick={() => exportarExcel('mensal')}
                disabled={exportando}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-50"
              >
                <FileDown size={16} className="text-indigo-500" /> Mês
              </button>
              <div className="w-[1px] bg-slate-200 my-2" />
              <button 
                onClick={() => exportarExcel('anual')}
                disabled={exportando}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-50"
              >
                <CalendarDays size={16} className="text-emerald-500" /> Anual
              </button>
            </div>

            {/* AÇÕES DE CADASTRO */}
            <button 
              onClick={() => setIsEmpresaModalOpen(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
            >
              <Building2 size={18} className="text-slate-400" /> Fornecedor
            </button>
            <button 
              onClick={() => setIsBoletoModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-100 transition-all active:scale-95"
            >
              <Plus size={20} /> Novo Boleto
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Pesquisar fornecedor (ex: PMZ, Eletrogeral)..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600 font-medium"
              value={buscaEmpresa}
              onChange={(e) => setBuscaEmpresa(e.target.value)}
            />
          </div>
          <select 
            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-600 font-bold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="abertos">🟡 Abertos</option>
            <option value="pagos">🟢 Pagos</option>
            <option value="vencidos">🔴 Vencidos</option>
          </select>
          <select 
            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-600 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            value={anoFiltro}
            onChange={(e) => setAnoFiltro(Number(e.target.value))}
          >
            <option value={2025}>Ano 2025</option>
            <option value={2026}>Ano 2026</option>
          </select>
        </div>

        {/* SEÇÃO DE RESUMO FINANCEIRO (CARDS) */}
        <SummaryCards boletos={boletos} />

        {/* GRID DE ANÁLISE (GRÁFICO + RANKING) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Desempenho Financeiro</h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Baseado em Vencimentos</span>
            </div>
            <FinancialChart data={relatorio} />
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Maiores Fornecedores</h2>
            <div className="space-y-4">
              {relatorio?.top_5_fornecedores ? Object.entries(relatorio.top_5_fornecedores).map(([nome, valor], i) => (
                <div key={nome} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-lg font-black text-[10px]">
                      0{i + 1}
                    </div>
                    <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{nome}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor as number)}
                  </span>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                  <Building2 size={40} />
                  <p className="text-xs font-bold mt-2">Sem dados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABELA DE BOLETOS DETALHADOS */}
        <div className="mt-8 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Listagem de Títulos</h2>
            <span className="bg-white px-3 py-1 rounded-full border border-slate-200 text-[10px] font-black text-slate-500 uppercase">
              {boletos.length} registros encontrados
            </span>
          </div>
          <BoletosTable data={boletos} onUpdate={fetchData} />
        </div>
      </div>

      {/* COMPONENTES DE MODAL */}
      <BoletoFormModal 
        isOpen={isBoletoModalOpen} 
        onClose={() => setIsBoletoModalOpen(false)} 
        onSuccess={fetchData} 
      />

      <EmpresaFormModal 
        isOpen={isEmpresaModalOpen}
        onClose={() => setIsEmpresaModalOpen(false)}
        onSuccess={() => {}} // Notifica se necessário
      />
    </main>
  );
}