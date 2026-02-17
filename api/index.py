from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import extract
import pandas as pd
import io
from fastapi.responses import StreamingResponse
from datetime import date
from typing import List, Optional
from . import models, schemas, database
from .utils import reports
import os

# Cria as tabelas no banco
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Configuração de CORS - Vercel + Localhost
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    os.getenv("VERCEL_URL", "").replace("https://", "https://"),  # Vercel próprio
]
# Remove URLs vazias
allowed_origins = [url for url in allowed_origins if url]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],  # Fallback se lista vazia
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ROTAS DE EMPRESA ---

@app.post("/empresas/", response_model=schemas.Empresa)
def criar_empresa(empresa: schemas.EmpresaCreate, db: Session = Depends(get_db)):
    if db.query(models.Empresa).filter(models.Empresa.cnpj == empresa.cnpj).first():
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado.")
    nova_empresa = models.Empresa(**empresa.model_dump())
    db.add(nova_empresa)
    db.commit()
    db.refresh(nova_empresa)
    return nova_empresa

@app.get("/empresas/", response_model=List[schemas.Empresa])
def listar_empresas(db: Session = Depends(get_db)):
    return db.query(models.Empresa).all()

# --- ROTAS DE BOLETO ---

@app.get("/boletos/", response_model=List[schemas.Boleto])
def listar_boletos(
    status: Optional[str] = Query(None, pattern="^(pagos|vencidos|abertos|)$"),
    nome_empresa: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Fazemos um JOIN com a tabela Empresa para poder filtrar pelo nome
    query = db.query(models.Boleto).join(models.Empresa)
    hoje = date.today()

    if nome_empresa:
        query = query.filter(models.Empresa.nome.ilike(f"%{nome_empresa}%"))

    if status == "pagos":
        query = query.filter(models.Boleto.data_pagamento != None)
    elif status == "vencidos":
        query = query.filter(models.Boleto.data_pagamento == None, models.Boleto.data_vencimento < hoje)
    elif status == "abertos":
        query = query.filter(models.Boleto.data_pagamento == None, models.Boleto.data_vencimento >= hoje)

    return query.all()

@app.post("/boletos/", response_model=schemas.Boleto)
def criar_boleto(boleto: schemas.BoletoCreate, db: Session = Depends(get_db)):
    # Valida se a empresa existe
    if not db.query(models.Empresa).filter(models.Empresa.id == boleto.empresa_id).first():
        raise HTTPException(status_code=404, detail="Empresa fornecedora não encontrada.")
    
    if db.query(models.Boleto).filter(models.Boleto.codigo_barras == boleto.codigo_barras).first():
        raise HTTPException(status_code=400, detail="Código de barras já cadastrado.")
    
    novo_boleto = models.Boleto(**boleto.model_dump())
    db.add(novo_boleto)
    db.commit()
    db.refresh(novo_boleto)
    return novo_boleto

@app.patch("/boletos/{boleto_id}/pagar", response_model=schemas.Boleto)
def pagar_boleto(boleto_id: int, obj: schemas.BoletoUpdate, db: Session = Depends(get_db)):
    db_boleto = db.query(models.Boleto).filter(models.Boleto.id == boleto_id).first()
    if not db_boleto:
        raise HTTPException(status_code=404, detail="Boleto não encontrado.")
    db_boleto.data_pagamento = obj.data_pagamento
    db.commit()
    db.refresh(db_boleto)
    return db_boleto


@app.get("/relatorios/financeiro/{ano}")
def get_relatorio(ano: int, db: Session = Depends(get_db)):
    return reports.gerar_metricas_financeiras(db, ano)
# --- EXPORTAR RELATÓRIO MENSAL/ANUAL ---

@app.get("/relatorios/exportar/{ano}")
@app.get("/relatorios/exportar/{ano}/{mes}")
def exportar_excel(ano: int, mes: Optional[int] = None, db: Session = Depends(get_db)):
    # 1. Busca os dados com JOIN para ter o nome da empresa
    query = db.query(
        models.Boleto.descricao,
        models.Boleto.valor,
        models.Boleto.data_vencimento,
        models.Boleto.data_pagamento,
        models.Boleto.codigo_barras,
        models.Empresa.nome.label("empresa")
    ).join(models.Empresa)

    # 2. Filtros de data
    if mes:
        query = query.filter(
            extract('year', models.Boleto.data_vencimento) == ano,
            extract('month', models.Boleto.data_vencimento) == mes
        )
        filename = f"Relatorio_Financeiro_{mes}_{ano}.xlsx"
    else:
        query = query.filter(extract('year', models.Boleto.data_vencimento) == ano)
        filename = f"Relatorio_Anual_{ano}.xlsx"

    # 3. Pandas: Criação do DataFrame e Excel
    df = pd.read_sql(query.statement, db.bind)
    
    # Formatação amigável
    df['Status'] = df['data_pagamento'].apply(lambda x: 'Pago' if pd.notnull(x) else 'Pendente')
    df = df[['empresa', 'descricao', 'valor', 'data_vencimento', 'data_pagamento', 'Status', 'codigo_barras']]
    
    # Salva em um buffer na memória (sem criar arquivo físico no servidor)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Relatorio')
    
    output.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')