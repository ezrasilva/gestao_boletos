export function extrairDadosBoleto(codigo44: string) {
  if (codigo44.length !== 44) return null;

  // 1. Extrair Valor (Dígitos 10 a 19)
  const valorRaw = codigo44.substring(9, 19);
  const valorFinal = (parseFloat(valorRaw) / 100).toFixed(2);

  // 2. Extrair Vencimento (Dígitos 06 a 09)
  const fatorVencimento = parseInt(codigo44.substring(5, 9));
  
  if (fatorVencimento === 0) return { valorFinal, dataFormatada: "" };

  const dataBase = new Date('1997-10-07T00:00:00Z');
  
  // Lógica de Ciclo FEBRABAN (Pós-2025)
  // Se o fator for "baixo" (como 1386) e estivermos em 2026, 
  // precisamos tratar o estouro do contador de 4 dígitos.
  let diasAdicionais = fatorVencimento;
  
  // Se a data atual for maior que 22/02/2025, 
  // e o fator for menor que o de 2025, somamos 9000
  const hoje = new Date();
  if (hoje > new Date('2025-02-22') && fatorVencimento < 10000) {
    // A regra da FEBRABAN diz para considerar o fator dentro do ciclo atual
    // Para simplificar: se o cálculo der uma data muito antiga, soma-se 9000 dias.
    diasAdicionais += 9000;
  }

  const dataVencimento = new Date(dataBase.getTime() + diasAdicionais * 24 * 60 * 60 * 1000);
  const dataFormatada = dataVencimento.toISOString().split('T')[0];

  return { valorFinal, dataFormatada };
}