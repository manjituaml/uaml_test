import React, { useEffect, useState } from "react";
import "./EmployeeProfile.scss";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { baseUrl, baseUserUrlPrefix } from "../../utils/baseUrl";
import {
  User,
  Mail,
  Briefcase,
  Building,
  Shield,
  Calendar, 
  RefreshCw,
  MoreVertical,
  Edit2,
  PauseCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

function EmployeeProfile() {
  const { empolyeeId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${baseUrl}${baseUserUrlPrefix}/getuser/${empolyeeId}`, {withCredentials: true}
        );
        if (res.data.success) setUser(res.data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [empolyeeId]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <CheckCircle size={16} />;
      case "suspended":
        return <PauseCircle size={16} />;
      case "inactive":
        return <XCircle size={16} />;
      default:
        return <CheckCircle size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "#10b981";
      case "suspended":
        return "#f59e0b";
      case "inactive":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  if (loading)
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading employee profile...</p>
      </div>
    );

  if (!user)
    return (
      <div className="profile-error">
        <XCircle size={48} />
        <h3>Employee Not Found</h3>
        <p>The requested employee profile could not be loaded.</p>
      </div>
    );

  return (
    <div className="profile-container">
      {/* Header Section */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="avatar">{user.userName?.charAt(0) || "U"}</div>
          <div className="profile-meta">
            <h1>{user.userName}</h1>
            <div className="profile-tags">
              <span className="tag tag-position">
                <Briefcase size={14} />
                {user.jobPosition}
              </span>
              <span className="tag tag-department">
                <Building size={14} />
                {user.department}
              </span>
              <span
                className="tag tag-status"
                style={{ color: getStatusColor(user.isStatus) }}
              >
                {getStatusIcon(user.isStatus)}
                {user.isStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {/* <button className="btn-icon">
            <MoreVertical size={20} />
          </button> */}
          {/* <button className="btn-secondary">
            <PauseCircle size={16} />
            Suspend Account
          </button> */}
          <button className="btn-primary" onClick={() => navigate(`/employee/${empolyeeId}/edit`)} >
            <Edit2 size={16}/>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        {/* Left Column - Personal Info */}
        <div className="content-left">
          <div className="info-card">
            <div className="card-header">
              <User size={20} />
              <h3>Personal Information</h3>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <label>Employee ID</label>
                <div className="info-value">{user.userId}</div>
              </div>
              <div className="info-item">
                <label>Full Name</label>
                <div className="info-value">{user.userName}</div>
              </div>
              <div className="info-item">
                <label>Email Address</label>
                <div className="info-value">
                  <Mail size={14} />
                  {user.userEmail}
                </div>
              </div>
              <div className="info-item">
                <label>Account Status</label>
                <div
                  className="status-badge"
                  style={{
                    backgroundColor: `${getStatusColor(user.isStatus)}15`,
                    color: getStatusColor(user.isStatus),
                  }}
                >
                  {getStatusIcon(user.isStatus)}
                  {user.isStatus}
                </div>
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="card-header">
              <Shield size={20} />
              <h3>Account Privileges</h3>
            </div>
            <div className="privileges-grid">
              <div
                className={`privilege-item ${user.isAdmin ? "active" : "inactive"}`}
              >
                <Shield size={18} />
                <div>
                  <div className="privilege-title">Administrator</div>
                  <div className="privilege-desc">Full system access</div>
                </div>
                <div className="privilege-status">
                  {user.isAdmin ? "Enabled" : "Disabled"}
                </div>
              </div>
              <div
                className={`privilege-item ${user.isHead ? "active" : "inactive"}`}
              >
                <Building size={18} />
                <div>
                  <div className="privilege-title">Department Head</div>
                  <div className="privilege-desc">Department management</div>
                </div>
                <div className="privilege-status">
                  {user.isHead ? "Enabled" : "Disabled"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Work Info & Meta */}
        <div className="content-right">
          <div className="info-card">
            <div className="card-header">
              <Briefcase size={20} />
              <h3>Work Details</h3>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-icon">
                  <Building size={18} />
                </div>
                <div>
                  <label>Department</label>
                  <div className="detail-value">{user.department}</div>
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-icon">
                  <Briefcase size={18} />
                </div>
                <div>
                  <label>Job Position</label>
                  <div className="detail-value">{user.jobPosition}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="card-header">
              <Calendar size={20} />
              <h3>Account Timeline</h3>
            </div>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-title">Account Created</div>
                  <div className="timeline-date">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-title">Last Updated</div>
                  <div className="timeline-date">
                    {new Date(user.updatedAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    <span className="timeline-ago">
                      (
                      {Math.floor(
                        (new Date() - new Date(user.updatedAt)) /
                          (1000 * 60 * 60 * 24),
                      )}{" "}
                      days ago)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="info-card stats-card">
            <h3>Quick Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">--</div>
                <div className="stat-label">Projects</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">--</div>
                <div className="stat-label">Tasks</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">--</div>
                <div className="stat-label">Teams</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">--</div>
                <div className="stat-label">Attendance</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfile;
