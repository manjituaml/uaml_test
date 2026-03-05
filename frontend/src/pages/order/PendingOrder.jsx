import { useState, useEffect, useMemo } from "react";
import "./PendingOrder2.scss";
import OrderCard from '../../components/ordercard/OrderCard';
import useGetAllOrders from "../../hooks/useGetAllOrders";
import {
  Package,
  Clock,
  Filter,
  Search,
  AlertCircle,
  RefreshCw, 
  Loader2,
  ChevronDown,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  Calendar,
  Plus,
  DollarSign,
  Truck,
  FileText,
  Users,
  TrendingDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function PendingOrder() {
  const navigate = useNavigate();
  const { orders, loading, error, refetch } = useGetAllOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showStats, setShowStats] = useState(true);

  // Filter only pending orders that are not dispatched (action = "pending")
  const pendingOrders = useMemo(() => {
    return orders.filter(order => 
      order.action === "pending" && // Only pending orders
      !order.closedItem // Not closed
    );
  }, [orders]);

  // Apply search and sorting
  const filteredOrders = useMemo(() => {
    let result = [...pendingOrders];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(order =>
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.itemNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const amountA = a.quantity * a.unitPrice;
      const amountB = b.quantity * b.unitPrice;
      
      switch(sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "amount-high":
          return amountB - amountA;
        case "amount-low":
          return amountA - amountB;
        case "quantity-high":
          return b.quantity - a.quantity;
        case "quantity-low":
          return a.quantity - b.quantity;
        case "planned-date":
          return new Date(a.plannedDispatchDate || 0) - new Date(b.plannedDispatchDate || 0);
        default:
          return 0;
      }
    });
    
    return result;
  }, [pendingOrders, searchTerm, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPending = pendingOrders.length;
    const totalAmount = pendingOrders.reduce((sum, order) => 
      sum + (order.quantity * order.unitPrice), 0
    );
    const totalQuantity = pendingOrders.reduce((sum, order) => 
      sum + order.quantity, 0
    );
    const avgOrderValue = totalPending > 0 ? totalAmount / totalPending : 0;
    
    // Count by item type
    const domesticCount = pendingOrders.filter(o => o.itemType === "Domestic").length;
    const exportCount = pendingOrders.filter(o => o.itemType === "Export").length;
    
    return {
      totalPending,
      totalAmount,
      totalQuantity,
      avgOrderValue,
      domesticCount,
      exportCount
    };
  }, [pendingOrders]);

  const getTimeUntilDispatch = (date) => {
    if (!date) return "Not set";
    const now = new Date();
    const dispatchDate = new Date(date);
    const diffTime = dispatchDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `${diffDays} days`;
    return `${diffDays} days`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Loader2 className="loading-spinner" size={48} />
          <p>Loading pending orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <AlertCircle size={48} className="error-icon" />
          <h3>Failed to load orders</h3>
          <p>{error}</p>
          <button onClick={refetch} className="retry-btn">
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-orders-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-left">
          <div className="header-icon">
            <Clock size={32} />
          </div>
          <div className="header-content">
            <h1>Pending Orders</h1>
            <p className="subtitle">
              {pendingOrders.length} orders awaiting action
            </p>
            <div className="header-stats">
              <div className="stat-badge">
                <DollarSign size={14} />
                <span>Total Value: ${stats.totalAmount.toFixed(2)}</span>
              </div>
              <div className="stat-badge">
                <Package size={14} />
                <span>Total Items: {stats.totalQuantity}</span>
              </div>
              <div className="stat-badge">
                <Users size={14} />
                <span>{stats.domesticCount} Domestic · {stats.exportCount} Export</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button
            className="btn-create"
            onClick={() => navigate('/order/create')}
          >
            <Plus size={18} />
            New Order
          </button>
          <button
            className="btn-view-all"
            onClick={() => navigate('/orders')}
          >
            View All Orders
          </button>
        </div>
      </div>

      {/* Quick Stats Toggle */}
      <div className="stats-toggle" onClick={() => setShowStats(!showStats)}>
        <BarChart3 size={16} />
        <span>{showStats ? 'Hide' : 'Show'} Statistics</span>
        <ChevronDown size={16} className={`chevron ${showStats ? 'up' : ''}`} />
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <div className="statistics-panel">
          <div className="stats-grid">
            <div className="stat-card highlight">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalPending}</div>
                <div className="stat-label">Pending Orders</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <DollarSign size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">${stats.totalAmount.toLocaleString()}</div>
                <div className="stat-label">Total Value</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Package size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalQuantity}</div>
                <div className="stat-label">Total Items</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">${stats.avgOrderValue.toFixed(2)}</div>
                <div className="stat-label">Avg Order Value</div>
              </div>
            </div>
          </div>
          
          <div className="type-distribution">
            <div className="distribution-item">
              <div className="distribution-header">
                <span className="distribution-label">
                  <span className="dot domestic"></span>
                  Domestic Orders
                </span>
                <span className="distribution-count">{stats.domesticCount}</span>
              </div>
              <div className="distribution-bar">
                <div 
                  className="distribution-fill domestic"
                  style={{ 
                    width: `${(stats.domesticCount / pendingOrders.length) * 100 || 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="distribution-item">
              <div className="distribution-header">
                <span className="distribution-label">
                  <span className="dot export"></span>
                  Export Orders
                </span>
                <span className="distribution-count">{stats.exportCount}</span>
              </div>
              <div className="distribution-bar">
                <div 
                  className="distribution-fill export"
                  style={{ 
                    width: `${(stats.exportCount / pendingOrders.length) * 100 || 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls Section */}
      <div className="controls-section">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search pending orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")} 
              className="clear-search"
            >
              ×
            </button>
          )}
        </div>

        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">
              <Filter size={14} />
              Sort By
            </label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Amount (High to Low)</option>
              <option value="amount-low">Amount (Low to High)</option>
              <option value="quantity-high">Quantity (High to Low)</option>
              <option value="quantity-low">Quantity (Low to High)</option>
              <option value="planned-date">Planned Dispatch Date</option>
            </select>
          </div>
          
          <div className="filter-info">
            <span className="results-count">
              Showing {filteredOrders.length} of {pendingOrders.length} pending orders
            </span>
            <button 
              onClick={() => {
                setSearchTerm("");
                setSortBy("newest");
              }}
              className="reset-filters"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="orders-grid">
        {filteredOrders.length === 0 ? (
          <div className="no-pending-orders">
            <div className="empty-state">
              <CheckCircle size={64} className="empty-icon" />
              <h3>No Pending Orders</h3>
              <p>All orders are either processed or dispatched</p>
              <div className="empty-actions">
                <button 
                  onClick={() => navigate('/order/create')}
                  className="btn-create-empty"
                >
                  <Plus size={16} />
                  Create New Order
                </button>
                <button 
                  onClick={() => navigate('/orders')}
                  className="btn-view-all-empty"
                >
                  View All Orders
                </button>
              </div>
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const dispatchTime = getTimeUntilDispatch(order.plannedDispatchDate);
            const isOverdue = dispatchTime === "Overdue";
            
            return (
              <div key={order._id} className="pending-order-card">
                <div className="card-header">
                  <div className="order-meta">
                    <div className="order-number">
                      <span className="prefix">PO #</span>
                      <span className="number">{order.itemNumber}</span>
                    </div>
                    <div className={`time-badge ${isOverdue ? 'overdue' : dispatchTime === 'Today' ? 'urgent' : 'normal'}`}>
                      <Clock size={12} />
                      <span>{dispatchTime}</span>
                    </div>
                  </div>
                  <div className="customer-name">
                    <Users size={14} />
                    <span>{order.customerName}</span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="item-info">
                    <h4 className="item-title">
                      <Package size={16} />
                      {order.itemName}
                    </h4>
                    <div className="item-details">
                      <div className="detail-item">
                        <span className="detail-label">Type</span>
                        <span className={`detail-value ${order.itemType?.toLowerCase()}`}>
                          {order.itemType}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Quantity</span>
                        <span className="detail-value">{order.quantity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="amount-section">
                    <div className="amount-item">
                      <span className="amount-label">Unit Price</span>
                      <span className="amount-value">${order.unitPrice?.toFixed(2)}</span>
                    </div>
                    <div className="amount-item highlight">
                      <span className="amount-label">Total</span>
                      <span className="amount-value">
                        ${(order.quantity * order.unitPrice)?.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {order.plannedDispatchDate && (
                    <div className="dispatch-info">
                      <div className="dispatch-date">
                        <Calendar size={14} />
                        <span>Planned: {new Date(order.plannedDispatchDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button 
                    className="btn-process"
                    onClick={() => navigate(`/order/${order._id}/edit`)}
                  >
                    <Truck size={16} />
                    Process Order
                  </button>
                  <button 
                    className="btn-invoice"
                    onClick={() => {/* Handle invoice */}}
                  >
                    <FileText size={16} />
                    Prepare Invoice
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      <div className="summary-footer">
        <div className="summary-content">
          <div className="summary-item">
            <span className="summary-label">Total Pending Value:</span>
            <span className="summary-value">${stats.totalAmount.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Average Order Value:</span>
            <span className="summary-value">${stats.avgOrderValue.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Urgent Orders:</span>
            <span className="summary-value urgent">
              {
                filteredOrders.filter(order => {
                  const time = getTimeUntilDispatch(order.plannedDispatchDate);
                  return time === "Overdue" || time === "Today" || time === "Tomorrow";
                }).length
              }
            </span>
          </div>
        </div>
        <button 
          className="btn-refresh"
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>
    </div>
  );
}

export default PendingOrder;