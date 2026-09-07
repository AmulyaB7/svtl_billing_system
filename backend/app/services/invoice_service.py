from datetime import datetime
from zoneinfo import ZoneInfo

from app.database import get_connection


CGST_PERCENT = 9
SGST_PERCENT = 9
GST_PERCENT = 18

INDIA_TIMEZONE = ZoneInfo("Asia/Kolkata")


def generate_invoice_number(cursor):
    current_time = datetime.now(INDIA_TIMEZONE)
    year = current_time.year
    year_short = current_time.strftime("%y")

    cursor.execute(
        """
        INSERT INTO invoice_sequences (year, last_number)
        VALUES (%s, 1)
        ON CONFLICT (year)
        DO UPDATE SET
            last_number = invoice_sequences.last_number + 1
        RETURNING last_number
        """,
        (year,),
    )

    number = cursor.fetchone()[0]

    return f"INV-{year_short}-{number:05d}"


def get_or_create_customer(cursor, customer):
    cursor.execute(
        """
        SELECT id
        FROM customers
        WHERE phone = %s
          AND name = %s
          AND address = %s
          AND COALESCE(gstin, '') = COALESCE(%s, '')
          AND place_of_supply = %s
        LIMIT 1
        """,
        (
            customer.phone,
            customer.name,
            customer.address,
            customer.gstin,
            customer.place_of_supply,
        ),
    )

    row = cursor.fetchone()

    if row:
        return row[0]

    cursor.execute(
        """
        INSERT INTO customers (
            name,
            phone,
            address,
            gstin,
            place_of_supply
        )
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            customer.name,
            customer.phone,
            customer.address,
            customer.gstin,
            customer.place_of_supply,
        ),
    )

    return cursor.fetchone()[0]


def create_invoice(invoice_data):
    customer = invoice_data.customer
    device = invoice_data.device
    items = invoice_data.items

    if not items:
        raise ValueError("At least one invoice item is required")

    subtotal = 0
    calculated_items = []

    for item in items:
        gst_inclusive_amount = round(item.quantity * item.rate, 2)

        taxable_amount = round(
            gst_inclusive_amount / (1 + GST_PERCENT / 100),
            2,
        )

        subtotal += taxable_amount

        calculated_items.append(
            {
                "description": item.description,
                "hsn_sac": item.hsn_sac,
                "quantity": item.quantity,
                "rate": taxable_amount / item.quantity,
                "gst_percent": GST_PERCENT,
                "amount": taxable_amount,
            }
        )

    subtotal = round(subtotal, 2)

    cgst = round(subtotal * CGST_PERCENT / 100, 2)
    sgst = round(subtotal * SGST_PERCENT / 100, 2)
    total_tax = round(cgst + sgst, 2)

    grand_total = round(subtotal + total_tax, 2)

    entered_total = round(
        sum(item.quantity * item.rate for item in items),
        2,
    )

    rounding_difference = round(entered_total - grand_total, 2)

    if rounding_difference != 0:
        sgst = round(sgst + rounding_difference, 2)
        total_tax = round(cgst + sgst, 2)
        grand_total = round(subtotal + total_tax, 2)

    current_time = datetime.now(INDIA_TIMEZONE)

    with get_connection() as connection:
        with connection.cursor() as cursor:

            invoice_number = generate_invoice_number(cursor)

            customer_id = get_or_create_customer(cursor, customer)

            cursor.execute(
                """
                INSERT INTO invoices (
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
                    salesperson
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                RETURNING id
                """,
                (
                    invoice_number,
                    current_time,
                    current_time.strftime("%H:%M:%S"),
                    customer_id,
                    customer.name,
                    customer.phone,
                    customer.address,
                    customer.gstin,
                    customer.place_of_supply,
                    subtotal,
                    cgst,
                    sgst,
                    total_tax,
                    grand_total,
                    invoice_data.payment_method,
                    invoice_data.notes,
                    "completed",
                    invoice_data.salesperson,
                ),
            )

            invoice_id = cursor.fetchone()[0]

            cursor.execute(
                """
                INSERT INTO devices (
                    invoice_id,
                    model,
                    color,
                    imei,
                    serial_number,
                    issue_description
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    invoice_id,
                    device.model,
                    device.color,
                    device.imei,
                    device.serial_number,
                    device.issue_description,
                ),
            )

            for item in calculated_items:
                cursor.execute(
                    """
                    INSERT INTO invoice_items (
                        invoice_id,
                        description,
                        hsn_sac,
                        quantity,
                        rate,
                        gst_percent,
                        amount
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        invoice_id,
                        item["description"],
                        item["hsn_sac"],
                        item["quantity"],
                        item["rate"],
                        item["gst_percent"],
                        item["amount"],
                    ),
                )

    return {
        "invoice_id": invoice_id,
        "invoice_number": invoice_number,
        "subtotal": subtotal,
        "cgst": cgst,
        "sgst": sgst,
        "total_tax": total_tax,
        "grand_total": grand_total,
    }