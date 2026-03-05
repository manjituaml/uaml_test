// OrderList.jsx
import { useState } from "react";
import "./PendingOrder.scss";
import OrderCard from "../../components/ordercard/OrderCard";
import { useNavigate } from "react-router-dom";
import useGetAllOrders from "../../hooks/useGetAllOrders";
import {
  Package,
  Plus,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Loader2,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import { useSelector } from "react-redux";

function OrderList() {
  const navigate = useNavigate();
  const { orders, loading, error, refetch } = useGetAllOrders();
  const { user, isAdmin, isHead } = useSelector((store) => store.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [itemTypeFilter, setItemTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // console.log(orders)
  // const domesticOrders = (orders || []).filter(
  //   (o) => o?.itemType?.toLowerCase() === "domestic",
  // );

  // const domesticPrice = domesticOrders?.reduce(
  //   (total, order) => total + (order?.reflectAmount || 0),
  //   0,
  // );

  // const exportOrders = (orders || []).filter(
  //   (o) => o?.itemType?.toLowerCase() === "export",
  // );

  // const exportPrice = exportOrders?.reduce(
  //   (total, order) => total + (order?.reflectAmount || 0),
  //   0,
  // );

  // const exportPriceInINR = exportOrders?.reduce(
  //   (total, order) => total + (order?.reflectAmount * order?.exchangeRate || 0),
  //   0,
  // );

  // console.log(orders);
  // console.log("Domestic Orders:", domesticOrders);
  // console.log("Export Orders:", exportOrders);

  const totals = (orders || []).reduce(
    (acc, order) => {
      if (order?.itemType === "Domestic") {
        acc.domestic += order?.reflectAmount || 0;
      }

      if (order?.itemType === "Export") {
        const amount = order?.reflectAmount || 0;
        const rate = order?.exchangeRate || 0;

        acc.exportUSD += amount;
        acc.exportINR += amount * rate;
      }

      return acc;
    },
    {
      domestic: 0,
      exportUSD: 0,
      exportINR: 0,
    },
  );

  // Filter and sort orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.itemNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "open" && !order.closedItem) ||
      (statusFilter === "closed" && order.closedItem) ||
      (statusFilter === "pending" && order.action === "pending") ||
      (statusFilter === "ready" && order.action === "ready") ||
      (statusFilter === "invoice" && order.action === "invoice ready") ||
      (statusFilter === "dispatch" && order.action === "dispatch");

    const matchesItemType =
      itemTypeFilter === "all" || order.itemType === itemTypeFilter;

    return matchesSearch && matchesStatus && matchesItemType;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "amount-high":
        return b.quantity * b.unitPrice - a.quantity * a.unitPrice;
      case "amount-low":
        return a.quantity * a.unitPrice - b.quantity * b.unitPrice;
      case "quantity-high":
        return b.quantity - a.quantity;
      case "quantity-low":
        return a.quantity - b.quantity;
      default:
        return 0;
    }
  });

  const getStatusStats = () => {
    const total = orders.length;
    const open = orders.filter((o) => !o.closedItem).length;
    const closed = orders.filter((o) => o.closedItem).length;
    const pending = orders.filter((o) => o.action === "pending").length;
    const ready = orders.filter((o) => o.action === "ready").length;
    const invoice = orders.filter((o) => o.action === "invoice ready").length;
    const dispatch = orders.filter((o) => o.action === "dispatch").length;

    return { total, open, closed, pending, ready, invoice, dispatch };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Loader2 className="loading-spinner" size={48} />
          <p>Loading purchase orders...</p>
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
    <div className="orders-modern-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-left">
          <div className="header-icon">
            <Package size={32} />
          </div>
          <div className="header-content">
            <h1>Purchase Orders</h1>
            <p className="subtitle">
              Manage and track all purchase orders in one place
            </p>
            <div className="stats-overview">
              <div className="stat-item">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Total Orders</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.open}</div>
                <div className="stat-label">Open</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.closed}</div>
                <div className="stat-label">Closed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.pending}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
          </div>

          <div className="pending-amount-card">
            <h2 className="card-title">Pending Amount</h2>

            <div className="amount-row domestic">
              <span className="label">Domestic</span>
              <span className="value">
                ₹ {totals?.domestic?.toLocaleString()}
              </span>
            </div>

            <div className="amount-row export">
              <span className="label">Export</span>
              <span className="value">
                $ {totals?.exportUSD?.toLocaleString()}
              </span>
            </div>

            <div className="divider" />

            <div className="amount-row total">
              <span className="label">Total (INR)</span>
              <span className="value highlight">
                ₹ {(totals?.domestic + totals?.exportINR)?.toLocaleString()}
              </span>
            </div>
          </div>
          
        </div>

        {(isAdmin || isHead) && (
          <div className="header-actions">
            <button
              className="btn-create-order"
              onClick={() => navigate("/order/create")}
            >
              <Plus size={18} />
              Create Order
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="quick-stats-grid">
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon ready">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.ready}</div>
            <div className="stat-label">Ready</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon invoice">
            <FileText size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.invoice}</div>
            <div className="stat-label">Invoice Ready</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon dispatch">
            <Package size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.dispatch}</div>
            <div className="stat-label">Dispatch</div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search orders by customer, item name, or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="clear-search">
              ×
            </button>
          )}
        </div>

        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">
              <Filter size={14} />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="open">Open Orders</option>
              <option value="closed">Closed Orders</option>
              <option value="pending">Pending</option>
              <option value="ready">Ready</option>
              <option value="invoice">Invoice Ready</option>
              <option value="dispatch">Dispatch</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Item Type</label>
            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="Domestic">Domestic</option>
              <option value="Export">Export</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sort By</label>
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
            </select>
          </div>
        </div>

        <div className="results-info">
          <span className="results-count">
            Showing {sortedOrders.length} of {orders.length} orders
          </span>
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setItemTypeFilter("all");
              setSortBy("newest");
            }}
            className="reset-filters"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="orders-grid">
        {sortedOrders.length === 0 ? (
          <div className="no-results">
            <Package size={48} />
            <h3>No orders found</h3>
            <p>Try adjusting your search or filter criteria</p>
            <button
              onClick={() => navigate("/order/create")}
              className="create-first-order"
            >
              <Plus size={16} />
              Create Your First Order
            </button>
          </div>
        ) : (
          sortedOrders.map((order) => (
            <OrderCard
              key={order._id}
              item={order}
              onClick={() => navigate(`/order/${order._id}/edit`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default OrderList;
