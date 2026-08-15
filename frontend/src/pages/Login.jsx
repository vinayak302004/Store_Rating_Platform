import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("roxiler_token", data.token);
      localStorage.setItem("roxiler_user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  }

  return (
    <section className="auth-card">
      <h1>Welcome back</h1>
      <p className="muted">Sign in to the Roxiler Store Rating Platform.</p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={submit} className="form">
        <label>Email<input type="email" required value={form.email}
          onChange={e => setForm({...form, email:e.target.value})} /></label>
        <label>Password<input type="password" required value={form.password}
          onChange={e => setForm({...form, password:e.target.value})} /></label>
        <button className="primary">Login</button>
      </form>

      <p className="center">New user? <Link to="/register">Create an account</Link></p>

    </section>
  );
}
