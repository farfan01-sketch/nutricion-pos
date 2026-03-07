import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("pos.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT,
    brand TEXT,
    category TEXT,
    cost REAL,
    price_retail REAL,
    price_wholesale REAL,
    stock INTEGER DEFAULT 0,
    stock_min INTEGER DEFAULT 5,
    type TEXT -- supplement, clothing, accessory
  );

  CREATE TABLE IF NOT EXISTS variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    size TEXT,
    color TEXT,
    stock INTEGER DEFAULT 0,
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    type TEXT, -- retail, wholesale
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    contact TEXT,
    conditions TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    customer_id INTEGER,
    total REAL,
    subtotal REAL,
    discount REAL,
    payment_method TEXT, -- cash, transfer, card, mixed
    type TEXT, -- sale, layaway
    status TEXT, -- completed, pending, cancelled
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    variant_id INTEGER,
    quantity INTEGER,
    price REAL,
    cost REAL,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS layaways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    deposit REAL,
    balance REAL,
    status TEXT, -- pending, paid, cancelled
    FOREIGN KEY(sale_id) REFERENCES sales(id)
  );

  CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    variant_id INTEGER,
    type TEXT, -- in, out, waste, adjustment
    quantity INTEGER,
    reason TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER,
    total REAL,
    status TEXT, -- paid, credit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS accounts_payable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER,
    total REAL,
    balance REAL,
    due_date DATETIME,
    status TEXT, -- pending, paid
    FOREIGN KEY(purchase_id) REFERENCES purchases(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    amount REAL,
    method TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    initial_cash REAL,
    final_cash REAL,
    expected_cash REAL,
    sales_total REAL DEFAULT 0,
    expenses_total REAL DEFAULT 0,
    status TEXT DEFAULT 'open', -- open, closed
    notes TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed default admin and settings if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run("admin", "admin123", "admin", "Administrador Principal");
}

const settings = [
  ['business_name', 'Nutrición Deportiva del Istmo'],
  ['business_address', 'Calle Principal #123, Centro'],
  ['business_phone', '9711234567'],
  ['business_rfc', 'XAXX010101000'],
  ['ticket_footer', '¡Gracias por su compra!'],
  ['wholesale_min_qty', '3']
];

for (const [key, value] of settings) {
  const exists = db.prepare("SELECT * FROM settings WHERE key = ?").get(key);
  if (!exists) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(key, value);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, 
      (SELECT SUM(stock) FROM variants WHERE product_id = p.id) as variant_stock
      FROM products p
    `).all();
    res.json(products);
  });

  app.get("/api/products/:code", (req, res) => {
    const product = db.prepare("SELECT * FROM products WHERE code = ?").get(req.params.code);
    if (product) {
      const variants = db.prepare("SELECT * FROM variants WHERE product_id = ?").all(product.id);
      res.json({ ...product, variants });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  });

  app.post("/api/products", (req, res) => {
    const { code, name, brand, category, cost, price_retail, price_wholesale, stock, stock_min, type, variants } = req.body;
    const info = db.prepare(`
      INSERT INTO products (code, name, brand, category, cost, price_retail, price_wholesale, stock, stock_min, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code, name, brand, category, cost, price_retail, price_wholesale, stock, stock_min, type);
    
    if (variants && Array.isArray(variants)) {
      const insertVariant = db.prepare("INSERT INTO variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)");
      for (const v of variants) {
        insertVariant.run(info.lastInsertRowid, v.size, v.color, v.stock);
      }
    }
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { code, name, brand, category, cost, price_retail, price_wholesale, stock, stock_min, type } = req.body;
    db.prepare(`
      UPDATE products 
      SET code = ?, name = ?, brand = ?, category = ?, cost = ?, price_retail = ?, price_wholesale = ?, stock = ?, stock_min = ?, type = ?
      WHERE id = ?
    `).run(code, name, brand, category, cost, price_retail, price_wholesale, stock, stock_min, type, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    db.prepare("DELETE FROM variants WHERE product_id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/customers", (req, res) => {
    const customers = db.prepare("SELECT * FROM customers").all();
    res.json(customers);
  });

  app.post("/api/customers", (req, res) => {
    const { name, phone, type, notes } = req.body;
    const info = db.prepare("INSERT INTO customers (name, phone, type, notes) VALUES (?, ?, ?, ?)").run(name, phone, type, notes);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/customers/:id", (req, res) => {
    const { name, phone, type, notes } = req.body;
    db.prepare("UPDATE customers SET name = ?, phone = ?, type = ?, notes = ? WHERE id = ?").run(name, phone, type, notes, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/customers/:id", (req, res) => {
    db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/suppliers", (req, res) => {
    const suppliers = db.prepare("SELECT * FROM suppliers").all();
    res.json(suppliers);
  });

  app.post("/api/suppliers", (req, res) => {
    const { name, contact, conditions, notes } = req.body;
    const info = db.prepare("INSERT INTO suppliers (name, contact, conditions, notes) VALUES (?, ?, ?, ?)").run(name, contact, conditions, notes);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/suppliers/:id", (req, res) => {
    const { name, contact, conditions, notes } = req.body;
    db.prepare("UPDATE suppliers SET name = ?, contact = ?, conditions = ?, notes = ? WHERE id = ?").run(name, contact, conditions, notes, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/suppliers/:id", (req, res) => {
    db.prepare("DELETE FROM suppliers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/sales", (req, res) => {
    const { user_id, customer_id, total, subtotal, discount, payment_method, type, items, deposit } = req.body;
    
    const transaction = db.transaction(() => {
      const saleInfo = db.prepare(`
        INSERT INTO sales (user_id, customer_id, total, subtotal, discount, payment_method, type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user_id, customer_id, total, subtotal, discount, payment_method, type, type === 'layaway' ? 'pending' : 'completed');

      const saleId = saleInfo.lastInsertRowid;

      for (const item of items) {
        db.prepare(`
          INSERT INTO sale_items (sale_id, product_id, variant_id, quantity, price, cost)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(saleId, item.product_id, item.variant_id, item.quantity, item.price, item.cost);

        // Update stock
        if (item.variant_id) {
          db.prepare("UPDATE variants SET stock = stock - ? WHERE id = ?").run(item.quantity, item.variant_id);
        } else {
          db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(item.quantity, item.product_id);
        }

        // Log movement
        db.prepare(`
          INSERT INTO inventory_movements (product_id, variant_id, type, quantity, reason, user_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(item.product_id, item.variant_id, 'out', item.quantity, 'Venta #' + saleId, user_id);
      }

      if (type === 'layaway') {
        db.prepare(`
          INSERT INTO layaways (sale_id, deposit, balance, status)
          VALUES (?, ?, ?, ?)
        `).run(saleId, deposit, total - deposit, 'pending');
      }

      return saleId;
    });

    try {
      const saleId = transaction();
      res.json({ id: saleId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/expenses", (req, res) => {
    const expenses = db.prepare("SELECT * FROM expenses ORDER BY created_at DESC").all();
    res.json(expenses);
  });

  app.post("/api/expenses", (req, res) => {
    const { category, amount, method, note } = req.body;
    const info = db.prepare("INSERT INTO expenses (category, amount, method, note) VALUES (?, ?, ?, ?)").run(category, amount, method, note);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/expenses/:id", (req, res) => {
    db.prepare("DELETE FROM expenses WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/dashboard/stats", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const stats = {
      sales_today: db.prepare("SELECT SUM(total) as total FROM sales WHERE date(created_at) = ? AND status != 'cancelled'").get(today).total || 0,
      expenses_today: db.prepare("SELECT SUM(amount) as total FROM expenses WHERE date(created_at) = ?").get(today).total || 0,
      low_stock: db.prepare("SELECT COUNT(*) as count FROM products WHERE stock <= stock_min").get().count,
      pending_layaways: db.prepare("SELECT COUNT(*) as count FROM layaways WHERE status = 'pending'").get().count
    };
    res.json(stats);
  });

  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, username, role, name FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role, name } = req.body;
    const info = db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run(username, password, role, name);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/users/:id", (req, res) => {
    const { username, role, name } = req.body;
    db.prepare("UPDATE users SET username = ?, role = ?, name = ? WHERE id = ?").run(username, role, name, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/users/:id", (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    const rows = db.prepare("SELECT * FROM settings").all();
    const settings: Record<string, string> = {};
    rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  });

  app.post("/api/settings", (req, res) => {
    const settings = req.body;
    const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    
    const transaction = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        upsert.run(key, String(value));
      }
    });

    try {
      transaction(settings);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Shift Management
  app.get("/api/shifts", (req, res) => {
    const shifts = db.prepare(`
      SELECT s.*, u.name as user_name 
      FROM shifts s 
      JOIN users u ON s.user_id = u.id 
      ORDER BY s.start_time DESC
    `).all();
    res.json(shifts);
  });

  app.get("/api/shifts/current", (req, res) => {
    const shift = db.prepare(`
      SELECT s.*, u.name as user_name, u.role as user_role
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'open' 
      ORDER BY s.start_time DESC 
      LIMIT 1
    `).get();
    if (!shift) return res.json(null);

    // Calculate current totals for the shift
    const sales = db.prepare(`
      SELECT SUM(total) as total 
      FROM sales 
      WHERE created_at >= ? AND status != 'cancelled'
    `).get(shift.start_time).total || 0;

    const expenses = db.prepare(`
      SELECT SUM(amount) as total 
      FROM expenses 
      WHERE created_at >= ?
    `).get(shift.start_time).total || 0;

    res.json({ ...shift, sales_total: sales, expenses_total: expenses });
  });

  app.post("/api/shifts/open", (req, res) => {
    const { user_id, initial_cash } = req.body;
    
    // Check if there's already an open shift
    const existing = db.prepare("SELECT id FROM shifts WHERE status = 'open'").get();
    if (existing) return res.status(400).json({ error: "Ya hay un turno abierto" });

    const info = db.prepare(`
      INSERT INTO shifts (user_id, initial_cash, status) 
      VALUES (?, ?, 'open')
    `).run(user_id, initial_cash);
    
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/shifts/close", (req, res) => {
    const { id, final_cash, notes } = req.body;
    const shift = db.prepare("SELECT * FROM shifts WHERE id = ?").get(id);
    
    if (!shift || shift.status !== 'open') {
      return res.status(400).json({ error: "Turno no válido o ya cerrado" });
    }

    // Calculate final totals
    const sales = db.prepare(`
      SELECT SUM(total) as total 
      FROM sales 
      WHERE created_at >= ? AND status != 'cancelled'
    `).get(shift.start_time).total || 0;

    const expenses = db.prepare(`
      SELECT SUM(amount) as total 
      FROM expenses 
      WHERE created_at >= ?
    `).get(shift.start_time).total || 0;

    const expected_cash = shift.initial_cash + sales - expenses;

    db.prepare(`
      UPDATE shifts 
      SET end_time = CURRENT_TIMESTAMP, 
          final_cash = ?, 
          expected_cash = ?, 
          sales_total = ?, 
          expenses_total = ?, 
          status = 'closed', 
          notes = ? 
      WHERE id = ?
    `).run(final_cash, expected_cash, sales, expenses, notes, id);

    res.json({ success: true, expected_cash });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
