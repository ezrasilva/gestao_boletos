import axios from 'axios';

const getBaseURL = () => {
  // Em desenvolvimento: aponta para FastAPI em 8000
  if (typeof window === 'undefined') {
    // Server-side: use URL relativa
    return '/api';
  }
  
  // Client-side
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }
  
  // Em produção (Vercel): use URL relativa
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

export const boletoService = {
  listar: (params?: { status?: string; nome_empresa?: string; ano?: number }) => {
    const query: any = {};
    // Envia apenas filtros preenchidos
    if (params?.status) query.status = params.status;
    if (params?.nome_empresa) query.nome_empresa = params.nome_empresa;
    if (params?.ano) query.ano = params.ano;

    return api.get('/boletos/', { params: query });
  },
    
  cadastrar: (dados: any) => api.post('/boletos/', dados),
  
  pagar: (id: number, data: string) => api.patch(`/boletos/${id}/pagar`, { data_pagamento: data }),
  
  getRelatorio: (ano: number) => api.get(`/relatorios/financeiro/${ano}`)
};

export const relatorioService = {
  getMetricas: (ano: number) => api.get(`/relatorios/financeiro/${ano}`),
  
  // IMPORTANTE: responseType 'blob' é essencial para download de arquivos
  exportarExcel: (ano: number, mes?: number) => {
    const url = mes 
      ? `/relatorios/exportar/${ano}/${mes}` 
      : `/relatorios/exportar/${ano}`;
    
    return api.get(url, { responseType: 'blob' });
  }
}

export const empresaService = {
  listar: () => api.get('/empresas/'),
  cadastrar: (dados: { nome: string; cnpj: string }) => api.post('/empresas/', dados),
};