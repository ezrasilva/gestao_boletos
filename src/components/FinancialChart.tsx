import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function FinancialChart({ data }: { data: any }) {
  // Transforma o objeto do Pandas em um array que o Recharts entende
  const chartData = (data && data.detalhe_mensal) 
    ? Object.entries(data.detalhe_mensal).map(([mes, valores]: any) => ({
        name: `Mês ${mes}`,
        total: valores.total_valor,
        quantidade: valores.quantidade
      })) 
    : [];

  if (!chartData.length) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}