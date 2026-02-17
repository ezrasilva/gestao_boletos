from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional, List

# --- Esquemas da Empresa ---
class EmpresaBase(BaseModel):
    nome: str
    cnpj: str

class EmpresaCreate(EmpresaBase):
    pass

class Empresa(EmpresaBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

# --- Esquemas do Boleto ---
class BoletoBase(BaseModel):
    descricao: str
    valor: float
    data_vencimento: date
    codigo_barras: str
    empresa_id: int # Chave estrangeira obrigatória

class BoletoCreate(BoletoBase):
    data_pagamento: Optional[date] = None

# ESTE É O QUE ESTAVA FALTANDO:
class BoletoUpdate(BaseModel):
    data_pagamento: date

class Boleto(BoletoBase):
    id: int
    data_pagamento: Optional[date] = None
    empresa: Empresa # Retorna os dados da empresa junto com o boleto
    
    model_config = ConfigDict(from_attributes=True)