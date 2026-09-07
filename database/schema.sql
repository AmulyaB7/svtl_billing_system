CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    gstin TEXT,
    place_of_supply TEXT NOT NULL DEFAULT '29-Karnataka',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_gstin TEXT,
    customer_place_of_supply TEXT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cgst NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sgst NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    salesperson TEXT,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL UNIQUE REFERENCES invoices(id),
    model TEXT NOT NULL,
    color TEXT,
    imei TEXT NOT NULL,
    serial_number TEXT,
    issue_description TEXT
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    description TEXT NOT NULL,
    hsn_sac TEXT,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
    gst_percent NUMERIC(5, 2) NOT NULL DEFAULT 18,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    address TEXT NOT NULL,
    gstin TEXT,
    email TEXT,
    phone TEXT,
    default_place_of_supply TEXT NOT NULL DEFAULT '29-Karnataka',
    default_cgst_percent NUMERIC(5, 2) NOT NULL DEFAULT 9,
    default_sgst_percent NUMERIC(5, 2) NOT NULL DEFAULT 9,
    terms_and_conditions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invoice_sequences (
    year INTEGER PRIMARY KEY,
    last_number INTEGER NOT NULL
);

CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_date ON invoices(date);
CREATE INDEX idx_invoices_archived ON invoices(archived);
CREATE INDEX idx_devices_imei ON devices(imei);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);