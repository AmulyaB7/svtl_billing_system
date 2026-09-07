import { useEffect, useMemo, useState } from "react";
import {
  archiveInvoice,
  getInvoices,
  type InvoiceListItem,
} from "../services/api";
import InvoicePreview from "../components/InvoicePreview";

function History() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const [selectedInvoiceId, setSelectedInvoiceId] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [archivingId, setArchivingId] = useState<string | null>(
    null,
  );

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const result = await getInvoices({
        search: search.trim() || undefined,
        showArchived,
        limit: 500,
        offset: 0,
      });

      setInvoices(result.invoices);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load invoice history.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadInvoices();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, showArchived]);

  const totals = useMemo(() => {
    const totalInvoices = invoices.length;

    const totalRevenue = invoices.reduce(
      (sum, invoice) => sum + invoice.grand_total,
      0,
    );

    const totalGst = invoices.reduce(
      (sum, invoice) => sum + invoice.total_tax,
      0,
    );

    const paidInvoices = invoices.filter(
      (invoice) =>
        invoice.status.toLowerCase() === "paid",
    ).length;

    return {
      totalInvoices,
      totalRevenue,
      totalGst,
      paidInvoices,
    };
  }, [invoices]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-GB");
  };

  const handleArchive = async (
    invoice: InvoiceListItem,
  ) => {
    const confirmed = window.confirm(
      `Archive ${invoice.invoice_number}?\n\nThe invoice will remain safely stored in the database and can be viewed again when "Show archived" is enabled.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setArchivingId(invoice.id);
      setErrorMessage("");

      await archiveInvoice(invoice.id);

      await loadInvoices();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to archive invoice.",
      );
    } finally {
      setArchivingId(null);
    }
  };

  if (selectedInvoiceId) {
    return (
      <InvoicePreview
        invoiceId={selectedInvoiceId}
        onClose={() =>
          setSelectedInvoiceId(null)
        }
      />
    );
  }

  return (
    <div className="history-page">
      <div className="history-toolbar">
        <div className="history-search">
          <span className="history-search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by invoice number, customer, phone, model, or IMEI..."
          />
        </div>

        <button
          className="refresh-button"
          type="button"
          onClick={loadInvoices}
          disabled={isLoading}
          aria-label="Refresh invoice history"
        >
          ↻
        </button>

        <label className="archive-toggle">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) =>
              setShowArchived(event.target.checked)
            }
          />

          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>

          <span>Show archived</span>
        </label>
      </div>

      {errorMessage && (
        <div className="message error-message">
          {errorMessage}
        </div>
      )}

      <div className="history-summary">
        <div className="summary-card">
          <div className="summary-number">
            {totals.totalInvoices}
          </div>

          <div className="summary-label">
            Total Invoices
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-number">
            ₹{formatCurrency(totals.totalRevenue)}
          </div>

          <div className="summary-label">
            Total Revenue
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-number">
            {totals.paidInvoices}
          </div>

          <div className="summary-label">
            Paid
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-number">
            ₹{formatCurrency(totals.totalGst)}
          </div>

          <div className="summary-label">
            Total GST
          </div>
        </div>
      </div>

      {isLoading ? (
        <section className="history-empty">
          <h3>Loading invoice history...</h3>
        </section>
      ) : invoices.length === 0 ? (
        <section className="history-empty">
          <h3>No invoices found</h3>

          <p>
            Try a different search or enable Show
            archived.
          </p>
        </section>
      ) : (
        <div className="invoice-list">
          {invoices.map((invoice) => (
            <article
              className={`invoice-history-card ${
                invoice.archived
                  ? "invoice-history-card-archived"
                  : ""
              }`}
              key={invoice.id}
            >
              <div className="invoice-card-main">
                <div className="invoice-card-top">
                  <div className="invoice-number-row">
                    <span className="invoice-number">
                      {invoice.invoice_number}
                    </span>

                    <span
                      className={`status-badge ${
                        invoice.archived
                          ? "archived-badge"
                          : "paid-badge"
                      }`}
                    >
                      {invoice.archived
                        ? "archived"
                        : invoice.status}
                    </span>
                  </div>

                  <div className="invoice-amount-area">
                    <div className="invoice-amount">
                      ₹
                      {formatCurrency(
                        invoice.grand_total,
                      )}
                    </div>

                    <div className="invoice-date">
                      {formatDate(invoice.date)}
                    </div>
                  </div>
                </div>

                <div className="invoice-customer-name">
                  {invoice.customer_name}
                </div>

                <div className="invoice-phone">
                  {invoice.customer_phone}
                </div>

                <div className="invoice-device-row">
                  <span>
                    {invoice.model ||
                      "Device unavailable"}
                  </span>

                  {invoice.imei && (
                    <span>
                      IMEI: {invoice.imei}
                    </span>
                  )}
                </div>
              </div>

              <div className="invoice-card-actions">
                <button
                  className="icon-action-button"
                  type="button"
                  title="View invoice"
                  onClick={() =>
                    setSelectedInvoiceId(invoice.id)
                  }
                >
                  ◉
                </button>

                {!invoice.archived && (
                  <button
                    className="icon-action-button archive-action"
                    type="button"
                    title="Archive invoice"
                    disabled={
                      archivingId === invoice.id
                    }
                    onClick={() =>
                      handleArchive(invoice)
                    }
                  >
                    {archivingId === invoice.id
                      ? "..."
                      : "▱"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;