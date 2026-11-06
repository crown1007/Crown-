import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { Package, Globe2, ShieldCheck, MapPin, Mail, Menu, X, Search, ArrowRight, LogIn, PlusCircle, RefreshCw, LogOut, Truck, Clock3, CheckCircle2 } from "lucide-react";
import "./style.css";

const COMPANY = {
  name: "Crownbridge Global Logistics",
  owner: "Mr. Cristinel Rusu",
  address: "78 Central Avenue, Hounslow, TW3 2QL, England",
  email: "crownbridgegloballogistics@gmail.com"
};
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function App() {
  const [page, setPage] = useState("home");
  const [trackingCode, setTrackingCode] = useState("");
  const [shipment, setShipment] = useState(null);
  const [trackError, setTrackError] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [adminRows, setAdminRows] = useState([]);
  const [form, setForm] = useState({ customer_name:"", origin:"", destination:"", status:"Shipment created", details:"Your shipment has been registered." });
  const [updateForm, setUpdateForm] = useState({ code:"", status:"In transit", details:"" });
  const [adminMessage, setAdminMessage] = useState("");

  React.useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function track(e) {
    e?.preventDefault();
    setLoading(true); setTrackError(""); setShipment(null);
    if (!supabase) { setTrackError("Tracking is not configured yet. The site owner must connect the database."); setLoading(false); return; }
    const code = trackingCode.trim().toUpperCase();
    if (!code) { setTrackError("Enter your tracking number."); setLoading(false); return; }
    const { data, error } = await supabase.rpc("public_track_shipment", { tracking_code_input: code });
    if (error) setTrackError("Tracking is temporarily unavailable. Please try again later.");
    else if (!data || data.length === 0) setTrackError("We couldn't find that tracking number. Please check it and try again.");
    else setShipment(data[0]);
    setLoading(false);
  }

  async function signIn(e) {
    e.preventDefault(); setAuthMessage("");
    if (!supabase) { setAuthMessage("Database setup is required before admin sign-in."); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthMessage(error ? "Sign-in failed. Check your credentials and admin access." : "Signed in.");
  }
  async function signOut() { await supabase?.auth.signOut(); setAdminRows([]); }
  async function loadAdmin() {
    if (!supabase || !session) return;
    const { data, error } = await supabase.from("shipments").select("id,tracking_code,customer_name,origin,destination,status,created_at").order("created_at",{ascending:false}).limit(100);
    if (error) setAdminMessage("Unable to load shipments. Confirm this account has admin permissions.");
    else { setAdminRows(data || []); setAdminMessage(""); }
  }
  React.useEffect(() => { if (page === "admin" && session) loadAdmin(); }, [page, session]);

  async function createShipment(e) {
    e.preventDefault(); setAdminMessage("");
    if (!supabase || !session) return;
    const code = `CBG-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.floor(100 + Math.random()*900)}`;
    const { data, error } = await supabase.from("shipments").insert({
      tracking_code: code, customer_name: form.customer_name, origin: form.origin,
      destination: form.destination, status: form.status
    }).select("id").single();
    if (error) { setAdminMessage("Could not create shipment. Check required fields and admin access."); return; }
    const { error: updateError } = await supabase.from("tracking_events").insert({ shipment_id:data.id, status:form.status, details:form.details });
    if (updateError) setAdminMessage(`Shipment ${code} created, but its first event could not be saved.`);
    else setAdminMessage(`Shipment created. Tracking number: ${code}`);
    setForm({customer_name:"",origin:"",destination:"",status:"Shipment created",details:"Your shipment has been registered."});
    loadAdmin();
  }
  async function addUpdate(e) {
    e.preventDefault(); setAdminMessage("");
    const code = updateForm.code.trim().toUpperCase();
    const { data: rows, error: findError } = await supabase.from("shipments").select("id").eq("tracking_code",code).limit(1);
    if (findError || !rows?.length) { setAdminMessage("Tracking number not found."); return; }
    const { error: eventError } = await supabase.from("tracking_events").insert({shipment_id:rows[0].id,status:updateForm.status,details:updateForm.details});
    const { error: statusError } = await supabase.from("shipments").update({status:updateForm.status}).eq("id",rows[0].id);
    setAdminMessage(eventError || statusError ? "Could not save the update." : "Tracking update saved.");
    if (!eventError && !statusError) { setUpdateForm({code:"",status:"In transit",details:""}); loadAdmin(); }
  }

  const go = (p) => { setPage(p); setMenuOpen(false); window.scrollTo({top:0,behavior:"smooth"}); };
  return <div>
    <div className="topbar"><div className="wrap topinner"><span><Globe2 size={14}/> Logistics, connected worldwide</span><a href={`mailto:${COMPANY.email}`}><Mail size={14}/> {COMPANY.email}</a></div></div>
    <header className="header"><div className="wrap nav">
      <button className="brand" onClick={()=>go("home")}><span className="brandmark"><Package/></span><span><b>CROWNBRIDGE</b><small>GLOBAL LOGISTICS</small></span></button>
      <button className="mobile-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen?<X/>:<Menu/>}</button>
      <nav className={menuOpen?"open":""}>
        <button onClick={()=>go("home")}>Home</button><button onClick={()=>go("services")}>Services</button><button onClick={()=>go("about")}>About</button><button onClick={()=>go("contact")}>Contact</button>
        <button className="navtrack" onClick={()=>go("track")}>Track shipment <ArrowRight size={16}/></button>
      </nav>
    </div></header>

    {page==="home" && <><section className="hero"><div className="wrap hero-grid"><div className="hero-copy"><div className="eyebrow"><span/> MOVING BUSINESS FORWARD</div><h1>Global logistics.<br/><em>Clearer journeys.</em></h1><p>Practical logistics support with shipment visibility from dispatch to destination. Track your consignment using your unique tracking number.</p><button className="primary" onClick={()=>go("track")}>Track your shipment <ArrowRight size={18}/></button><div className="trust"><ShieldCheck size={18}/> Shipment updates in one place</div></div><div className="hero-art"><div className="orbit orbit1"/><div className="orbit orbit2"/><div className="parcel"><Package size={86}/><span>CBG</span></div><div className="float-card"><span className="live-dot"/> TRACKING PORTAL <b>Stay informed</b></div><div className="route-line"/></div></div></section>
      <section className="features wrap"><div><Globe2/><b>Global reach</b><span>Logistics coordination across borders</span></div><div><Package/><b>Shipment visibility</b><span>Check the latest recorded shipment status</span></div><div><ShieldCheck/><b>Reliable updates</b><span>Tracking history recorded as events occur</span></div></section>
      <section className="section wrap split"><div><div className="eyebrow dark">SHIPMENT TRACKING</div><h2>Know where your shipment stands.</h2><p>Enter the tracking reference supplied by Crownbridge Global Logistics to view the latest status and available tracking events.</p></div><TrackBox trackingCode={trackingCode} setTrackingCode={setTrackingCode} track={track} loading={loading} error={trackError} shipment={shipment}/></section>
    </>}
    {page==="track" && <section className="page-section wrap"><div className="eyebrow dark">TRACK A SHIPMENT</div><h1 className="page-title">Track your delivery</h1><p className="sub">Enter your unique tracking number to view its latest recorded progress.</p><TrackBox trackingCode={trackingCode} setTrackingCode={setTrackingCode} track={track} loading={loading} error={trackError} shipment={shipment}/></section>}
    {page==="services" && <section className="page-section wrap"><div className="eyebrow dark">WHAT WE DO</div><h1 className="page-title">Logistics services</h1><p className="sub">A clear point of contact for shipment coordination and delivery visibility.</p><div className="service-grid"><Service icon={<Truck/>} title="Freight coordination" body="Support for coordinating the movement of consignments and keeping shipment information organised."/><Service icon={<Globe2/>} title="International logistics" body="Logistics coordination for shipments moving between origin and destination locations."/><Service icon={<Package/>} title="Shipment tracking" body="A tracking portal for customers to view the latest recorded shipment status and event history."/></div></section>}
    {page==="about" && <section className="page-section wrap narrow"><div className="eyebrow dark">ABOUT CROWNBRIDGE</div><h1 className="page-title">Moving with clarity.</h1><p className="sub">Crownbridge Global Logistics is presented as a logistics and shipment coordination business. This website provides company information and a customer-facing tracking portal.</p><div className="info-panel"><h3>Company information</h3><p><b>Company:</b> {COMPANY.name}</p><p><b>Owner:</b> {COMPANY.owner}</p><p><b>Address:</b> {COMPANY.address}</p><p><b>Email:</b> <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p></div></section>}
    {page==="contact" && <section className="page-section wrap narrow"><div className="eyebrow dark">GET IN TOUCH</div><h1 className="page-title">Contact our team</h1><p className="sub">For shipment enquiries, tracking assistance, or general questions, contact us by email.</p><div className="contact-card"><Mail size={26}/><div><small>EMAIL</small><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></div></div><div className="contact-card"><MapPin size={26}/><div><small>ADDRESS</small><b>{COMPANY.address}</b></div></div></section>}
    {page==="admin" && <section className="page-section wrap admin-page"><div className="eyebrow dark">PRIVATE AREA</div><h1 className="page-title">Shipment administration</h1>{!session ? <form className="admin-login" onSubmit={signIn}><h3>Owner sign in</h3><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="primary">Sign in <LogIn size={16}/></button>{authMessage&&<p className="notice">{authMessage}</p>}</form> : <><div className="admin-toolbar"><span>Signed in to the private dashboard</span><button className="secondary" onClick={signOut}><LogOut size={15}/> Sign out</button></div><p className="notice">{adminMessage}</p><div className="admin-grid"><form className="admin-card" onSubmit={createShipment}><h3><PlusCircle/> Create shipment</h3><label>Customer name<input value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})} required/></label><label>Origin<input value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})} required/></label><label>Destination<input value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} required/></label><label>Initial status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{["Shipment created","Processing","Dispatched","In transit","Out for delivery","Delivered","On hold"].map(x=><option>{x}</option>)}</select></label><label>Tracking note<input value={form.details} onChange={e=>setForm({...form,details:e.target.value})} required/></label><button className="primary">Create tracking number</button></form><form className="admin-card" onSubmit={addUpdate}><h3><RefreshCw/> Add tracking update</h3><label>Tracking number<input value={updateForm.code} onChange={e=>setUpdateForm({...updateForm,code:e.target.value})} placeholder="CBG-YYYYMMDD-123" required/></label><label>New status<select value={updateForm.status} onChange={e=>setUpdateForm({...updateForm,status:e.target.value})}>{["Processing","Dispatched","In transit","Customs clearance","Out for delivery","Delivered","On hold"].map(x=><option>{x}</option>)}</select></label><label>Update details<input value={updateForm.details} onChange={e=>setUpdateForm({...updateForm,details:e.target.value})} required/></label><button className="primary">Save update</button></form></div><div className="admin-card list-card"><h3>Recent shipments <button className="text-button" onClick={loadAdmin}>Refresh</button></h3>{adminRows.length===0?<p>No shipments found.</p>:adminRows.map(row=><div className="admin-row" key={row.id}><b>{row.tracking_code}</b><span>{row.origin} → {row.destination}</span><small>{row.status}</small></div>)}</div></>}</section>}
    <footer><div className="wrap footer-grid"><div><div className="brand footer-brand"><span className="brandmark"><Package/></span><span><b>CROWNBRIDGE</b><small>GLOBAL LOGISTICS</small></span></div><p>Logistics coordination and shipment visibility.</p></div><div><b>Explore</b><button onClick={()=>go("services")}>Services</button><button onClick={()=>go("about")}>About us</button><button onClick={()=>go("track")}>Track shipment</button></div><div><b>Contact</b><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a><span>{COMPANY.address}</span></div></div><div className="wrap copyright">© {new Date().getFullYear()} Crownbridge Global Logistics. All rights reserved.</div></footer>
    <button className="admin-link" onClick={()=>go("admin")} aria-label="Admin sign in"><ShieldCheck size={16}/></button>
  </div>;
}

function TrackBox({trackingCode,setTrackingCode,track,loading,error,shipment}) {
  return <div className="track-card"><form onSubmit={track}><label htmlFor="tracking">Tracking number</label><div className="track-input"><input id="tracking" value={trackingCode} onChange={e=>setTrackingCode(e.target.value)} placeholder="e.g. CBG-20261106-123"/><button className="primary" disabled={loading}>{loading?"Searching…":<><Search size={17}/> Track</>}</button></div></form>{error&&<p className="error">{error}</p>}{shipment&&<div className="result"><div className="result-head"><div><small>TRACKING NUMBER</small><b>{shipment.tracking_code}</b></div><span className="status">{shipment.status}</span></div><div className="route"><div><MapPin/><small>ORIGIN</small><b>{shipment.origin}</b></div><ArrowRight/><div><MapPin/><small>DESTINATION</small><b>{shipment.destination}</b></div></div><h3>Tracking history</h3>{(shipment.events||[]).length===0?<p>No tracking events have been recorded yet.</p>:<div className="timeline">{shipment.events.map((ev,i)=><div className="event" key={i}><span className="event-dot"/><div><b>{ev.status}</b><p>{ev.details}</p><small>{new Date(ev.created_at).toLocaleString()}</small></div></div>)}</div>}</div>}</div>;
}
function Service({icon,title,body}) { return <div className="service-card"><span>{icon}</span><h3>{title}</h3><p>{body}</p></div>; }
createRoot(document.getElementById("root")).render(<App/>);
