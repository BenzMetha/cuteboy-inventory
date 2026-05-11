// packing.jsx — Packing queue store + Packing page
// Loaded AFTER components.jsx + pages.jsx, BEFORE app.jsx

/* ============ Packing store ============ */
(function() {
  const KEY = '__cuteboy_packing_v1';
  // seed initial pending pack from sample (so the page isn't empty on first load)
  const seed = [
    {
      id: 'pk-001',
      ref: 'SO-25-9920',
      destination: 'shopify',
      status: 'pending', // pending | packing | packed
      createdAt: '2026-05-11T08:48:00Z',
      packedAt: null,
      packer: null,
      items: [
        { id: 'p001', name: "Oversized Tee 'Neon Drift'", sku: 'TS-OVR-BLK', category: 'Top wear', price: 690, pickQty: 2, packed: 0 },
        { id: 'p005', name: 'Mesh Trucker Cap', sku: 'AC-CAP-NAV', category: 'Accessories', price: 490, pickQty: 1, packed: 0 },
      ],
    },
    {
      id: 'pk-002',
      ref: 'SO-25-9921',
      destination: 'shopify',
      status: 'packing',
      createdAt: '2026-05-11T08:55:00Z',
      packedAt: null,
      packer: 'คุณมิ้นต์',
      items: [
        { id: 'p006', name: "Chunky Sneaker 'Spectra'", sku: 'SH-CHK-WHT', category: 'Footwear', price: 2490, pickQty: 3, packed: 2 },
        { id: 'p010', name: "Crossbody Bag 'Pocket'", sku: 'AC-BAG-CRM', category: 'Accessories', price: 1290, pickQty: 1, packed: 1 },
        { id: 'p012', name: "Graphic Tee 'CB Heart'", sku: 'TS-GRP-PNK', category: 'Top wear', price: 690, pickQty: 4, packed: 0 },
      ],
    },
    {
      id: 'pk-003',
      ref: 'SO-25-9919',
      destination: 'popup',
      status: 'packed',
      createdAt: '2026-05-11T08:14:00Z',
      packedAt: '2026-05-11T09:02:00Z',
      packer: 'คุณจูน',
      items: [
        { id: 'p002', name: "Boxy Crop Tee 'Pulse'", sku: 'TS-BOX-WHT', category: 'Top wear', price: 590, pickQty: 6, packed: 6 },
      ],
    },
  ];

  let state = seed.slice();
  const listeners = new Set();
  const notify = () => {
    listeners.forEach(fn => fn(state));
    window.dispatchEvent(new CustomEvent('packing:changed', { detail: state }));
  };

  window.PackingStore = {
    get: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    add: (order) => {
      const id = 'pk-' + Math.random().toString(36).slice(2, 7);
      state = [
        { id, status: 'pending', packedAt: null, packer: null, ...order,
          items: order.items.map(it => ({ ...it, packed: 0 })) },
        ...state,
      ];
      notify();
      // sync to Google Sheets
      if (window.API) {
        window.API.addPackingOrder({ ref: order.ref, items: order.items, note: order.destination || '' })
          .catch(err => console.warn('addPackingOrder sync failed:', err));
      }
    },
    startPacking: (id, packer) => {
      state = state.map(o => o.id === id ? { ...o, status: 'packing', packer: packer || 'คุณพลอย' } : o);
      notify();
    },
    incPack: (id, itemId, delta) => {
      state = state.map(o => {
        if (o.id !== id) return o;
        const items = o.items.map(it => it.id === itemId
          ? { ...it, packed: Math.max(0, Math.min(it.pickQty, it.packed + delta)) }
          : it);
        return { ...o, items, status: o.status === 'pending' ? 'packing' : o.status };
      });
      notify();
    },
    finishAll: (id) => {
      const order = state.find(o => o.id === id);
      state = state.map(o => o.id === id
        ? { ...o, items: o.items.map(it => ({ ...it, packed: it.pickQty })), status: 'packed', packedAt: new Date().toISOString(), packer: o.packer || 'คุณพลอย' }
        : o);
      notify();
      // sync to Google Sheets: update packing status + deduct stock
      if (window.API && order) {
        window.API.updatePackingOrderStatus(id, 'packed')
          .catch(err => console.warn('updatePackingStatus sync failed:', err));
        order.items.forEach(it => {
          window.API.addMovement({
            type: 'OUT', ref: order.ref,
            productId: it.id, sku: it.sku,
            qty: -it.pickQty, wh: 'BKK', zone: 'A-01',
            user: order.packer || 'คุณพลอย', note: `แพ็คเสร็จ · ${order.ref}`,
          }).catch(err => console.warn('addMovement sync failed:', err));
          window.API.updateProductStock(it.id, -it.pickQty)
            .catch(err => console.warn('updateStock sync failed:', err));
        });
        if (window.refreshData) setTimeout(window.refreshData, 2000);
      }
    },
    confirmShip: (id) => {
      state = state.map(o => o.id === id
        ? { ...o, status: 'packed', packedAt: new Date().toISOString(), packer: o.packer || 'คุณพลอย', shipped: true }
        : o);
      notify();
    },
    cancel: (id) => {
      state = state.filter(o => o.id !== id);
      notify();
    },
    counts: () => ({
      pending: state.filter(o => o.status === 'pending').length,
      packing: state.filter(o => o.status === 'packing').length,
      packed:  state.filter(o => o.status === 'packed').length,
      pendingItems: state.filter(o => o.status !== 'packed').reduce((s, o) => s + o.items.reduce((a, it) => a + (it.pickQty - it.packed), 0), 0),
    }),
  };
})();

/* ============ usePackingStore hook ============ */
function usePackingStore() {
  const [s, setS] = React.useState(window.PackingStore.get());
  React.useEffect(() => window.PackingStore.subscribe(setS), []);
  return s;
}

/* ============ Packing Page ============ */
function PackingPage() {
  const toast = useToast();
  const orders = usePackingStore();
  const [filter, setFilter] = React.useState('active'); // active | pending | packing | packed | all
  const [selected, setSelected] = React.useState(null);

  const filtered = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'active') return o.status !== 'packed';
    return o.status === filter;
  });

  const counts = window.PackingStore.counts();

  React.useEffect(() => {
    if (selected) {
      const fresh = orders.find(o => o.id === selected.id);
      if (fresh) setSelected(fresh);
      else setSelected(null);
    }
  }, [orders]);

  return (
    <>
      <PageHeader
        title="แพ็คสินค้า · Packing"
        subtitle="คิวรายการที่รอแพ็ค · เมื่อแพ็คเสร็จระบบจะตัดสต๊อคและซิงค์ Shopify อัตโนมัติ"
        actions={
          <>
            <button className="btn btn-ghost"><I.scan/> สแกนเริ่มแพ็ค</button>
            <button className="btn btn-primary"><I.download/> Export packing list</button>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard label="รอแพ็ค · Pending" value={counts.pending} unit="orders" accent="var(--neon-warn)" ico={<I.box/>}/>
        <StatCard label="กำลังแพ็ค · Packing" value={counts.packing} unit="orders" accent="var(--neon-1)" ico={<I.sparkle/>}/>
        <StatCard label="แพ็คเสร็จ · Packed" value={counts.packed} unit="orders" accent="var(--neon-3)" ico={<I.check/>}/>
        <StatCard label="ชิ้นรอแพ็ค" value={counts.pendingItems} unit="ชิ้น" accent="var(--neon-2)"/>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <div className="seg">
            {[
              { v: 'active',  l: `กำลังดำเนินการ (${counts.pending + counts.packing})` },
              { v: 'pending', l: `รอแพ็ค (${counts.pending})` },
              { v: 'packing', l: `กำลังแพ็ค (${counts.packing})` },
              { v: 'packed',  l: `เสร็จแล้ว (${counts.packed})` },
              { v: 'all',     l: 'ทั้งหมด' },
            ].map(o => (
              <button key={o.v} className={filter === o.v ? 'on' : ''} onClick={() => setFilter(o.v)}>{o.l}</button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-ico"><I.box/></div>
            <div>ไม่มีรายการในสถานะนี้</div>
          </div>
        </div>
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          {filtered.map(o => (
            <PackOrderCard
              key={o.id}
              order={o}
              onOpen={() => setSelected(o)}
              onStart={() => { window.PackingStore.startPacking(o.id); toast.info('เริ่มแพ็ค', `${o.ref}`); }}
              onFinish={() => {
                window.PackingStore.finishAll(o.id);
                toast.success('แพ็คเสร็จ · จ่ายออกสำเร็จ ✓', `${o.ref} · ตัดสต๊อค ${o.items.reduce((s,it)=>s+it.pickQty,0)} ชิ้น`);
                setTimeout(() => toast.info('Shopify auto-deduct', `อัพเดต ${o.items.length} SKUs`), 900);
              }}
              onCancel={() => { window.PackingStore.cancel(o.id); toast.warn('ยกเลิกใบแพ็ค', o.ref); }}
            />
          ))}
        </div>
      )}

      <PackDetailModal
        order={selected}
        onClose={() => setSelected(null)}
        onInc={(itemId, d) => window.PackingStore.incPack(selected.id, itemId, d)}
        onFinish={() => {
          window.PackingStore.finishAll(selected.id);
          toast.success('แพ็คเสร็จ · จ่ายออกสำเร็จ ✓', `${selected.ref}`);
          setTimeout(() => toast.info('Shopify auto-deduct', `อัพเดต ${selected.items.length} SKUs`), 900);
        }}
      />
    </>
  );
}

/* ============ Order card ============ */
function PackOrderCard({ order, onOpen, onStart, onFinish, onCancel }) {
  const totalQty = order.items.reduce((s, it) => s + it.pickQty, 0);
  const packedQty = order.items.reduce((s, it) => s + it.packed, 0);
  const pct = totalQty ? Math.round(packedQty / totalQty * 100) : 0;

  const statusInfo = {
    pending: { cls: 'badge-warn', label: '⏳ รอแพ็ค', tone: 'warn' },
    packing: { cls: 'badge-cyan', label: '📦 กำลังแพ็ค', tone: '' },
    packed:  { cls: 'badge-green', label: '✓ จ่ายออกสำเร็จ', tone: 'green' },
  }[order.status];

  const destLabel = { shopify: 'Shopify', popup: 'Pop-up Store', wholesale: 'Wholesale' }[order.destination] || order.destination;

  const created = new Date(order.createdAt);
  const ago = timeAgo(created);

  return (
    <div className="card hoverable" style={{ padding: 18, cursor: 'pointer' }} onClick={onOpen}>
      <div className="row-between" style={{ marginBottom: 12, gap: 14 }}>
        <div className="row" style={{ gap: 14, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            display: 'grid', placeItems: 'center',
            background: order.status === 'packed'
              ? 'color-mix(in oklab, var(--neon-3) 18%, var(--surface-2))'
              : order.status === 'packing'
              ? 'color-mix(in oklab, var(--neon-1) 18%, var(--surface-2))'
              : 'color-mix(in oklab, var(--neon-warn) 18%, var(--surface-2))',
            color: order.status === 'packed' ? 'var(--neon-3)'
                 : order.status === 'packing' ? 'var(--neon-1)'
                 : 'var(--neon-warn)',
            boxShadow: 'inset 0 0 0 1px currentColor',
          }}>
            {order.status === 'packed' ? <I.check/> : <I.box/>}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="row" style={{ gap: 10, marginBottom: 2 }}>
              <b style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>{order.ref}</b>
              <span className={"badge " + statusInfo.cls}><span className="dot-mark"/>{statusInfo.label}</span>
            </div>
            <div className="dim" style={{ fontSize: 12 }}>
              {destLabel} · สร้างเมื่อ {ago}
              {order.packer && <> · ผู้แพ็ค: <span style={{ color: 'var(--text-mid)' }}>{order.packer}</span></>}
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          {order.status === 'pending' && (
            <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); onStart(); }}>
              ▶ เริ่มแพ็ค
            </button>
          )}
          {order.status !== 'packed' && (
            <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); onFinish(); }}>
              <I.check/> แพ็คเสร็จทั้งหมด
            </button>
          )}
          {order.status === 'packed' && (
            <span className="dim mono" style={{ fontSize: 12 }}>
              {order.packedAt ? new Date(order.packedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          )}
        </div>
      </div>

      {/* item preview chips */}
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {order.items.slice(0, 4).map(it => (
          <div key={it.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 10px', borderRadius: 999,
            background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
            fontSize: 12,
          }}>
            <span className="mono dim" style={{ fontSize: 11 }}>{it.sku}</span>
            <span style={{ color: 'var(--text-mid)' }}>×</span>
            <b className="mono" style={{
              color: it.packed === it.pickQty ? 'var(--neon-3)' : it.packed > 0 ? 'var(--neon-1)' : 'var(--text)'
            }}>{it.packed}/{it.pickQty}</b>
          </div>
        ))}
        {order.items.length > 4 && <span className="dim" style={{ fontSize: 12, alignSelf: 'center' }}>+{order.items.length - 4} อื่น ๆ</span>}
      </div>

      <div className="row" style={{ gap: 12, alignItems: 'center' }}>
        <div className={"bar " + (statusInfo.tone || '')} style={{ flex: 1 }}>
          <span style={{ width: pct + '%' }}/>
        </div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--text-mid)', minWidth: 70, textAlign: 'right' }}>
          <b style={{ color: 'var(--text)' }}>{packedQty}</b>/{totalQty} ชิ้น · {pct}%
        </div>
      </div>
    </div>
  );
}

/* ============ Detail modal ============ */
function PackDetailModal({ order, onClose, onInc, onFinish }) {
  if (!order) return null;
  const totalQty = order.items.reduce((s, it) => s + it.pickQty, 0);
  const packedQty = order.items.reduce((s, it) => s + it.packed, 0);
  const allDone = packedQty === totalQty;
  return (
    <Modal open={true} onClose={onClose} title={`📦 แพ็คใบ ${order.ref}`} width={680}>
      <div className="stack" style={{ gap: 14 }}>
        <div className="row-between">
          <div className="dim" style={{ fontSize: 13 }}>
            {{ shopify: 'Shopify', popup: 'Pop-up Store', wholesale: 'Wholesale' }[order.destination] || order.destination}
            {order.packer && <> · ผู้แพ็ค <b style={{ color: 'var(--text)' }}>{order.packer}</b></>}
          </div>
          <span className={"badge " + (order.status === 'packed' ? 'badge-green' : order.status === 'packing' ? 'badge-cyan' : 'badge-warn')}>
            <span className="dot-mark"/>{order.status === 'packed' ? 'จ่ายออกสำเร็จ' : order.status === 'packing' ? 'กำลังแพ็ค' : 'รอแพ็ค'}
          </span>
        </div>

        <div className="bar green"><span style={{ width: (packedQty/totalQty*100) + '%' }}/></div>
        <div className="dim" style={{ fontSize: 12, marginTop: -8 }}>{packedQty}/{totalQty} ชิ้น · {Math.round(packedQty/totalQty*100)}%</div>

        <div className="stack" style={{ gap: 8 }}>
          {order.items.map(it => {
            const done = it.packed >= it.pickQty;
            return (
              <div key={it.id} className={"pick-item " + (done ? 'in-pick' : '')}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  border: '1.5px solid ' + (done ? 'var(--neon-3)' : 'var(--border)'),
                  background: done ? 'var(--neon-3)' : 'transparent',
                  color: '#001018',
                  display: 'grid', placeItems: 'center',
                  flexShrink: 0,
                }}>
                  {done && <I.check/>}
                </div>
                <div className="pi-info">
                  <div className="pi-name" style={{ textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.6 : 1 }}>{it.name}</div>
                  <div className="pi-meta">{it.sku} · {it.category}</div>
                </div>
                {order.status === 'packed' ? (
                  <span className="badge badge-green mono">{it.packed}/{it.pickQty}</span>
                ) : (
                  <div className="pick-stepper">
                    <button onClick={() => onInc(it.id, -1)} disabled={it.packed === 0}><I.minus/></button>
                    <input readOnly value={`${it.packed}/${it.pickQty}`} style={{ width: 56 }}/>
                    <button onClick={() => onInc(it.id, +1)} disabled={done}><I.plus/></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {order.status !== 'packed' && (
          <div className="row" style={{ gap: 10, paddingTop: 4 }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>บันทึก & ปิด</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => { onFinish(); onClose(); }}>
              <I.check/> {allDone ? 'ยืนยันจ่ายออก' : 'แพ็คเสร็จทั้งหมด & จ่ายออก'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function timeAgo(d) {
  const now = new Date('2026-05-11T12:00:00');
  const diff = (now - d) / 1000;
  if (diff < 60) return 'เมื่อสักครู่';
  if (diff < 3600) return `${Math.round(diff/60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.round(diff/3600)} ชม.ที่แล้ว`;
  return d.toLocaleDateString('th-TH');
}

Object.assign(window, { PackingPage, usePackingStore });
