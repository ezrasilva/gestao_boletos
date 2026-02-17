import pandas as pd
from sqlalchemy.orm import Session
from ..models import Boleto, Empresa

def gerar_metricas_financeiras(db: Session, ano: int):
    # Fazemos um JOIN para pegar o nome da empresa na consulta
    query = db.query(
        Boleto.valor,
        Boleto.data_vencimento,
        Boleto.data_pagamento,
        Empresa.nome.label("nome_empresa")
    ).join(Empresa).filter(
        Boleto.data_vencimento >= f"{ano}-01-01",
        Boleto.data_vencimento <= f"{ano}-12-31"
    )
    
    df = pd.read_sql(query.statement, db.bind)
    
    if df.empty:
        return {"mensagem": "Sem dados"}

    df['data_vencimento'] = pd.to_datetime(df['data_vencimento'])
    
    relatorio_mensal = df.groupby(df['data_vencimento'].dt.month).agg(
        total_valor=('valor', 'sum'),
        quantidade=('valor', 'count'),
        pagos=('data_pagamento', lambda x: x.notnull().sum())
    ).to_dict(orient="index")

    top_empresas = df.groupby('nome_empresa')['valor'].sum().sort_values(ascending=False).head(5).to_dict()

    return {
        "ano": ano,
        "detalhe_mensal": relatorio_mensal,
        "top_5_fornecedores": top_empresas
    }