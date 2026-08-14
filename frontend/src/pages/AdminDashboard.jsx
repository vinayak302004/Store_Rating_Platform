import React, { useEffect, useState } from "react";
import api from "../api";

const emptyUser = {name:"",email:"",password:"",address:"",role:"USER"};
const emptyStore = {name:"",email:"",address:"",ownerId:""};

function SortSelect({ onChange, type }) {
  return (
    <select defaultValue="name:asc" onChange={e => onChange(e.target.value)}>
      <option value="name:asc">Name ↑</option>
      <option value="name:desc">Name ↓</option>
      <option value="email:asc">Email ↑</option>
      <option value="email:desc">Email ↓</option>
      <option value="address:asc">Address ↑</option>
      <option value="address:desc">Address ↓</option>
      {type === "users" && <><option value="role:asc">Role ↑</option><option value="role:desc">Role ↓</option></>}
      {type === "stores" && <><option value="rating:desc">Rating ↓</option><option value="rating:asc">Rating ↑</option></>}
    </select>
  );
}

export default function AdminDashboard() {
  const [stats,setStats] = useState({users:0,stores:0,ratings:0});
  const [stores,setStores] = useState([]);
  const [users,setUsers] = useState([]);
  const [owners,setOwners] = useState([]);
  const [storeForm,setStoreForm] = useState(emptyStore);
  const [userForm,setUserForm] = useState(emptyUser);
  const [storeFilter,setStoreFilter] = useState({name:"",email:"",address:""});
  const [userFilter,setUserFilter] = useState({name:"",email:"",address:"",role:""});
  const [storeSort,setStoreSort] = useState("name:asc");
  const [userSort,setUserSort] = useState("name:asc");
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");

  const parseSort = value => {
    const [sortBy,order] = value.split(":");
    return {sortBy,order};
  };

  async function load() {
    const [s,u,o] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/stores", {params:{...storeFilter,...parseSort(storeSort)}}),
      api.get("/admin/users", {params:{...userFilter,...parseSort(userSort)}})
    ]);
    setStats(s.data);
    setStores(s.data ? (await api.get("/admin/stores", {params:{...storeFilter,...parseSort(storeSort)}})).data : []);
    setUsers(u.data);
    setOwners(u.data.filter(x => x.role === "OWNER"));
  }

  useEffect(() => {
    load().catch(err => setError(err.response?.data?.message || "Could not load admin data"));
  }, [storeSort,userSort]);

  async function createUser(e) {
    e.preventDefault();
    try {
      await api.post("/admin/users", userForm);
      setUserForm(emptyUser);
      setMessage("User created successfully");
      await load();
    } catch (err) { setError(err.response?.data?.message || "Could not create user"); }
  }

  async function createStore(e) {
    e.preventDefault();
    try {
      await api.post("/admin/stores", storeForm);
      setStoreForm(emptyStore);
      setMessage("Store created successfully");
      await load();
    } catch (err) { setError(err.response?.data?.message || "Could not create store"); }
  }

  function setUserField(k,v){ setUserForm({...userForm,[k]:v}); }
  function setStoreField(k,v){ setStoreForm({...storeForm,[k]:v}); }

  return (
    <>
      <div className="page-head">
        <div><h1>Administrator Dashboard</h1><p className="muted">Manage users, stores and ratings.</p></div>
      </div>

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <div className="stats">
        <div className="stat"><span>Total Users</span><strong>{stats.users}</strong></div>
        <div className="stat"><span>Total Stores</span><strong>{stats.stores}</strong></div>
        <div className="stat"><span>Total Ratings</span><strong>{stats.ratings}</strong></div>
      </div>

      <div className="two-col">
        <section className="card">
          <h2>Add User</h2>
          <form className="form compact" onSubmit={createUser}>
            <input placeholder="Name (20-60 chars)" minLength="20" maxLength="60" required value={userForm.name} onChange={e=>setUserField("name",e.target.value)} />
            <input type="email" placeholder="Email" required value={userForm.email} onChange={e=>setUserField("email",e.target.value)} />
            <input type="password" placeholder="Password" minLength="8" maxLength="16" required value={userForm.password} onChange={e=>setUserField("password",e.target.value)} />
            <textarea placeholder="Address" maxLength="400" required value={userForm.address} onChange={e=>setUserField("address",e.target.value)} />
            <select value={userForm.role} onChange={e=>setUserField("role",e.target.value)}>
              <option value="USER">Normal User</option><option value="ADMIN">Admin</option><option value="OWNER">Store Owner</option>
            </select>
            <button className="primary">Add User</button>
          </form>
        </section>

        <section className="card">
          <h2>Add Store</h2>
          <form className="form compact" onSubmit={createStore}>
            <input placeholder="Store name" required value={storeForm.name} onChange={e=>setStoreField("name",e.target.value)} />
            <input type="email" placeholder="Store email" required value={storeForm.email} onChange={e=>setStoreField("email",e.target.value)} />
            <textarea placeholder="Store address" maxLength="400" required value={storeForm.address} onChange={e=>setStoreField("address",e.target.value)} />
            <select value={storeForm.ownerId} onChange={e=>setStoreField("ownerId",e.target.value)}>
              <option value="">No owner assigned</option>
              {owners.map(o=><option key={o.id} value={o.id}>{o.name} — {o.email}</option>)}
            </select>
            <button className="primary">Add Store</button>
          </form>
        </section>
      </div>

      <section className="card">
        <div className="section-head"><h2>Stores</h2><SortSelect type="stores" onChange={setStoreSort}/></div>
        <div className="filter-row">
          <input placeholder="Name" value={storeFilter.name} onChange={e=>setStoreFilter({...storeFilter,name:e.target.value})}/>
          <input placeholder="Email" value={storeFilter.email} onChange={e=>setStoreFilter({...storeFilter,email:e.target.value})}/>
          <input placeholder="Address" value={storeFilter.address} onChange={e=>setStoreFilter({...storeFilter,address:e.target.value})}/>
          <button className="secondary" onClick={load}>Filter</button>
        </div>
        <Table rows={stores} columns={["name","email","address","rating"]} />
      </section>

      <section className="card">
        <div className="section-head"><h2>Users</h2><SortSelect type="users" onChange={setUserSort}/></div>
        <div className="filter-row">
          <input placeholder="Name" value={userFilter.name} onChange={e=>setUserFilter({...userFilter,name:e.target.value})}/>
          <input placeholder="Email" value={userFilter.email} onChange={e=>setUserFilter({...userFilter,email:e.target.value})}/>
          <input placeholder="Address" value={userFilter.address} onChange={e=>setUserFilter({...userFilter,address:e.target.value})}/>
          <select value={userFilter.role} onChange={e=>setUserFilter({...userFilter,role:e.target.value})}>
            <option value="">All Roles</option><option value="USER">User</option><option value="ADMIN">Admin</option><option value="OWNER">Owner</option>
          </select>
          <button className="secondary" onClick={load}>Filter</button>
        </div>
        <Table rows={users} columns={["name","email","address","role"]}/>
      </section>
    </>
  );
}

function Table({rows,columns}) {
  return (
    <div className="table-wrap">
      <table><thead><tr>{columns.map(c=><th key={c}>{c.replace("_"," ").toUpperCase()}</th>)}</tr></thead>
      <tbody>{rows.map(row=><tr key={row.id}>{columns.map(c=><td key={c}>{c==="rating" ? `⭐ ${row[c]}` : row[c]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
