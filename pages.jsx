// pages.jsx — page-level components
const { WAREHOUSES, PRODUCTS, MOVEMENTS, SUPPLIERS, TIMESERIES, CATEGORIES } = window.INV_DATA;

/* =========================================================
   DASHBOARD
   ========================================================= */
function DashboardPage({ onNav }) {
  const toast = useToast();

  // --- KPI calculations ---
  const totalUnits   = PRODUCTS.reduce((s, p) => s + p.stock, 0);
  const activeSKUs   = PRODUCTS.filter(p => p.stock > 0).length;
  const stockValue   = PRODUCTS.filter(p => p.stock > 0).reduce((s, p) => s + p.stock * p.cost, 0);

  // Packing queue count (pending + packing)
  const [packCount, setPackCount] = React.useState(() => {
    const c = window.PackingStore?.counts() || { pending: 0, packing: 0 };
    return c.pending + c.packing;
  });
  React.useEffect(() => {
    if (!window.PackingStore) return;
    const unsub = window.PackingStore.subscribe(c => setPackCount(c.pending + c.packing));
    return unsub;
  }, []);

  // Top 5 categories by remaining stock
  const palette = ["var(--neon-1)", "var(--neon-2)", "#fbbf24", "var(--neon-danger)", "var(--neon-3)"];
  const catTotals = CATEGORIES
    .map(c => ({
      label: c,
      value: PRODUCTS.filter(p => p.category === c && p.stock > 0).reduce((s, p) => s + p.stock, 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const maxCat = catTotals[0]?.value || 1;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="ภาพรวมสินค้าคงเหลือ · ข้อมูล live จาก Google Sheets"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => toast.success("Sync เสร็จเรียบร้อย", "ดึงข้อมูลจาก Google Sheets")}>
              <I.link/> Sync ทันที
            </button>
            <button className="btn btn-primary" onClick={() => onNav("receive")}>
              <I.plus/> รับเข้าใหม่
            </button>
          </>
        }
      />

      {/* 5 KPI cards */}
      <div className="stat-grid">
        <StatCard
          label="Total Stock on Hand"
          value={totalUnits}
          unit="units"
          accent="var(--neon-1)"
          ico={<I.box/>}
        />
        <StatCard
          label="Active SKUs"
          value={activeSKUs}
          unit="SKUs"
          accent="var(--neon-2)"
          ico={<I.sparkle/>}
        />
        <StatCard
          label="Stock Value"
          value={stockValue}
          accent="#fbbf24"
          ico={<I.chart/>}
          format={(v) => "฿" + new Intl.NumberFormat("en-US").format(Math.round(v))}
        />
        <StatCard
          label="ใบงานรอแพ็ค"
          value={packCount}
          unit="ใบ"
          accent="var(--neon-3)"
          ico={<I.box/>}
        />
      </div>

      {/* Top 5 categories + Recent movements */}
      <div className="grid-12-8" style={{ marginTop: 4 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Recent movements</h3>
              <p className="card-subtitle">การเคลื่อนไหวล่าสุดของสต๊อค</p>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => onNav("movement")}>ดูทั้งหมด <I.chevR/></button>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            {MOVEMENTS.slice(0, 8).map(m => (
              <MovementRow key={m.id} m={m}/>
            ))}
            {MOVEMENTS.length === 0 && (
              <div className="empty" style={{ padding: 24 }}>ยังไม่มีข้อมูล Movement</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Top 5 หมวดสินค้า</h3>
            <p className="card-subtitle" style={{ margin: 0, fontSize: 12 }}>สัดส่วนตามจำนวนที่เหลือ</p>
          </div>
          <div className="stack" style={{ gap: 14, marginTop: 8 }}>
            {catTotals.map((c, i) => (
              <div key={c.label}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: palette[i], display: 'inline-block', flexShrink: 0 }}/>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 13, color: 'var(--text-mid)' }}>{fmtNum(c.value)} ชิ้น</span>
                </div>
                <div className="bar" style={{ height: 6 }}>
                  <span style={{ width: Math.round((c.value / maxCat) * 100) + '%', background: palette[i] }}/>
                </div>
              </div>
            ))}
            {catTotals.length === 0 && <div className="dim" style={{ fontSize: 13 }}>ยังไม่มีข้อมูลสินค้า</div>}
          </div>
        </div>
      </div>
    </>
  );
}

function ShopifyMark() {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'color-mix(in oklab, var(--neon-3) 20%, var(--surface-2))',
      display: 'grid', placeItems: 'center', color: 'var(--neon-3)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--neon-3) 30%, transparent)',
      fontFamily: 'var(--font-display)', fontWeight: 700 }}>S</div>
  );
}
function SheetsMark() {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'color-mix(in oklab, var(--neon-1) 20%, var(--surface-2))',
      display: 'grid', placeItems: 'center', color: 'var(--neon-1)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--neon-1) 30%, transparent)',
      fontFamily: 'var(--font-display)', fontWeight: 700 }}>G</div>
  );
}

function MovementRow({ m }) {
  const product = PRODUCTS.find(p => p.id === m.productId);
  const cls = m.type === 'IN' ? 'in' : m.type === 'OUT' ? 'out' : m.type === 'TX' ? 'tx' : 'adj';
  const ico = m.type === 'IN' ? <I.arrowDown/> : m.type === 'OUT' ? <I.arrowUp/> : m.type === 'TX' ? <I.tx/> : <I.warn/>;
  return (
    <div className="move-row">
      <div className={"move-ico " + cls}>{ico}</div>
      <div className="move-body">
        <div className="move-title">
          {m.type === 'IN' ? 'รับเข้า' : m.type === 'OUT' ? 'จ่ายออก' : m.type === 'TX' ? 'โอน' : 'ปรับสต๊อค'} · {product?.name || m.sku}
        </div>
        <div className="move-meta">{m.date} · {m.ref} · {m.wh} / {m.zone} · {m.user}</div>
      </div>
      <div className={"move-qty " + (m.qty > 0 ? "in" : m.qty < 0 ? "out" : "")}>
        {m.qty > 0 ? "+" : ""}{fmtNum(m.qty)}
      </div>
    </div>
  );
}

/* =========================================================
   RECEIVE (รับเข้า)
   ========================================================= */
function ReceivePage() {
  const toast = useToast();
  const [scanActive, setScanActive] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [items, setItems] = useState([]);
  const [supplier, setSupplier] = useState(SUPPLIERS[0].id);
  const [warehouse, setWarehouse] = useState(WAREHOUSES[0].id);
  const [zone, setZone] = useState(WAREHOUSES[0]?.zones?.[0]?.id || '');
  const [poRef, setPoRef] = useState("PO-25005");
  const inputRef = useRef(null);

  const currentWh = WAREHOUSES.find(w => w.id === warehouse);

  const startScan = () => {
    setScanActive(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCode = (code) => {
    const c = code.trim();
    if (!c) return;
    const p = PRODUCTS.find(pp => pp.barcode === c || pp.sku.toLowerCase() === c.toLowerCase());
    if (!p) {
      toast.error("ไม่พบสินค้า", `Barcode ${c} ไม่อยู่ในระบบ`);
      setScannedCode(c);
      return;
    }
    setScannedCode(c);
    setItems(prev => {
      const ex = prev.find(x => x.id === p.id);
      if (ex) return prev.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { id: p.id, name: p.name, sku: p.sku, cost: p.cost, qty: 1, category: p.category }];
    });
    toast.success("เพิ่มสินค้าแล้ว", `${p.name} · ${p.sku}`);
  };

  const addManual = (pid) => {
    const p = PRODUCTS.find(pp => pp.id === pid);
    if (!p) return;
    setItems(prev => {
      const ex = prev.find(x => x.id === p.id);
      if (ex) return prev.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { id: p.id, name: p.name, sku: p.sku, cost: p.cost, qty: 1, category: p.category }];
    });
  };

  const updateQty = (id, qty) => setItems(prev => prev.map(x => x.id === id ? { ...x, qty: Math.max(1, qty) } : x));
  const removeItem = (id) => setItems(prev => prev.filter(x => x.id !== id));

  const totalUnits = items.reduce((s, x) => s + x.qty, 0);
  const totalValue = items.reduce((s, x) => s + x.qty * x.cost, 0);

  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!items.length) {
      toast.warn("ยังไม่มีรายการ", "กรุณาเพิ่มสินค้าก่อนยืนยันการรับเข้า");
      return;
    }
    setSubmitting(true);
    toast.info("กำลังบันทึก…", `บันทึก ${items.length} รายการไป Google Sheets`);
    const wh = WAREHOUSES.find(w => w.id === warehouse);
    const whCode = wh ? wh.code : warehouse;
    const zoneObj = wh ? wh.zones.find(z => z.id === zone) : null;
    const zoneCode = zoneObj ? zoneObj.code : zone;
    try {
      await Promise.all(items.map(item =>
        Promise.all([
          window.API.addMovement({
            type: 'IN', ref: poRef,
            productId: item.id, sku: item.sku,
            qty: item.qty, wh: whCode, zone: zoneCode,
            user: 'คุณพลอย', note: `รับเข้า ${poRef}`,
          }),
          window.API.updateProductStock(item.id, item.qty),
        ])
      ));
      toast.success("รับเข้าเรียบร้อย 🎉", `${poRef} · ${items.length} SKU · ${totalUnits} ชิ้น · บันทึกใน Google Sheets แล้ว`);
      setTimeout(() => toast.info("ซิงค์ไป Shopify อัตโนมัติ", `อัพเดต ${items.length} SKUs`), 1100);
      setItems([]);
      setScannedCode("");
      if (window.refreshData) window.refreshData();
    } catch (err) {
      toast.error("บันทึกไม่สำเร็จ", "กรุณาตรวจสอบการเชื่อมต่อ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="รับเข้าสินค้า · Receive"
        subtitle="สแกน barcode หรือเลือกสินค้าจากรายการ · ระบบจะอัพเดต Shopify และ Google Sheet อัตโนมัติ"
        actions={
          <>
            <button className="btn btn-ghost"><I.download/> Import CSV</button>
            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? <span style={{display:'inline-flex',alignItems:'center',gap:8}}><span style={{width:12,height:12,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/> กำลังบันทึก…</span> : <><I.check/> ยืนยันการรับเข้า</>}
            </button>
          </>
        }
      />

      <div className="grid-12-8">
        <div className="stack">
          <Scanner
            active={scanActive}
            code={scannedCode}
            onClick={startScan}
            status={items.length > 0 ? `เพิ่มแล้ว ${items.length} รายการ` : "พร้อมสแกน"}
          />

          {scanActive && (
            <div className="card" style={{ padding: 16 }}>
              <div className="row" style={{ gap: 10 }}>
                <input
                  ref={inputRef}
                  className="input mono"
                  placeholder="พิมพ์ barcode หรือสแกน… แล้วกด Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { handleCode(e.target.value); e.target.value = ""; }
                  }}
                  autoFocus
                />
                <button className="btn btn-ghost" onClick={() => setScanActive(false)}>ปิด</button>
              </div>
              <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <span className="dim" style={{ fontSize: 11.5 }}>ลองสแกน:</span>
                {PRODUCTS.slice(0, 4).map(p => (
                  <button key={p.id} className="chip" onClick={() => handleCode(p.barcode)}>
                    {p.barcode}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">รายการที่จะรับ ({items.length})</h3>
              <div className="row" style={{ gap: 14, fontSize: 13 }}>
                <span className="dim">รวม: </span>
                <b className="mono">{totalUnits} ชิ้น</b>
                <span className="dim">·</span>
                <b className="mono text-neon">{fmtTHB(totalValue)}</b>
              </div>
            </div>
            {items.length === 0 ? (
              <div className="empty">
                <div className="empty-ico"><I.box/></div>
                <div>ยังไม่มีรายการ · สแกน barcode หรือเพิ่มจากรายการสินค้าด้านล่าง</div>
              </div>
            ) : (
              <div className="stack" style={{ gap: 8 }}>
                {items.map(it => (
                  <div key={it.id} className="pick-item in-pick">
                    <ProductThumb product={PRODUCTS.find(p => p.id === it.id)} size={36}/>
                    <div className="pi-info">
                      <div className="pi-name">{it.name}</div>
                      <div className="pi-meta">{it.sku} · ต้นทุน {fmtTHB(it.cost)} / ชิ้น</div>
                    </div>
                    <div className="pick-stepper">
                      <button onClick={() => updateQty(it.id, it.qty - 1)}><I.minus/></button>
                      <input type="number" value={it.qty} onChange={(e) => updateQty(it.id, +e.target.value || 1)}/>
                      <button onClick={() => updateQty(it.id, it.qty + 1)}><I.plus/></button>
                    </div>
                    <div className="pi-qty mono text-neon">{fmtTHB(it.qty * it.cost)}</div>
                    <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => removeItem(it.id)}><I.x/></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">เพิ่มจากรายการสินค้า</h3>
              <p className="card-subtitle">คลิกเพื่อเพิ่ม</p>
            </div>
            <div className="stack" style={{ gap: 6 }}>
              {PRODUCTS.slice(0, 5).map(p => (
                <div key={p.id} className="pick-item" onClick={() => addManual(p.id)} style={{ cursor: 'pointer' }}>
                  <ProductThumb product={p} size={32}/>
                  <div className="pi-info">
                    <div className="pi-name">{p.name}</div>
                    <div className="pi-meta">{p.sku} · {p.barcode}</div>
                  </div>
                  <span className="badge badge-neutral mono">stock {p.stock}</span>
                  <button className="icon-btn" style={{ width: 28, height: 28 }}><I.plus/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ position: 'sticky', top: 84, alignSelf: 'start' }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>ข้อมูลใบรับเข้า</h3>
          <div className="stack" style={{ gap: 14 }}>
            <div className="field">
              <label className="field-label">เลขที่ใบรับ <span className="req">*</span></label>
              <input className="input mono" value={poRef} onChange={(e) => setPoRef(e.target.value)}/>
            </div>
            <div className="field">
              <label className="field-label">Supplier · ผู้จำหน่าย</label>
              <select className="select" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                {SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">คลังปลายทาง · Warehouse</label>
              <select className="select" value={warehouse} onChange={(e) => { const wId = e.target.value; setWarehouse(wId); const wObj = WAREHOUSES.find(w => w.id === wId); setZone(wObj?.zones?.[0]?.id || ''); }}>
                {WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}
              </select>
            </div>
            {currentWh?.zones?.length > 0 && (
              <div className="field">
                <label className="field-label">Zone</label>
                <select className="select" value={zone} onChange={(e) => setZone(e.target.value)}>
                  {currentWh.zones.map(z => <option key={z.id} value={z.id}>{z.code} · {z.type}</option>)}
                </select>
              </div>
            )}
            <div className="field">
              <label className="field-label">วันที่รับเข้า</label>
              <input className="input mono" defaultValue="2026-05-11" type="text"/>
            </div>
            <div className="field">
              <label className="field-label">หมายเหตุ</label>
              <textarea className="textarea" placeholder="เพิ่มหมายเหตุ เช่น lot number, สภาพสินค้า…"/>
            </div>

            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 14, marginTop: 4 }}>
              <div className="row-between" style={{ marginBottom: 6, fontSize: 13 }}>
                <span className="dim">จำนวน SKU</span>
                <b className="mono">{items.length}</b>
              </div>
              <div className="row-between" style={{ marginBottom: 6, fontSize: 13 }}>
                <span className="dim">รวมจำนวน</span>
                <b className="mono">{totalUnits} ชิ้น</b>
              </div>
              <div className="row-between" style={{ fontSize: 15 }}>
                <span style={{ color: 'var(--text-mid)' }}>มูลค่ารวม</span>
                <b className="mono text-neon" style={{ fontSize: 17 }}>{fmtTHB(totalValue)}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   ISSUE (จ่ายออก) — warehouse selector + pick list
   ========================================================= */
const EMPLOYEES = ["คุณพลอย", "คุณกานต์", "คุณแนน", "คุณฝ้าย", "คุณมิ้น", "คุณบิ๊ก"];
const CHANNELS  = [
  "Shopify", "Shopee", "Live", "Event", "To Mycloud",
  "Influencer", "Giveaway", "เบิกพนักงาน", "ลูกค้าเปลี่ยน", "เคลมสินค้า",
];

function IssuePage() {
  const toast = useToast();

  // Today's date as YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);

  // Warehouse selector — filters which stock column is shown
  const [selectedWh, setSelectedWh] = useState(WAREHOUSES[0]?.id || '');

  const getWhStock = (p) => {
    const wh = WAREHOUSES.find(w => w.id === selectedWh);
    if (!wh) return p.stock;
    if (wh.code === 'RAMA2') return p.stockRAMA2 || 0;
    if (wh.code === 'MYCL')  return p.stockMYCL  || 0;
    return p.stock;
  };

  const [available, setAvailable] = useState(() =>
    PRODUCTS.filter(p => p.stock > 0).map(p => ({ ...p }))
  );
  const [picked, setPicked] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  // Form fields
  const [orderRef,    setOrderRef]    = useState("SO-" + todayStr.replace(/-/g, '').slice(2));
  const [issueDate,   setIssueDate]   = useState(todayStr);
  const [requestedBy, setRequestedBy] = useState(EMPLOYEES[0]);
  const [channel,     setChannel]     = useState(CHANNELS[0]);
  const [note,        setNote]        = useState("");

  const moveToPicked = (id) => {
    const p = available.find(x => x.id === id);
    if (!p) return;
    setAvailable(prev => prev.filter(x => x.id !== id));
    setPicked(prev => [...prev, { ...p, pickQty: 1 }]);
  };
  const moveToAvailable = (id) => {
    const p = picked.find(x => x.id === id);
    if (!p) return;
    setPicked(prev => prev.filter(x => x.id !== id));
    setAvailable(prev => [...prev, p]);
  };
  const updateQty = (id, q) => setPicked(prev => prev.map(x => x.id === id ? { ...x, pickQty: Math.max(1, Math.min(x.stock, q)) } : x));

  const handleDragStart = (id) => setDraggingId(id);
  const handleDragEnd = () => { setDraggingId(null); setDragOver(null); };
  const handleDrop = (side) => {
    if (!draggingId) return;
    if (side === 'picked'    && available.find(x => x.id === draggingId)) moveToPicked(draggingId);
    if (side === 'available' && picked.find(x => x.id === draggingId))    moveToAvailable(draggingId);
    setDraggingId(null); setDragOver(null);
  };

  const totalQty   = picked.reduce((s, x) => s + x.pickQty, 0);
  const totalValue = picked.reduce((s, x) => s + x.pickQty * x.price, 0);

  const submit = () => {
    if (!picked.length) { toast.warn("ยังไม่มีของให้จ่าย", "เลือกสินค้าก่อนยืนยัน"); return; }
    const wh = WAREHOUSES.find(w => w.id === selectedWh);
    window.PackingStore.add({
      ref: orderRef,
      destination: channel,
      requestedBy, note,
      whCode: wh?.code || '',
      createdAt: new Date().toISOString(),
      items: picked.map(p => ({ id: p.id, name: p.name, sku: p.sku, category: p.category, price: p.price, pickQty: p.pickQty, packed: 0 })),
    });
    toast.success("ส่งเข้าคิวแพ็ค 📦", `${orderRef} · ${picked.length} SKU · ${totalQty} ชิ้น`);
    setTimeout(() => toast.info("ไปที่หน้า 'แพ็คสินค้า'", "เพื่อยืนยันการแพ็คและตัดสต๊อค"), 900);
    setPicked([]);
    window.dispatchEvent(new CustomEvent('packing:changed'));
  };

  return (
    <>
      <PageHeader
        title="จ่ายออกสินค้า · Issue"
        subtitle="เลือกคลัง · เลือกสินค้า · ยืนยันการจ่ายออก"
        actions={<>
          <button className="btn btn-primary" onClick={submit}><I.check/> ยืนยันจ่ายออก</button>
        </>}
      />

      {/* Warehouse selector */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 12 }}>
        <div className="row" style={{ gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-mid)', whiteSpace: 'nowrap' }}>คลังต้นทาง:</span>
          <div className="chips">
            {WAREHOUSES.map(w => (
              <button
                key={w.id}
                className={"chip " + (selectedWh === w.id ? "on" : "")}
                onClick={() => setSelectedWh(w.id)}
              >
                {w.code} · {w.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-12-8">
        {/* Pick list */}
        <div className="pick-pane">
          <div className="pick-col">
            <div className="pick-col-head">
              <b>📦 สินค้าในคลัง</b>
              <span className="badge badge-neutral mono">{available.length}</span>
            </div>
            <div
              className={"pick-list " + (dragOver === 'available' ? "drop-over" : "")}
              onDragOver={(e) => { e.preventDefault(); setDragOver('available'); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop('available')}
            >
              {available.map(p => {
                const whStock = getWhStock(p);
                return (
                  <div key={p.id}
                       className={"pick-item " + (draggingId === p.id ? "dragging" : "")}
                       draggable
                       onDragStart={() => handleDragStart(p.id)}
                       onDragEnd={handleDragEnd}
                       onDoubleClick={() => moveToPicked(p.id)}
                  >
                    <span className="dim"><I.drag/></span>
                    <ProductThumb product={p} size={36}/>
                    <div className="pi-info">
                      <div className="pi-name">{p.name}</div>
                      <div className="pi-meta">{p.sku} · คงเหลือ {fmtNum(whStock)} ชิ้น</div>
                    </div>
                    <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => moveToPicked(p.id)}><I.chevR/></button>
                  </div>
                );
              })}
              {available.length === 0 && <div className="drop-hint">ไม่มีสินค้าเหลือ</div>}
            </div>
          </div>

          <div className="pick-col">
            <div className="pick-col-head">
              <b>🚚 รายการจ่ายออก</b>
              <span className="badge badge-cyan mono">{picked.length} · {totalQty} ชิ้น</span>
            </div>
            <div
              className={"pick-list " + (dragOver === 'picked' ? "drop-over" : "")}
              onDragOver={(e) => { e.preventDefault(); setDragOver('picked'); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop('picked')}
            >
              {picked.map(p => (
                <div key={p.id}
                     className={"pick-item in-pick " + (draggingId === p.id ? "dragging" : "")}
                     draggable
                     onDragStart={() => handleDragStart(p.id)}
                     onDragEnd={handleDragEnd}>
                  <ProductThumb product={p} size={36}/>
                  <div className="pi-info">
                    <div className="pi-name">{p.name}</div>
                    <div className="pi-meta">{p.sku} · {fmtTHB(p.price)}</div>
                  </div>
                  <div className="pick-stepper">
                    <button onClick={() => updateQty(p.id, p.pickQty - 1)}><I.minus/></button>
                    <input type="number" value={p.pickQty} onChange={(e) => updateQty(p.id, +e.target.value || 1)}/>
                    <button onClick={() => updateQty(p.id, p.pickQty + 1)}><I.plus/></button>
                  </div>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => moveToAvailable(p.id)}><I.chevL/></button>
                </div>
              ))}
              {picked.length === 0 && <div className="drop-hint">ลากสินค้ามาวางที่นี่ ⬇</div>}
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="card" style={{ position: 'sticky', top: 84, alignSelf: 'start' }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>ข้อมูลใบจ่ายออก</h3>
          <div className="stack" style={{ gap: 14 }}>
            <div className="field">
              <label className="field-label">วันที่จ่ายออก</label>
              <input className="input mono" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}/>
            </div>
            <div className="field">
              <label className="field-label">เลขที่ใบ (Order Ref)</label>
              <input className="input mono" value={orderRef} onChange={(e) => setOrderRef(e.target.value)}/>
            </div>
            <div className="field">
              <label className="field-label">ผู้ขอเบิก</label>
              <select className="select" value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)}>
                {EMPLOYEES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">ช่องทาง / วัตถุประสงค์</label>
              <select className="select" value={channel} onChange={(e) => setChannel(e.target.value)}>
                {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">หมายเหตุ</label>
              <textarea className="textarea" placeholder="ใส่ข้อมูลเพิ่มเติม…" value={note} onChange={(e) => setNote(e.target.value)}/>
            </div>

            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 14 }}>
              <div className="row-between" style={{ marginBottom: 6, fontSize: 13 }}>
                <span className="dim">รวมรายการ</span>
                <b className="mono">{picked.length} SKU</b>
              </div>
              <div className="row-between" style={{ marginBottom: 6, fontSize: 13 }}>
                <span className="dim">รวมจำนวน</span>
                <b className="mono">{totalQty} ชิ้น</b>
              </div>
              <div className="row-between" style={{ fontSize: 15 }}>
                <span style={{ color: 'var(--text-mid)' }}>มูลค่ารวม (ราคาขาย)</span>
                <b className="mono text-neon" style={{ fontSize: 17 }}>{fmtTHB(totalValue)}</b>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={submit}>
              <I.check/> ยืนยันจ่ายออก
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   PRODUCTS list + detail
   ========================================================= */
function ProductsPage({ onSelectProduct }) {
  const [search, setSearch] = useState("");
  const [cat,    setCat]    = useState("All");
  const [stockFilter, setStockFilter] = useState("all"); // all | instock | soldout
  const [page,   setPage]   = useState(1);
  const PER_PAGE = 25;

  const filtered = PRODUCTS.filter(p => {
    if (cat !== "All" && p.category !== cat) return false;
    if (stockFilter === "instock"  && p.stock === 0) return false;
    if (stockFilter === "soldout"  && p.stock > 0)  return false;
    if (search && !(p.name + " " + p.sku).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Reset to page 1 when filters change
  React.useEffect(() => { setPage(1); }, [search, cat, stockFilter]);

  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <PageHeader
        title="สินค้า · Products"
        subtitle={`${PRODUCTS.length} SKUs · บริหารข้อมูลสินค้าและรูปแบบ Variant`}
        actions={<>
          <button className="btn btn-ghost"><I.download/> Export</button>
          <button className="btn btn-primary"><I.plus/> เพิ่มสินค้า</button>
        </>}
      />

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div className="search" style={{ width: 280 }}>
            <span className="search-ico"><I.search/></span>
            <input placeholder="ค้นหา SKU หรือชื่อสินค้า…" value={search} onChange={(e) => setSearch(e.target.value)}/>
          </div>
          {/* Stock status toggle */}
          <div className="seg">
            <button className={stockFilter === "all"     ? "on" : ""} onClick={() => setStockFilter("all")}>ทั้งหมด</button>
            <button className={stockFilter === "instock" ? "on" : ""} onClick={() => setStockFilter("instock")}>มีสต๊อค</button>
            <button className={stockFilter === "soldout" ? "on" : ""} onClick={() => setStockFilter("soldout")}>หมดแล้ว</button>
          </div>
          {/* Category chips */}
          <div className="chips">
            {["All", ...CATEGORIES].map(c => (
              <button key={c} className={"chip " + (cat === c ? "on" : "")} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>Category</th>
                <th>Color</th>
                <th className="num">ราคาขาย</th>
                <th className="num">ต้นทุน</th>
                <th className="num">คงเหลือ</th>
                <th>สถานะสต๊อค</th>
                <th>Shopify</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(p => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => onSelectProduct(p.id)}>
                  <td>
                    <div className="cell-product">
                      <ProductThumb product={p}/>
                      <div className="cell-product-info">
                        <b>{p.name}</b>
                        <small>{p.sku} · {p.barcode}</small>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-neutral">{p.category}</span></td>
                  <td>{p.color}</td>
                  <td className="num">
                    {p.comparePrice > p.price
                      ? <div>
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-mid)', fontSize: 11, marginRight: 4 }}>{fmtTHB(p.comparePrice)}</span>
                          <span style={{ color: 'var(--neon-danger)', fontWeight: 600 }}>{fmtTHB(p.price)}</span>
                          <span className="badge badge-danger" style={{ marginLeft: 6, fontSize: 10 }}>-{Math.round((1 - p.price / p.comparePrice) * 100)}%</span>
                        </div>
                      : fmtTHB(p.price)}
                  </td>
                  <td className="num dim">{fmtTHB(p.cost)}</td>
                  <td className="num">
                    <b>{fmtNum(p.stock)}</b>
                    {(p.stockRAMA2 > 0 || p.stockMYCL > 0) && (
                      <div style={{ fontSize: 10, color: 'var(--text-mid)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                        {p.stockRAMA2 > 0 && <span>R2:{p.stockRAMA2} </span>}
                        {p.stockMYCL > 0 && <span>MC:{p.stockMYCL}</span>}
                      </div>
                    )}
                  </td>
                  <td><StockBadge stock={p.stock} reorderPoint={p.reorderPoint}/></td>
                  <td>
                    {p.shopify === 'synced' && <span className="badge badge-green"><span className="dot-mark"/>synced</span>}
                    {p.shopify === 'syncing' && <span className="badge badge-cyan"><span className="dot-mark"/>syncing</span>}
                    {p.shopify === 'error' && <span className="badge badge-danger"><span className="dot-mark"/>error</span>}
                  </td>
                  <td><button className="icon-btn" style={{ width: 32, height: 32 }}><I.chevR/></button></td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-mid)' }}>ไม่พบสินค้า</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-soft)' }}>
          <Paginator total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage}/>
        </div>
      </div>
    </>
  );
}

function ProductDetailPage({ productId, onBack }) {
  const p = PRODUCTS.find(pp => pp.id === productId);
  const [tab, setTab] = useState("overview");
  if (!p) return null;

  // per-warehouse stock from real data
  const whStockMap = {
    "RAMA2": p.stockRAMA2 || 0,
    "MYCL":  p.stockMYCL  || 0,
  };
  const totalRealStock = Object.values(whStockMap).reduce((a, b) => a + b, 0);

  const wRow = WAREHOUSES.map(w => {
    const realStock = whStockMap[w.code] || 0;
    // distribute sizes proportionally to warehouse stock
    const share = totalRealStock > 0 ? realStock / totalRealStock : 1 / WAREHOUSES.length;
    return {
      wh: w.code,
      name: w.name,
      total: realStock,
      sizes: p.sizes.map(s => ({ size: s.size, qty: Math.round(s.qty * share) })),
    };
  });

  const productMovements = MOVEMENTS.filter(m => m.productId === p.id);

  return (
    <>
      <PageHeader
        title={p.name}
        subtitle={`${p.sku} · ${p.brand} · ${p.category}`}
        actions={<>
          <button className="btn btn-ghost" onClick={onBack}><I.chevL/> กลับ</button>
          <button className="btn btn-ghost"><I.scan/> พิมพ์ Barcode</button>
          <button className="btn btn-primary">แก้ไขสินค้า</button>
        </>}
      />

      <div className="product-hero">
        <div className="product-img" style={{ overflow: 'hidden', position: 'relative' }}>
          {p.imageUrl
            ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}/>
            : null}
          <span className="product-img-label" style={{ display: p.imageUrl ? 'none' : 'flex' }}>[ No image ]</span>
        </div>
        <div className="stack">
          <div className="card" style={{ padding: 18 }}>
            <div className="row" style={{ gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div className="stat-label">ราคาขาย</div>
                {p.comparePrice > p.price
                  ? <div>
                      <div style={{ textDecoration: 'line-through', color: 'var(--text-mid)', fontSize: 14 }}>{fmtTHB(p.comparePrice)}</div>
                      <div className="stat-value" style={{ fontSize: 24, color: 'var(--neon-danger)' }}>
                        {fmtTHB(p.price)}
                        <span className="badge badge-danger" style={{ marginLeft: 8, fontSize: 11 }}>-{Math.round((1 - p.price / p.comparePrice) * 100)}%</span>
                      </div>
                    </div>
                  : <div className="stat-value" style={{ fontSize: 24 }}>{fmtTHB(p.price)}</div>}
              </div>
              <div>
                <div className="stat-label">ต้นทุน</div>
                <div className="stat-value" style={{ fontSize: 24, color: 'var(--text-mid)' }}>{fmtTHB(p.cost)}</div>
              </div>
              <div>
                <div className="stat-label">Gross margin</div>
                <div className="stat-value text-neon" style={{ fontSize: 24 }}>{p.price > 0 ? Math.round((1 - p.cost / p.price) * 100) : 0}%</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <StockBadge stock={p.stock} reorderPoint={p.reorderPoint}/>
                {p.shopify === 'synced' && <span className="badge badge-green"><span className="dot-mark"/>Shopify synced</span>}
                {p.shopify === 'error' && <span className="badge badge-danger"><span className="dot-mark"/>Shopify error</span>}
              </div>
            </div>
          </div>

          <div className="grid-3">
            <div className="card" style={{ padding: 18 }}>
              <div className="stat-label">Stock on hand</div>
              <div className="counter" style={{ fontSize: 30 }}><AnimatedNumber value={p.stock} format={fmtNum}/></div>
              <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>units</div>
              <div className="bar" style={{ marginTop: 14 }}>
                <span style={{ width: Math.min(100, (p.stock / (p.reorderPoint * 4)) * 100) + '%' }}/>
              </div>
              <div className="row-between" style={{ fontSize: 11, marginTop: 6 }}>
                <span className="dim">Reorder @ {p.reorderPoint}</span>
                <span className="dim">target {p.reorderPoint * 4}</span>
              </div>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <div className="stat-label">Sell-through (30d)</div>
              <div className="counter" style={{ fontSize: 30 }}>74<small style={{ fontSize: 14, color: 'var(--text-dim)', marginLeft: 3 }}>%</small></div>
              <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>ขายไปแล้ว 74% ของล็อต</div>
              <div className="gauge" style={{ "--p": 74, "--size": "0px", display: 'none' }}/>
              <div className="bar green" style={{ marginTop: 14 }}><span style={{ width: '74%' }}/></div>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <div className="stat-label">Days of supply</div>
              <div className="counter" style={{ fontSize: 30 }}>{Math.max(6, Math.round(p.stock / 8))}<small style={{ fontSize: 14, color: 'var(--text-dim)', marginLeft: 3 }}>days</small></div>
              <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>คาดว่าหมดใน {Math.max(6, Math.round(p.stock / 8))} วัน</div>
              <div className="bar warn" style={{ marginTop: 14 }}><span style={{ width: '46%' }}/></div>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs">
        {[
          { id: "overview", l: "ภาพรวม" },
          { id: "variants", l: "Size matrix" },
          { id: "locations", l: "ตามคลัง" },
          { id: "movements", l: "Movement history" },
        ].map(t => (
          <button key={t.id} className={"tab " + (tab === t.id ? "on" : "")} onClick={() => setTab(t.id)}>{t.l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 14 }}>รายละเอียดสินค้า</h3>
            <div className="stack" style={{ gap: 12 }}>
              {[
                ["SKU", p.sku],
                ["Barcode", p.barcode],
                ["Brand", p.brand],
                ["Category", p.category],
                ["สี", p.color],
                ["จุดสั่งซื้อใหม่", `${p.reorderPoint} ชิ้น`],
                ["สถานะ", p.status === 'out' ? "Out of stock" : "Active"],
              ].map(([k, v]) => (
                <div key={k} className="row-between" style={{ fontSize: 13 }}>
                  <span className="dim">{k}</span>
                  <span className="mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 14 }}>Channels</h3>
            <div className="stack" style={{ gap: 12 }}>
              <div className="row-between">
                <div className="row" style={{ gap: 10 }}><ShopifyMark/><div><b style={{ fontSize: 13 }}>Shopify</b><div className="dim" style={{ fontSize: 11.5 }}>cuteboy.myshopify.com</div></div></div>
                {p.shopify === 'synced' ? <span className="badge badge-green">synced</span> :
                 p.shopify === 'syncing' ? <span className="badge badge-cyan">syncing</span> :
                 <span className="badge badge-danger">error</span>}
              </div>
              <div className="row-between">
                <div className="row" style={{ gap: 10 }}><SheetsMark/><div><b style={{ fontSize: 13 }}>Google Sheet</b><div className="dim" style={{ fontSize: 11.5 }}>Inventory Master · row {p.id.replace("p", "")}</div></div></div>
                <span className="badge badge-cyan">live</span>
              </div>
              <div className="row-between">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--surface-3)', color: 'var(--text-mid)' }}>P</div>
                  <div><b style={{ fontSize: 13 }}>Pop-up Store</b><div className="dim" style={{ fontSize: 11.5 }}>Siam Square · manual</div></div>
                </div>
                <span className="badge badge-neutral">offline</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "variants" && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 14 }}>Size × Warehouse Matrix</h3>
          <table className="variant-matrix">
            <thead>
              <tr>
                <th></th>
                {p.sizes.map(s => <th key={s.size}>{s.size}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {wRow.map(w => {
                const t = w.sizes.reduce((s, x) => s + x.qty, 0);
                return (
                  <tr key={w.wh}>
                    <td>{w.wh} · {w.name}</td>
                    {w.sizes.map(s => {
                      const cls = s.qty === 0 ? "out" : s.qty < 8 ? "low" : s.qty > 30 ? "healthy" : "";
                      return <td key={s.size}><div className={"variant-cell " + cls}>{s.qty || '—'}</div></td>;
                    })}
                    <td><div className="variant-cell" style={{ background: 'color-mix(in oklab, var(--neon-1) 16%, var(--surface-2))', color: 'var(--neon-1)', borderColor: 'color-mix(in oklab, var(--neon-1) 30%, var(--border))' }}>{t}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "locations" && (
        <div className="stack">
          {wRow.map(w => (
            <div className="card" key={w.wh}>
              <div className="row-between" style={{ marginBottom: w.total > 0 ? 14 : 0 }}>
                <div>
                  <h3 className="card-title">{w.name}</h3>
                  <div className="dim" style={{ fontSize: 12 }}>{w.wh}</div>
                </div>
                <div className="row" style={{ gap: 16 }}>
                  <span className={`badge ${w.total > 0 ? 'badge-cyan' : 'badge-neutral'} mono`}>{w.total} ชิ้น</span>
                  <div style={{ width: 200 }}>
                    <BarRow value={w.total} total={p.stock || 1} tone={w.total === 0 ? "danger" : "green"}/>
                  </div>
                </div>
              </div>
              {w.total > 0 && w.sizes.length > 0 && (
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {w.sizes.map(s => (
                    <div key={s.size} style={{ textAlign: 'center', padding: '6px 12px', borderRadius: 8, background: 'var(--surface-2)', minWidth: 52 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{s.size}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.qty === 0 ? 'var(--neon-danger)' : 'var(--text-main)' }}>{s.qty}</div>
                    </div>
                  ))}
                </div>
              )}
              {w.total === 0 && <div className="dim" style={{ fontSize: 12 }}>ไม่มีสต๊อคที่คลังนี้</div>}
            </div>
          ))}
          <div className="card" style={{ padding: 14, background: 'var(--surface)' }}>
            <div className="row-between">
              <span style={{ fontSize: 13, fontWeight: 600 }}>รวมทั้งหมด</span>
              <span className="badge badge-green mono">{p.stock} ชิ้น</span>
            </div>
          </div>
        </div>
      )}

      {tab === "movements" && (
        <div className="card">
          <div className="stack" style={{ gap: 4 }}>
            {productMovements.length === 0 ? (
              <div className="empty">ไม่มีประวัติการเคลื่อนไหวของสินค้านี้ในช่วง 30 วัน</div>
            ) : productMovements.map(m => <MovementRow key={m.id} m={m}/>)}
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   LOCATIONS — simplified view
   ========================================================= */
function LocationsPage() {
  // Per-warehouse stock totals and active SKU counts from real data
  const whStats = WAREHOUSES.map(w => {
    let totalStock = 0;
    let activeSKUs = 0;
    if (w.code === 'RAMA2') {
      totalStock = PRODUCTS.reduce((s, p) => s + (p.stockRAMA2 || 0), 0);
      activeSKUs = PRODUCTS.filter(p => (p.stockRAMA2 || 0) > 0).length;
    } else if (w.code === 'MYCL') {
      totalStock = PRODUCTS.reduce((s, p) => s + (p.stockMYCL || 0), 0);
      activeSKUs = PRODUCTS.filter(p => (p.stockMYCL || 0) > 0).length;
    } else {
      // fallback: split evenly
      const share = WAREHOUSES.length > 0 ? 1 / WAREHOUSES.length : 1;
      totalStock = Math.round(PRODUCTS.reduce((s, p) => s + p.stock, 0) * share);
      activeSKUs = PRODUCTS.filter(p => p.stock > 0).length;
    }
    return { ...w, totalStock, activeSKUs };
  });

  const grandTotal = whStats.reduce((s, w) => s + w.totalStock, 0);
  const totalActiveSKUs = PRODUCTS.filter(p => p.stock > 0).length;

  return (
    <>
      <PageHeader
        title="Locations · คลังสินค้า"
        subtitle={`${WAREHOUSES.length} คลัง · สต๊อครวม ${fmtNum(grandTotal)} ชิ้น`}
        actions={<>
          <button className="btn btn-primary"><I.plus/> เพิ่มคลัง</button>
        </>}
      />

      {/* Summary cards */}
      <div className="stat-grid">
        <StatCard label="คลังทั้งหมด"    value={WAREHOUSES.length} unit="คลัง"  accent="var(--neon-1)" ico={<I.map/>}/>
        <StatCard label="สต๊อครวมทุกคลัง" value={grandTotal}       unit="ชิ้น"  accent="var(--neon-2)" ico={<I.box/>}/>
        <StatCard label="Active SKUs"     value={totalActiveSKUs}  unit="SKUs"  accent="#fbbf24"        ico={<I.sparkle/>}/>
      </div>

      {/* One card per warehouse */}
      <div className="stack">
        {whStats.map(w => {
          const pct = grandTotal > 0 ? Math.round((w.totalStock / grandTotal) * 100) : 0;
          // Top 5 products in this warehouse
          const topProducts = PRODUCTS
            .filter(p => {
              if (w.code === 'RAMA2') return (p.stockRAMA2 || 0) > 0;
              if (w.code === 'MYCL')  return (p.stockMYCL  || 0) > 0;
              return p.stock > 0;
            })
            .sort((a, b) => {
              const sa = w.code === 'RAMA2' ? (a.stockRAMA2 || 0) : w.code === 'MYCL' ? (a.stockMYCL || 0) : a.stock;
              const sb = w.code === 'RAMA2' ? (b.stockRAMA2 || 0) : w.code === 'MYCL' ? (b.stockMYCL || 0) : b.stock;
              return sb - sa;
            })
            .slice(0, 5);

          return (
            <div className="warehouse-card" key={w.id}>
              <div className="warehouse-head">
                <div>
                  <h3 className="warehouse-name">
                    <span className="badge badge-cyan mono" style={{ fontSize: 12 }}>{w.code}</span>
                    {w.name}
                  </h3>
                  <div className="warehouse-addr">{w.addr || ''}</div>
                  <div className="warehouse-meta" style={{ marginTop: 10 }}>
                    <div className="wm-stat">
                      <div className="wm-stat-lbl">สต๊อครวม</div>
                      <div className="wm-stat-val">{fmtNum(w.totalStock)}</div>
                    </div>
                    <div className="wm-stat">
                      <div className="wm-stat-lbl">Active SKUs</div>
                      <div className="wm-stat-val">{w.activeSKUs}</div>
                    </div>
                    <div className="wm-stat">
                      <div className="wm-stat-lbl">สัดส่วน</div>
                      <div className="wm-stat-val text-neon">{pct}%</div>
                    </div>
                  </div>
                </div>
                <div style={{ width: 220 }}>
                  <BarRow value={w.totalStock} total={grandTotal || 1}/>
                </div>
              </div>

              {topProducts.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="dim" style={{ fontSize: 12, marginBottom: 8 }}>Top สินค้าในคลังนี้</div>
                  <div className="stack" style={{ gap: 6 }}>
                    {topProducts.map(p => {
                      const qty = w.code === 'RAMA2' ? (p.stockRAMA2 || 0) : w.code === 'MYCL' ? (p.stockMYCL || 0) : p.stock;
                      return (
                        <div key={p.id} className="pick-item" style={{ cursor: 'default' }}>
                          <ProductThumb product={p} size={32}/>
                          <div className="pi-info">
                            <div className="pi-name">{p.name}</div>
                            <div className="pi-meta">{p.sku}</div>
                          </div>
                          <span className="badge badge-neutral mono">{fmtNum(qty)} ชิ้น</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* =========================================================
   STOCK REPORT
   ========================================================= */
function StockReportPage() {
  const [cat,    setCat]    = useState("All");
  const [status, setStatus] = useState("All");
  const [wh,     setWh]     = useState("All");
  const [page,   setPage]   = useState(1);
  const PER_PAGE = 30;

  const filtered = PRODUCTS.filter(p => {
    if (cat !== "All" && p.category !== cat) return false;
    if (status === "low" && p.stock >= p.reorderPoint) return false;
    if (status === "out" && p.stock > 0) return false;
    if (status === "healthy" && p.stock < p.reorderPoint) return false;
    return true;
  });

  React.useEffect(() => { setPage(1); }, [cat, status, wh]);

  const pageItems  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalValue = filtered.reduce((s, p) => s + p.stock * p.cost, 0);

  return (
    <>
      <PageHeader
        title="รายงานสินค้าคงเหลือ"
        subtitle="Stock on hand · Real-time · มูลค่าสต๊อคและความเสี่ยง"
        actions={<>
          <button className="btn btn-ghost"><I.download/> Export CSV</button>
          <button className="btn btn-ghost"><I.download/> Export Sheet</button>
          <button className="btn btn-primary">พิมพ์รายงาน</button>
        </>}
      />

      <div className="stat-grid">
        <StatCard label="SKUs" value={filtered.length} accent="var(--neon-1)"/>
        <StatCard label="Units" value={filtered.reduce((s, p) => s + p.stock, 0)} accent="var(--neon-2)"/>
        <StatCard label="Value" value={totalValue} accent="#fbbf24" format={(v) => fmtTHB(Math.round(v))}/>
        <StatCard label="ความเสี่ยง · ต้องสั่งเติม" value={PRODUCTS.filter(p => p.stock < p.reorderPoint).length} accent="var(--neon-danger)"/>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div className="chips">
            <span className="dim" style={{ fontSize: 12, alignSelf: 'center', marginRight: 4 }}>หมวด:</span>
            {["All", ...CATEGORIES].map(c => (
              <button key={c} className={"chip " + (cat === c ? "on" : "")} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <div className="chips">
            <span className="dim" style={{ fontSize: 12, alignSelf: 'center', marginRight: 4 }}>สถานะ:</span>
            {[
              { v: "All", l: "ทั้งหมด" },
              { v: "healthy", l: "ปกติ" },
              { v: "low", l: "ต่ำ" },
              { v: "out", l: "หมด" },
            ].map(o => (
              <button key={o.v} className={"chip " + (status === o.v ? "on" : "")} onClick={() => setStatus(o.v)}>{o.l}</button>
            ))}
          </div>
          <div className="chips">
            <span className="dim" style={{ fontSize: 12, alignSelf: 'center', marginRight: 4 }}>คลัง:</span>
            {[{ v: "All", l: "ทั้งหมด" }, ...WAREHOUSES.map(w => ({ v: w.code, l: w.code }))].map(o => (
              <button key={o.v} className={"chip " + (wh === o.v ? "on" : "")} onClick={() => setWh(o.v)}>{o.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap" style={{ border: 'none' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>หมวด</th>
                <th className="num">RAMA2</th>
                <th className="num">MYCL</th>
                <th className="num">รวม</th>
                <th className="num">มูลค่า</th>
                <th>สถานะ</th>
                <th className="num">เติมที่</th>
                <th>Fill rate</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(p => {
                const rama2 = p.stockRAMA2 || 0;
                const mycl  = p.stockMYCL  || 0;
                const target = p.reorderPoint * 3;
                const pct = Math.min(100, Math.round((p.stock / (target || 1)) * 100));
                let tone = "green";
                if (p.stock < p.reorderPoint) tone = "warn";
                if (p.stock === 0) tone = "danger";
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-product">
                        <ProductThumb product={p} size={36}/>
                        <div className="cell-product-info">
                          <b>{p.name}</b>
                          <small>{p.sku}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-neutral">{p.category}</span></td>
                    <td className="num">{fmtNum(rama2)}</td>
                    <td className="num">{fmtNum(mycl)}</td>
                    <td className="num"><b>{fmtNum(p.stock)}</b></td>
                    <td className="num dim">{fmtTHB(p.stock * p.cost)}</td>
                    <td><StockBadge stock={p.stock} reorderPoint={p.reorderPoint}/></td>
                    <td className="num dim">{p.reorderPoint}</td>
                    <td style={{ minWidth: 140 }}>
                      <div className={"bar " + tone}><span style={{ width: pct + '%' }}/></div>
                    </td>
                  </tr>
                );
              })}
              {pageItems.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-mid)' }}>ไม่พบข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-soft)' }}>
          <Paginator total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage}/>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   MOVEMENT REPORT
   ========================================================= */
function MovementReportPage() {
  const [type,      setType]      = useState("All");
  const [range,     setRange]     = useState("7d");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [page,      setPage]      = useState(1);
  const PER_PAGE = 30;

  const getDateRangeMovements = () => {
    if (!startDate || !endDate) return MOVEMENTS;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return MOVEMENTS.filter(m => {
      const mDate = new Date(m.date);
      return mDate >= start && mDate <= end;
    });
  };

  const dateFilteredMovements = getDateRangeMovements();
  const filtered = dateFilteredMovements.filter(m => type === "All" || m.type === type);

  React.useEffect(() => { setPage(1); }, [type, startDate, endDate]);
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    IN: dateFilteredMovements.filter(m => m.type === 'IN').reduce((s, m) => s + m.qty, 0),
    OUT: -dateFilteredMovements.filter(m => m.type === 'OUT').reduce((s, m) => s + m.qty, 0),
    TX: dateFilteredMovements.filter(m => m.type === 'TX').reduce((s, m) => s + Math.abs(m.qty), 0),
    ADJ: dateFilteredMovements.filter(m => m.type === 'ADJ').length,
  };

  return (
    <>
      <PageHeader
        title="รายงานการเคลื่อนไหวสินค้า"
        subtitle="Movement log · ทุก transaction ทั้งรับ-จ่าย-โอน-ปรับสต๊อค"
        actions={<>
          <button className="btn btn-ghost"><I.download/> Export</button>
        </>}
      />

      <div className="stat-grid">
        <StatCard label="รับเข้า · IN" value={stats.IN} unit="ชิ้น" accent="var(--neon-3)" ico={<I.arrowDown/>} delta={8.2} deltaDir="up"/>
        <StatCard label="จ่ายออก · OUT" value={stats.OUT} unit="ชิ้น" accent="var(--neon-danger)" ico={<I.arrowUp/>} delta={4.1} deltaDir="up"/>
        <StatCard label="โอนระหว่างคลัง" value={stats.TX} unit="ชิ้น" accent="var(--neon-2)" ico={<I.tx/>}/>
        <StatCard label="การปรับสต๊อค" value={stats.ADJ} unit="ครั้ง" accent="#fbbf24" ico={<I.warn/>}/>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="stack" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div className="seg">
              {[
                { v: "All", l: "ทั้งหมด" },
                { v: "IN", l: "รับ" },
                { v: "OUT", l: "จ่าย" },
                { v: "TX", l: "โอน" },
                { v: "ADJ", l: "ปรับ" },
              ].map(o => (
                <button key={o.v} className={type === o.v ? "on" : ""} onClick={() => setType(o.v)}>{o.l}</button>
              ))}
            </div>
            <div className="seg">
              {["1d", "7d", "30d", "90d"].map(o => (
                <button key={o} className={range === o ? "on" : ""} onClick={() => setRange(o)}>{o}</button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div className="search" style={{ width: 240 }}>
                <span className="search-ico"><I.search/></span>
                <input placeholder="ค้นหา ref, SKU, ผู้ทำ…"/>
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label className="field-label" style={{ margin: 0 }}>เลือกช่วงวันที่:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-soft)', background: 'var(--surface-2)', color: 'var(--text-main)', fontFamily: 'inherit' }}/>
              <span style={{ color: 'var(--text-mid)' }}>ถึง</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-soft)', background: 'var(--surface-2)', color: 'var(--text-main)', fontFamily: 'inherit' }}/>
              {(startDate || endDate) && <button className="btn btn-ghost btn-sm" onClick={() => { setStartDate(""); setEndDate(""); }}>ล้างตัวกรอง</button>}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">Movement timeline</h3>
            <p className="card-subtitle">
              {startDate && endDate ? `${startDate} ถึง ${endDate} · ` : ''}{filtered.length} รายการ
            </p>
          </div>
        </div>
        <div className="stack" style={{ gap: 4 }}>
          {pageItems.length > 0 ? (
            pageItems.map(m => <MovementRow key={m.id} m={m}/>)
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-mid)' }}>
              ไม่มีข้อมูล Movement ในช่วงวันที่ที่เลือก
            </div>
          )}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-soft)' }}>
          <Paginator total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage}/>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   SETTINGS / INTEGRATIONS
   ========================================================= */
function SettingsPage() {
  const toast = useToast();
  const [shopify, setShopify] = useState({ on: true, auto: true, every: 15 });
  const [sheet, setSheet]   = useState({ on: true, auto: true, every: 15 });
  const [syncing, setSyncing] = useState(false);

  const runSync = () => {
    setSyncing(true);
    toast.info("เริ่มซิงค์...", "เชื่อมต่อ Shopify Storefront API");
    setTimeout(() => {
      toast.success("Shopify sync เสร็จ", "อัพเดต 12 SKUs · 432 หน่วย");
      setTimeout(() => {
        toast.success("Google Sheet sync เสร็จ", "เพิ่ม 24 rows ใน Inventory Master");
        setSyncing(false);
      }, 900);
    }, 1300);
  };

  return (
    <>
      <PageHeader
        title="ตั้งค่า & Integrations"
        subtitle="เชื่อมต่อกับ Shopify, Google Sheet และระบบอื่น ๆ"
        actions={<>
          <button className={"btn btn-primary" + (syncing ? " is-syncing" : "")} onClick={runSync} disabled={syncing}>
            {syncing ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
              กำลังซิงค์…
            </span> : <><I.link/> Run sync now</>}
          </button>
        </>}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="stack">
        <div className="card">
          <div className="row-between" style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 14 }}>
              <ShopifyMark/>
              <div>
                <h3 className="card-title">Shopify Storefront</h3>
                <p className="card-subtitle">cuteboy.myshopify.com · เชื่อมต่อตั้งแต่ 14 ม.ค. 2026</p>
              </div>
            </div>
            <span className="badge badge-green"><span className="dot-mark"/>connected</span>
          </div>

          <div className="field-grid-3">
            <div className="field">
              <label className="field-label">Auto-sync</label>
              <div className="seg" style={{ width: '100%' }}>
                <button className={shopify.auto ? "on" : ""} style={{ flex: 1 }} onClick={() => setShopify({ ...shopify, auto: true })}>เปิด</button>
                <button className={!shopify.auto ? "on" : ""} style={{ flex: 1 }} onClick={() => setShopify({ ...shopify, auto: false })}>ปิด</button>
              </div>
            </div>
            <div className="field">
              <label className="field-label">ทุกกี่นาที</label>
              <select className="select" value={shopify.every} onChange={(e) => setShopify({ ...shopify, every: +e.target.value })}>
                <option value={5}>5 นาที</option>
                <option value={15}>15 นาที</option>
                <option value={30}>30 นาที</option>
                <option value={60}>1 ชั่วโมง</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">เมื่อสต๊อคเป็น 0</label>
              <select className="select">
                <option>ซ่อนสินค้าจากร้าน</option>
                <option>เปิด pre-order</option>
                <option>ไม่ทำอะไร</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
            <div className="row-between" style={{ marginBottom: 10 }}>
              <span className="dim" style={{ fontSize: 12 }}>Sync history (ล่าสุด)</span>
              <a className="dim" style={{ fontSize: 12, cursor: 'pointer' }}>ดูทั้งหมด</a>
            </div>
            <div className="stack" style={{ gap: 6 }}>
              {[
                { t: "11:54 · 11 May", st: "success", msg: "อัพเดต 12 SKUs · 432 units" },
                { t: "11:39 · 11 May", st: "success", msg: "อัพเดต 8 SKUs · 124 units" },
                { t: "11:24 · 11 May", st: "warn", msg: "1 SKU ไม่ตรง · TS-OVR-BLK (resolved)" },
                { t: "11:09 · 11 May", st: "success", msg: "อัพเดต 14 SKUs · 280 units" },
              ].map((h, i) => (
                <div key={i} className="row" style={{ gap: 12, padding: '8px 10px', borderRadius: 8, background: 'var(--surface-2)' }}>
                  <span className={"badge " + (h.st === 'success' ? 'badge-green' : 'badge-warn')}>
                    {h.st === 'success' ? <I.check/> : <I.warn/>} {h.st}
                  </span>
                  <span className="mono dim" style={{ fontSize: 11.5 }}>{h.t}</span>
                  <span style={{ fontSize: 13 }}>{h.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="row-between" style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 14 }}>
              <SheetsMark/>
              <div>
                <h3 className="card-title">Google Sheet</h3>
                <p className="card-subtitle">Sheet: Inventory Master · drive.google.com/.../1aZ9...</p>
              </div>
            </div>
            <span className="badge badge-green"><span className="dot-mark"/>connected</span>
          </div>

          <div className="field-grid-3">
            <div className="field">
              <label className="field-label">Auto-sync</label>
              <div className="seg" style={{ width: '100%' }}>
                <button className={sheet.auto ? "on" : ""} style={{ flex: 1 }} onClick={() => setSheet({ ...sheet, auto: true })}>เปิด</button>
                <button className={!sheet.auto ? "on" : ""} style={{ flex: 1 }} onClick={() => setSheet({ ...sheet, auto: false })}>ปิด</button>
              </div>
            </div>
            <div className="field">
              <label className="field-label">ความถี่</label>
              <select className="select" defaultValue={15}>
                <option value={5}>5 นาที</option>
                <option value={15}>15 นาที</option>
                <option value={30}>30 นาที</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">ทิศทาง</label>
              <select className="select" defaultValue="both">
                <option value="push">Inventory ➜ Sheet</option>
                <option value="pull">Sheet ➜ Inventory</option>
                <option value="both">Two-way sync</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 14 }}>Integrations อื่น ๆ</h3>
          <div className="grid-3">
            {[
              { name: "Lazada", desc: "Marketplace channel sync", on: false },
              { name: "Shopee", desc: "Marketplace channel sync", on: false },
              { name: "Line OA", desc: "แจ้งเตือนสต๊อคต่ำ", on: true },
              { name: "Slack", desc: "Daily summary @ 9:00", on: true },
              { name: "Webhooks", desc: "Custom endpoints", on: false },
              { name: "Barcode printer", desc: "Brother QL-820", on: true },
            ].map(it => (
              <div key={it.name} className="card hoverable" style={{ padding: 14, cursor: 'pointer' }}>
                <div className="row-between">
                  <b style={{ fontSize: 13.5 }}>{it.name}</b>
                  {it.on ? <span className="badge badge-green"><span className="dot-mark"/>on</span> : <span className="badge badge-neutral">off</span>}
                </div>
                <div className="dim" style={{ fontSize: 12, marginTop: 4 }}>{it.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  DashboardPage, ReceivePage, IssuePage,
  ProductsPage, ProductDetailPage, LocationsPage,
  StockReportPage, MovementReportPage, SettingsPage,
});
