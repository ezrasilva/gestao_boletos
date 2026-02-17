export interface Boleto {
  id: number;
  nome_empresa: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  codigo_barras: string;
}

export interface RelatorioAnual {
  ano: number;
  detalhe_mensal: {
    [key: string]: {
      total_valor: number;
      quantidade: number;
      pagos: number;
    }
  };
  top_5_fornecedores?: Record<string, number>;
}