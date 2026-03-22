import os
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security.api_key import APIKeyHeader
from dotenv import load_dotenv
from supabase import create_client, Client

from models import PesajeCreate, PesajeManualCreate, PesajeResponse
from utils import formatoPeso, generarReportePdf, MESES

# Load environment variables
load_dotenv(override=True)

supabaseUrl = os.getenv("SUPABASE_URL", "")
supabaseKey = os.getenv("SUPABASE_KEY", "")
adminApiKey = os.getenv("ADMIN_API_KEY") # No default value for security

if not adminApiKey:
    raise RuntimeError("CRITICAL: ADMIN_API_KEY must be set in the environment variables.")

if not supabaseUrl or not supabaseKey:
    print("WARNING: SUPABASE_URL and SUPABASE_KEY must be set in the .env file")

# Initialize Supabase client
supabase: Client = create_client(supabaseUrl, supabaseKey) if supabaseUrl and supabaseKey else None

apiKeyHeader = APIKeyHeader(name="X-API-KEY", auto_error=False)

def getApiKey(apiHeader: str = Security(apiKeyHeader)):
    if apiHeader == adminApiKey:
        return apiHeader
    raise HTTPException(
        status_code=403,
        detail="No autorizado: API Key inválida o faltante"
    )

app = FastAPI(title="Sistema de Pesaje de Aguacates (Supabase)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def requireDb():
    if not supabase:
        raise HTTPException(status_code=500, detail="La base de datos (Supabase) no está configurada. Verifica el archivo .env")

@app.get("/health")
def healthCheck():
    return {"status": "ok"}

@app.post("/pesaje", response_model=PesajeResponse)
def registrarPesaje(data: PesajeCreate, apiKey: str = Depends(getApiKey)):
    requireDb()
    response = supabase.table("pesajes").insert({
        "peso": data.peso,
        "fila": data.fila,
        "arbol": data.arbol
    }).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Error al insertar en Supabase")
    return response.data[0]

@app.post("/pesaje/manual", response_model=PesajeResponse)
def registrarPesajeManual(data: PesajeManualCreate, apiKey: str = Depends(getApiKey)):
    requireDb()
    fechaStr = data.fecha.strftime("%Y-%m-%dT%H:%M:%SZ")
    response = supabase.table("pesajes").insert({
        "peso": data.peso, 
        "fecha": fechaStr,
        "fila": data.fila,
        "arbol": data.arbol
    }).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Error al insertar en Supabase")
    return response.data[0]

@app.get("/media")
def obtenerMedia(mes: int = Query(None), anio: int = Query(None)):
    requireDb()
    ahora = datetime.now()
    mesFiltro = mes if mes is not None else ahora.month
    anioFiltro = anio if anio is not None else ahora.year

    inicioStr = f"{anioFiltro}-{mesFiltro:02d}-01T00:00:00Z"
    if mesFiltro == 12:
        finStr = f"{anioFiltro + 1}-01-01T00:00:00Z"
    else:
        finStr = f"{anioFiltro}-{mesFiltro + 1:02d}-01T00:00:00Z"

    response = (
        supabase.table("pesajes")
        .select("peso")
        .gte("fecha", inicioStr)
        .lt("fecha", finStr)
        .execute()
    )
    
    registros = response.data
    if not registros:
        return {"media": 0, "total": 0, "suma": 0}
        
    suma = sum(r["peso"] for r in registros)
    media = suma / len(registros)
    return {"media": round(media, 3), "total": len(registros), "suma": round(suma, 3)}

@app.get("/meses")
def listarMeses():
    requireDb()
    response = supabase.table("pesajes").select("fecha").execute()
    
    agrupados = set()
    for r in response.data:
        dt = datetime.fromisoformat(r["fecha"].replace("Z", "+00:00"))
        agrupados.add((dt.year, dt.month))
        
    ordenados = sorted(list(agrupados), key=lambda x: (x[0], x[1]), reverse=True)
    
    mesesList = []
    for anio, mes in ordenados:
        mesesList.append({
            "anio": anio,
            "mes": mes,
            "nombre": f"{MESES[mes - 1]} {anio}",
        })
    return mesesList

@app.delete("/reset")
def eliminarDatos(apiKey: str = Depends(getApiKey)):
    requireDb()
    response = supabase.table("pesajes").delete().neq("id", 0).execute()
    eliminados = len(response.data) if response.data else 0
    return {"mensaje": f"Se eliminaron {eliminados} registros en Supabase.", "eliminados": eliminados}

@app.get("/reporte")
def generarReporte(mes: int = Query(None), anio: int = Query(None)):
    requireDb()
    ahora = datetime.now()
    mesReporte = mes if mes else ahora.month
    anioReporte = anio if anio else ahora.year

    inicioStr = f"{anioReporte}-{mesReporte:02d}-01T00:00:00Z"
    if mesReporte == 12:
        finStr = f"{anioReporte + 1}-01-01T00:00:00Z"
    else:
        finStr = f"{anioReporte}-{mesReporte + 1:02d}-01T00:00:00Z"

    response = (
        supabase.table("pesajes")
        .select("*")
        .gte("fecha", inicioStr)
        .lt("fecha", finStr)
        .order("fecha")
        .execute()
    )
    
    registros = response.data
    if not registros:
        raise HTTPException(
            status_code=404,
            detail=f"No hay registros para {MESES[mesReporte - 1]} {anioReporte}.",
        )

    buffer, nombreMesArchivo = generarReportePdf(registros, mesReporte, anioReporte)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=reporte_{nombreMesArchivo}_{anioReporte}.pdf"
        },
    )

@app.get("/dashboard/stats")
def obtenerStatsDashboard(period: str = Query("month")):
    requireDb()
    if period not in ["month", "year"]:
        period = "month"

    response = supabase.rpc("get_dashboard_stats", {"p_period": period}).execute()
    
    if not response.data:
        return {"graph_data": [], "top_five": [], "period": period}

    graphData = response.data
    for item in graphData:
        item["media"] = round(item["media"], 1)

    topFive = sorted(graphData, key=lambda x: x["media"], reverse=True)[:5]

    if period == "month":
        graphData = graphData[-12:]
    elif period == "year":
        graphData = graphData[-5:]

    return {
        "graph_data": graphData, 
        "top_five": topFive, 
        "period": period
    }