import { useEffect, useState } from "react";
import { getSettings, type Settings as SettingsData } from "../services/api";

function Settings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load settings.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (isLoading) {
    return (
      <section className="form-card placeholder-page">
        <h2>Settings</h2>
        <p>Loading business settings...</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="form-card placeholder-page">
        <h2>Settings</h2>
        <p className="error-text">{errorMessage}</p>
      </section>
    );
  }

  if (!settings) {
    return (
      <section className="form-card placeholder-page">
        <h2>Settings</h2>
        <p>No settings found.</p>
      </section>
    );
  }

  return (
    <section className="form-card settings-page">
      <div className="section-heading">
        <h2>Business Settings</h2>
        <p>
          These details are stored in the billing database and are used
          for invoices.
        </p>
      </div>

      <div className="settings-grid">
        <div className="settings-field">
          <label>Business Name</label>
          <div className="settings-value">
            {settings.business_name}
          </div>
        </div>

        <div className="settings-field">
          <label>GSTIN</label>
          <div className="settings-value">
            {settings.gstin || "Not configured"}
          </div>
        </div>

        <div className="settings-field settings-field-full">
          <label>Business Address</label>
          <div className="settings-value">
            {settings.address}
          </div>
        </div>

        <div className="settings-field">
          <label>Phone</label>
          <div className="settings-value">
            {settings.phone || "Not configured"}
          </div>
        </div>

        <div className="settings-field">
          <label>Email</label>
          <div className="settings-value">
            {settings.email || "Not configured"}
          </div>
        </div>

        <div className="settings-field">
          <label>Default Place of Supply</label>
          <div className="settings-value">
            {settings.default_place_of_supply}
          </div>
        </div>

        <div className="settings-field">
          <label>CGST</label>
          <div className="settings-value">
            {settings.default_cgst_percent}%
          </div>
        </div>

        <div className="settings-field">
          <label>SGST</label>
          <div className="settings-value">
            {settings.default_sgst_percent}%
          </div>
        </div>

        <div className="settings-field settings-field-full">
          <label>Terms &amp; Conditions</label>
          <div className="settings-value">
            {settings.terms_and_conditions || "No terms configured."}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Settings;