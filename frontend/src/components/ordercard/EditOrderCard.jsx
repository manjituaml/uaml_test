import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Save,
  Package,
  User,
  DollarSign,
  Calendar,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  FileText,
  Clock,
  FileCheck,
  Truck as TruckIcon,
} from "lucide-react";
import {
  baseInvoiceUrlPrefix,
  baseOrderUrlPrefix,
  baseUrl,
} from "../../utils/baseUrl";
import "./EditOrderCard.scss";
import { useSelector } from "react-redux";

function EditOrderCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isHead } = useSelector((store) => store.auth);
  const isProductionSenior =
    user?.department === "production" &&
    (user?.jobPosition === "manager" || user?.jobPosition === "senior");
  const isSalesSenior =
    user?.department === "sales" &&
    (user?.jobPosition === "manager" || user?.jobPosition === "senior");

  const [formData, setFormData] = useState({
    customerName: "",
    itemName: "",
    itemNumber: "",
    itemType: "Domestic",
    quantity: "",
    unitPrice: "",
    action: "",
    plannedDispatchDate: "",
    exchangeRate: "",
    podate: "",
  });

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [dispatchData, setDispatchData] = useState({
    dispatchQuantity: "",
    dispatchDate: new Date().toISOString().split("T")[0],
    invoiceNumber: "",
    notes: "",
  });

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");

  // Action options
  const actionOptions = [
    {
      value: "pending",
      label: "Pending",
      icon: <Clock size={16} />,
      color: "#6b7280",
      disabled: isSalesSenior,
    },
    {
      value: "ready",
      label: "Ready",
      icon: <CheckCircle size={16} />,
      color: "#f59e0b",
      disabled: isSalesSenior,
    },
    {
      value: "invoice ready",
      label: "Invoice Ready",
      icon: <FileText size={16} />,
      color: "#3b82f6",
      disabled: isProductionSenior,
    },
    {
      value: "dispatch",
      label: "Dispatch",
      icon: <TruckIcon size={16} />,
      color: "#10b981",
      disabled: isProductionSenior,
    },
  ];

  useEffect(() => {
    fetchOrderData();
  }, [id]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}${baseOrderUrlPrefix}/${id}`, {
        withCredentials: true,
      });

      if (res.data.success && res.data.order) {
        const order = res.data.order;
        setOrderDetails(order);

        setFormData({
          customerName: order.customerName || "",
          itemName: order.itemName || "",
          itemNumber: order.itemNumber || "",
          itemType: order.itemType || "Domestic",
          quantity: order.quantity || "",
          unitPrice: order.unitPrice || "",
          action: order.action || "pending",
          exchangeRate: order.exchangeRate || "",
          plannedDispatchDate: order.plannedDispatchDate
            ? new Date(order.plannedDispatchDate).toISOString().split("T")[0]
            : "",
          podate: order.podate || "",
        });

        // Set file preview if exists
        if (order.file) {
          setFilePreview(order.file);
        }
      }
    } catch (error) {
      console.error("Error fetching order data:", error);
      setErrors({ fetch: "Failed to load order data. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }

    if (!formData.itemName.trim()) {
      newErrors.itemName = "Item name is required";
    }

    if (!formData.itemNumber.trim()) {
      newErrors.itemNumber = "Item number is required";
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Valid quantity is required (greater than 0)";
    }

    if (!formData.unitPrice || formData.unitPrice <= 0) {
      newErrors.unitPrice = "Valid unit price is required (greater than 0)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDispatch = () => {
    if (!dispatchData.dispatchQuantity || dispatchData.dispatchQuantity <= 0) {
      return "Valid dispatch quantity is required";
    }

    if (orderDetails) {
      const remaining = orderDetails.quantity - orderDetails.dispatchedQuantity;
      if (dispatchData.dispatchQuantity > remaining) {
        return `Dispatch quantity exceeds remaining quantity (${remaining} units left)`;
      }
    }

    return "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "unitPrice" ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(selectedFile.name);
      }
    }
  };

  // Update handleDispatchChange
  const handleDispatchChange = (e) => {
    const { name, value } = e.target;
    setDispatchData((prev) => ({
      ...prev,
      [name]: name === "dispatchQuantity" ? Number(value) : value,
    }));
  };
  const handleUpdateOrder = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const updateData = { ...formData };

      // Set plannedDispatchDate to null if empty
      if (!updateData.plannedDispatchDate) {
        updateData.plannedDispatchDate = null;
      }

      // If there's a new file, upload it first
      if (file) {
        const formDataToSend = new FormData();
        formDataToSend.append("file", file);

        // Upload file
        const uploadRes = await axios.post(
          `${baseUrl}/upload`, // Adjust this to your file upload endpoint
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
          },
        );

        if (uploadRes.data.success) {
          updateData.file = uploadRes.data.fileUrl;
        }
      }

      const res = await axios.put(
        `${baseUrl}${baseOrderUrlPrefix}/${id}`,
        updateData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        },
      );

      if (res.data.success) {
        setSuccessMessage("Order updated successfully!");
        await fetchOrderData(); // Refresh data

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        setErrors({ submit: res.data.message || "Failed to update order" });
      }
    } catch (error) {
      console.error("Error updating order:", error);

      // Better error handling
      if (error.response?.data?.errors) {
        setErrors({ submit: error.response.data.errors.join(", ") });
      } else {
        setErrors({
          submit:
            error.response?.data?.message ||
            "Failed to update order. Please try again.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();

    const dispatchError = validateDispatch();
    if (dispatchError) {
      setErrors({ dispatch: dispatchError });
      return;
    }

    try {
      setSaving(true);

      const res = await axios.put(
        `${baseUrl}${baseOrderUrlPrefix}/${id}/dispatch`,
        dispatchData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        },
      );

      if (res.data.success) {
        setSuccessMessage(
          `Dispatched ${dispatchData.dispatchQuantity} units successfully! Invoice: ${res.data.newDispatch?.invoiceNumber || "Generated"}`,
        );
        await recordDispatch();

        // Reset form
        setDispatchData({
          dispatchQuantity: "",
          dispatchDate: new Date().toISOString().split("T")[0],
          invoiceNumber: "",
          notes: "",
        });

        await fetchOrderData(); // Refresh data

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        setErrors({ dispatch: res.data.message || "Failed to dispatch order" });
      }
    } catch (error) {
      console.error("Error dispatching order:", error);
      setErrors({
        dispatch:
          error.response?.data?.message ||
          "Failed to dispatch order. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const recordDispatch = async () => {
    try {
      const invoicePayload = {
        invoiceDate: dispatchData.dispatchDate,
        order: orderDetails._id, // order id
        invoiceNumber: dispatchData.invoiceNumber,
        quantity: dispatchData.dispatchQuantity,
        unitPrice: orderDetails.unitPrice,
        itemType: orderDetails.itemType,
        exchangeRate: orderDetails.exchangeRate || 0,
        purchaseOrderNumber: orderDetails.itemNumber,
      };

      const res = await axios.post(
        `${baseUrl}${baseInvoiceUrlPrefix}/create`,
        invoicePayload,
        { withCredentials: true },
      );

      if (res.data.success) {
        // console.log("Invoice created:", res.data.invoice);
      }
    } catch (error) {
      console.error("Invoice creation failed:", error);
    }
  };

  const handleCloseOrder = async () => {
    if (!isSalesSenior) {
      alert(`Only 'Sales Department' can close the order`);
    }
    if (
      !window.confirm(
        "Are you sure you want to close this order? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      const res = await axios.put(
        `${baseUrl}${baseOrderUrlPrefix}/${id}/close`,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        },
      );

      if (res.data.success) {
        setSuccessMessage("Order closed successfully!");
        await fetchOrderData(); // Refresh data

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    } catch (error) {
      console.error("Error closing order:", error);
      setErrors({
        submit: error.response?.data?.message || "Failed to close order",
      });
    } finally {
      setSaving(false);
    }
  };

  const getActionDetails = (actionValue) => {
    return (
      actionOptions.find((option) => option.value === actionValue) ||
      actionOptions[0]
    );
  };

  const getOrderStatus = () => {
    if (!orderDetails) return { text: "Loading...", color: "#6b7280" };

    if (orderDetails.closedItem) {
      return { text: "Closed", color: "#10b981" };
    }

    const actionDetails = getActionDetails(orderDetails.action || "pending");
    return { text: actionDetails.label, color: actionDetails.color };
  };

  const getProgressPercentage = () => {
    if (!orderDetails) return 0;
    return Math.min(
      100,
      (orderDetails.dispatchedQuantity / orderDetails.quantity) * 100,
    );
  };

  if (loading) {
    return (
      <div className="edit-loading">
        <div className="loading-spinner"></div>
        <p>Loading order data...</p>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="edit-error">
        <XCircle size={48} />
        <h3>Order Not Found</h3>
        <p>The requested order could not be loaded.</p>
        <button onClick={() => navigate(-1)} className="btn-back">
          Back to Orders
        </button>
      </div>
    );
  }

  const handleDeleteAction = async (orderId) => {
    try {
      alert("Do you want to delete it?");

      const res = axios.delete(`${baseUrl}${baseOrderUrlPrefix}/${orderId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        navigate("/");
        alert(`Order has been deleted successfully`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="edit-order-container">
      {/* Header */}
      <div className="edit-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="header-content">
          <h1>
            <Package size={24} />
            Edit Purchase Order
          </h1>
          <p className="order-id">Order #{orderDetails.itemNumber}</p>
          <div className="status-section">
            <div
              className="order-status"
              style={{ backgroundColor: getOrderStatus().color }}
            >
              {getActionDetails(orderDetails.action || "pending").icon}
              {getOrderStatus().text}
            </div>
            {orderDetails.closedItem && (
              <div className="closed-badge">
                <CheckCircle size={14} />
                Closed on{" "}
                {new Date(orderDetails.closedItem).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="alert-success">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Messages */}
      {errors.submit && (
        <div className="alert-error">
          <AlertCircle size={20} />
          <span>{errors.submit}</span>
          <button onClick={() => setErrors({})}>
            <X size={16} />
          </button>
        </div>
      )}

      {errors.dispatch && (
        <div className="alert-error">
          <AlertCircle size={20} />
          <span>{errors.dispatch}</span>
          <button onClick={() => setErrors({})}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Order Summary */}
      <div className="order-summary">
        <div className="summary-card">
          <div className="summary-item">
            <div className="summary-label">Total Quantity</div>
            <div className="summary-value">{orderDetails.quantity} units</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Dispatched</div>
            <div className="summary-value">
              {orderDetails.dispatchedQuantity} units
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Remaining</div>
            <div className="summary-value highlight">
              {orderDetails.quantity - orderDetails.dispatchedQuantity} units
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Total Amount</div>
            <div className="summary-value total">
              ${(orderDetails.quantity * orderDetails.unitPrice).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-header">
            <span>Dispatch Progress</span>
            <span>{getProgressPercentage().toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>
      {/* Dispatch History */}

      <div className="edit-content">
        {/* Left Column - Edit Form */}
        <div className="edit-form-section">
          <div className="section-card">
            <div className="section-header">
              <Package size={20} />
              <h3>Order Details</h3>
            </div>

            <form onSubmit={handleUpdateOrder}>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <User size={16} />
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className={`form-input ${errors.customerName ? "error" : ""}`}
                    placeholder="Enter customer name"
                  />
                  {errors.customerName && (
                    <span className="error-message">{errors.customerName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>PO date</label>
                  <h3>
                    {formData?.podate
                      ? new Date(formData.podate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </h3>
                </div>
                <div className="form-group">
                  <label>
                    <Package size={16} />
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    className={`form-input ${errors.itemName ? "error" : ""}`}
                    placeholder="Enter item name"
                  />
                  {errors.itemName && (
                    <span className="error-message">{errors.itemName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Package size={16} />
                    PO Number *
                  </label>
                  <input
                    type="text"
                    name="itemNumber"
                    value={formData.itemNumber}
                    onChange={handleInputChange}
                    className={`form-input ${errors.itemNumber ? "error" : ""}`}
                    placeholder="Enter item number"
                    // disabled={orderDetails.dispatchedQuantity > 0}
                    disabled
                  />
                  {errors.itemNumber && (
                    <span className="error-message">{errors.itemNumber}</span>
                  )}
                  {orderDetails.dispatchedQuantity > 0 && (
                    <p className="input-hint">
                      Cannot change item number after dispatch
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Package size={16} />
                    Item Type
                  </label>
                  <select
                    name="itemType"
                    value={formData.itemType}
                    onChange={handleInputChange}
                    className="form-select"
                    disabled
                  >
                    <option value="Domestic">Domestic</option>
                    <option value="Export">Export</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <Package size={16} />
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className={`form-input ${errors.quantity ? "error" : ""}`}
                    placeholder="0"
                    disabled
                  />
                  {errors.quantity && (
                    <span className="error-message">{errors.quantity}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    {orderDetails?.itemType === "Domestic" ? (
                      "₹"
                    ) : (
                      <DollarSign size={16} />
                    )}
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="unitPrice"
                    value={formData.unitPrice}
                    onChange={handleInputChange}
                    className={`form-input ${errors.unitPrice ? "error" : ""}`}
                    placeholder="0.00"
                    disabled
                  />
                  {errors.unitPrice && (
                    <span className="error-message">{errors.unitPrice}</span>
                  )}
                </div>
                {orderDetails?.itemType === "Export" && (
                  <div className="form-group">
                    <label>
                      <DollarSign size={16} />
                      Exchange Rate *
                    </label>
                    <input
                      className={`form-input ${errors.unitPrice ? "error" : ""}`}
                      placeholder={`${formData?.exchangeRate}`}
                      disabled
                    />
                  </div>
                )}
              </div>

              {/* Action Status */}
              <div className="form-group">
                <label>
                  <CheckCircle size={16} />
                  Order Status
                </label>
                <div className="action-selector">
                  {actionOptions.map((action) => (
                    <label
                      key={action.value}
                      className={`action-option
      ${formData.action === action.value ? "active" : ""}
      ${action.disabled ? "disabled" : ""}
    `}
                      style={
                        formData.action === action.value && !action.disabled
                          ? {
                              borderColor: action.color,
                              backgroundColor: `${action.color}15`,
                            }
                          : {}
                      }
                    >
                      <input
                        type="radio"
                        name="action"
                        value={action.value}
                        checked={formData.action === action.value}
                        onChange={handleInputChange}
                        disabled={action.disabled} // 👈 real disabling
                      />

                      <div className="action-content">
                        <span
                          className="action-icon"
                          style={{
                            color: action.disabled ? "#9ca3af" : action.color,
                          }}
                        >
                          {action.icon}
                        </span>
                        <span className="action-label">
                          {action.label}
                          {action.disabled && " 🔒"}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              {/* <div className="form-group">
                <label>
                  <FileText size={16} />
                  Attach File
                </label>
                <div className="file-upload">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="file-label">
                    <FileText size={18} />
                    {file ? file.name : "Choose file"}
                  </label>
                  {filePreview && (
                    <div className="file-preview">
                      {filePreview.startsWith("data:image") ? (
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="file-preview-image"
                        />
                      ) : (
                        <div className="file-preview-text">
                          <FileText size={24} />
                          <span>{filePreview}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div> */}

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  Planned Dispatch Date
                </label>
                <input
                  type="date"
                  name="plannedDispatchDate"
                  value={formData.plannedDispatchDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <div className="orderAction">
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteAction(orderDetails?._id)}
                      className="delete_action"
                    >
                      Delete
                    </button>
                  )}

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving || orderDetails.closedItem}
                  >
                    {saving ? (
                      <>
                        <div className="save-spinner"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Dispatch & Actions */}
        {/* Dispatch Form */}
        <div className="section-card">
          <div className="section-header">
            <Truck size={20} />
            <h3>Dispatch Items</h3>
          </div>

          {orderDetails.closedItem ? (
            <div className="closed-message">
              <CheckCircle size={24} />
              <p>
                This order has been closed on{" "}
                {new Date(orderDetails.closedItem).toLocaleDateString()}
              </p>
              <p className="small">No further dispatches allowed</p>
            </div>
          ) : (
            <form onSubmit={handleDispatch}>
              <div className="form-group">
                <label>
                  <Truck size={16} />
                  Dispatch Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    orderDetails.quantity -
                    (orderDetails.dispatchedQuantity || 0)
                  }
                  name="dispatchQuantity"
                  value={dispatchData.dispatchQuantity}
                  onChange={handleDispatchChange}
                  className="form-input"
                  placeholder={`Max: ${orderDetails.quantity - (orderDetails.dispatchedQuantity || 0)}`}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <FileText size={16} />
                  Invoice Number *
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={dispatchData.invoiceNumber}
                  onChange={handleDispatchChange}
                  className="form-input"
                  placeholder="Enter Invoice Number"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  Dispatch Date
                </label>
                <input
                  type="date"
                  name="dispatchDate"
                  value={dispatchData.dispatchDate}
                  onChange={handleDispatchChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>
                  <FileText size={16} />
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={dispatchData.notes}
                  onChange={handleDispatchChange}
                  className="form-input"
                  placeholder="Add any notes about this dispatch"
                  rows="2"
                />
              </div>

              <button
                type="submit"
                className="btn-primary full-width"
                disabled={saving || !isSalesSenior}
              >
                {saving ? "Dispatching..." : "Record Dispatch"}
              </button>
            </form>
          )}
          <div className="section-card">
            <div className="section-header">
              <Calendar size={20} />
              <h3>Dispatch History</h3>
            </div>

            {orderDetails.dispatches && orderDetails.dispatches.length > 0 ? (
              <div className="dispatch-history">
                <div className="dispatch-summary">
                  <div className="summary-row">
                    <span>Total Dispatched:</span>
                    <strong>
                      {orderDetails.dispatches.reduce(
                        (total, d) => total + d.quantity,
                        0,
                      )}{" "}
                      / {orderDetails.quantity} units
                    </strong>
                  </div>
                </div>

                {orderDetails.dispatches
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((dispatch, index) => (
                    <div
                      key={dispatch._id || index}
                      className="dispatch-item detailed"
                    >
                      <div className="dispatch-header">
                        <span className="dispatch-badge">
                          Dispatch #{index + 1}
                        </span>
                        <span className="dispatch-date">
                          {new Date(dispatch.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="dispatch-details">
                        <div className="detail-row">
                          <span className="detail-label">Quantity:</span>
                          <span className="detail-value highlight">
                            {dispatch.quantity} units
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Invoice:</span>
                          <span className="detail-value invoice">
                            {dispatch.invoiceNumber || "N/A"}
                          </span>
                        </div>
                        {dispatch.notes && (
                          <div className="detail-row">
                            <span className="detail-label">Notes:</span>
                            <span className="detail-value">
                              {dispatch.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="no-data">
                <Truck size={32} className="no-data-icon" />
                <p>No dispatch history available</p>
                <p className="small">
                  Record your first dispatch using the form above
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditOrderCard;
