// components.jsx — shared UI building blocks
const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

/* ============ Icons (inline SVG) ============ */
const I = {
  dash: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
  arrowDown: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></svg>,
  arrowUp: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>,
  box: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M3 8l9 5 9-5"/></svg>,
  map: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 3l-6 3v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>,
  chart: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 21h18"/><rect x="5" y="11" width="3" height="8"/><rect x="11" y="6" width="3" height="13"/><rect x="17" y="13" width="3" height="6"/></svg>,
  history: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>,
  gear: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9 1.7 1.7 0 0 0 4.3 7.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>,
  scan: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8M11 8v8M15 8v8M19 8v8"/></svg>,
  bell: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  search: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>,
  chevR: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9 18 6-6-6-6"/></svg>,
  chevL: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m15 18-6-6 6-6"/></svg>,
  chevD: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6"/></svg>,
  plus: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  minus: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14"/></svg>,
  download: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>,
  check: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>,
  x: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  warn: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.7 3h16.94a2 2 0 0 0 1.7-3L13.7 3.86a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
  drag: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>,
  tx: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 17h14"/><path d="M17 7H3"/><path d="M21 17l-4 4M3 7l4-4"/></svg>,
  link: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>,
  sparkle: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m12 3 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7z"/></svg>,
  flag: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/></svg>,
};

/* ============ Toast system ============ */
const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }) {
  const [stack, setStack] = useState([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setStack((s) => [...s, { id, type: 'info', dur: 3200, ...t }]);
    setTimeout(() => setStack((s) => s.filter(x => x.id !== id)), (t.dur || 3200));
  }, []);
  const api = useMemo(() => ({
    push,
    success: (title, msg) => push({ type: 'success', title, msg }),
    info: (title, msg) => push({ type: 'info', title, msg }),
    warn: (title, msg) => push({ type: 'warn', title, msg }),
    error: (title, msg) => push({ type: 'error', title, msg }),
  }), [push]);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-stack">
        {stack.map(t => (
          <div key={t.id} className={"toast " + (t.type || '')}>
            <div className="toast-ico">
              {t.type === 'success' ? <I.check/> :
               t.type === 'warn' ? <I.warn/> :
               t.type === 'error' ? <I.x/> : <I.sparkle/>}
            </div>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.msg && <div className="toast-msg">{t.msg}</div>}
            </div>
            <button className="toast-close" onClick={() => setStack(s => s.filter(x => x.id !== t.id))}><I.x/></button>
            <div className="toast-progress" style={{ animationDuration: (t.dur || 3200) + 'ms' }}/>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ============ Sidebar ============ */
const NAV = [
  { group: "หลัก / Main", items: [
    { id: "dashboard", label: "Dashboard", ico: <I.dash/> },
  ]},
  { group: "เคลื่อนไหวสต๊อค / Movements", items: [
    { id: "receive", label: "รับเข้า · Receive", ico: <I.arrowDown/> },
    { id: "issue",   label: "จ่ายออก · Issue",  ico: <I.arrowUp/> },
    { id: "packing", label: "แพ็คสินค้า · Packing", ico: <I.box/>, dynBadge: "packing" },
    { id: "transfer", label: "โอน · Transfer", ico: <I.tx/>, badge: "3" },
  ]},
  { group: "ข้อมูลหลัก / Master", items: [
    { id: "products",  label: "สินค้า · Products", ico: <I.box/> },
    { id: "locations", label: "Locations", ico: <I.map/> },
  ]},
  { group: "รายงาน / Reports", items: [
    { id: "stock", label: "สินค้าคงเหลือ", ico: <I.chart/> },
    { id: "movement", label: "การเคลื่อนไหว", ico: <I.history/> },
  ]},
  { group: "ระบบ / System", items: [
    { id: "settings", label: "ตั้งค่า & Integrations", ico: <I.gear/> },
  ]},
];

function Sidebar({ active, onNav, collapsed, setCollapsed }) {
  const [pkCount, setPkCount] = useState(0);
  useEffect(() => {
    const upd = () => {
      if (window.PackingStore) {
        const c = window.PackingStore.counts();
        setPkCount(c.pending + c.packing);
      }
    };
    upd();
    return window.PackingStore?.subscribe(upd);
  }, []);
  const dynBadges = { packing: pkCount > 0 ? String(pkCount) : null };
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">CB</div>
        <div className="brand-name">
          <b>Cuteboy</b>
          <small>Inventory · WMS</small>
        </div>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="toggle sidebar">
          {collapsed ? <I.chevR/> : <I.chevL/>}
        </button>
      </div>

      {NAV.map((g, i) => (
        <React.Fragment key={i}>
          <div className="nav-section">{g.group}</div>
          {g.items.map(it => (
            <div key={it.id}
                 className={"nav-item " + (active === it.id ? "active" : "")}
                 onClick={() => onNav(it.id)}
                 title={collapsed ? it.label : ""}>
              <span className="nav-ico">{it.ico}</span>
              <span className="nav-label">{it.label}</span>
              {(it.badge || (it.dynBadge && dynBadges[it.dynBadge])) && <span className="nav-badge" style={it.dynBadge && dynBadges[it.dynBadge] ? { background: 'color-mix(in oklab, var(--neon-warn) 24%, var(--surface-3))', color: 'var(--neon-warn)', boxShadow: '0 0 8px color-mix(in oklab, var(--neon-warn) 50%, transparent)' } : null}>{it.badge || dynBadges[it.dynBadge]}</span>}
            </div>
          ))}
        </React.Fragment>
      ))}

      <div className="sidebar-footer">
        <div className="avatar">P</div>
        <div className="sidebar-footer-info">
          <b>คุณพลอย</b>
          <small>Warehouse Lead · BKK</small>
        </div>
      </div>
    </aside>
  );
}

/* ============ Topbar ============ */
function Topbar({ crumbs, onNav, onShowScanner }) {
  return (
    <div className="topbar">
      <div className="breadcrumb">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="crumb-sep"><I.chevR/></span>}
            {i < crumbs.length - 1 ? (
              <a onClick={() => c.to && onNav(c.to)}>{c.label}</a>
            ) : (
              <span className="crumb-current">{c.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="search">
        <span className="search-ico"><I.search/></span>
        <input placeholder="ค้นหา SKU, สินค้า, ใบรับ-จ่าย…" />
        <span className="search-kbd">⌘ K</span>
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" onClick={onShowScanner} title="Quick scan"><I.scan/></button>
        <button className="icon-btn" title="Notifications"><I.bell/><span className="dot"/></button>
      </div>
    </div>
  );
}

/* ============ AnimatedNumber ============ */
function AnimatedNumber({ value, format = (v) => Math.round(v).toString(), duration = 900 }) {
  const [v, setV] = useState(0);
  const ref = useRef({ start: 0, from: 0, to: value, raf: 0 });
  useEffect(() => {
    cancelAnimationFrame(ref.current.raf);
    ref.current.from = v;
    ref.current.to = value;
    ref.current.start = performance.now();
    const tick = (t) => {
      const elapsed = t - ref.current.start;
      const k = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      const nv = ref.current.from + (ref.current.to - ref.current.from) * eased;
      setV(nv);
      if (k < 1) ref.current.raf = requestAnimationFrame(tick);
    };
    ref.current.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current.raf);
  }, [value, duration]);
  return <>{format(v)}</>;
}

/* ============ StatCard ============ */
function StatCard({ label, value, unit, delta, deltaDir, accent, ico, format }) {
  return (
    <div className="stat-card" style={{ "--accent": accent || "var(--neon-1)" }}>
      {ico && <div className="stat-icon">{ico}</div>}
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        <AnimatedNumber value={value} format={format || ((v) => fmtNum(Math.round(v)))} />
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {delta != null && (
        <div className="stat-meta">
          <span className={"stat-delta " + (deltaDir === "down" ? "down" : "up")}>
            {deltaDir === "down" ? "▼" : "▲"} {Math.abs(delta)}%
          </span>
          <span>vs 7d ago</span>
        </div>
      )}
    </div>
  );
}

/* ============ Sparkline / SVG bar+line chart ============ */
function MovementChart({ data, h = 220 }) {
  const w = 720;
  const pad = { l: 30, r: 12, t: 14, b: 26 };
  const max = Math.max(...data.flatMap(d => [d.in, d.out])) * 1.25;
  const barW = (w - pad.l - pad.r) / data.length * 0.36;
  const groupW = (w - pad.l - pad.r) / data.length;
  const y = (v) => pad.t + (h - pad.t - pad.b) * (1 - v / max);
  // line is "net"
  const linePts = data.map((d, i) => {
    const cx = pad.l + groupW * i + groupW / 2;
    return [cx, y(d.in - d.out + max/2 - max/2 + (d.in + d.out)/2)];
  });
  const linePath = linePts.map((p, i) => (i === 0 ? "M" : "L") + p[0] + "," + p[1]).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="gIn" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--neon-3)" stopOpacity="1"/>
          <stop offset="100%" stopColor="var(--neon-3)" stopOpacity="0.3"/>
        </linearGradient>
        <linearGradient id="gOut" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--neon-danger)" stopOpacity="1"/>
          <stop offset="100%" stopColor="var(--neon-danger)" stopOpacity="0.25"/>
        </linearGradient>
        <linearGradient id="gLine" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--neon-1)"/>
          <stop offset="100%" stopColor="var(--neon-2)"/>
        </linearGradient>
      </defs>
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={pad.l} x2={w - pad.r}
              y1={pad.t + (h - pad.t - pad.b) * t}
              y2={pad.t + (h - pad.t - pad.b) * t}
              stroke="var(--border-soft)" strokeDasharray="3 4"/>
      ))}
      {data.map((d, i) => {
        const cx = pad.l + groupW * i + groupW / 2;
        const inH = h - pad.b - y(d.in);
        const outH = h - pad.b - y(d.out);
        return (
          <g key={i}>
            <rect x={cx - barW - 1} y={y(d.in)} width={barW} height={inH} rx="2" fill="url(#gIn)">
              <animate attributeName="height" from="0" to={inH} dur="0.7s" fill="freeze" />
              <animate attributeName="y" from={h - pad.b} to={y(d.in)} dur="0.7s" fill="freeze" />
            </rect>
            <rect x={cx + 1} y={y(d.out)} width={barW} height={outH} rx="2" fill="url(#gOut)">
              <animate attributeName="height" from="0" to={outH} dur="0.7s" fill="freeze" />
              <animate attributeName="y" from={h - pad.b} to={y(d.out)} dur="0.7s" fill="freeze" />
            </rect>
            <text x={cx} y={h - 8} textAnchor="middle" fill="var(--text-dim)" fontSize="10" fontFamily="var(--font-mono)">{d.day}</text>
          </g>
        );
      })}
      <path d={linePath} fill="none" stroke="url(#gLine)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 4px var(--neon-1-glow))"/>
      {linePts.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill="var(--bg)" stroke="var(--neon-1)" strokeWidth="1.5"/>
      ))}
    </svg>
  );
}

/* ============ Donut/category chart ============ */
function CategoryDonut({ data, size = 180 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const R = size / 2;
  const r = R - 14;
  const ir = R - 36;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {data.map((d, i) => {
          const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
          acc += d.value;
          const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
          const large = end - start > Math.PI ? 1 : 0;
          const x1 = R + r * Math.cos(start), y1 = R + r * Math.sin(start);
          const x2 = R + r * Math.cos(end),   y2 = R + r * Math.sin(end);
          const xi1 = R + ir * Math.cos(end),   yi1 = R + ir * Math.sin(end);
          const xi2 = R + ir * Math.cos(start), yi2 = R + ir * Math.sin(start);
          const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${ir} ${ir} 0 ${large} 0 ${xi2} ${yi2} Z`;
          return <path key={i} d={path} fill={d.color} stroke="var(--surface)" strokeWidth="1.5"/>;
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {data.map((d, i) => (
          <div key={i} className="row-between" style={{ fontSize: 12.5 }}>
            <span className="row" style={{ gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, boxShadow: `0 0 8px ${d.color}` }}/>
              <span style={{ color: 'var(--text-mid)' }}>{d.label}</span>
            </span>
            <span className="mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{fmtNum(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Bar row (horizontal progress with label+value) ============ */
function BarRow({ label, value, total, tone }) {
  const pct = Math.min(100, Math.round((value / total) * 100));
  let cls = "";
  if (tone) cls = tone;
  else if (pct > 90) cls = "danger";
  else if (pct > 75) cls = "warn";
  else if (pct > 50) cls = "green";
  return (
    <div>
      <div className="row-between" style={{ marginBottom: 6, fontSize: 12 }}>
        <span style={{ color: 'var(--text-mid)' }}>{label}</span>
        <span className="mono" style={{ color: 'var(--text-dim)' }}>{fmtNum(value)} / {fmtNum(total)}</span>
      </div>
      <div className={"bar " + cls}><span style={{ width: pct + '%' }}/></div>
    </div>
  );
}

/* ============ Page header helper ============ */
function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

/* ============ Product thumb (placeholder swatches) ============ */
function ProductThumb({ product, size = 40 }) {
  // category to color
  const cmap = {
    "Top wear": "var(--neon-1)",
    "Bottom wear": "var(--neon-2)",
    "Outerwear": "#fbbf24",
    "Footwear": "var(--neon-danger)",
    "Accessories": "var(--neon-3)",
  };
  const c = cmap[product.category] || "var(--neon-1)";
  const initial = product.sku.split("-")[0];
  return (
    <div className="cell-thumb" style={{
      width: size, height: size, borderRadius: size > 60 ? 12 : 8,
      background: `linear-gradient(135deg, color-mix(in oklab, ${c} 20%, var(--surface-2)), color-mix(in oklab, ${c} 6%, var(--surface)))`,
      borderColor: `color-mix(in oklab, ${c} 30%, var(--border))`,
      color: c,
      fontSize: size > 60 ? 14 : 11,
      fontWeight: 600,
    }}>{initial}</div>
  );
}

/* ============ Status badge for stock level ============ */
function StockBadge({ stock, reorderPoint }) {
  if (stock <= 0) return <span className="badge badge-danger"><span className="dot-mark"/>Out</span>;
  if (stock < reorderPoint) return <span className="badge badge-warn"><span className="dot-mark"/>Low</span>;
  if (stock < reorderPoint * 2) return <span className="badge badge-cyan"><span className="dot-mark"/>Healthy</span>;
  return <span className="badge badge-green"><span className="dot-mark"/>Plenty</span>;
}

/* ============ Mini scanner widget (used in modal/quick-scan) ============ */
function Scanner({ active, code, status, onClick }) {
  // Render some bar lines
  const lines = useMemo(() => Array.from({ length: 28 }, () => 1 + Math.floor(Math.random() * 3)), []);
  return (
    <div className={"scanner " + (active ? "active" : "")} onClick={onClick}>
      <div className="scanner-viewport">
        <div className="bar-lines">
          {lines.map((w, i) => <span key={i} style={{ width: w + 'px' }}/>)}
        </div>
        <div className="laser"/>
      </div>
      <div className="scanner-body">
        <div className="scanner-title">{active ? "กำลังสแกน…" : "เริ่ม Barcode Scan"}</div>
        <div className="dim" style={{ fontSize: 12.5 }}>
          {active ? "เล็งกล้องไปที่บาร์โค้ด หรือ พิมพ์รหัสเข้ามาได้เลย" : "กดเพื่อเปิดสแกนเนอร์ — รองรับ EAN-13 / Code-128 / QR"}
        </div>
        <div className="scanner-code">{code || "—— —— —— ——"}</div>
        {active && <div className="scanner-status"><span className="pulse-dot"/>{status || "พร้อมรับข้อมูล"}</div>}
      </div>
    </div>
  );
}

/* ============ Modal ============ */
function Modal({ open, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(2,4,12,0.7)', backdropFilter: 'blur(6px)',
      display: 'grid', placeItems: 'center',
      animation: 'toast-in .25s ease',
    }} onClick={onClose}>
      <div style={{
        width: width, maxWidth: '92vw', maxHeight: '90vh', overflow: 'auto',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, boxShadow: '0 24px 64px -8px rgba(0,0,0,0.7)',
      }} onClick={(e) => e.stopPropagation()}>
        <div className="row-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)' }}>
          <b style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{title}</b>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}><I.x/></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  I, ToastProvider, useToast, Sidebar, Topbar, AnimatedNumber, StatCard,
  MovementChart, CategoryDonut, BarRow, PageHeader, ProductThumb, StockBadge,
  Scanner, Modal,
});
