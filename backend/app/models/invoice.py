from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=1)
    address: str = Field(..., min_length=1)
    gstin: Optional[str] = None
    place_of_supply: str = Field(
        default="29-Karnataka",
        min_length=1,
    )

    @field_validator(
        "name",
        "phone",
        "address",
        "place_of_supply",
    )
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("This field cannot be empty")

        return value

    @field_validator("gstin")
    @classmethod
    def clean_gstin(
        cls,
        value: Optional[str],
    ) -> Optional[str]:
        if value is None:
            return None

        value = value.strip()

        return value if value else None


class DeviceCreate(BaseModel):
    model: str = Field(..., min_length=1)
    color: Optional[str] = None
    imei: Optional[str] = Field(
        default=None,
        min_length=15,
        max_length=15,
    )
    serial_number: Optional[str] = None
    issue_description: Optional[str] = None

    @field_validator("model")
    @classmethod
    def validate_model(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Model cannot be empty")

        return value

    @field_validator("imei")
    @classmethod
    def validate_imei(
        cls,
        value: Optional[str],
    ) -> Optional[str]:
        if value is None:
            return None

        value = value.strip()

        if not value:
            return None

        if not value.isdigit():
            raise ValueError(
                "IMEI must contain exactly 15 digits"
            )

        if len(value) != 15:
            raise ValueError(
                "IMEI must contain exactly 15 digits"
            )

        return value

    @field_validator(
        "color",
        "serial_number",
        "issue_description",
    )
    @classmethod
    def clean_optional_text(
        cls,
        value: Optional[str],
    ) -> Optional[str]:
        if value is None:
            return None

        value = value.strip()

        return value if value else None


class InvoiceItemCreate(BaseModel):
    description: str = Field(..., min_length=1)
    hsn_sac: Optional[str] = None
    quantity: float = Field(default=1, gt=0)
    rate: float = Field(default=0, ge=0)

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Item description cannot be empty"
            )

        return value

    @field_validator("hsn_sac")
    @classmethod
    def clean_hsn_sac(
        cls,
        value: Optional[str],
    ) -> Optional[str]:
        if value is None:
            return None

        value = value.strip()

        return value if value else None


class InvoiceCreate(BaseModel):
    customer: CustomerCreate
    device: DeviceCreate
    items: list[InvoiceItemCreate] = Field(
        ...,
        min_length=1,
    )
    payment_method: str = Field(..., min_length=1)
    salesperson: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("payment_method")
    @classmethod
    def validate_payment_method(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Payment method cannot be empty"
            )

        return value

    @field_validator("salesperson", "notes")
    @classmethod
    def clean_optional_text(
        cls,
        value: Optional[str],
    ) -> Optional[str]:
        if value is None:
            return None

        value = value.strip()

        return value if value else None