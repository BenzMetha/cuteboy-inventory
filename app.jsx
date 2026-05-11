// app.jsx — main app shell, routing, tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "cyan-purple",
  "density": "regular",
  "radius": "rounded",
  "showScanLines": true,
  "showGlow": true,
  "bg": "deep-navy"
}/*EDITMODE-END*/;

const ACCENT_PALETTES = {
  "cyan-purple": { 1: "#22d3ee", 2: "#a78bfa" },
  "lime-cyan":   { 1: "#a3e635", 2: "#22d3ee" },
  "pink-violet": { 1: "#f472b6", 2: "#a78bfa" },
  "amber-rose":  { 1: "#fbbf24", 2: "#fb7185" },
  "ice-mint":    { 1: "#60a5fa", 2: "#34d399" },
};

const BG_OPTIONS = {
  "deep-navy":  { bg: "#07091a", g1: "#0c1230", g2: "#0a0a1f" },
  "void":       { bg: "#04050d", g1: "#0a0a18", g2: "#050511" },
  "plum":       { bg: "#0c0617", g1: "#1a0c28", g2: "#0c0617" },
  "forest-night": { bg: "#08130c", g1: "#0a2316", g2: "#06120b" },
};

function applyTweaks(t) {
  const root = document.documentElement;
  const a = ACCENT_PALETTES[t.accent] || ACCENT_PALETTES["cyan-purple"];
  root.style.setProperty("--neon-1", a[1]);
  root.style.setProperty("--neon-1-glow", hexToGlow(a[1]));
  root.style.setProperty("--neon-2", a[2]);
  root.style.setProperty("--neon-2-glow", hexToGlow(a[2]));

  const bg = BG_OPTIONS[t.bg] || BG_OPTIONS["deep-navy"];
  root.style.setProperty("--bg", bg.bg);
  root.style.setProperty("--bg-grad-1", bg.g1);
  root.style.setProperty("--bg-grad-2", bg.g2);

  const radii = {
    sharp:   { sm: 4, md: 6, lg: 8, xl: 12 },
    rounded: { sm: 8, md: 12, lg: 16, xl: 22 },
    pillowy: { sm: 12, md: 18, lg: 24, xl: 32 },
  };
  const r = radii[t.radius] || radii["rounded"];
  root.style.setProperty("--radius-sm", r.sm + "px");
  root.style.setProperty("--radius", r.md + "px");
  root.style.setProperty("--radius-lg", r.lg + "px");
  root.style.setProperty("--radius-xl", r.xl + "px");
}

function hexToGlow(hex) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.55)`;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [productId, setProductId] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => { applyTweaks(t); }, [t]);

  useEffect(() => {
    window.fetchINVData().then(ok => {
      setDataReady(true);
      setLoadError(!ok);
      setDataVersion(v => v + 1);
    });
    // expose global refresh for write operations
    window.refreshData = () => {
      window.fetchINVData().then(() => setDataVersion(v => v + 1));
    };
  }, []);

  const navigate = (id) => {
    setActive(id);
    setProductId(null);
  };

  const selectProduct = (pid) => { setProductId(pid); setActive("products"); };

  const crumbs = useMemo(() => {
    if (productId) {
      const p = PRODUCTS.find(pp => pp.id === productId);
      return [
        { label: "หน้าหลัก", to: "dashboard" },
        { label: "สินค้า · Products", to: "products" },
        { label: p?.name || "Product" },
      ];
    }
    const labels = {
      dashboard: "Dashboard",
      receive: "รับเข้าสินค้า",
      issue: "จ่ายออกสินค้า",
      packing: "แพ็คสินค้า · Packing",
      transfer: "โอนระหว่างคลัง",
      products: "สินค้า · Products",
      locations: "Locations",
      stock: "รายงานสินค้าคงเหลือ",
      movement: "รายงานการเคลื่อนไหว",
      settings: "ตั้งค่า & Integrations",
    };
    return [
      { label: "Cuteboy Inventory", to: "dashboard" },
      { label: labels[active] || active },
    ];
  }, [active, productId]);

  let pageEl = null;
  if (productId) {
    pageEl = <ProductDetailPage productId={productId} onBack={() => setProductId(null)}/>;
  } else if (active === "dashboard") {
    pageEl = <DashboardPage onNav={navigate} openScanner={() => setScannerOpen(true)}/>;
  } else if (active === "receive") {
    pageEl = <ReceivePage/>;
  } else if (active === "issue") {
    pageEl = <IssuePage/>;
  } else if (active === "packing") {
    pageEl = <PackingPage/>;
  } else if (active === "transfer") {
    pageEl = <TransferPlaceholder/>;
  } else if (active === "products") {
    pageEl = <ProductsPage onSelectProduct={selectProduct}/>;
  } else if (active === "locations") {
    pageEl = <LocationsPage/>;
  } else if (active === "stock") {
    pageEl = <StockReportPage/>;
  } else if (active === "movement") {
    pageEl = <MovementReportPage/>;
  } else if (active === "settings") {
    pageEl = <SettingsPage/>;
  }

  if (!dataReady) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:20, background:'var(--bg)' }}>
        <div style={{ width:48, height:48, border:'3px solid var(--border-soft)', borderTopColor:'var(--neon-1)', borderRadius:'50%', animation:'spin 0.9s linear infinite' }}/>
        <div style={{ color:'var(--neon-1)', fontFamily:'var(--font-mono)', fontSize:14, letterSpacing:2 }}>LOADING DATA…</div>
        <div style={{ color:'var(--text-mid)', fontSize:12 }}>กำลังดึงข้อมูลจาก Google Sheets</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className={"app " + (collapsed ? "collapsed" : "")}>
      {loadError && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:9999, background:'var(--neon-danger)', color:'#000', padding:'6px 16px', fontSize:12, fontFamily:'var(--font-mono)', textAlign:'center' }}>
          ⚠ ไม่สามารถเชื่อมต่อ Google Sheets ได้ — แสดงข้อมูลจาก cache ล่าสุด
        </div>
      )}
      <Sidebar active={active} onNav={navigate} collapsed={collapsed} setCollapsed={setCollapsed}/>
      <main className="main" style={loadError ? { paddingTop:28 } : {}}>
        <Topbar crumbs={crumbs} onNav={navigate} onShowScanner={() => setScannerOpen(true)}/>
        <div className="content">{pageEl}</div>
      </main>

      {scannerOpen && <QuickScanModal onClose={() => setScannerOpen(false)} onNav={navigate}/>}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Accent palette"/>
        <TweakColor
          label="Neon pair"
          value={ACCENT_PALETTES[t.accent] ? [ACCENT_PALETTES[t.accent][1], ACCENT_PALETTES[t.accent][2]] : ["#22d3ee", "#a78bfa"]}
          options={Object.entries(ACCENT_PALETTES).map(([k, v]) => [v[1], v[2]])}
          onChange={(arr) => {
            const key = Object.entries(ACCENT_PALETTES).find(([k, v]) => v[1] === arr[0] && v[2] === arr[1])?.[0];
            if (key) setTweak('accent', key);
          }}
        />
        <TweakRadio
          label="Background"
          value={t.bg}
          options={["deep-navy", "void", "plum", "forest-night"]}
          onChange={(v) => setTweak('bg', v)}
        />
        <TweakSection label="Shape & feel"/>
        <TweakRadio
          label="Corner radius"
          value={t.radius}
          options={["sharp", "rounded", "pillowy"]}
          onChange={(v) => setTweak('radius', v)}
        />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["compact", "regular", "comfy"]}
          onChange={(v) => setTweak('density', v)}
        />
        <TweakSection label="Effects"/>
        <TweakToggle label="Neon glow" value={t.showGlow} onChange={(v) => setTweak('showGlow', v)}/>
        <TweakToggle label="Scanner laser" value={t.showScanLines} onChange={(v) => setTweak('showScanLines', v)}/>
      </TweaksPanel>
    </div>
  );
}

function TransferPlaceholder() {
  const toast = useToast();
  return (
    <>
      <PageHeader
        title="โอนระหว่างคลัง · Transfer"
        subtitle="ย้ายสินค้าระหว่างคลัง · ระบบจะ track ระหว่างทาง"
        actions={<button className="btn btn-primary" onClick={() => toast.info("สร้างใบโอนใหม่", "บันทึกเป็น draft แล้ว")}><I.plus/> ใบโอนใหม่</button>}
      />
      <div className="stat-grid">
        <StatCard label="รอการอนุมัติ" value={3} accent="var(--neon-warn)"/>
        <StatCard label="กำลังขนส่ง" value={2} accent="var(--neon-2)"/>
        <StatCard label="เสร็จสิ้น (7d)" value={14} accent="var(--neon-3)"/>
      </div>
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>Active transfers</h3>
        <div className="stack" style={{ gap: 10 }}>
          {[
            { ref: "TX-115", from: "BKK · A-01", to: "ST01 · FLR", qty: 24, sku: "TS-BOX-WHT", status: "in-transit", pct: 60 },
            { ref: "TX-116", from: "BKK · C-01", to: "CNX · N-03", qty: 36, sku: "SH-CHK-WHT", status: "in-transit", pct: 38 },
            { ref: "TX-117", from: "CNX · N-02", to: "BKK · A-02", qty: 48, sku: "DN-CRG-IDG", status: "pending", pct: 0 },
          ].map(tx => (
            <div key={tx.ref} className="pick-item" style={{ alignItems: 'center' }}>
              <div className="move-ico tx"><I.tx/></div>
              <div className="pi-info">
                <div className="pi-name">{tx.ref} · {tx.sku} <span className="dim" style={{ fontWeight: 400 }}>· {tx.qty} ชิ้น</span></div>
                <div className="pi-meta">{tx.from} ➜ {tx.to}</div>
                <div style={{ marginTop: 8 }}>
                  <div className={"bar " + (tx.status === "pending" ? "warn" : "")}>
                    <span style={{ width: tx.pct + '%' }}/>
                  </div>
                </div>
              </div>
              {tx.status === "in-transit"
                ? <span className="badge badge-cyan"><span className="dot-mark"/>in-transit</span>
                : <span className="badge badge-warn"><span className="dot-mark"/>pending</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function QuickScanModal({ onClose, onNav }) {
  const toast = useToast();
  const [code, setCode] = useState("");
  const [found, setFound] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = () => {
    const p = PRODUCTS.find(pp => pp.barcode === code.trim() || pp.sku.toLowerCase() === code.trim().toLowerCase());
    if (!p) {
      toast.error("ไม่พบสินค้า", code);
      setFound(null);
      return;
    }
    setFound(p);
    toast.success("พบสินค้า", `${p.name} · ${p.sku}`);
  };

  return (
    <Modal open={true} onClose={onClose} title="Quick scan · สแกนด่วน" width={620}>
      <Scanner active={true} code={code} status="ใส่ barcode แล้วกด Enter"/>
      <div style={{ marginTop: 14 }}>
        <div className="row" style={{ gap: 10 }}>
          <input
            ref={inputRef}
            className="input mono"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="พิมพ์ barcode หรือ SKU…"
          />
          <button className="btn btn-primary" onClick={handleSubmit}>ค้นหา</button>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <span className="dim" style={{ fontSize: 12 }}>ลอง:</span>
          {PRODUCTS.slice(0, 3).map(p => (
            <button key={p.id} className="chip" onClick={() => setCode(p.barcode)}>{p.barcode}</button>
          ))}
        </div>
      </div>

      {found && (
        <div style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="row" style={{ gap: 14 }}>
              <ProductThumb product={found} size={56}/>
              <div className="flex-1">
                <b style={{ fontSize: 14 }}>{found.name}</b>
                <div className="dim mono" style={{ fontSize: 12 }}>{found.sku} · {found.category}</div>
                <div className="row" style={{ gap: 12, marginTop: 6 }}>
                  <StockBadge stock={found.stock} reorderPoint={found.reorderPoint}/>
                  <span className="dim" style={{ fontSize: 12 }}>คงเหลือ <b className="mono text-neon">{found.stock}</b> ชิ้น</span>
                </div>
              </div>
            </div>
            <div className="row" style={{ gap: 8, marginTop: 14 }}>
              <button className="btn btn-sm btn-ghost" onClick={() => { onClose(); onNav("receive"); }}><I.arrowDown/> รับเข้า</button>
              <button className="btn btn-sm btn-ghost" onClick={() => { onClose(); onNav("issue"); }}><I.arrowUp/> จ่ายออก</button>
              <button className="btn btn-sm btn-primary" onClick={onClose}>ดูรายละเอียด</button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ToastProvider>
    <App/>
  </ToastProvider>
);
