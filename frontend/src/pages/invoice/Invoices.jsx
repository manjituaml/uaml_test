import React, { useEffect, useState } from "react";
import "./Invoices.scss";
import axios from "axios";
import { baseInvoiceUrlPrefix, baseUrl } from "../../utils/baseUrl";

function Invoices() {
  const [mode, setMode] = useState("allinvoices");
  const [displayInvoices, setDisplayInvoices] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [tillDate, setTillDate] = useState("");

  const fetchInvoices = async () => {
    try {
      let res;

      if (mode === "allinvoices") {
        res = await axios.get(`${baseUrl}${baseInvoiceUrlPrefix}/all`, {
          withCredentials: true,
        });
      } else if (mode === "fromtilldate") {
        if (!fromDate || !tillDate) return;
        res = await axios.get(
          `${baseUrl}${baseInvoiceUrlPrefix}/range/${fromDate}/${tillDate}`,
          { withCredentials: true }
        );
      } else if (mode === "currentmonth") {
        res = await axios.get(
          `${baseUrl}${baseInvoiceUrlPrefix}/currentmonth`,
          { withCredentials: true }
        );
      }

      if (res?.data?.success) {
        setDisplayInvoices(res.data.invoices);
      }
    } catch (error) {
      console.error("Fetch invoices error:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [mode]);

  // totals
  let totalDomestic = 0;
  let totalExport = 0;
  let totalINR = 0;

  displayInvoices.forEach((inv) => {
    const amount = inv?.quantity * inv?.unitPrice;

    if (inv?.itemType === "Domestic") {
      totalDomestic += amount;
      totalINR += amount;
    } else {
      totalExport += amount;
      totalINR += amount * (inv?.exchangeRate || 1);
    }
  });

  const domesticInvoices = displayInvoices.filter(
    (inv) => inv?.itemType === "Domestic"
  );

  const exportInvoices = displayInvoices.filter(
    (inv) => inv?.itemType === "Export"
  );

  return (
    <div className="invoice-page">
      <h2>Invoices</h2>

      {/* Filters */}
      <div className="filters">
        <button onClick={() => setMode("allinvoices")}>All</button>
        <button onClick={() => setMode("currentmonth")}>Current Month</button>
        <button onClick={() => setMode("fromtilldate")}>Date Range</button>

        {mode === "fromtilldate" && (
          <>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />

            <input
              type="date"
              value={tillDate}
              onChange={(e) => setTillDate(e.target.value)}
            />

            <button onClick={fetchInvoices}>Search</button>
          </>
        )}
      </div>

      {/* Totals */}
      <div className="totals">
        <p>Total Domestic: ₹ {totalDomestic}</p>
        <p>Total Export: $ {totalExport}</p>
        <p>Total INR: ₹ {totalINR}</p>
      </div>

      {/* Domestic */}
      <h3>Domestic Invoices</h3>

      {domesticInvoices.map((inv) => {
        const amount = inv?.quantity * inv?.unitPrice;

        return (
          <div className="invoices" key={inv?._id}>
            <p>
              Invoice Number: <span>{inv?.invoiceNumber}</span>
            </p>
            <p>
              PO Number: <span>{inv?.purchaseOrderNumber}</span>
            </p>
            <p>
              Quantity: <span>{inv?.quantity}</span>
            </p>
            <p>
              Unit Price: <span>{inv?.unitPrice} ₹</span>
            </p>
            <p>
              Amount: <span>{amount}</span>
            </p>
          </div>
        );
      })}

      {/* Export */}
      <h3>Export Invoices</h3>

      {exportInvoices.map((inv) => {
        const amount = inv?.quantity * inv?.unitPrice;

        return (
          <div className="invoices" key={inv?._id}>
            <p>
              Invoice Number: <span>{inv?.invoiceNumber}</span>
            </p>
            <p>
              PO Number: <span>{inv?.purchaseOrderNumber}</span>
            </p>
            <p>
              Quantity: <span>{inv?.quantity}</span>
            </p>
            <p>
              Unit Price: <span>{inv?.unitPrice} $</span>
            </p>
            <p>
              Amount: <span>{amount}</span>
            </p>
            <p>
              Exchange Price: <span>{inv?.exchangeRate} $</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default Invoices;