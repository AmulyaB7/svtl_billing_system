import { useState } from "react";
import "./App.css";
import History from "./pages/History";
import NewInvoice from "./pages/NewInvoice";
import Settings from "./pages/Settings";

type Page = "new-invoice" | "history" | "settings";

function App() {
  const [page, setPage] = useState<Page>("new-invoice");

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-logo">SV</div>

          <div className="brand-text">
            <div className="brand-name">
              Sri Vijayalakshmi Telelinks
            </div>

            <div className="brand-subtitle">
              Billing &amp; Invoices
            </div>
          </div>
        </div>

        <nav className="main-nav">
          <button
            className={`nav-button ${
              page === "new-invoice" ? "active" : ""
            }`}
            onClick={() => setPage("new-invoice")}
            type="button"
          >
            <span className="nav-icon">▧</span>
            New Invoice
          </button>

          <button
            className={`nav-button ${
              page === "history" ? "active" : ""
            }`}
            onClick={() => setPage("history")}
            type="button"
          >
            <span className="nav-icon">◷</span>
            History
          </button>

          <button
            className={`nav-button ${
              page === "settings" ? "active" : ""
            }`}
            onClick={() => setPage("settings")}
            type="button"
          >
            <span className="nav-icon">⚙</span>
            Settings
          </button>
        </nav>
      </header>

      {page === "new-invoice" && (
        <main className="page-container">
          <NewInvoice />
        </main>
      )}

      {page === "history" && (
        <main className="page-container">
          <History />
        </main>
      )}

      {page === "settings" && (
        <main className="page-container">
          <Settings />
        </main>
      )}
    </div>
  );
}

export default App;