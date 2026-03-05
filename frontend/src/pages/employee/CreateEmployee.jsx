import React, { useState } from "react";
import "./CreateEmployee.scss";
import axios from "axios";
import { baseUrl, baseUserUrlPrefix } from "../../utils/baseUrl";
import { useNavigate } from "react-router-dom";

function CreateEmployee() {
  const [apiMessage, setApiMessage] = useState();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    userName: "",
    userId: "",
    userEmail: "",
    password: "",
    department: "",
    jobPosition: "",
    isStatus: "active",
    isAdmin: false,
    isHead: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${baseUrl}${baseUserUrlPrefix}/create`,
        form,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        },
      );

      if (res.data.message) {
        setApiMessage(res.data.message);

        // ✅ Clear message after 3 seconds
        setTimeout(() => {
          setApiMessage("");
        }, 3000);
      }
    } catch (error) {
      setApiMessage("Failed to create employee");

      setTimeout(() => {
        setApiMessage("");
      }, 3000);
    }
  };

  return (
    <div className="create-emp-page">
      <div className="create-emp-card">
        <h2>Create Employee</h2>
        <p>Add a new team member</p>
        {apiMessage && <span>{apiMessage}</span>}
        <form onSubmit={handleSubmit}>
          <div className="grid">
            <input
              name="userName"
              placeholder="Full Name"
              onChange={handleChange}
            />
            <input
              name="userId"
              placeholder="User ID"
              onChange={handleChange}
            />
            <input
              name="userEmail"
              placeholder="Email"
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
            />

            <select name="department" onChange={handleChange}>
              <option value="">Select Department</option>
              <option value="production">Production</option>
              <option value="marketing">Marketing</option>
              <option value="purchase">Purchase</option>
              <option value="sales">Sales</option>
              <option value="account">Account</option>
              <option value="hiring">Hiring</option>
              <option value="quality">Quality</option>
              <option value="store">Store</option>
            </select>

            <select name="jobPosition" onChange={handleChange}>
              <option value="">Select Position</option>
              <option value="ceo">CEO</option>
              <option value="manager">Manager</option>
              <option value="senior">Senior</option>
              <option value="junior">Junior</option>
            </select>

            <select name="isStatus" onChange={handleChange}>
              <option value="active">Active</option>
              <option value="suspend">Suspend</option>
              <option value="deactive">Deactive</option>
            </select>
          </div>

          <div className="checks">
            <label>
              <input type="checkbox" name="isAdmin" onChange={handleChange} />
              Admin
            </label>

            <label>
              <input type="checkbox" name="isHead" onChange={handleChange} />
              Department Head
            </label>
          </div>

          <button type="submit">Create Employee</button>
        </form>
      </div>
    </div>
  );
}

export default CreateEmployee;
