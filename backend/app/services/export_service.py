import io
import csv
from datetime import datetime, date
from typing import List, Optional
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from backend.app.models.transaction import Transaction
from backend.app.models.user import User

def generate_csv_report(transactions: List[Transaction]) -> io.BytesIO:
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers matching Section 15
    headers = [
        "Date", "Time", "Provider/Bank", "Reference Number", "Invoice Number",
        "Amount (ETB)", "Payer", "Receiver", "Payment Type", "Waiter", "Branch", "Status"
    ]
    writer.writerow(headers)
    
    total_amount = 0.0
    for tx in transactions:
        amt = float(tx.amount or 0.0)
        total_amount += amt
        writer.writerow([
            str(tx.payment_date or ""),
            tx.payment_time or "",
            tx.provider_display_name or tx.provider,
            tx.reference_number or "",
            tx.invoice_number or "",
            f"{amt:.2f}",
            tx.payer_name or "",
            tx.receiver_name or "",
            tx.payment_type or "",
            tx.scanned_by_user.full_name if tx.scanned_by_user else "",
            tx.branch.name if tx.branch else "",
            tx.receipt_status.value if hasattr(tx.receipt_status, "value") else str(tx.receipt_status)
        ])
        
    writer.writerow([])
    writer.writerow(["TOTAL", "", "", "", "", f"{total_amount:.2f}", "", "", "", "", "", ""])
    
    bytes_io = io.BytesIO()
    bytes_io.write(output.getvalue().encode("utf-8"))
    bytes_io.seek(0)
    return bytes_io

def generate_excel_report(
    transactions: List[Transaction],
    restaurant_name: str,
    period_title: str
) -> io.BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "Transactions Report"
    ws.views.sheetView[0].showGridLines = True

    # Colors
    header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid") # Dark Blue
    sub_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    total_fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
    
    title_font = Font(name="Calibri", size=16, bold=True, color="1E3A8A")
    meta_font = Font(name="Calibri", size=11, color="475569")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    bold_font = Font(name="Calibri", size=11, bold=True)
    regular_font = Font(name="Calibri", size=11)

    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    # Title & Metadata
    ws["A1"] = f"PayVerify Ethiopia - {restaurant_name}"
    ws["A1"].font = title_font
    ws["A2"] = f"Report Period: {period_title} | Generated: {datetime.now().strftime('%d %b %Y %I:%M %p')}"
    ws["A2"].font = meta_font

    total_amount = sum(float(tx.amount or 0.0) for tx in transactions)
    ws["A3"] = f"Total Transactions: {len(transactions)} | Total Revenue: {total_amount:,.2f} ETB"
    ws["A3"].font = bold_font

    headers = [
        "Date", "Time", "Provider/Bank", "Reference No.", "Invoice No.",
        "Amount (ETB)", "Payer", "Receiver", "Payment Type", "Waiter", "Branch", "Status"
    ]
    
    start_row = 5
    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=start_row, column=col_idx, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    current_row = start_row + 1
    for tx in transactions:
        amt = float(tx.amount or 0.0)
        row_values = [
            str(tx.payment_date or ""),
            tx.payment_time or "",
            tx.provider_display_name or tx.provider,
            tx.reference_number or "-",
            tx.invoice_number or "-",
            amt,
            tx.payer_name or "-",
            tx.receiver_name or "-",
            tx.payment_type or "-",
            tx.scanned_by_user.full_name if tx.scanned_by_user else "-",
            tx.branch.name if tx.branch else "-",
            tx.receipt_status.value if hasattr(tx.receipt_status, "value") else str(tx.receipt_status)
        ]
        
        for col_idx, val in enumerate(row_values, 1):
            cell = ws.cell(row=current_row, column=col_idx, value=val)
            cell.font = regular_font
            cell.border = thin_border
            if col_idx == 6:  # Amount
                cell.number_format = "#,##0.00"
                cell.alignment = Alignment(horizontal="right")
            elif col_idx in (1, 2, 12):
                cell.alignment = Alignment(horizontal="center")
        current_row += 1

    # Total Row
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=5)
    total_label_cell = ws.cell(row=current_row, column=1, value="TOTAL:")
    total_label_cell.font = bold_font
    total_label_cell.alignment = Alignment(horizontal="right")
    
    total_amt_cell = ws.cell(row=current_row, column=6, value=total_amount)
    total_amt_cell.font = bold_font
    total_amt_cell.number_format = "#,##0.00"
    total_amt_cell.alignment = Alignment(horizontal="right")
    
    for c in range(1, len(headers) + 1):
        cell = ws.cell(row=current_row, column=c)
        cell.fill = total_fill
        cell.border = thin_border

    # Auto-adjust column widths
    for col in ws.columns:
        max_len = 0
        col_letter = col[0].column_letter
        for cell in col:
            if cell.value:
                max_len = max(max_len, len(str(cell.value)))
        ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output

def generate_pdf_report(
    transactions: List[Transaction],
    restaurant_name: str,
    branch_name: Optional[str],
    period_title: str
) -> io.BytesIO:
    output = io.BytesIO()
    doc = SimpleDocTemplate(
        output,
        pagesize=landscape(letter),
        leftMargin=30,
        rightMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor("#1E3A8A"),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#475569"),
        spaceAfter=15
    )
    cell_style = ParagraphStyle(
        'DocCell',
        parent=styles['Normal'],
        fontSize=8,
        leading=10
    )
    cell_bold = ParagraphStyle(
        'DocCellBold',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        fontName="Helvetica-Bold"
    )

    elements = []
    
    # Title & Subtitle
    elements.append(Paragraph(f"PayVerify Ethiopia — {restaurant_name}", title_style))
    branch_str = f"Branch: {branch_name} | " if branch_name else ""
    elements.append(
        Paragraph(
            f"{branch_str}Period: {period_title} | Generated: {datetime.now().strftime('%d %b %Y %I:%M %p')}",
            subtitle_style
        )
    )

    # Table Header
    table_data = [
        ["Date", "Time", "Provider", "Reference No.", "Amount", "Payer", "Receiver", "Waiter", "Branch", "Status"]
    ]
    
    total_amount = 0.0
    for tx in transactions:
        amt = float(tx.amount or 0.0)
        total_amount += amt
        table_data.append([
            str(tx.payment_date or ""),
            tx.payment_time or "",
            tx.provider_display_name or tx.provider,
            tx.reference_number or "-",
            f"{amt:,.2f} ETB",
            tx.payer_name or "-",
            tx.receiver_name or "-",
            tx.scanned_by_user.full_name if tx.scanned_by_user else "-",
            tx.branch.name if tx.branch else "-",
            tx.receipt_status.value if hasattr(tx.receipt_status, "value") else str(tx.receipt_status)
        ])

    # Table Totals Row
    table_data.append([
        "TOTAL", "", "", f"{len(transactions)} txs", f"{total_amount:,.2f} ETB", "", "", "", "", ""
    ])

    col_widths = [60, 55, 80, 85, 80, 85, 85, 75, 65, 65]
    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    t_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (4, 0), (4, -1), 'RIGHT'),
        ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -2), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor("#F8FAFC")]),
        # Total row styling
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#E2E8F0")),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 9),
        ('TOPPADDING', (0, -1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 6),
    ])
    t.setStyle(t_style)
    elements.append(t)
    
    doc.build(elements)
    output.seek(0)
    return output
