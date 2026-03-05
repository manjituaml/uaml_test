import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { baseUrl, baseUserUrlPrefix } from "../../utils/baseUrl";
import "./Login.scss";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/slices/authSlice";

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    userId: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const loginHandler = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.userId.trim() || !formData.password.trim()) {
      setError("User ID and Password are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(
        `${baseUrl}${baseUserUrlPrefix}/login`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (res.data.success) {
        dispatch(loginSuccess(res.data.user));
        navigate("/");
      } else {
        dispatch(loginFail(res.data.message));
      }
    } catch (error) {
      console.error("Login error:", error);

      // Handle different error types
      if (error.response) {
        // Server responded with error status
        setError(
          error.response.data?.message ||
            "Login failed. Please check credentials.",
        );
      } else if (error.request) {
        // Request was made but no response received
        setError("Network error. Please check your connection.");
      } else {
        // Something else happened
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      loginHandler(e);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Please enter your credentials to continue</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="login-form" onSubmit={loginHandler}>
          <div className="form-group">
            <label htmlFor="userId">User ID</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter your user ID"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading || !formData.userId || !formData.password}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

          <div className="login-footer">
            <p>
              Forgot your password?{" "}
              <button type="button" className="link-button">
                Contact Administrator
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
