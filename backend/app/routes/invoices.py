from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.database import get_connection
from app.models.invoice import InvoiceCreate
from app.services.invoice_service import create_invoice

router = APIRouter()


@router.get("/")
def list_invoices(
    search: Optional[str] = Query(default=None),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    show_archived: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status_code=400,
            detail="date_from cannot be later than date_to",
        )

    conditions = []
    params = []

    if not show_archived:
        conditions.append("i.archived = FALSE")

    if search:
        search_value = f"%{search.strip()}%"

        conditions.append(
            """
            (
                i.invoice_number ILIKE %s
                OR i.customer_name ILIKE %s
                OR i.customer_phone ILIKE %s
                OR d.model ILIKE %s
                OR d.imei ILIKE %s
            )
            """
        )

        params.extend(
            [
                search_value,
                search_value,
                search_value,
                search_value,
                search_value,
            ]
        )

    if date_from:
        conditions.append("i.date::date >= %s")
        params.append(date_from)

    if date_to:
        conditions.append("i.date::date <= %s")
        params.append(date_to)

    where_clause = " AND ".join(conditions)

    if where_clause:
        where_clause = f"WHERE {where_clause}"

    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:

                cursor.execute(
                    f"""
                    SELECT COUNT(*)
                    FROM invoices i
                    LEFT JOIN devices d
                        ON d.invoice_id = i.id
                    {where_clause}
                    """,
                    tuple(params),
                )

                count = cursor.fetchone()[0]

                cursor.execute(
                    f"""
                    SELECT
                        i.id,
                        i.invoice_number,
                        i.date,
                        i.time,
                        i.customer_name,
                        i.customer_phone,
                        i.subtotal,
                        i.cgst,
                        i.sgst,
                        i.total_tax,
                        i.grand_total,
                        i.payment_method,
                        i.salesperson,
                        i.status,
                        i.archived,
                        d.model,
                        d.imei
                    FROM invoices i
                    LEFT JOIN devices d
                        ON d.invoice_id = i.id
                    {where_clause}
                    ORDER BY i.date DESC, i.created_at DESC
                    LIMIT %s
                    OFFSET %s
                    """,
                    tuple(params) + (limit, offset),
                )

                rows = cursor.fetchall()

        invoices = []

        for row in rows:
            invoices.append(
                {
                    "id": str(row[0]),
                    "invoice_number": row[1],
                    "date": row[2].isoformat()
                    if hasattr(row[2], "isoformat")
                    else str(row[2]),
                    "time": str(row[3]),
                    "customer_name": row[4],
                    "customer_phone": row[5],
                    "subtotal": float(row[6]),
                    "cgst": float(row[7]),
                    "sgst": float(row[8]),
                    "total_tax": float(row[9]),
                    "grand_total": float(row[10]),
                    "payment_method": row[11],
                    "salesperson": row[12],
                    "status": row[13],
                    "archived": row[14],
                    "model": row[15],
                    "imei": row[16],
                }
            )

        return {
            "count": count,
            "limit": limit,
            "offset": offset,
            "invoices": invoices,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.get("/{invoice_id}")
def get_invoice(invoice_id: str):
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        invoice_number,
                        date,
                        time,
                        customer_id,
                        customer_name,
                        customer_phone,
                        customer_address,
                        customer_gstin,
                        customer_place_of_supply,
                        subtotal,
                        cgst,
                        sgst,
                        total_tax,
                        grand_total,
                        payment_method,
                        notes,
                        status,
                        salesperson,
                        archived,
                        created_at
                    FROM invoices
                    WHERE id = %s
                    """,
                    (invoice_id,),
                )

                invoice = cursor.fetchone()

                if not invoice:
                    raise HTTPException(
                        status_code=404,
                        detail="Invoice not found",
                    )

                cursor.execute(
                    """
                    SELECT
                        id,
                        model,
                        color,
                        imei,
                        serial_number,
                        issue_description
                    FROM devices
                    WHERE invoice_id = %s
                    LIMIT 1
                    """,
                    (invoice_id,),
                )

                device = cursor.fetchone()

                cursor.execute(
                    """
                    SELECT
                        id,
                        description,
                        hsn_sac,
                        quantity,
                        rate,
                        gst_percent,
                        amount
                    FROM invoice_items
                    WHERE invoice_id = %s
                    ORDER BY id
                    """,
                    (invoice_id,),
                )

                item_rows = cursor.fetchall()

        return {
            "id": str(invoice[0]),
            "invoice_number": invoice[1],
            "date": invoice[2].isoformat()
            if hasattr(invoice[2], "isoformat")
            else str(invoice[2]),
            "time": str(invoice[3]),
            "customer": {
                "id": str(invoice[4]),
                "name": invoice[5],
                "phone": invoice[6],
                "address": invoice[7],
                "gstin": invoice[8],
                "place_of_supply": invoice[9],
            },
            "device": (
                {
                    "model": device[1],
                    "color": device[2],
                    "imei": device[3],
                    "serial_number": device[4],
                    "issue_description": device[5],
                }
                if device
                else None
            ),
            "items": [
                {
                    "id": str(row[0]),
                    "description": row[1],
                    "hsn_sac": row[2],
                    "quantity": float(row[3]),
                    "rate": float(row[4]),
                    "gst_percent": float(row[5]),
                    "amount": float(row[6]),
                }
                for row in item_rows
            ],
            "subtotal": float(invoice[10]),
            "cgst": float(invoice[11]),
            "sgst": float(invoice[12]),
            "total_tax": float(invoice[13]),
            "grand_total": float(invoice[14]),
            "payment_method": invoice[15],
            "notes": invoice[16],
            "status": invoice[17],
            "salesperson": invoice[18],
            "archived": invoice[19],
            "created_at": invoice[20].isoformat()
            if hasattr(invoice[20], "isoformat")
            else str(invoice[20]),
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.post("/")
def create_new_invoice(invoice: InvoiceCreate):
    try:
        return create_invoice(invoice)

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.patch("/{invoice_id}/archive")
def archive_invoice(invoice_id: str):
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    UPDATE invoices
                    SET archived = TRUE,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING
                        id,
                        invoice_number,
                        archived
                    """,
                    (invoice_id,),
                )

                row = cursor.fetchone()

                if not row:
                    raise HTTPException(
                        status_code=404,
                        detail="Invoice not found",
                    )

        return {
            "id": str(row[0]),
            "invoice_number": row[1],
            "archived": row[2],
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )