import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Lock,
  Building,
  Briefcase,
  Shield,
  UserCheck,
  Calendar,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { baseUrl, baseUserUrlPrefix } from "../../utils/baseUrl";
import "./EditEmployee.scss";

function EditEmployee() {
  const navigate = useNavigate();
  const { empolyeeId } = useParams();
  const [formData, setFormData] = useState({
    userName: "",
    userId: "",
    userEmail: "",
    password: "",
    department: "",
    jobPosition: "",
    isStatus: "active",
    isAdmin: false,
    isHead: false,
    statusPeriode: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [originalData, setOriginalData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Department options based on schema
  const departmentOptions = [
    { value: "production", label: "Production" },
    { value: "marketing", label: "Marketing" },
    { value: "purchase", label: "Purchase" },
    { value: "sales", label: "Sales" },
    { value: "account", label: "Account" },
    { value: "hiring", label: "Hiring" },
    { value: "quality", label: "Quality" },
    { value: "store", label: "Store" },
  ];

  // Job position options based on schema
  const jobPositionOptions = [
    { value: "ceo", label: "CEO" },
    { value: "manager", label: "Manager" },
    { value: "senior", label: "Senior" },
    { value: "junior", label: "Junior" },
  ];

  // Status options based on schema
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "suspend", label: "Suspended" },
    { value: "deactive", label: "Deactivated" },
  ];

  useEffect(() => {
    fetchEmployeeData();
  }, [empolyeeId]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${baseUrl}${baseUserUrlPrefix}/getuser/${empolyeeId}`,
        { withCredentials: true },
      );

      if (res.data.success && res.data.user) {
        const userData = res.data.user;
        setFormData({
          userName: userData.userName || "",
          userId: userData.userId || "",
          userEmail: userData.userEmail || "",
          password: "", // Don't pre-fill password for security
          department: userData.department || "",
          jobPosition: userData.jobPosition || "",
          isStatus: userData.isStatus || "active",
          isAdmin: userData.isAdmin || false,
          isHead: userData.isHead || false,
          statusPeriode: userData.statusPeriode
            ? new Date(userData.statusPeriode).toISOString().split("T")[0]
            : "",
        });
        setOriginalData(userData);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setErrors({ fetch: "Failed to load employee data. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userName.trim()) {
      newErrors.userName = "Name is required";
    } else if (formData.userName.length < 2) {
      newErrors.userName = "Name must be at least 2 characters";
    }

    if (!formData.userEmail.trim()) {
      newErrors.userEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
      newErrors.userEmail = "Invalid email format";
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.department) {
      newErrors.department = "Department is required";
    }

    if (!formData.jobPosition) {
      newErrors.jobPosition = "Job position is required";
    }

    if (formData.isStatus === "suspend" && !formData.statusPeriode) {
      newErrors.statusPeriode =
        "Suspension end date is required for suspended status";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear success message when form changes
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Prepare data for API - only send password if changed
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const res = await axios.put(
        `${baseUrl}${baseUserUrlPrefix}/edit/${empolyeeId}`,
        updateData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        },
      );

      if (res.data.success) {
        setSuccessMessage("Employee updated successfully!");
        // Update original data to reflect changes
        setOriginalData(formData);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        setErrors({ submit: res.data.message || "Failed to update employee" });
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      setErrors({
        submit:
          error.response?.data?.message ||
          "Failed to update employee. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  const handleResetForm = () => {
    if (originalData) {
      setFormData({
        userName: originalData.userName || "",
        userId: originalData.userId || "",
        userEmail: originalData.userEmail || "",
        password: "",
        department: originalData.department || "",
        jobPosition: originalData.jobPosition || "",
        isStatus: originalData.isStatus || "active",
        isAdmin: originalData.isAdmin || false,
        isHead: originalData.isHead || false,
        statusPeriode: originalData.statusPeriode
          ? new Date(originalData.statusPeriode).toISOString().split("T")[0]
          : "",
      });
    }
    setErrors({});
    setSuccessMessage("");
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "#10b981";
      case "suspend":
        return "#f59e0b";
      case "deactive":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="edit-loading">
        <div className="loading-spinner"></div>
        <p>Loading employee data...</p>
      </div>
    );
  }

  return (
    <div className="edit-employee-container">
      {/* Header */}
      <div className="edit-header">
        <button className="btn-back" onClick={handleCancel}>
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="header-content">
          <h1>
            <User size={24} />
            Edit Employee Profile
          </h1>
          <p className="employee-id">ID: {formData.userId}</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="alert-success">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="alert-error">
          <AlertCircle size={20} />
          <span>{errors.submit}</span>
          <button onClick={() => setErrors({})}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-grid">
          {/* Left Column - Personal Info */}
          <div className="form-column">
            <div className="form-section">
              <div className="section-header">
                <User size={20} />
                <h3>Personal Information</h3>
              </div>

              <div className="form-group">
                <label>
                  <User size={16} />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  className={`form-input ${errors.userName ? "error" : ""}`}
                  placeholder="Enter full name"
                />
                {errors.userName && (
                  <span className="error-message">{errors.userName}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <Mail size={16} />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="userEmail"
                  value={formData.userEmail}
                  onChange={handleInputChange}
                  className={`form-input ${errors.userEmail ? "error" : ""}`}
                  placeholder="employee@company.com"
                />
                {errors.userEmail && (
                  <span className="error-message">{errors.userEmail}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <Lock size={16} />
                  Password
                  <span className="label-hint">
                    (Leave blank to keep current)
                  </span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`form-input ${errors.password ? "error" : ""}`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}
                <p className="input-hint">Must be at least 6 characters long</p>
              </div>
            </div>
          </div>

          {/* Right Column - Work Details */}
          <div className="form-column">
            <div className="form-section">
              <div className="section-header">
                <Briefcase size={20} />
                <h3>Work Details</h3>
              </div>

              <div className="form-group">
                <label>
                  <Building size={16} />
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`form-select ${errors.department ? "error" : ""}`}
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <span className="error-message">{errors.department}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <Briefcase size={16} />
                  Job Position *
                </label>
                <select
                  name="jobPosition"
                  value={formData.jobPosition}
                  onChange={handleInputChange}
                  className={`form-select ${errors.jobPosition ? "error" : ""}`}
                >
                  <option value="">Select Position</option>
                  {jobPositionOptions.map((position) => (
                    <option key={position.value} value={position.value}>
                      {position.label}
                    </option>
                  ))}
                </select>
                {errors.jobPosition && (
                  <span className="error-message">{errors.jobPosition}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <UserCheck size={16} />
                  Account Status
                </label>
                <div className="status-selector">
                  {statusOptions.map((status) => (
                    <label
                      key={status.value}
                      className={`status-option ${formData.isStatus === status.value ? "active" : ""}`}
                      style={
                        formData.isStatus === status.value
                          ? {
                              borderColor: getStatusColor(status.value),
                              backgroundColor: `${getStatusColor(status.value)}15`,
                            }
                          : {}
                      }
                    >
                      <input
                        type="radio"
                        name="isStatus"
                        value={status.value}
                        checked={formData.isStatus === status.value}
                        onChange={handleInputChange}
                      />
                      <span
                        className="status-dot"
                        style={{
                          backgroundColor: getStatusColor(status.value),
                        }}
                      ></span>
                      {status.label}
                    </label>
                  ))}
                </div>
              </div>

              {formData.isStatus === "suspend" && (
                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    Suspension End Date *
                  </label>
                  <input
                    type="date"
                    name="statusPeriode"
                    value={formData.statusPeriode}
                    onChange={handleInputChange}
                    className={`form-input ${errors.statusPeriode ? "error" : ""}`}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.statusPeriode && (
                    <span className="error-message">
                      {errors.statusPeriode}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Permissions Section */}
            <div className="form-section">
              <div className="section-header">
                <Shield size={20} />
                <h3>Permissions</h3>
              </div>

              <div className="permissions-grid">
                <label className="permission-item">
                  <div className="permission-info">
                    <div className="permission-icon">
                      <Shield size={18} />
                    </div>
                    <div>
                      <div className="permission-title">
                        Administrator Access
                      </div>
                      <div className="permission-desc">
                        Full system access and control
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={formData.isAdmin}
                    onChange={handleInputChange}
                    className="toggle-switch"
                  />
                </label>

                <label className="permission-item">
                  <div className="permission-info">
                    <div className="permission-icon">
                      <Building size={18} />
                    </div>
                    <div>
                      <div className="permission-title">Department Head</div>
                      <div className="permission-desc">
                        Manage department members and tasks
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="isHead"
                    checked={formData.isHead}
                    onChange={handleInputChange}
                    className="toggle-switch"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleResetForm}
            className="btn-secondary"
            disabled={saving}
          >
            Reset Changes
          </button>

          <div className="action-group">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-outline"
              disabled={saving}
            >
              Cancel
            </button>

            <button type="submit" className="btn-primary" disabled={saving}>
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

      {/* Current Values Summary */}
      {originalData && (
        <div className="current-values">
          <h4>Current Values</h4>
          <div className="values-grid">
            <div className="value-item">
              <span className="value-label">Name:</span>
              <span className="value-data">{originalData.userName}</span>
            </div>
            <div className="value-item">
              <span className="value-label">Email:</span>
              <span className="value-data">{originalData.userEmail}</span>
            </div>
            <div className="value-item">
              <span className="value-label">Department:</span>
              <span className="value-data">
                {departmentOptions.find(
                  (d) => d.value === originalData.department,
                )?.label || originalData.department}
              </span>
            </div>
            <div className="value-item">
              <span className="value-label">Position:</span>
              <span className="value-data">
                {jobPositionOptions.find(
                  (p) => p.value === originalData.jobPosition,
                )?.label || originalData.jobPosition}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditEmployee;
