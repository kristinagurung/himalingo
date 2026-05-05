'use client';
import React, { useState, useEffect } from 'react';

const API = "http://localhost:5000";

export default function AdminPanel() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [creds, setCreds] = useState({ email: "", pass: "" });
    const [error, setError] = useState("");

    useEffect(() => {
        if (localStorage.getItem("himalingo_session") === "active") {
            setIsLoggedIn(true);
            fetchData();
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/admin/all-data`);
            const result = await res.json();
            if (result.success) setData(result.translations || []);
        } catch (err) { console.error("Fetch failed"); }
        setLoading(false);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        // Credentials: admin@himalingo.com / admin123
        if (creds.email === "admin@himalingo.com" && creds.pass === "admin123") {
            localStorage.setItem("himalingo_session", "active");
            setIsLoggedIn(true);
            fetchData();
        } else {
            setError("Invalid Admin Credentials");
        }
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/admin/sync-json`, { method: 'POST' });
            const result = await res.json();
            alert(result.message);
            fetchData();
        } catch (err) { alert("Sync failed"); }
        setLoading(false);
    };

    const toggleStatus = async (id) => {
        try {
            const res = await fetch(`${API}/admin/toggle-status/${id}`, { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                setData(prev => prev.map(item => 
                    item._id === id ? { ...item, isChecked: result.isChecked } : item
                ));
            }
        } catch (err) { console.error("Update failed"); }
    };

    if (!isLoggedIn) return (
        <div style={styles.loginWrapper}>
            <div style={styles.loginCard}>
                <h2 style={{textAlign:'center', color:'#2A3547'}}>Himalingo Admin Login</h2>
                <form onSubmit={handleLogin}>
                    <input style={styles.input} type="email" placeholder="Email" onChange={e => setCreds({...creds, email: e.target.value})} required />
                    <input style={styles.input} type="password" placeholder="Password" onChange={e => setCreds({...creds, pass: e.target.value})} required />
                    {error && <p style={{color:'red', fontSize:'13px'}}>{error}</p>}
                    <button style={styles.btnBlue} type="submit">Login</button>
                </form>
            </div>
        </div>
    );

    return (
        <div style={styles.container}>
            <aside style={styles.sidebar}>
                <h2 style={styles.logo}>● Himalingo</h2>
                <div style={styles.navActive}>📊 Dashboard</div>
            </aside>
            <main style={styles.main}>
                <header style={styles.header}>
                    <div>
                        <h1 style={{margin:0}}>Data Management</h1>
                        <p style={{color:'#7C8FAC', margin:0}}>Total Items: {data.length}</p>
                    </div>
                    <button onClick={handleSync} style={styles.btnSync}>{loading ? "Syncing..." : "🔄 Sync JSON"}</button>
                </header>
                <div style={styles.card}>
                    <input style={styles.search} placeholder="Search..." onChange={e => setSearch(e.target.value)} />
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>STATUS</th>
                                <th style={styles.th}>ENGLISH</th>
                                <th style={styles.th}>BHUTIA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.filter(d => (d.english || "").toLowerCase().includes(search.toLowerCase())).map(item => (
                                <tr key={item._id}>
                                    <td style={styles.td}>
                                        <input 
                                            type="checkbox" 
                                            checked={!!item.isChecked} 
                                            onChange={() => toggleStatus(item._id)} 
                                        />
                                    </td>
                                    <td style={styles.td}>{item.english}</td>
                                    <td style={{...styles.td, color:'#5D87FF', fontWeight:'bold'}}>{item.transliteration}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

const styles = {
    container: { display:'flex', background:'#F2F5F9', minHeight:'100vh' },
    sidebar: { width:'200px',background:'#fff', padding:'30px', borderRight:'1px solid #e5eaef', position:'fixed', height:'100vh' },
    logo: { fontSize:'24px', fontWeight:'bold', marginBottom:'40px' },
    navActive: { background:'#ECF2FF', color:'#5D87FF', padding:'12px', borderRadius:'8px', fontWeight:'600',position: 'fixed' },
    main: { flex:1, padding:'40px', marginLeft:'260px' },
    header: { display:'flex', justifyContent:'space-between', marginBottom:'30px' },
    btnSync: { background:'#5D87FF', color:'#fff', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer' },
    card: { background:'#fff', borderRadius:'12px', padding:'25px', boxShadow:'0 5px 20px rgba(0,0,0,0.05)' },
    search: { width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #dfe5ef', marginBottom:'20px' },
    table: { width:'100%', borderCollapse:'collapse' },
    th: { textAlign:'left', padding:'15px', color:'#7C8FAC', borderBottom:'1px solid #f2f5f9' },
    td: { padding:'15px', borderBottom:'1px solid #f2f5f9' },
    loginWrapper: { height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F2F5F9' },
    loginCard: { background:'#fff', padding:'40px', borderRadius:'15px', width:'350px' },
    input: { width:'100%', padding:'12px', marginBottom:'15px', borderRadius:'8px', border:'1px solid #ddd' },
    btnBlue: { width:'100%', padding:'12px', background:'#5D87FF', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' }
};