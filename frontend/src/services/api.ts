const API_BASE_URL = "https://svtl-billing-system.onrender.com/api";

export type Customer = {
  name: string;
  phone: string;
  address: string;
  gstin?: string | null;
  place_of_supply: string;
};



export type Device = {
  model: string;
  color?: string | null;
  imei: string | null;
  serial_number?: string | null;
  issue_description?: string | null;
};

export type InvoiceItem = {
  description: string;
  hsn_sac?: string | null;
  quantity: number;
  rate: number;
};

export type CreateInvoiceRequest = {
  customer: Customer;
  device: Device;
  items: InvoiceItem[];
  payment_method: string;
  salesperson?: string | null;
  notes?: string | null;
};

export type CreateInvoiceResponse = {
  invoice_id: string;
  invoice_number: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  total_tax: number;
  grand_total: number;
};

export type InvoiceListItem = {
  id: string;
  invoice_number: string;
  date: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  total_tax: number;
  grand_total: number;
  payment_method: string;
  salesperson: string | null;
  status: string;
  archived: boolean;
  model: string | null;
  imei: string | null;
};

export type InvoiceDetail = {
  id: string;
  invoice_number: string;
  date: string;
  time: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string;
    gstin: string | null;
    place_of_supply: string;
  };
  device: {
    model: string;
    color: string | null;
    imei: string;
    serial_number: string | null;
    issue_description: string | null;
  } | null;
  items: {
    id: string;
    description: string;
    hsn_sac: string | null;
    quantity: number;
    rate: number;
    gst_percent: number;
    amount: number;
  }[];
  subtotal: number;
  cgst: number;
  sgst: number;
  total_tax: number;
  grand_total: number;
  payment_method: string;
  notes: string | null;
  status: string;
  salesperson: string | null;
  archived: boolean;
  created_at: string;
};

export type Settings = {
  id: string;
  business_name: string;
  address: string;
  gstin: string | null;
  email: string | null;
  phone: string | null;
  default_place_of_supply: string;
  default_cgst_percent: number;
  default_sgst_percent: number;
  terms_and_conditions: string | null;
};

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (
      typeof data === "object" &&
      data !== null &&
      "detail" in data
    ) {
      const detail = (data as { detail?: unknown }).detail;

      if (typeof detail === "string") {
        throw new Error(detail);
      }

      if (Array.isArray(detail)) {
        const messages = detail
          .map((item) => {
            if (
              typeof item === "object" &&
              item !== null &&
              "msg" in item
            ) {
              return String(
                (item as { msg: unknown }).msg,
              );
            }

            return String(item);
          })
          .join(", ");

        throw new Error(messages);
      }
    }

    throw new Error(
      `Request failed with status ${response.status}`,
    );
  }

  return data as T;
}

export async function createInvoice(
  invoice: CreateInvoiceRequest,
): Promise<CreateInvoiceResponse> {
  return request<CreateInvoiceResponse>("/invoices/", {
    method: "POST",
    body: JSON.stringify(invoice),
  });
}

export async function getInvoices(params?: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  showArchived?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{
  count: number;
  limit: number;
  offset: number;
  invoices: InvoiceListItem[];
}> {
  const query = new URLSearchParams();

  if (params?.search) {
    query.set("search", params.search);
  }

  if (params?.dateFrom) {
    query.set("date_from", params.dateFrom);
  }

  if (params?.dateTo) {
    query.set("date_to", params.dateTo);
  }

  if (params?.showArchived) {
    query.set("show_archived", "true");
  }

  query.set("limit", String(params?.limit ?? 50));
  query.set("offset", String(params?.offset ?? 0));

  return request(`/invoices/?${query.toString()}`);
}

export async function getInvoice(
  invoiceId: string,
): Promise<InvoiceDetail> {
  return request<InvoiceDetail>(
    `/invoices/${invoiceId}`,
  );
}

export async function archiveInvoice(
  invoiceId: string,
): Promise<{
  id: string;
  invoice_number: string;
  archived: boolean;
}> {
  return request(`/invoices/${invoiceId}/archive`, {
    method: "PATCH",
  });
}

export async function getSettings(): Promise<Settings> {
  return request<Settings>("/settings/");
}