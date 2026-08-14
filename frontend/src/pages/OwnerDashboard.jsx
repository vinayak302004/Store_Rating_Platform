import React, { useEffect, useState } from "react";
import api from "../api";

export default function OwnerDashboard() {
  const [data,setData] = useState({stores:[],averageRating:0,ratingCount:0,raters:[]});
  const [error,setError] = useState("");

  useEffect(() => {
    api.get("/owner/dashboard")
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.message || "Could not load dashboard"));
  }, []);

  return (
    <>
      <div className="page-head">
        <div><h1>Store Owner Dashboard</h1><p className="muted">Monitor ratings submitted for your store.</p></div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="stats">
        <div className="stat"><span>Average Rating</span><strong>⭐ {data.averageRating}</strong></div>
        <div className="stat"><span>Total Ratings</span><strong>{data.ratingCount}</strong></div>
        <div className="stat"><span>Stores</span><strong>{data.stores.length}</strong></div>
      </div>

      <section className="card">
        <h2>Your Stores</h2>
        <div className="table-wrap">
          <table><thead><tr><th>Name</th><th>Email</th><th>Address</th></tr></thead>
          <tbody>{data.stores.map(s=><tr key={s.id}><td>{s.name}</td><td>{s.email}</td><td>{s.address}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Users who submitted ratings</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Email</th><th>Address</th><th>Store</th><th>Rating</th><th>Updated</th></tr></thead>
            <tbody>
              {data.raters.map(r => (
                <tr key={`${r.id}-${r.store_name}`}>
                  <td>{r.name}</td><td>{r.email}</td><td>{r.address}</td>
                  <td>{r.store_name}</td><td>⭐ {r.rating}</td>
                  <td>{new Date(r.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
