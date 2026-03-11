import { useState } from "react";
import "./Layout.scss";
import { Outlet, useNavigate } from "react-router-dom";
import UAMLLOGO from "../utils/logo";
import { useSelector } from "react-redux";

function Layout() {
  const navigate = useNavigate();
  const { user, isAdmin, isHead, isStatus } = useSelector(
    (store) => store.auth,
  );
  const headList = [
    ...(isAdmin || isHead ?
      [{ headName: "Employee", url: "employee" }]
      : []),
    { headName: "Orders", url: "order" },
    { headName: "Invoice", url: "invoice" },
    ...(user
      ? [{ headName: "Logout", url: "logout" }]
      : [{ headName: "Login", url: "login" }]),
  ];

  return (
    <>
      <div className="app_container">
        <div className="app_head">
          <div className="app_logo">
            <div className="app_image">
              <img src={UAMLLOGO} alt="" />
            </div>
            <div className="app_name">
              <h1>UAML</h1> <h3>Nano/Amorphous Core</h3>
            </div>
          </div>
          <div className="headListing">
            <ul>
              {user?.userName}
              {headList.map((c, i) => (
                <li key={i} onClick={() => navigate(c.url)}>
                  {c.headName}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="app_outlet">
          <Outlet />
        </div>
        <div className="footer"></div>
      </div>
    </>
  );
}

export default Layout;
