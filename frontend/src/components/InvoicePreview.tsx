import { useEffect, useState } from "react";
import {
  getInvoice,
  getSettings,
  type InvoiceDetail,
  type Settings,
} from "../services/api";

type InvoicePreviewProps = {
  invoiceId: string;
  onClose: () => void;
};

const FALLBACK_TERMS = [
  "All disputes are subject to local jurisdiction.",
  "Our Payment Terms are 7 Days. COUr not to allowed.",
  "If Our Payment Terms are Not Followed, 300 days If Made Within Due Date, Interest Will Be Charged @ 18% PA",
  "Service Report Available for all warranty & service centers.",
];

function numberToWordsIndian(value: number): string {
  const ones = [
    "",
    "ONE",
    "TWO",
    "THREE",
    "FOUR",
    "FIVE",
    "SIX",
    "SEVEN",
    "EIGHT",
    "NINE",
    "TEN",
    "ELEVEN",
    "TWELVE",
    "THIRTEEN",
    "FOURTEEN",
    "FIFTEEN",
    "SIXTEEN",
    "SEVENTEEN",
    "EIGHTEEN",
    "NINETEEN",
  ];

  const tens = [
    "",
    "",
    "TWENTY",
    "THIRTY",
    "FORTY",
    "FIFTY",
    "SIXTY",
    "SEVENTY",
    "EIGHTY",
    "NINETY",
  ];

  const convertBelowThousand = (number: number): string => {
    let result = "";

    if (number >= 100) {
      result += `${ones[Math.floor(number / 100)]} HUNDRED`;
      number %= 100;

      if (number > 0) {
        result += " ";
      }
    }

    if (number >= 20) {
      result += tens[Math.floor(number / 10)];
      number %= 10;

      if (number > 0) {
        result += ` ${ones[number]}`;
      }
    } else if (number > 0) {
      result += ones[number];
    }

    return result;
  };

  const integerPart = Math.floor(value);

  if (integerPart === 0) {
    return "ZERO RUPEES";
  }

  let number = integerPart;
  const parts: string[] = [];

  const crore = Math.floor(number / 10000000);
  if (crore > 0) {
    parts.push(`${convertBelowThousand(crore)} CRORE`);
    number %= 10000000;
  }

  const lakh = Math.floor(number / 100000);
  if (lakh > 0) {
    parts.push(`${convertBelowThousand(lakh)} LAKH`);
    number %= 100000;
  }

  const thousand = Math.floor(number / 1000);
  if (thousand > 0) {
    parts.push(`${convertBelowThousand(thousand)} THOUSAND`);
    number %= 1000;
  }

  if (number > 0) {
    parts.push(convertBelowThousand(number));
  }

  return `${parts.join(" ")} RUPEES`;
}

function amountInWords(value: number): string {
  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);

  let result = numberToWordsIndian(rupees);

  if (paise > 0) {
    result += ` AND ${numberToWordsIndian(paise)} PAISE`;
  }

  return `${result} ONLY`;
}

function formatMoney(value: number): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB");
}

function InvoicePreview({
  invoiceId,
  onClose,
}: InvoicePreviewProps) {
  const [invoice, setInvoice] =
    useState<InvoiceDetail | null>(null);

  const [settings, setSettings] =
    useState<Settings | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [invoiceData, settingsData] =
          await Promise.all([
            getInvoice(invoiceId),
            getSettings(),
          ]);

        setInvoice(invoiceData);
        setSettings(settingsData);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load invoice.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [invoiceId]);

  if (isLoading) {
    return (
      <div className="invoice-preview-overlay">
        <div className="invoice-preview-loading">
          Loading invoice...
        </div>
      </div>
    );
  }

  if (errorMessage || !invoice || !settings) {
    return (
      <div className="invoice-preview-overlay">
        <div className="invoice-preview-error">
          <h2>Unable to load invoice</h2>
          <p>
            {errorMessage || "Invoice data is unavailable."}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="preview-close-button"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const terms = settings.terms_and_conditions
    ? settings.terms_and_conditions
        .split("\n")
        .map((term) => term.trim())
        .filter(Boolean)
    : FALLBACK_TERMS;

  return (
    <div className="invoice-preview-overlay">
      <div className="invoice-preview-header">
        <h2>Invoice Preview</h2>

        <div className="invoice-preview-actions">
          <button
            type="button"
            className="preview-header-button"
            onClick={onClose}
          >
            × &nbsp; Close
          </button>

          <button
            type="button"
            className="preview-header-button"
            onClick={onClose}
          >
            ✓ &nbsp; Save &amp; Close
          </button>

          <button
            type="button"
            className="preview-print-button"
            onClick={() => window.print()}
          >
            ▣ &nbsp; Print
          </button>
        </div>
      </div>

      <div className="invoice-preview-scroll">
        <div className="invoice-paper">
          <div className="invoice-border">

            <section className="invoice-company-header">
              <h1>{settings.business_name}</h1>

              <div>{settings.address}</div>

              <div>
                GSTIN: {settings.gstin || ""}{" "}
                State: {settings.default_place_of_supply}
              </div>

              <div>
                Email Id: {settings.email || ""}
              </div>
            </section>

            <section className="invoice-title-row">
              <strong>TAX INVOICE</strong>

              <span>Original Copy</span>
            </section>

            <section className="invoice-meta">
              <div>
                <div>
                  <strong>Invoice No:</strong>{" "}
                  {invoice.invoice_number}
                </div>

                <div>
                  <strong>Invoice Time:</strong>{" "}
                  {invoice.time}
                </div>
              </div>

              <div className="invoice-meta-right">
                <div>
                  <strong>Invoice Date:</strong>{" "}
                  {formatDate(invoice.date)}
                </div>

                <div>
                  <strong>Salesperson:</strong>{" "}
                  {invoice.salesperson || ""}
                </div>
              </div>
            </section>

            <section className="invoice-party-section">
              <div className="invoice-party">
                <strong>To:</strong>

                <div className="party-name">
                  {invoice.customer.name}
                </div>

                <div>
                  {invoice.customer.address}
                </div>

                <div>
                  Phone: {invoice.customer.phone}
                </div>

                {invoice.customer.gstin && (
                  <div>
                    GSTIN: {invoice.customer.gstin}
                  </div>
                )}
              </div>

              <div className="invoice-party">
                <strong>Shipped To:</strong>

                <div className="party-name">
                  {invoice.customer.name}
                </div>

                <div>
                  {invoice.customer.address}
                </div>

                <div>
                  Phone: {invoice.customer.phone}
                </div>

                {invoice.customer.gstin && (
                  <div>
                    GSTIN: {invoice.customer.gstin}
                  </div>
                )}
              </div>
            </section>

            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th>SNo</th>
                  <th>Particulars</th>
                  <th>HSN/SAC</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>GST %</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="center-cell">
                      {index + 1}
                    </td>

                    <td className="particular-cell">
                      <div>
                        {item.description}
                      </div>

                      <div className="imei-line">
                        IMEI NO: {invoice.device?.imei || ""}
                      </div>
                    </td>

                    <td className="center-cell">
                      {item.hsn_sac || ""}
                    </td>

                    <td className="center-cell">
                      {item.quantity}
                    </td>

                    <td className="money-cell">
                      {formatMoney(item.rate)}
                    </td>

                    <td className="center-cell">
                      {item.gst_percent}
                    </td>

                    <td className="money-cell">
                      {formatMoney(item.amount)}
                    </td>
                  </tr>
                ))}

                {Array.from({
                  length: Math.max(
                    2 - invoice.items.length,
                    0,
                  ),
                }).map((_, index) => (
                  <tr
                    key={`empty-${index}`}
                    className="empty-item-row"
                  >
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>

            <section className="invoice-total-area">
              <div className="invoice-total-spacer" />

              <div className="invoice-total-table">
                <div className="invoice-total-row total-row">
                  <strong>Total</strong>
                  <strong>
                    {formatMoney(invoice.subtotal)}
                  </strong>
                </div>

                <div className="invoice-total-row">
                  <span>
                    CGST
                    <br />
                    9%
                  </span>

                  <span>
                    {formatMoney(invoice.cgst)}
                  </span>
                </div>

                <div className="invoice-total-row">
                  <span>
                    SGST
                    <br />
                    9%
                  </span>

                  <span>
                    {formatMoney(invoice.sgst)}
                  </span>
                </div>

                <div className="invoice-total-row net-total-row">
                  <strong>
                    Net
                    <br />
                    Total
                  </strong>

                  <strong>
                    {formatMoney(invoice.grand_total)}
                  </strong>
                </div>
              </div>
            </section>

            <section className="amount-words">
              <strong>Amount in Words:</strong>{" "}
              {amountInWords(invoice.grand_total)}
            </section>

            <section className="terms-section">
              <strong>Terms &amp; Conditions:</strong>

              <div className="terms-list">
                {terms.map((term, index) => (
                  <div key={index}>
                    {index + 1}. {term}
                  </div>
                ))}
              </div>
            </section>

            <section className="signature-section">
              <div className="signature-company">
                for {settings.business_name}
              </div>

              <div className="signature-space">
                <div className="signature-box">
                  <div className="signature-line" />
                  <strong>
                    Receiver's Signature
                  </strong>
                </div>

                <div className="signature-box">
                  <div className="signature-line" />
                  <strong>
                    Authorized Seal &amp; Signature
                  </strong>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoicePreview;