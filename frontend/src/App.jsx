import React, { useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import ChangePassword from "./pages/ChangePassword";

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("roxiler_user") || "null");
  } catch {
    return null;
  }
}

function Protected({ roles, children }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function Home() {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "OWNER") return <Navigate to="/owner" replace />;
  return <Navigate to="/stores" replace />;
}

function Layout({ children }) {
  const user = getUser();
  const navigate = useNavigate();
  const [, refresh] = useState(0);

  function logout() {
    localStorage.removeItem("roxiler_token");
    localStorage.removeItem("roxiler_user");
    refresh(v => v + 1);
    navigate("/login");
  }

  return (
    <div className="app">
      {user && (
        <header className="topbar">
          <Link to="/" className="brand">Store Rating Platform</Link>
          <nav>
            <span className="role-pill">{user.role}</span>
            {user.role === "USER" && <Link to="/stores">Stores</Link>}
            {user.role === "ADMIN" && <Link to="/admin">Admin</Link>}
            {user.role === "OWNER" && <Link to="/owner">Owner</Link>}
            <Link to="/password">Change Password</Link>
            <button className="link-button" onClick={logout}>Logout</button>
          </nav>
        </header>
      )}
      <main className="container">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/password" element={<Protected><ChangePassword /></Protected>} />
        <Route path="/admin" element={<Protected roles={["ADMIN"]}><AdminDashboard /></Protected>} />
        <Route path="/stores" element={<Protected roles={["USER"]}><UserDashboard /></Protected>} />
        <Route path="/owner" element={<Protected roles={["OWNER"]}><OwnerDashboard /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
