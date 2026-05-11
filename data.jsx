// data.jsx — live data from Google Sheets via Apps Script API

const API_URL = "https://script.google.com/macros/s/AKfycbyfp5o52iPCBLmAz8mLWzhUmZz-Q5g1VXTwYqH_UqBlEnDuDd7-Uk9bPCMx7YYTgd1hvQ/exec";

// ── parse helpers ────────────────────────────────────────────
function parseSizes(s) {
  if (!s) return [];
  return String(s).split(',').map(p => {
    const [size, qty] = p.split(':');
    return { size: size.trim(), qty: Number(qty) || 0 };
  });
}

function parseProduct(r) {
  const stockRAMA2 = Number(r.stockRAMA2) || 0;
  const stockMYCL  = Number(r.stockMYCL)  || 0;
  // total stock = sum of per-warehouse, or fall back to stock column
  const totalStock = (r.stockRAMA2 !== undefined || r.stockMYCL !== undefined)
    ? stockRAMA2 + stockMYCL
    : (Number(r.stock) || 0);
  return {
    id: String(r.id),
    sku: String(r.sku),
    name: String(r.name),
    category: String(r.category),
    stock: totalStock,
    stockRAMA2,
    stockMYCL,
    cost: Number(r.cost) || 0,
    price: Number(r.price) || 0,
    comparePrice: Number(r.comparePrice) || 0,
    reorderPoint: Number(r.reorderPoint) || 0,
    sizes: parseSizes(r.sizes),
    color: String(r.colors || ''),
    brand: 'Cuteboy',
    barcode: r.barcode ? String(r.barcode) : '',
    imageUrl: r.imageUrl ? String(r.imageUrl) : '',
    status: totalStock > 0 ? 'active' : 'out',
    shopify: 'synced',
  };
}

function parseMovement(r) {
  return {
    id: String(r.id),
    type: String(r.type),
    date: String(r.date),
    ref: String(r.ref),
    productId: String(r.productId),
    sku: String(r.sku),
    qty: Number(r.qty) || 0,
    wh: String(r.wh),
    zone: String(r.zone),
    user: String(r.user),
    note: String(r.note || ''),
  };
}

function parseWarehouse(r) {
  const zonesCodes = String(r.zones || '').split(',').map(z => z.trim()).filter(Boolean);
  return {
    id: String(r.id),
    code: String(r.code),
    name: String(r.name),
    addr: String(r.city || ''),
    capacity: Number(r.capacity) || 0,
    used: Number(r.used) || 0,
    zones: zonesCodes.map((code, i) => ({
      id: 'z-' + code,
      code,
      type: code,
      capacity: 500,
      used: 0,
    })),
  };
}

// ── mutable arrays (mutated in-place so module-scope destructuring in pages.jsx stays valid) ──
const WAREHOUSES = [
  { id: "wh-bkk", code: "BKK", name: "คลังพระราม 9 (HQ)", addr: "อาคาร G Tower, กรุงเทพฯ", capacity: 12000,
    zones: [
      { id: "z1", code: "A-01", type: "Top wear", capacity: 1200, used: 982 },
      { id: "z2", code: "A-02", type: "Bottom wear", capacity: 1000, used: 540 },
      { id: "z3", code: "B-01", type: "Outerwear", capacity: 800, used: 712 },
      { id: "z4", code: "B-02", type: "Accessories", capacity: 600, used: 188 },
      { id: "z5", code: "C-01", type: "Footwear", capacity: 900, used: 845 },
      { id: "z6", code: "RTN", type: "Returns", capacity: 200, used: 36 },
    ]
  },
  { id: "wh-cnx", code: "CNX", name: "คลังเชียงใหม่", addr: "นิคมฯ ลำพูน", capacity: 6000,
    zones: [
      { id: "zc1", code: "N-01", type: "Top wear", capacity: 800, used: 612 },
      { id: "zc2", code: "N-02", type: "Bottom wear", capacity: 700, used: 412 },
      { id: "zc3", code: "N-03", type: "Footwear", capacity: 500, used: 220 },
      { id: "zc4", code: "N-04", type: "Accessories", capacity: 300, used: 156 },
    ]
  },
  { id: "wh-store-01", code: "ST01", name: "Pop-up Siam Square", addr: "Siam Square Soi 7", capacity: 1200,
    zones: [
      { id: "zs1", code: "FLR", type: "Showroom", capacity: 600, used: 420 },
      { id: "zs2", code: "STK", type: "Backroom", capacity: 600, used: 312 },
    ]
  },
];

const PRODUCTS = [
  { id: "p001", sku: "TS-OVR-BLK", name: "Oversized Tee 'Neon Drift'", category: "Top wear",
    color: "Black", brand: "Cuteboy", price: 690, cost: 220, barcode: "8859123450012",
    stock: 432, reorderPoint: 80, status: "active", shopify: "synced",
    sizes: [{ size:"S", qty: 88}, {size:"M", qty: 142}, {size:"L", qty: 121}, {size:"XL", qty: 81}] },
  { id: "p002", sku: "TS-BOX-WHT", name: "Boxy Crop Tee 'Pulse'", category: "Top wear",
    color: "Off-white", brand: "Cuteboy", price: 590, cost: 190, barcode: "8859123450029",
    stock: 287, reorderPoint: 60, status: "active", shopify: "synced",
    sizes: [{ size:"S", qty: 74}, {size:"M", qty: 98}, {size:"L", qty: 78}, {size:"XL", qty: 37}] },
  { id: "p003", sku: "DN-CRG-IDG", name: "Cargo Denim Wide Leg", category: "Bottom wear",
    color: "Indigo wash", brand: "Cuteboy", price: 1490, cost: 520, barcode: "8859123450036",
    stock: 156, reorderPoint: 50, status: "active", shopify: "synced",
    sizes: [{ size:"28", qty: 32}, {size:"30", qty: 48}, {size:"32", qty: 41}, {size:"34", qty: 35}] },
  { id: "p004", sku: "JK-VAR-BWN", name: "Varsity Jacket 'CB Racing'", category: "Outerwear",
    color: "Brown/cream", brand: "Cuteboy", price: 2890, cost: 980, barcode: "8859123450043",
    stock: 42, reorderPoint: 25, status: "active", shopify: "syncing",
    sizes: [{ size:"S", qty: 8}, {size:"M", qty: 14}, {size:"L", qty: 12}, {size:"XL", qty: 8}] },
  { id: "p005", sku: "AC-CAP-NAV", name: "Mesh Trucker Cap", category: "Accessories",
    color: "Navy", brand: "Cuteboy", price: 490, cost: 145, barcode: "8859123450050",
    stock: 312, reorderPoint: 80, status: "active", shopify: "synced",
    sizes: [{ size:"FREE", qty: 312 }] },
  { id: "p006", sku: "SH-CHK-WHT", name: "Chunky Sneaker 'Spectra'", category: "Footwear",
    color: "White/pink", brand: "Cuteboy", price: 2490, cost: 880, barcode: "8859123450067",
    stock: 64, reorderPoint: 40, status: "active", shopify: "error",
    sizes: [{ size:"38", qty: 8}, {size:"39", qty: 14}, {size:"40", qty: 16}, {size:"41", qty: 14}, {size:"42", qty: 12}] },
  { id: "p007", sku: "TS-LNG-OLV", name: "Long-sleeve Tee 'Static'", category: "Top wear",
    color: "Olive", brand: "Cuteboy", price: 790, cost: 240, barcode: "8859123450074",
    stock: 18, reorderPoint: 50, status: "active", shopify: "synced",
    sizes: [{ size:"S", qty: 4}, {size:"M", qty: 6}, {size:"L", qty: 5}, {size:"XL", qty: 3}] },
  { id: "p008", sku: "DN-SLM-BLK", name: "Slim Tapered Denim", category: "Bottom wear",
    color: "Jet black", brand: "Cuteboy", price: 1390, cost: 470, barcode: "8859123450081",
    stock: 0, reorderPoint: 40, status: "out", shopify: "synced",
    sizes: [{ size:"28", qty: 0}, {size:"30", qty: 0}, {size:"32", qty: 0}, {size:"34", qty: 0}] },
  { id: "p009", sku: "JK-BMR-GRY", name: "Bomber Jacket 'Quiet Lab'", category: "Outerwear",
    color: "Graphite", brand: "Cuteboy", price: 2490, cost: 820, barcode: "8859123450098",
    stock: 78, reorderPoint: 30, status: "active", shopify: "synced",
    sizes: [{ size:"S", qty: 18}, {size:"M", qty: 24}, {size:"L", qty: 22}, {size:"XL", qty: 14}] },
  { id: "p010", sku: "AC-BAG-CRM", name: "Crossbody Bag 'Pocket'", category: "Accessories",
    color: "Cream", brand: "Cuteboy", price: 1290, cost: 410, barcode: "8859123450104",
    stock: 122, reorderPoint: 40, status: "active", shopify: "synced",
    sizes: [{ size:"FREE", qty: 122 }] },
  { id: "p011", sku: "SH-LFR-BLK", name: "Loafer 'Studio 7'", category: "Footwear",
    color: "Black patent", brand: "Cuteboy", price: 1990, cost: 720, barcode: "8859123450111",
    stock: 36, reorderPoint: 30, status: "active", shopify: "synced",
    sizes: [{ size:"38", qty: 6}, {size:"39", qty: 10}, {size:"40", qty: 10}, {size:"41", qty: 6}, {size:"42", qty: 4}] },
  { id: "p012", sku: "TS-GRP-PNK", name: "Graphic Tee 'CB Heart'", category: "Top wear",
    color: "Soft pink", brand: "Cuteboy", price: 690, cost: 215, barcode: "8859123450128",
    stock: 245, reorderPoint: 60, status: "active", shopify: "synced",
    sizes: [{ size:"S", qty: 56}, {size:"M", qty: 78}, {size:"L", qty: 68}, {size:"XL", qty: 43}] },
];

const MOVEMENTS = [
  { id: "m001", type: "IN",  date: "2026-05-11 09:12", ref: "PO-25004", productId: "p001", sku: "TS-OVR-BLK", qty: 120, wh: "BKK", zone: "A-01", user: "Khun Ploy", note: "Receipt from Supplier Cotton Co." },
  { id: "m002", type: "OUT", date: "2026-05-11 08:55", ref: "SO-SHP-9921", productId: "p006", sku: "SH-CHK-WHT", qty: -3, wh: "BKK", zone: "C-01", user: "Shopify auto", note: "Order #9921 from Shopify" },
  { id: "m003", type: "OUT", date: "2026-05-11 08:48", ref: "SO-SHP-9920", productId: "p001", sku: "TS-OVR-BLK", qty: -2, wh: "BKK", zone: "A-01", user: "Shopify auto", note: "Order #9920" },
  { id: "m004", type: "TX",  date: "2026-05-11 07:30", ref: "TX-114", productId: "p003", sku: "DN-CRG-IDG", qty: 40, wh: "CNX → BKK", zone: "N-02 → A-02", user: "Khun Boss", note: "Stock balancing" },
  { id: "m005", type: "ADJ", date: "2026-05-10 18:22", ref: "ADJ-58", productId: "p007", sku: "TS-LNG-OLV", qty: -4, wh: "BKK", zone: "A-01", user: "Khun Mint", note: "Cycle count variance" },
  { id: "m006", type: "IN",  date: "2026-05-10 16:14", ref: "PO-25003", productId: "p005", sku: "AC-CAP-NAV", qty: 200, wh: "BKK", zone: "B-02", user: "Khun Ploy", note: "Receipt confirmed" },
  { id: "m007", type: "OUT", date: "2026-05-10 15:09", ref: "SO-POP-441", productId: "p012", sku: "TS-GRP-PNK", qty: -6, wh: "ST01", zone: "FLR", user: "Khun June", note: "In-store sale" },
  { id: "m008", type: "IN",  date: "2026-05-10 11:48", ref: "PO-25002", productId: "p009", sku: "JK-BMR-GRY", qty: 60, wh: "BKK", zone: "B-01", user: "Khun Ploy", note: "Bomber restock" },
  { id: "m009", type: "OUT", date: "2026-05-10 10:33", ref: "SO-SHP-9911", productId: "p010", sku: "AC-BAG-CRM", qty: -1, wh: "BKK", zone: "B-02", user: "Shopify auto", note: "Order #9911" },
  { id: "m010", type: "TX",  date: "2026-05-09 17:22", ref: "TX-113", productId: "p002", sku: "TS-BOX-WHT", qty: 24, wh: "BKK → ST01", zone: "A-01 → FLR", user: "Khun June", note: "Replenish pop-up" },
  { id: "m011", type: "IN",  date: "2026-05-09 14:05", ref: "PO-25001", productId: "p004", sku: "JK-VAR-BWN", qty: 30, wh: "BKK", zone: "B-01", user: "Khun Ploy", note: "Limited drop" },
  { id: "m012", type: "OUT", date: "2026-05-09 12:18", ref: "SO-SHP-9902", productId: "p001", sku: "TS-OVR-BLK", qty: -4, wh: "BKK", zone: "A-01", user: "Shopify auto", note: "Order #9902" },
];

const SUPPLIERS = [
  { id: "sup-01", name: "Cotton Co. (Thailand)", code: "SUP-CTN" },
  { id: "sup-02", name: "Denim Studio Lab", code: "SUP-DNM" },
  { id: "sup-03", name: "Footworks Mfg.", code: "SUP-FTW" },
  { id: "sup-04", name: "OEM Korea Trims", code: "SUP-KOR" },
];

const TIMESERIES = (() => {
  const days = 14, arr = [];
  for (let i = 0; i < days; i++) {
    const inv = Math.round(80 + Math.sin(i / 2) * 50 + Math.random() * 40);
    const out = Math.round(60 + Math.cos(i / 1.7) * 30 + Math.random() * 35);
    const d = new Date(2026, 4, 11 - (days - 1 - i));
    arr.push({ day: d.toISOString().slice(5, 10), in: inv, out });
  }
  return arr;
})();

const CATEGORIES = ["Top wear", "Bottom wear", "Outerwear", "Footwear", "Accessories"];

window.INV_DATA = { WAREHOUSES, PRODUCTS, MOVEMENTS, SUPPLIERS, TIMESERIES, CATEGORIES };

// ── API fetch (mutates arrays in-place so module-level destructuring in pages.jsx stays valid) ──
window.fetchINVData = async function() {
  try {
    const [prods, movs, whs] = await Promise.all([
      fetch(API_URL + '?action=getProducts').then(r => r.json()),
      fetch(API_URL + '?action=getMovements').then(r => r.json()),
      fetch(API_URL + '?action=getWarehouses').then(r => r.json()),
    ]);

    if (Array.isArray(prods) && prods.length) {
      PRODUCTS.splice(0, PRODUCTS.length, ...prods.map(parseProduct));
    }
    if (Array.isArray(movs) && movs.length) {
      MOVEMENTS.splice(0, MOVEMENTS.length, ...movs.map(parseMovement));
    }
    if (Array.isArray(whs) && whs.length) {
      WAREHOUSES.splice(0, WAREHOUSES.length, ...whs.map(parseWarehouse));
    }
    return true;
  } catch (err) {
    console.warn('fetchINVData failed, using local data:', err);
    return false;
  }
};

// ── Write API helpers ──────────────────────────────────────────
window.API = {
  _post: async function(body) {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.json();
  },

  addMovement: async function(data) {
    const result = await window.API._post({ action: 'addMovement', data });
    if (result.success) {
      // optimistic local update
      MOVEMENTS.unshift({
        id: result.id,
        type: data.type,
        date: data.date || new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 16),
        ref: data.ref,
        productId: data.productId,
        sku: data.sku,
        qty: data.qty,
        wh: data.wh,
        zone: data.zone,
        user: data.user,
        note: data.note || '',
      });
    }
    return result;
  },

  updateProductStock: async function(productId, delta) {
    const result = await window.API._post({ action: 'updateProductStock', productId, delta });
    if (result.success) {
      // optimistic local update
      const p = PRODUCTS.find(p => p.id === productId);
      if (p) p.stock = result.newStock;
    }
    return result;
  },

  addPackingOrder: async function(data) {
    return window.API._post({ action: 'addPackingOrder', data });
  },

  updatePackingOrderStatus: async function(id, status) {
    return window.API._post({ action: 'updatePackingOrderStatus', id, status });
  },
};

window.fmtNum = (n) => new Intl.NumberFormat("en-US").format(n);
window.fmtTHB = (n) => "฿" + new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);
window.shortDate = (s) => String(s).slice(5).replace(" ", " · ");
