import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CreateOrderCard.scss";
import { baseOrderUrlPrefix, baseUrl } from "../../utils/baseUrl";
import { useSelector } from "react-redux";

function CreateOrderCard() {
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    itemName: "",
    itemNumber: "",
    itemType: "Domestic",
    quantity: "",
    unitPrice: "",
    exchangeRate: "", // New field for export orders
    plannedDispatchDate: "",
    podate: "",
  });

  const { user, isAdmin, isHead } = useSelector((store) => store.auth);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  // Calculate derived values
  const [calculatedValues, setCalculatedValues] = useState({
    totalAmount: 0,
    totalAmountInINR: 0,
    currency: "INR",
  });

  // Update calculated values when form changes
  useEffect(() => {
    const quantity = Number(orderForm.quantity) || 0;
    const unitPrice = Number(orderForm.unitPrice) || 0;
    const exchangeRate = Number(orderForm.exchangeRate) || 0;
    const isExport = orderForm.itemType === "Export";

    const totalAmount = quantity * unitPrice;
    const currency = isExport ? "USD" : "INR";
    const totalAmountInINR = isExport
      ? totalAmount * exchangeRate
      : totalAmount;

    setCalculatedValues({
      totalAmount,
      totalAmountInINR,
      currency,
    });
  }, [
    orderForm.quantity,
    orderForm.unitPrice,
    orderForm.exchangeRate,
    orderForm.itemType,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderForm({ ...orderForm, [name]: value });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    // Clear success message
    if (success) {
      setSuccess("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!orderForm.customerName?.trim()) {
      newErrors.customerName = "Customer name is required";
    }

    if (!orderForm.itemName?.trim()) {
      newErrors.itemName = "Item name is required";
    }

    if (!orderForm.itemNumber?.trim()) {
      newErrors.itemNumber = "PO number is required";
    }

    if (!orderForm.quantity || orderForm.quantity <= 0) {
      newErrors.quantity = "Valid quantity is required (greater than 0)";
    }

    if (!orderForm.unitPrice || orderForm.unitPrice <= 0) {
      newErrors.unitPrice = "Valid unit price is required (greater than 0)";
    }

    // Validate exchange rate for Export orders
    if (orderForm.itemType === "Export") {
      if (!orderForm.exchangeRate || orderForm.exchangeRate <= 0) {
        newErrors.exchangeRate =
          "Exchange rate is required for Export orders (greater than 0)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!isAdmin && !isHead) {
      return setErrors({
        submit: "Either Admin or Head can perform this action.",
      });
    }

    try {
      setLoading(true);

      // Prepare data - only include exchangeRate for export orders
      const orderData = {
        customerName: orderForm.customerName.trim(),
        itemName: orderForm.itemName.trim(),
        itemNumber: orderForm.itemNumber.trim(),
        itemType: orderForm.itemType,
        quantity: Number(orderForm.quantity),
        unitPrice: Number(orderForm.unitPrice),
      };

      // Add exchangeRate only for export orders
      if (orderForm.itemType === "Export") {
        orderData.exchangeRate = Number(orderForm.exchangeRate);
      }
      
      if (orderForm.podate) {
        orderData.podate = orderForm.podate;
      }

      // Add plannedDispatchDate if provided
      if (orderForm.plannedDispatchDate) {
        orderData.plannedDispatchDate = orderForm.plannedDispatchDate;
      }

      console.log("Submitting order data:", orderData); // For debugging

      const res = await axios.post(
        `${baseUrl}${baseOrderUrlPrefix}`,
        orderData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        },
      );

      if (res.data.success) {
        setSuccess("Order Created Successfully ✅");
        console.log(res?.data?.order)
        // Reset form
        setOrderForm({
          customerName: "",
          itemName: "",
          itemNumber: "",
          itemType: "Domestic",
          quantity: "",
          unitPrice: "",
          exchangeRate: "",
          plannedDispatchDate: "",
          podate: "",
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess("");
        }, 3000);

        console.log("Order created:", res.data.order);
      } else {
        setErrors({ submit: res.data.message || "Failed to create order" });
      }
    } catch (error) {
      console.error("Error creating order:", error);

      if (error.response?.data?.errors) {
        setErrors({ submit: error.response.data.errors.join(", ") });
      } else {
        setErrors({
          submit: error.response?.data?.message || "Error creating order ❌",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create_order_container">
      <div className="create_order_card">
        <h2>Create Purchase Order</h2>

        {success && <div className="success_message">{success}</div>}

        {errors.submit && <div className="error_message">{errors.submit}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form_group">
            <label>Customer Name *</label>
            <input
              type="text"
              name="customerName"
              value={orderForm.customerName}
              onChange={handleChange}
              className={errors.customerName ? "error" : ""}
              placeholder="Enter customer name"
            />
            {errors.customerName && (
              <span className="error_text">{errors.customerName}</span>
            )}
          </div>

          <div className="form_group">
            <label>Item Name *</label>
            <input
              type="text"
              name="itemName"
              value={orderForm.itemName}
              onChange={handleChange}
              className={errors.itemName ? "error" : ""}
              placeholder="Enter item name"
            />
            {errors.itemName && (
              <span className="error_text">{errors.itemName}</span>
            )}
          </div>

          <div className="form_group">
            <label>Purchase Order Number *</label>
            <input
              type="text"
              name="itemNumber"
              value={orderForm.itemNumber}
              onChange={handleChange}
              className={errors.itemNumber ? "error" : ""}
              placeholder="Enter purchase order number"
            />
            {errors.itemNumber && (
              <span className="error_text">{errors.itemNumber}</span>
            )}
          </div>

          <div className="form_group">
            <label>Item Type *</label>
            <select
              name="itemType"
              value={orderForm.itemType}
              onChange={handleChange}
            >
              <option value="Domestic">Domestic (INR)</option>
              <option value="Export">Export (USD)</option>
            </select>
          </div>

          <div className="form_row">
            <div className="form_group">
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                step="1"
                name="quantity"
                value={orderForm.quantity}
                onChange={handleChange}
                className={errors.quantity ? "error" : ""}
                placeholder="Enter quantity"
              />
              {errors.quantity && (
                <span className="error_text">{errors.quantity}</span>
              )}
            </div>

            <div className="form_group">
              <label>
                Unit Price ({orderForm.itemType === "Export" ? "USD" : "INR"}) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                name="unitPrice"
                value={orderForm.unitPrice}
                onChange={handleChange}
                className={errors.unitPrice ? "error" : ""}
                placeholder="0.00"
              />
              {errors.unitPrice && (
                <span className="error_text">{errors.unitPrice}</span>
              )}
            </div>
          </div>

          {/* Exchange Rate field - only shown for Export orders */}
          {orderForm.itemType === "Export" && (
            <div className="form_group">
              <label>Exchange Rate (USD to INR) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                name="exchangeRate"
                value={orderForm.exchangeRate}
                onChange={handleChange}
                className={errors.exchangeRate ? "error" : ""}
                placeholder="e.g., 83.50"
              />
              {errors.exchangeRate && (
                <span className="error_text">{errors.exchangeRate}</span>
              )}
              <small className="helper_text">
                Current USD to INR conversion rate
              </small>
            </div>
          )}

          {/* Calculated Values Preview */}
          {Number(orderForm.quantity) > 0 &&
            Number(orderForm.unitPrice) > 0 && (
              <div className="calculated_values">
                <h4>Order Summary</h4>
                <div className="value_row">
                  <span>Total Amount:</span>
                  <strong>
                    {calculatedValues.currency}{" "}
                    {calculatedValues.totalAmount.toFixed(2)}
                  </strong>
                </div>
                {orderForm.itemType === "Export" &&
                  Number(orderForm.exchangeRate) > 0 && (
                    <div className="value_row">
                      <span>Total Amount (INR):</span>
                      <strong>
                        ₹ {calculatedValues.totalAmountInINR.toFixed(2)}
                      </strong>
                    </div>
                  )}
                <div className="value_row">
                  <span>Reflect Amount (Initial):</span>
                  <strong>
                    {calculatedValues.currency}{" "}
                    {calculatedValues.totalAmount.toFixed(2)}
                  </strong>
                </div>
              </div>
            )}

          <div className="form_group">
            <label>PO Date</label>
            <input
              type="date"
              name="podate"
              value={orderForm.podate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form_group">
            <label>Planned Dispatch Date (Optional)</label>
            <input
              type="date"
              name="plannedDispatchDate"
              value={orderForm.plannedDispatchDate}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]} // Can't select past dates
            />
          </div>

          <button type="submit" className="btn_submit" disabled={loading}>
            {loading ? "Creating..." : "Create Order"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateOrderCard;
