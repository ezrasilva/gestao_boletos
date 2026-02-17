from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    cnpj = Column(String, unique=True, index=True)
    
    # Relacionamento: Uma empresa pode ter vários boletos
    boletos = relationship("Boleto", back_populates="empresa")

class Boleto(Base):
    __tablename__ = "boletos"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String)
    valor = Column(Float)
    data_vencimento = Column(Date, index=True)
    data_pagamento = Column(Date, nullable=True)
    codigo_barras = Column(String, unique=True)
    criado_em = Column(DateTime, default=datetime.datetime.utcnow)

    # Chave Estrangeira para a Empresa
    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    empresa = relationship("Empresa", back_populates="boletos")