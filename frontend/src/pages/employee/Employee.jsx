import React, { useState } from "react";
import "./Employee.scss";
import { useNavigate } from "react-router-dom";
import useGetAllUsers from "../../hooks/useGetAllUsers";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Building,
  Briefcase,
  Shield,
  Star,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";

function Employee() {
  const navigate = useNavigate();
  const { users, loading, error, refetch } = useGetAllUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // Filter and search employees
  const filteredEmployees = users.filter(emp => {
    const matchesSearch = 
      emp.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jobPosition?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "admin") return matchesSearch && emp.isAdmin;
    if (filter === "head") return matchesSearch && emp.isHead;
    if (filter === "active") return matchesSearch && emp.isStatus === "active";
    if (filter === "suspended") return matchesSearch && emp.isStatus === "suspend";
    
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return '#10b981';
      case 'suspend': return '#f59e0b';
      case 'deactive': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDepartmentColor = (dept) => {
    const colors = {
      production: '#3b82f6',
      marketing: '#8b5cf6',
      purchase: '#10b981',
      sales: '#f59e0b',
      account: '#ef4444',
      hiring: '#06b6d4',
      quality: '#84cc16',
      store: '#f97316'
    };
    return colors[dept?.toLowerCase()] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Loader2 className="loading-spinner" size={48} />
          <p>Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <AlertCircle size={48} className="error-icon" />
          <h3>Something went wrong</h3>
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
    <div className="employee-modern-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-left">
          <div className="header-icon">
            <Users size={32} />
          </div>
          <div className="header-content">
            <h1>Employee Directory</h1>
            <p className="subtitle">
              Manage and organize your team members efficiently
            </p>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-number">{users.length}</span>
                <span className="stat-label">Total Employees</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {users.filter(e => e.isAdmin).length}
                </span>
                <span className="stat-label">Administrators</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {users.filter(e => e.isHead).length}
                </span>
                <span className="stat-label">Department Heads</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button
            className="btn-create"
            onClick={() => navigate("/employee/create")}
          >
            <UserPlus size={18} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search employees by name, email, or department..."
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

        <div className="filter-section">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
              onClick={() => setFilter('admin')}
            >
              <Shield size={14} />
              Administrators
            </button>
            <button 
              className={`filter-btn ${filter === 'head' ? 'active' : ''}`}
              onClick={() => setFilter('head')}
            >
              <Star size={14} />
              Department Heads
            </button>
            <button 
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button 
              className={`filter-btn ${filter === 'suspended' ? 'active' : ''}`}
              onClick={() => setFilter('suspended')}
            >
              Suspended
            </button>
          </div>
          
          <div className="results-info">
            <span className="results-count">
              Showing {filteredEmployees.length} of {users.length} employees
            </span>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="employee-grid">
        {filteredEmployees.length === 0 ? (
          <div className="no-results">
            <Search size={48} />
            <h3>No employees found</h3>
            <p>Try adjusting your search or filter criteria</p>
            <button 
              onClick={() => {
                setSearchTerm("");
                setFilter("all");
              }}
              className="reset-filters"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredEmployees.map((emp) => (
            <div 
              className="employee-card" 
              key={emp._id || emp.userId}
              onClick={() => navigate(`/employee/${emp.userId}`)}
            >
              {/* Card Header */}
              <div className="card-header">
                <div className="employee-avatar" 
                  style={{ 
                    backgroundColor: getDepartmentColor(emp.department),
                    color: 'white'
                  }}
                >
                  {emp.userName?.charAt(0) || 'U'}
                </div>
                <div className="employee-meta">
                  <h3 className="employee-name">{emp.userName}</h3>
                  <div className="status-badge" 
                    style={{ 
                      backgroundColor: `${getStatusColor(emp.isStatus)}15`,
                      color: getStatusColor(emp.isStatus)
                    }}
                  >
                    {emp.isStatus}
                  </div>
                </div>
                <button 
                  className="card-menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle menu click
                  }}
                >
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Card Body */}
              <div className="card-body">
                <div className="info-row">
                  <Mail size={16} className="row-icon" />
                  <span className="row-text">{emp.userEmail}</span>
                </div>
                <div className="info-row">
                  <Building size={16} className="row-icon" />
                  <span className="row-text">{emp.department}</span>
                </div>
                <div className="info-row">
                  <Briefcase size={16} className="row-icon" />
                  <span className="row-text">{emp.jobPosition}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="card-footer">
                <div className="badge-container">
                  {emp.isAdmin && (
                    <span className="badge badge-admin">
                      <Shield size={12} />
                      Admin
                    </span>
                  )}
                  {emp.isHead && (
                    <span className="badge badge-head">
                      <Star size={12} />
                      Head
                    </span>
                  )}
                  <span 
                    className="badge badge-dept"
                    style={{ backgroundColor: `${getDepartmentColor(emp.department)}15`, color: getDepartmentColor(emp.department) }}
                  >
                    {emp.department}
                  </span>
                </div>
                <div className="view-details">
                  <span>View Details</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon active">
            <Users size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {users.filter(e => e.isStatus === 'active').length}
            </div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon suspended">
            <Users size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {users.filter(e => e.isStatus === 'suspend').length}
            </div>
            <div className="stat-label">Suspended</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon admin">
            <Shield size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {users.filter(e => e.isAdmin).length}
            </div>
            <div className="stat-label">Administrators</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon head">
            <Star size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {users.filter(e => e.isHead).length}
            </div>
            <div className="stat-label">Department Heads</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Employee;