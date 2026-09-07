from fastapi import APIRouter, HTTPException

from app.database import get_connection

router = APIRouter()


@router.get("/")
def get_settings():
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        id,
                        business_name,
                        address,
                        gstin,
                        email,
                        phone,
                        default_place_of_supply,
                        default_cgst_percent,
                        default_sgst_percent,
                        terms_and_conditions
                    FROM settings
                    LIMIT 1
                """)

                row = cursor.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Settings not configured"
            )

        return {
            "id": row[0],
            "business_name": row[1],
            "address": row[2],
            "gstin": row[3],
            "email": row[4],
            "phone": row[5],
            "default_place_of_supply": row[6],
            "default_cgst_percent": float(row[7]),
            "default_sgst_percent": float(row[8]),
            "terms_and_conditions": row[9]
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )