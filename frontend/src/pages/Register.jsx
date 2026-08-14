import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const initial = { name:"", email:"", address:"", password:"" };

export default function Register() {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/auth/register", form);
      localStorage.setItem("roxiler_token", data.token);
      localStorage.setItem("roxiler_user", JSON.stringify(data.user));
      navigate("/stores");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  }

  return (
    <section className="auth-card wide">
      <h1>Create account</h1>
      <p className="muted">Normal users can register from this page.</p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={submit} className="form">
        <label>Name (20-60 characters)
          <input required minLength="20" maxLength="60" value={form.name}
            onChange={e => setForm({...form,name:e.target.value})} />
        </label>
        <label>Email
          <input type="email" required value={form.email}
            onChange={e => setForm({...form,email:e.target.value})} />
        </label>
        <label>Address (max 400 characters)
          <textarea required maxLength="400" value={form.address}
            onChange={e => setForm({...form,address:e.target.value})} />
        </label>
        <label>Password (8-16, uppercase + special character)
          <input type="password" required minLength="8" maxLength="16"
            value={form.password}
            onChange={e => setForm({...form,password:e.target.value})} />
        </label>
        <button className="primary">Register</button>
      </form>

      <p className="center">Already registered? <Link to="/login">Login</Link></p>
    </section>
  );
}
