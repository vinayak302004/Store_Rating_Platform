import React, { useEffect, useState } from "react";
import api from "../api";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const { data } = await api.patch("/auth/password", { password });
      setMessage(data.message);
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    }
  }

  return (
    <section className="card narrow">
      <h1>Change password</h1>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
      <form className="form" onSubmit={submit}>
        <label>New password
          <input type="password" minLength="8" maxLength="16" required
            value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <button className="primary">Update Password</button>
      </form>
    </section>
  );
}
