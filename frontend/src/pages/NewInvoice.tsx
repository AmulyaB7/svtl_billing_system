import { useMemo, useState } from "react";
import {
  createInvoice,
  type CreateInvoiceRequest,
} from "../services/api";
import InvoicePreview from "../components/InvoicePreview";

type InvoiceItemForm = {
  id: number;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
};

const GST_RATE = 0.18;
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;

const createEmptyItem = (): InvoiceItemForm => ({
  id: Date.now() + Math.random(),
  description: "",
  hsnSac: "85171300",
  quantity: 1,
  rate: 0,
});

function NewInvoice() {
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    gstin: "",
    placeOfSupply: "29-Karnataka",
  });

  const [device, setDevice] = useState({
    model: "",
    color: "",
    imei: "",
    issueDescription: "",
  });

  const [items, setItems] = useState<InvoiceItemForm[]>([
    createEmptyItem(),
  ]);

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [salesperson, setSalesperson] = useState("");
  const [notes, setNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewInvoiceId, setPreviewInvoiceId] =
    useState<string | null>(null);

  const totals = useMemo(() => {
    const enteredTotal = items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0,
    );

    const roundedEnteredTotal =
      Math.round(enteredTotal * 100) / 100;

    const subtotal = items.reduce((sum, item) => {
      const grossAmount = item.quantity * item.rate;

      const taxableAmount =
        Math.round(
          (grossAmount / (1 + GST_RATE)) * 100,
        ) / 100;

      return sum + taxableAmount;
    }, 0);

    const roundedSubtotal =
      Math.round(subtotal * 100) / 100;

    const cgst =
      Math.round(roundedSubtotal * CGST_RATE * 100) / 100;

    let sgst =
      Math.round(roundedSubtotal * SGST_RATE * 100) / 100;

    const calculatedTotal =
      Math.round(
        (roundedSubtotal + cgst + sgst) * 100,
      ) / 100;

    const roundingDifference =
      Math.round(
        (roundedEnteredTotal - calculatedTotal) * 100,
      ) / 100;

    sgst =
      Math.round(
        (sgst + roundingDifference) * 100,
      ) / 100;

    const total =
      Math.round(
        (roundedSubtotal + cgst + sgst) * 100,
      ) / 100;

    return {
      subtotal: roundedSubtotal,
      cgst,
      sgst,
      total,
    };
  }, [items]);

  const formatCurrency = (value: number) =>
    `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const updateCustomer = (
    field: keyof typeof customer,
    value: string,
  ) => {
    setCustomer((current) => ({
      ...current,
      [field]: value,
    }));

    clearMessages();
  };

  const updateDevice = (
    field: keyof typeof device,
    value: string,
  ) => {
    setDevice((current) => ({
      ...current,
      [field]: value,
    }));

    clearMessages();
  };

  const updateItem = (
    id: number,
    field: keyof InvoiceItemForm,
    value: string | number,
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );

    clearMessages();
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      createEmptyItem(),
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length === 1) {
      return;
    }

    setItems((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  const applyQuickItem = (
    id: number,
    description: string,
  ) => {
    updateItem(id, "description", description);
  };

  const resetForm = () => {
    setCustomer({
      name: "",
      phone: "",
      address: "",
      gstin: "",
      placeOfSupply: "29-Karnataka",
    });

    setDevice({
      model: "",
      color: "",
      imei: "",
      issueDescription: "",
    });

    setItems([createEmptyItem()]);
    setPaymentMethod("Cash");
    setSalesperson("");
    setNotes("");
  };

  const clearForm = () => {
    resetForm();
    setPreviewInvoiceId(null);
    clearMessages();
  };

  const saveInvoice = async (
    openPreview: boolean = false,
  ) => {
    setSuccessMessage("");
    setErrorMessage("");

    const payload: CreateInvoiceRequest = {
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        gstin: customer.gstin || null,
        place_of_supply: customer.placeOfSupply,
      },

      device: {
        model: device.model,
        color: device.color || null,
        imei: device.imei || null,
        issue_description:
          device.issueDescription || null,
      },

      items: items.map((item) => ({
        description: item.description,
        hsn_sac: item.hsnSac || null,
        quantity: item.quantity,
        rate: item.rate,
      })),

      payment_method: paymentMethod,
      salesperson: salesperson || null,
      notes: notes || null,
    };

    try {
      setIsSaving(true);

      const result = await createInvoice(payload);

      if (openPreview) {
        setPreviewInvoiceId(result.invoice_id);
      } else {
        setSuccessMessage(
          `Invoice ${result.invoice_number} saved successfully.`,
        );

        resetForm();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save invoice.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {previewInvoiceId && (
        <InvoicePreview
          invoiceId={previewInvoiceId}
          onClose={() => {
            setPreviewInvoiceId(null);
            resetForm();
          }}
        />
      )}

      {successMessage && (
        <div className="message success-message">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="message error-message">
          {errorMessage}
        </div>
      )}

      <section className="form-card">
        <div className="section-heading">
          <h2>Customer Details</h2>
        </div>

        <div className="form-grid two-columns">
          <div className="form-field">
            <label htmlFor="customer-name">
              Name *
            </label>

            <input
              id="customer-name"
              type="text"
              value={customer.name}
              onChange={(event) =>
                updateCustomer(
                  "name",
                  event.target.value,
                )
              }
              placeholder="Customer name"
            />
          </div>

          <div className="form-field">
            <label htmlFor="customer-phone">
              Phone *
            </label>

            <input
              id="customer-phone"
              type="tel"
              value={customer.phone}
              onChange={(event) =>
                updateCustomer(
                  "phone",
                  event.target.value,
                )
              }
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="form-field full-width">
            <label htmlFor="customer-address">
              Address *
            </label>

            <textarea
              id="customer-address"
              value={customer.address}
              onChange={(event) =>
                updateCustomer(
                  "address",
                  event.target.value,
                )
              }
              placeholder="Full address with city and pincode"
              rows={4}
            />
          </div>

          <div className="form-field">
            <label htmlFor="customer-gstin">
              Customer GSTIN (Optional)
            </label>

            <input
              id="customer-gstin"
              type="text"
              value={customer.gstin}
              onChange={(event) =>
                updateCustomer(
                  "gstin",
                  event.target.value,
                )
              }
              placeholder="GSTIN IF APPLICABLE"
            />
          </div>

          <div className="form-field">
            <label htmlFor="place-of-supply">
              Place of Supply
            </label>

            <input
              id="place-of-supply"
              type="text"
              value={customer.placeOfSupply}
              readOnly
            />
          </div>
        </div>
      </section>

      <section className="form-card">
        <div className="section-heading">
          <h2>Device Details</h2>
        </div>

        <div className="form-grid two-columns">
          <div className="form-field">
            <label htmlFor="device-model">
              Model *
            </label>

            <input
              id="device-model"
              type="text"
              value={device.model}
              onChange={(event) =>
                updateDevice(
                  "model",
                  event.target.value,
                )
              }
              placeholder="Enter device model"
            />
          </div>

          <div className="form-field">
            <label htmlFor="device-color">
              Color
            </label>

            <input
              id="device-color"
              type="text"
              value={device.color}
              onChange={(event) =>
                updateDevice(
                  "color",
                  event.target.value,
                )
              }
              placeholder="e.g., BLUE, BLACK"
            />
          </div>

          <div className="form-field">
            <label htmlFor="device-imei">
              IMEI Number
            </label>

            <input
              id="device-imei"
              type="text"
              value={device.imei}
              onChange={(event) =>
                updateDevice(
                  "imei",
                  event.target.value,
                )
              }
              placeholder="Enter IMEI / device identifier"
            />
          </div>

          <div className="form-field">
            <label htmlFor="device-issue">
              Issue Description
            </label>

            <input
              id="device-issue"
              type="text"
              value={device.issueDescription}
              onChange={(event) =>
                updateDevice(
                  "issueDescription",
                  event.target.value,
                )
              }
              placeholder="Brief issue description"
            />
          </div>
        </div>
      </section>

      <section className="form-card service-card">
        <div className="section-heading-row">
          <h2>Service Items</h2>

          <button
            type="button"
            className="secondary-button"
            onClick={addItem}
          >
            + Add Item
          </button>
        </div>

        <div className="service-items">
          {items.map((item, index) => (
            <div
              className="item-card"
              key={item.id}
            >
              <div className="item-card-header">
                <h3>Item {index + 1}</h3>

                {items.length > 1 && (
                  <button
                    type="button"
                    className="remove-item-button"
                    onClick={() =>
                      removeItem(item.id)
                    }
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="quick-actions">
                <button
                  type="button"
                  onClick={() =>
                    applyQuickItem(
                      item.id,
                      "MOBILE SALE",
                    )
                  }
                >
                  MOBILE SALE
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyQuickItem(
                      item.id,
                      "ACCESSORIES SALE",
                    )
                  }
                >
                  ACCESSORIES SALE
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyQuickItem(
                      item.id,
                      "Screen Replacement",
                    )
                  }
                >
                  Screen Replacement
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyQuickItem(
                      item.id,
                      "Battery Replacement",
                    )
                  }
                >
                  Battery Replacement
                </button>
              </div>

              <div className="item-grid">
                <div className="form-field item-description-field">
                  <label
                    htmlFor={`description-${item.id}`}
                  >
                    Description
                  </label>

                  <input
                    id={`description-${item.id}`}
                    type="text"
                    value={item.description}
                    onChange={(event) =>
                      updateItem(
                        item.id,
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Description"
                  />
                </div>

                <div className="form-field">
                  <label
                    htmlFor={`hsn-${item.id}`}
                  >
                    HSN/SAC
                  </label>

                  <input
                    id={`hsn-${item.id}`}
                    type="text"
                    value={item.hsnSac}
                    onChange={(event) =>
                      updateItem(
                        item.id,
                        "hsnSac",
                        event.target.value,
                      )
                    }
                    placeholder="HSN/SAC"
                  />
                </div>

                <div className="form-field">
                  <label
                    htmlFor={`rate-${item.id}`}
                  >
                    Rate (₹)
                  </label>

                  <input
                    id={`rate-${item.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      item.rate === 0
                        ? ""
                        : item.rate
                    }
                    onChange={(event) =>
                      updateItem(
                        item.id,
                        "rate",
                        Number(
                          event.target.value,
                        ) || 0,
                      )
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="form-field amount-field">
                  <label>Amount</label>

                  <div className="amount-display">
                    {formatCurrency(
                      item.quantity *
                        item.rate,
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="totals-card">
          <div className="total-row">
            <span>Subtotal</span>
            <strong>
              {formatCurrency(
                totals.subtotal,
              )}
            </strong>
          </div>

          <div className="total-row">
            <span>CGST (9%)</span>
            <strong>
              {formatCurrency(
                totals.cgst,
              )}
            </strong>
          </div>

          <div className="total-row">
            <span>SGST (9%)</span>
            <strong>
              {formatCurrency(
                totals.sgst,
              )}
            </strong>
          </div>

          <div className="total-row grand-total">
            <span>Net Total</span>
            <strong>
              {formatCurrency(
                totals.total,
              )}
            </strong>
          </div>
        </div>
      </section>

      <section className="form-card">
        <div className="section-heading">
          <h2>Payment</h2>
        </div>

        <div className="payment-grid">
          <div className="form-field">
            <label htmlFor="payment-method">
              Payment Method
            </label>

            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(
                  event.target.value,
                )
              }
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">
                Bank Transfer
              </option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="salesperson">
              Salesperson
            </label>

            <input
              id="salesperson"
              type="text"
              value={salesperson}
              onChange={(event) => {
                setSalesperson(
                  event.target.value,
                );
                clearMessages();
              }}
              placeholder="Salesperson"
            />
          </div>

          <div className="form-field full-width">
            <label htmlFor="invoice-notes">
              Notes
            </label>

            <textarea
              id="invoice-notes"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                clearMessages();
              }}
              placeholder="Additional notes"
              rows={3}
            />
          </div>
        </div>

        <div className="bottom-actions">
          <button
            type="button"
            className="clear-button"
            onClick={clearForm}
            disabled={isSaving}
          >
            Clear Form
          </button>

          <button
            type="button"
            className="save-button"
            onClick={() =>
              saveInvoice(false)
            }
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : "Save Only"}
          </button>

          <button
            type="button"
            className="preview-button"
            onClick={() =>
              saveInvoice(true)
            }
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : "Preview & Print"}
          </button>
        </div>
      </section>
    </>
  );
}

export default NewInvoice;