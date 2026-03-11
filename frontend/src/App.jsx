import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import PendingOrder from "./pages/order/PendingOrder";
import OrderList from "./pages/order/OrderList";
import CreateOrderCard from "./components/ordercard/CreateOrderCard";
import Employee from "./pages/employee/Employee";
import CreateEmployee from "./pages/employee/CreateEmployee";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import EditEmployee from "./pages/employee/EditEmployee";
import EditOrderCard from "./components/ordercard/EditOrderCard";
import Login from "./pages/auth/Login";
import Logout from "./pages/auth/Logout";
import Invoices from "./pages/invoice/Invoices";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<OrderList />} />
        <Route path="/order" element={<OrderList />} />
        <Route path="/order/create" element={<CreateOrderCard />} />
        <Route path="/order/:id/edit" element={<EditOrderCard />} />
        <Route path="/invoice" element={<Invoices />} />
        <Route path="/employee" element={<Employee />} />
        <Route path="/employee/create" element={<CreateEmployee />} />
        <Route path="/employee/:empolyeeId" element={<EmployeeProfile />} />
        <Route path="/employee/:empolyeeId/edit" element={<EditEmployee />} />
        <Route path="/login" element={<Login />} />
        <Route path="logout" element={<Logout/>} />
      </Route>
    </Routes>
  );
}

export default App;
