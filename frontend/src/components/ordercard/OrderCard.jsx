// OrderCard.jsx
import React from 'react';
import {
  Calendar,
  DollarSign,
  Package,
  User,
  TrendingUp,
  CheckCircle,
  Clock,
  FileText,
  Truck,
  ChevronRight
} from "lucide-react";

function OrderCard({ item, onClick }) {
  const amount = item?.quantity * item?.unitPrice;
  const remaining = item?.quantity - (item?.dispatchedQuantity || 0);
  const progress = item?.quantity ? ((item?.dispatchedQuantity || 0) / item?.quantity) * 100 : 0;

  const getStatusConfig = () => {
    if (item?.closedItem) {
      return {
        icon: <CheckCircle size={14} />,
        label: "Completed",
        color: "#10b981",
        bgColor: "#10b98115"
      };
    }
    
    switch(item?.action) {
      case "pending":
        return {
          icon: <Clock size={14} />,
          label: "Pending",
          color: "#f59e0b",
          bgColor: "#f59e0b15"
        };
      case "ready":
        return {
          icon: <Package size={14} />,
          label: "Ready",
          color: "#3b82f6",
          bgColor: "#3b82f615"
        };
      case "invoice ready":
        return {
          icon: <FileText size={14} />,
          label: "Invoice Ready",
          color: "#8b5cf6",
          bgColor: "#8b5cf615"
        };
      case "dispatch":
        return {
          icon: <Truck size={14} />,
          label: "Dispatch",
          color: "#06b6d4",
          bgColor: "#06b6d415"
        };
      default:
        return {
          icon: <Clock size={14} />,
          label: "Pending",
          color: "#6b7280",
          bgColor: "#6b728015"
        };
    }
  };

  const statusConfig = getStatusConfig();
  const isClosed = item?.closedItem;

  return (
    <div className="order-card" onClick={onClick}>
      {/* Card Header */}
      <div className="card-header">
        <div className="order-meta">
          <div className="order-number">
            <span className="prefix">PO #</span>
            <span className="number">{item.itemNumber}</span>
          </div>
          <div 
            className="status-badge"
            style={{ 
              backgroundColor: statusConfig.bgColor,
              color: statusConfig.color
            }}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </div>
        </div>
        {item.podate ? new Date(item.podate).toLocaleDateString() : ''}
        <div className="customer-info">
          <User size={14} />
          <span className="customer-name">{item.customerName}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body">
        <div className="item-info">
          <div className="item-name">
            <Package size={16} />
            <span>{item.itemName}</span>
          </div>
          <div className="item-type">
            <span className="type-label">Type:</span>
            <span className={`type-value ${item.itemType?.toLowerCase()}`}>
              {item.itemType}
            </span>
          </div>
        </div>

        <div className="order-details">
          <div className="detail-row">
            <div className="detail-item">
              <span className="detail-label">Quantity</span>
              <span className="detail-value">{item.quantity}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Unit Price</span>
              <span className="detail-value">{item?.itemType === "Domestic" ? `₹` : '$'} {item.unitPrice?.toFixed(2)}</span>
            </div>
            <div className="detail-item highlight">
              <span className="detail-label">Total Amount</span>
              <span className="detail-value">{item?.itemType === "Domestic" ? `₹` : '$'} {amount?.toFixed(2)}</span>
            </div>
              
          </div>
        </div>

        {/* Progress Bar */}
        {!isClosed && (
          <div className="progress-section">
            <div className="progress-header">
              <span>Dispatch Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-stats">
              <span className="stat">
                Dispatched: {item.dispatchedQuantity || 0}/{item.quantity}
              </span>
              <span className="stat highlight">
                Remaining: {remaining}
              </span>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="dates-section">
          {item.plannedDispatchDate && (
            <div className="date-item">
              <Calendar size={12} />
              <span className="date-label">Planned:</span>
              <span className="date-value">
                {new Date(item.plannedDispatchDate).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="date-item">
            <Calendar size={12} />
            <span className="date-label">Created:</span>
            <span className="date-value">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="card-footer">
        <div className="action-buttons">
          {isClosed ? (
            <div className="closed-indicator">
              <CheckCircle size={14} />
              <span>Closed on {new Date(item.closedItem).toLocaleDateString()}</span>
            </div>
          ) : (
            <div className="view-cta">
              <span>Edit Order</span>
              <ChevronRight size={16} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderCard;