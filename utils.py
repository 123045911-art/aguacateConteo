import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from fastapi.responses import StreamingResponse

MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

def formatoPeso(kg: float) -> str:
    gramos = round(kg * 1000)
    return f"{gramos}g"

def generarReportePdf(registros, mesReporte, anioReporte):
    nombreMesArchivo = MESES[mesReporte - 1].lower()
    ahora = datetime.now()
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    titleStyle = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=20,
        textColor=colors.HexColor("#2d5a27"),
        spaceAfter=20,
        alignment=TA_CENTER,
    )
    subtitleStyle = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=12,
        textColor=colors.HexColor("#8b4513"),
        alignment=TA_CENTER,
        spaceAfter=12,
    )

    elements = []

    # Title
    elements.append(Paragraph("Reporte de Pesaje de Aguacates", titleStyle))
    elements.append(
        Paragraph(
            f"{MESES[mesReporte - 1]} {anioReporte}",
            subtitleStyle,
        )
    )
    elements.append(Spacer(1, 12))

    # Table
    data = [["ID", "Peso (g)", "Fecha y Hora"]]
    for i, r in enumerate(registros, start=1):
        dt = datetime.fromisoformat(r["fecha"].replace("Z", "+00:00"))
        data.append([
            str(i),
            formatoPeso(r["peso"]),
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
    
    mediaG = round(media * 1000)
    sumaG = round(suma * 1000)
    
    if sumaG >= 1000:
        sumaStr = f"{sumaG / 1000:.3f} kg"
    else:
        sumaStr = f"{sumaG} g"

    avgStyle = ParagraphStyle(
        "Average",
        parent=styles["Normal"],
        fontSize=12,
        textColor=colors.HexColor("#2d5a27"),
        alignment=TA_CENTER,
        spaceAfter=8,
    )
    elements.append(
        Paragraph(
            f"<b>Total Acumulado:</b> {sumaStr} <br/> <b>Media:</b> {mediaG} g por unidad ({len(registros)} registros)",
            avgStyle,
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
    return buffer, nombreMesArchivo
