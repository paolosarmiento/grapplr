import { useState } from "react";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

const LIME = "#AAFF00", LIME_DK = "#000";
const LOGO = import.meta.env.BASE_URL + 'logo-horizontal.png';

export default function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) { setError("Please enter your email and password."); return; }
    setError(""); setLoading(true);
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(
        e.code === "auth/invalid-credential" ? "Invalid email or password." :
        e.code === "auth/email-already-in-use" ? "This email is already registered." :
        e.code === "auth/weak-password" ? "Password must be at least 6 characters." : e.message
      );
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100dvh", background:"#000", display:"flex", flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif", maxWidth:480, margin:"0 auto", position:"relative", overflow:"hidden" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 24px rgba(170,255,0,0.4)}50%{box-shadow:0 0 48px rgba(170,255,0,0.65)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        @keyframes logoDrop { from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)} }
        .glow-btn { animation: glowPulse 2.5s ease-in-out infinite; }
        .auth-form { animation: fadeUp 0.5s ease forwards; }
        .logo-wrap { animation: logoDrop 0.6s ease forwards; }
        .tap { transition: transform 0.12s ease, opacity 0.12s ease; cursor: pointer; }
        .tap:active { transform: scale(0.97); opacity: 0.85; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #1C1C1E inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>

      {/* Background glow */}
      <div style={{ position:"absolute", top:-100, left:"50%", transform:"translateX(-50%)", width:500, height:400, background:"radial-gradient(ellipse at center, rgba(170,255,0,0.07) 0%, transparent 70%)", pointerEvents:"none" }}/>

      {/* Logo top half */}
      <div className="logo-wrap" style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 32px 24px", gap:14 }}>
        <img src={LOGO} alt="Grapplr" style={{ width:"88%", maxWidth:320, objectFit:"contain" }} onError={e=>{ e.target.style.display='none'; }}/>
        <p style={{ fontSize:14, color:"#555", letterSpacing:"0.4px", textAlign:"center", lineHeight:1.6, margin:0 }}>
          The operating system for improving your BJJ
        </p>
        <div style={{ display:"flex", gap:20, marginTop:4 }}>
          {[" Track"," Analyze"," Evolve"].map(b=>(
            <span key={b} style={{ fontSize:12, color:"#3A3A3C", fontWeight:500 }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Auth bottom sheet */}
      <div className="auth-form" style={{ background:"#111", borderRadius:"28px 28px 0 0", padding:"28px 20px 44px", borderTop:"0.5px solid #1E1E1E" }}>

        {/* Tab switcher */}
        <div style={{ display:"flex", background:"#1C1C1E", borderRadius:50, padding:3, marginBottom:20, border:"0.5px solid #2A2A2C" }}>
          {[["login","Sign in"],["register","Create account"]].map(([m,label])=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} className="tap" style={{ flex:1, border:"none", borderRadius:50, padding:"12px 0", background:mode===m?"#2C2C2E":"transparent", color:mode===m?"#fff":"#555", fontWeight:mode===m?600:400, fontSize:14, fontFamily:"inherit", transition:"all 0.2s" }}>{label}</button>
          ))}
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading} className="tap" style={{ width:"100%", padding:"16px", borderRadius:16, background:"#1C1C1E", color:"#fff", border:"0.5px solid #2A2A2C", fontFamily:"inherit", fontWeight:600, fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:16, opacity:loading?0.5:1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div style={{ flex:1, height:"0.5px", background:"#222" }}/><span style={{ fontSize:12, color:"#3A3A3C" }}>or</span><div style={{ flex:1, height:"0.5px", background:"#222" }}/>
        </div>

        {/* Email */}
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address"
          style={{ display:"block", width:"100%", background:"#1C1C1E", border:"0.5px solid #2A2A2C", borderRadius:14, padding:"16px 18px", fontSize:16, color:"#fff", fontFamily:"inherit", outline:"none", marginBottom:10, WebkitAppearance:"none" }}
          onFocus={e=>e.target.style.boxShadow="0 0 0 3px rgba(170,255,0,0.2)"} onBlur={e=>e.target.style.boxShadow="none"}/>

        {/* Password */}
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" onKeyDown={e=>e.key==="Enter"&&handleEmail()}
          style={{ display:"block", width:"100%", background:"#1C1C1E", border:"0.5px solid #2A2A2C", borderRadius:14, padding:"16px 18px", fontSize:16, color:"#fff", fontFamily:"inherit", outline:"none", marginBottom:16, WebkitAppearance:"none" }}
          onFocus={e=>e.target.style.boxShadow="0 0 0 3px rgba(170,255,0,0.2)"} onBlur={e=>e.target.style.boxShadow="none"}/>

        {/* Error */}
        {error&&<div style={{ background:"#E24B4A15", border:"0.5px solid #E24B4A40", borderRadius:12, padding:"12px 16px", marginBottom:14 }}><p style={{ margin:0, fontSize:13, color:"#E24B4A", lineHeight:1.5 }}>{error}</p></div>}

        {/* CTA */}
        <button onClick={handleEmail} disabled={loading} className={loading?"tap":"tap glow-btn"}
          style={{ width:"100%", padding:"19px", borderRadius:18, background:loading?"#2C2C2E":LIME, color:loading?"#555":LIME_DK, border:"none", fontFamily:"inherit", fontWeight:800, fontSize:17, letterSpacing:"0.3px", transition:"background 0.2s" }}>
          {loading?"Please wait…":mode==="login"?"Sign in →":"Create account →"}
        </button>

        <p style={{ margin:"20px 0 0", textAlign:"center", fontSize:12, color:"#333", lineHeight:1.6 }}>
          By continuing you agree to Grapplr's terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
