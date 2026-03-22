import os
from datetime import datetime
from io import BytesIO
import random
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv
from supabase import create_client, Client
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from fastapi import Security, Depends
from fastapi.security.api_key import APIKeyHeader

# Load environment variables
load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "aguacate123") # Valor por defecto si no hay .env
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")
# Nota: Si necesitas wildcards en Vercel, deberías usar allow_origin_regex o listar los dominios exactos.

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: SUPABASE_URL and SUPABASE_KEY must be set in the .env file")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

def get_api_key(api_header: str = Security(api_key_header)):
    if api_header == ADMIN_API_KEY:
        return api_header
    raise HTTPException(
        status_code=403,
        detail="No autorizado: API Key inválida o faltante"
    )

MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]


class PesajeCreate(BaseModel):
    peso: float

    @field_validator("peso")
    @classmethod
    def peso_valido(cls, v: float) -> float:
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
    def peso_valido(cls, v: float) -> float:
        if v < 0.070:
            raise ValueError("El peso no puede ser menor a 70 gramos.")
        if v > 0.300:
            raise ValueError("El peso no puede ser mayor a 300 gramos.")
        return round(v, 3)


class PesajeResponse(BaseModel):
    id: int
    peso: float
    fecha: datetime


app = FastAPI(title="Sistema de Pesaje de Aguacates (Supabase)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def formato_peso(kg: float) -> str:
    gramos = round(kg * 1000)
    return f"{gramos}g"


def require_db():
    if not supabase:
        raise HTTPException(status_code=500, detail="La base de datos (Supabase) no está configurada. Verifica el archivo .env")

# Health Check for Render
@app.get("/health")
def health_check():
    return {"status": "ok"}


# Endpoints
@app.post("/pesaje", response_model=PesajeResponse)
def registrar_pesaje(data: PesajeCreate, api_key: str = Depends(get_api_key)):
    require_db()
    response = supabase.table("pesajes").insert({"peso": data.peso}).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Error al insertar en Supabase")
    return response.data[0]


@app.post("/pesaje/manual", response_model=PesajeResponse)
def registrar_pesaje_manual(data: PesajeManualCreate, api_key: str = Depends(get_api_key)):
    require_db()
    # format date for Postgres
    fecha_str = data.fecha.strftime("%Y-%m-%dT%H:%M:%SZ")
    response = supabase.table("pesajes").insert({"peso": data.peso, "fecha": fecha_str}).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Error al insertar en Supabase")
    return response.data[0]


@app.get("/media")
def obtener_media(mes: int = Query(None), anio: int = Query(None)):
    require_db()
    ahora = datetime.now()
    mes_filtro = mes if mes is not None else ahora.month
    anio_filtro = anio if anio is not None else ahora.year

    inicio_str = f"{anio_filtro}-{mes_filtro:02d}-01T00:00:00Z"
    if mes_filtro == 12:
        fin_str = f"{anio_filtro + 1}-01-01T00:00:00Z"
    else:
        fin_str = f"{anio_filtro}-{mes_filtro + 1:02d}-01T00:00:00Z"

    response = (
        supabase.table("pesajes")
        .select("peso")
        .gte("fecha", inicio_str)
        .lt("fecha", fin_str)
        .execute()
    )
    
    registros = response.data
    if not registros:
        return {"media": 0, "total": 0, "suma": 0}
        
    suma = sum(r["peso"] for r in registros)
    media = suma / len(registros)
    return {"media": round(media, 3), "total": len(registros), "suma": round(suma, 3)}


@app.get("/meses")
def listar_meses():
    require_db()
    response = supabase.table("pesajes").select("fecha").execute()
    
    agrupados = set()
    for r in response.data:
        dt = datetime.fromisoformat(r["fecha"].replace("Z", "+00:00"))
        agrupados.add((dt.year, dt.month))
        
    # Sort descending
    ordenados = sorted(list(agrupados), key=lambda x: (x[0], x[1]), reverse=True)
    
    meses_list = []
    for anio, mes in ordenados:
        meses_list.append({
            "anio": anio,
            "mes": mes,
            "nombre": f"{MESES[mes - 1]} {anio}",
        })
    return meses_list




@app.delete("/reset")
def eliminar_datos(api_key: str = Depends(get_api_key)):
    require_db()
    # Supabase .delete() requires a condition. We use neq(id, 0) to delete everything since id starts at 1
    response = supabase.table("pesajes").delete().neq("id", 0).execute()
    eliminados = len(response.data) if response.data else 0
    return {"mensaje": f"Se eliminaron {eliminados} registros en Supabase.", "eliminados": eliminados}


@app.get("/reporte")
def generar_reporte(mes: int = Query(None), anio: int = Query(None)):
    require_db()
    ahora = datetime.now()
    mes_reporte = mes if mes else ahora.month
    anio_reporte = anio if anio else ahora.year
    nombre_mes_archivo = MESES[mes_reporte - 1].lower()

    inicio_str = f"{anio_reporte}-{mes_reporte:02d}-01T00:00:00Z"
    if mes_reporte == 12:
        fin_str = f"{anio_reporte + 1}-01-01T00:00:00Z"
    else:
        fin_str = f"{anio_reporte}-{mes_reporte + 1:02d}-01T00:00:00Z"

    response = (
        supabase.table("pesajes")
        .select("*")
        .gte("fecha", inicio_str)
        .lt("fecha", fin_str)
        .order("fecha")
        .execute()
    )
    
    registros = response.data

    if not registros:
        raise HTTPException(
            status_code=404,
            detail=f"No hay registros para {MESES[mes_reporte - 1]} {anio_reporte}.",
        )

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=20,
        textColor=colors.HexColor("#2d5a27"),
        spaceAfter=20,
        alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=12,
        textColor=colors.HexColor("#8b4513"),
        alignment=TA_CENTER,
        spaceAfter=12,
    )

    elements = []

    # Title
    elements.append(Paragraph("Reporte de Pesaje de Aguacates", title_style))
    elements.append(
        Paragraph(
            f"{MESES[mes_reporte - 1]} {anio_reporte}",
            subtitle_style,
        )
    )
    elements.append(Spacer(1, 12))

    # Table
    data = [["ID", "Peso (g)", "Fecha y Hora"]]
    for i, r in enumerate(registros, start=1):
        dt = datetime.fromisoformat(r["fecha"].replace("Z", "+00:00"))
        data.append([
            str(i),
            formato_peso(r["peso"]),
            dt.strftime("%d/%m/%Y %H:%M:%S"),
        ])

    table = Table(data, colWidths=[1 * inch, 2 * inch, 3 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2d5a27")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 11),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f4f1de")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f4f1de"), colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#8b4513")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 20))

    # Average and Totals
    media = sum(r["peso"] for r in registros) / len(registros)
    suma = sum(r["peso"] for r in registros)
    
    media_g = round(media * 1000)
    suma_g = round(suma * 1000)
    
    if suma_g >= 1000:
        suma_str = f"{suma_g / 1000:.3f} kg"
    else:
        suma_str = f"{suma_g} g"

    avg_style = ParagraphStyle(
        "Average",
        parent=styles["Normal"],
        fontSize=12,
        textColor=colors.HexColor("#2d5a27"),
        alignment=TA_CENTER,
        spaceAfter=8,
    )
    elements.append(
        Paragraph(
            f"<b>Total Acumulado:</b> {suma_str} <br/> <b>Media:</b> {media_g} g por unidad ({len(registros)} registros)",
            avg_style,
        )
    )
    elements.append(Spacer(1, 12))

    # Generation date
    elements.append(
        Paragraph(
            f"<i>Reporte generado el {ahora.strftime('%d/%m/%Y a las %H:%M:%S')}</i>",
            ParagraphStyle("Footer", parent=styles["Normal"], fontSize=9, alignment=TA_CENTER, textColor=colors.grey),
        )
    )

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=reporte_{nombre_mes_archivo}_{anio_reporte}.pdf"
        },
    )


@app.get("/dashboard/stats")
def obtener_stats_dashboard(period: str = Query("month")):
    require_db()
    
    # Validar periodo
    if period not in ["month", "year"]:
        period = "month"

    # Llamamos a la función RPC de Supabase para obtener estadísticas pre-calculadas
    response = supabase.rpc("get_dashboard_stats", {"p_period": period}).execute()
    
    if not response.data:
        return {"graph_data": [], "top_five": [], "period": period}

    graph_data = response.data
    
    # Ordenar y formatear etiquetas si es necesario (ya viene casi listo de SQL)
    for item in graph_data:
        item["media"] = round(item["media"], 1)
        # El label ya viene formateado desde SQL

    # Top 5 basado en media
    top_five = sorted(graph_data, key=lambda x: x["media"], reverse=True)[:5]

    # Limitar datos del gráfico según el periodo
    if period == "month":
        graph_data = graph_data[-12:] # Últimos 12 meses
    elif period == "year":
        graph_data = graph_data[-5:] # Últimos 5 años

    return {
        "graph_data": graph_data, 
        "top_five": top_five, 
        "period": period
    }