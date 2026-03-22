from pydantic import BaseModel, field_validator
from datetime import datetime

class PesajeCreate(BaseModel):
    peso: float

    @field_validator("peso")
    @classmethod
    def pesoValido(cls, v: float) -> float:
        if v < 0.070:
            raise ValueError("El peso no puede ser menor a 70 gramos.")
        if v > 0.300:
            raise ValueError("El peso no puede ser mayor a 300 gramos.")
        return round(v, 3)

class PesajeManualCreate(BaseModel):
    peso: float
    fecha: datetime

    @field_validator("peso")
    @classmethod
    def pesoValido(cls, v: float) -> float:
        if v < 0.070:
            raise ValueError("El peso no puede ser menor a 70 gramos.")
        if v > 0.300:
            raise ValueError("El peso no puede ser mayor a 300 gramos.")
        return round(v, 3)

class PesajeResponse(BaseModel):
    id: int
    peso: float
    fecha: datetime
