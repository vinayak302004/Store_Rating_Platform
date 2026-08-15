import React, { useEffect, useState } from "react";
import api from "../api";

export default function UserDashboard() {
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name:"", address:"" });
  const [sort, setSort] = useState({ sortBy:"name", order:"asc" });
  const [rating, setRating] = useState({});
  const [error, setError] = useState("");

  async function load() {
    try {
      const params = { ...filters, ...sort };
      const { data } = await api.get("/stores", { params });
      setStores(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load stores");
    }
  }

  useEffect(() => { load(); }, [sort]);

  async function rate(store) {
    const value = Number(rating[store.id]);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      setError("Rating must be an integer from 1 to 5");
      return;
    }

    try {
      if (store.my_rating) {
        await api.put(`/stores/${store.id}/rating`, { rating:value });
      } else {
        await api.post(`/stores/${store.id}/rating`, { rating:value });
      }
      setRating({...rating, [store.id]:""});
      setError("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save rating");
    }
  }

  function changeSort(e) {
    const [sortBy, order] = e.target.value.split(":");
    setSort({ sortBy, order });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Stores</h1>
          <p className="muted">Search stores and submit or modify your rating.</p>
        </div>
      </div>

      <section className="card filter-grid">
        <input placeholder="Search by store name" value={filters.name}
          onChange={e => setFilters({...filters,name:e.target.value})} />
        <input placeholder="Search by address" value={filters.address}
          onChange={e => setFilters({...filters,address:e.target.value})} />
        <button className="secondary" onClick={load}>Search</button>
        <select onChange={changeSort} defaultValue="name:asc">
          <option value="name:asc">Name ↑</option>
          <option value="name:desc">Name ↓</option>
          <option value="address:asc">Address ↑</option>
          <option value="address:desc">Address ↓</option>
          <option value="rating:desc">Rating ↓</option>
          <option value="rating:asc">Rating ↑</option>
        </select>
      </section>

      {error && <div className="error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Store</th><th>Address</th><th>Overall Rating</th><th>Your Rating</th><th>Action</th></tr>
          </thead>
          <tbody>
            {stores.map(s => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.address}</td>
                <td>⭐ {s.overall_rating}</td>
                <td>{s.my_rating || "Not submitted"}</td>
                <td className="rating-cell">
                  <select value={rating[s.id] ?? ""} onChange={e => setRating({...rating,[s.id]:e.target.value})}>
                    <option value="">Select</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <button className="primary small" onClick={() => rate(s)}>
                    {s.my_rating ? "Modify" : "Submit"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
