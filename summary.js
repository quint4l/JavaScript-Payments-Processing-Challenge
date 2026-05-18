/**
 * summary.js
 * Lee deposits.json y:
 *  1. Imprime el resumen en consola
 *  2. Genera summary.html con los mismos valores
 *
 * Los montos se almacenan en satoshis (enteros) y se convierten
 * a BTC solo al momento de mostrarlos, evitando errores de punto flotante.
 */

const fs   = require("fs");
const path = require("path");

const CUSTOMER_ORDER = [
  "Wesley Crusher",
  "Leonard McCoy",
  "Jonathan Archer",
  "Jadzia Dax",
  "Montgomery Scott",
  "James T. Kirk",
  "Spock",
];

/** Convierte satoshis a BTC con 8 decimales */
function toBTC(satoshis) {
  return (satoshis / 1e8).toFixed(8);
}

/** Formatea BTC con comas para el HTML (ej: 1,210.60058269) */
function toBTCFormatted(satoshis) {
  const [int, dec] = toBTC(satoshis).split(".");
  return parseInt(int).toLocaleString("en-US") + "." + dec;
}

// ─── Calcular estadísticas ────────────────────────────────────────────────────

function calcStats(deposits) {
  const stats = {};
  for (const name of CUSTOMER_ORDER) {
    stats[name] = { count: 0, totalSatoshis: 0 };
  }
  stats["(sin referencia)"] = { count: 0, totalSatoshis: 0 };

  let minSatoshis = Infinity;
  let maxSatoshis = -Infinity;
  let totalClientSatoshis = 0;

  for (const dep of deposits) {
    const key = dep.customer || "(sin referencia)";
    stats[key].count += 1;
    stats[key].totalSatoshis += dep.amountSatoshis;

    if (dep.amountSatoshis < minSatoshis) minSatoshis = dep.amountSatoshis;
    if (dep.amountSatoshis > maxSatoshis) maxSatoshis = dep.amountSatoshis;

    if (dep.customer) totalClientSatoshis += dep.amountSatoshis;
  }

  return { stats, minSatoshis, maxSatoshis, totalClientSatoshis };
}

// ─── 1. Imprimir en consola ───────────────────────────────────────────────────

function printConsole(stats, minSatoshis, maxSatoshis, deposits) {
  console.log("\n════════════════════════════════════════════════════════");
  console.log("  RESUMEN DE DEPOSITOS");
  console.log("════════════════════════════════════════════════════════\n");

  const pad = (str) => str.padEnd(26);

  for (const name of CUSTOMER_ORDER) {
    const s = stats[name];
    console.log(
      `Deposited for ${pad(name + ":")} count=${s.count} sum=${toBTC(s.totalSatoshis)}`
    );
  }

  const noRef = stats["(sin referencia)"];
  console.log(
    `Deposited without reference:       count=${noRef.count} sum=${toBTC(noRef.totalSatoshis)}`
  );

  console.log("");
  if (deposits.length > 0) {
    console.log(`Smallest valid deposit:            ${toBTC(minSatoshis)}`);
    console.log(`Largest valid deposit:             ${toBTC(maxSatoshis)}`);
  } else {
    console.log("No hay depositos validos.");
  }

  console.log("\n════════════════════════════════════════════════════════\n");
}

// ─── 2. Generar HTML ──────────────────────────────────────────────────────────

function generateHTML(stats, minSatoshis, maxSatoshis, deposits, totalClientSatoshis) {
  const noRef     = stats["(sin referencia)"];
  const generated = new Date().toLocaleString("es-MX", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calcular el máximo para escalar las barras
  const maxSat = Math.max(
    ...CUSTOMER_ORDER.map(n => stats[n].totalSatoshis),
    noRef.totalSatoshis
  );

  // Genera una fila por cliente
  function customerRow(name) {
    const s   = stats[name];
    const pct = maxSat > 0 ? ((s.totalSatoshis / maxSat) * 100).toFixed(1) : 0;
    const btc = toBTCFormatted(s.totalSatoshis);
    const hasActivity = s.count > 0;
    
    return `
      <div class="customer-row" data-active="${hasActivity}">
        <div class="customer-info">
          <span class="customer-name">${name}</span>
          <span class="customer-badge">${s.count} transacciones</span>
        </div>
        <div class="customer-stats">
          <div class="progress-container">
            <div class="progress-bar" style="width:${pct}%"></div>
          </div>
          <span class="customer-amount">${btc} BTC</span>
        </div>
      </div>`;
  }

  const noRefPct = maxSat > 0 ? ((noRef.totalSatoshis / maxSat) * 100).toFixed(1) : 0;
  const activeClients = CUSTOMER_ORDER.filter(n => stats[n].count > 0).length;
  const totalTransactions = deposits.length;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Nomica · Resumen de Depositos Bitcoin</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
  <style>
    *, *::before, *::after { 
      box-sizing: border-box; 
      margin: 0; 
      padding: 0; 
    }
    
    :root {
      --primary: #0F172A;
      --primary-dark: #020617;
      --secondary: #3B82F6;
      --accent: #10B981;
      --accent-dark: #059669;
      --gray-50: #F9FAFB;
      --gray-100: #F3F4F6;
      --gray-200: #E5E7EB;
      --gray-300: #D1D5DB;
      --gray-400: #9CA3AF;
      --gray-500: #6B7280;
      --gray-600: #4B5563;
      --gray-700: #374151;
      --gray-800: #1F2937;
      --gray-900: #111827;
      --success: #10B981;
      --warning: #F59E0B;
      --error: #EF4444;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      --radius-sm: 0.5rem;
      --radius-md: 0.75rem;
      --radius-lg: 1rem;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: var(--gray-900);
      min-height: 100vh;
      padding: 1rem;
    }
    
    /* Container principal */
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1rem;
    }
    
    /* Header moderno */
    .header {
      background: white;
      border-radius: var(--radius-lg);
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-lg);
      background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
      border-bottom: 4px solid var(--secondary);
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--secondary), var(--accent));
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
    
    .logo-text h1 {
      font-size: 1.75rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.25rem;
    }
    
    .logo-text p {
      color: var(--gray-600);
      font-size: 0.875rem;
    }
    
    .stats-badge {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    .stat-pill {
      background: var(--gray-100);
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      color: var(--gray-700);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .stat-pill i {
      color: var(--accent);
    }
    
    /* Grid de metricas */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .metric-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-md);
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid var(--gray-200);
    }
    
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .metric-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    
    .metric-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .metric-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--secondary), var(--accent));
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.25rem;
    }
    
    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: 0.5rem;
    }
    
    .metric-sub {
      font-size: 0.75rem;
      color: var(--gray-500);
    }
    
    .metric-value.success {
      color: var(--success);
    }
    
    .metric-value.warning {
      color: var(--warning);
    }
    
    /* Tabla de clientes */
    .customers-section {
      background: white;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-md);
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--gray-200);
    }
    
    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--gray-900);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .section-title i {
      color: var(--accent);
    }
    
    .customer-row {
      padding: 1rem;
      border-bottom: 1px solid var(--gray-100);
      transition: background 0.2s;
    }
    
    .customer-row:hover {
      background: var(--gray-50);
    }
    
    .customer-row[data-active="false"] {
      opacity: 0.5;
    }
    
    .customer-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .customer-name {
      font-weight: 600;
      color: var(--gray-900);
      font-size: 1rem;
    }
    
    .customer-badge {
      font-size: 0.75rem;
      color: var(--gray-500);
      background: var(--gray-100);
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
    }
    
    .customer-stats {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    .progress-container {
      flex: 1;
      background: var(--gray-200);
      border-radius: 9999px;
      height: 8px;
      overflow: hidden;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--secondary), var(--accent));
      border-radius: 9999px;
      transition: width 0.3s ease;
    }
    
    .customer-amount {
      font-weight: 600;
      color: var(--gray-700);
      font-size: 0.875rem;
      min-width: 100px;
      text-align: right;
    }
    
    /* Sin referencia */
    .no-reference {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px dashed var(--gray-300);
    }
    
    /* Grid de min/max */
    .minmax-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .minmax-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .minmax-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    
    .minmax-icon.min {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      color: var(--error);
    }
    
    .minmax-icon.max {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      color: var(--success);
    }
    
    .minmax-content {
      flex: 1;
    }
    
    .minmax-label {
      font-size: 0.75rem;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    
    .minmax-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--gray-900);
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 2rem;
      color: white;
      font-size: 0.875rem;
    }
    
    .footer-content {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: var(--radius-lg);
      padding: 1rem;
      display: inline-block;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      body {
        padding: 0.5rem;
      }
      
      .container {
        padding: 0.5rem;
      }
      
      .header {
        padding: 1.5rem;
      }
      
      .header-content {
        flex-direction: column;
        text-align: center;
      }
      
      .logo-section {
        flex-direction: column;
        text-align: center;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .customers-section {
        padding: 1rem;
      }
      
      .customer-info {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .customer-stats {
        flex-direction: column;
        align-items: stretch;
      }
      
      .customer-amount {
        text-align: left;
      }
      
      .minmax-grid {
        grid-template-columns: 1fr;
      }
      
      .section-header {
        flex-direction: column;
      }
    }
    
    @media (max-width: 480px) {
      .metric-value {
        font-size: 1.5rem;
      }
      
      .logo-text h1 {
        font-size: 1.25rem;
      }
      
      .stat-pill {
        font-size: 0.75rem;
      }
    }
    
    /* Animaciones */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .metric-card, .customers-section, .minmax-card {
      animation: fadeInUp 0.5s ease-out;
    }
    
    .customer-row {
      animation: fadeInUp 0.3s ease-out;
      animation-fill-mode: backwards;
    }
    
    ${CUSTOMER_ORDER.map((_, index) => `.customer-row:nth-child(${index + 1}) { animation-delay: ${index * 0.05}s; }`).join('')}
  </style>
</head>
<body>
<div class="container">
  
  <!-- Header -->
  <div class="header">
    <div class="header-content">
      <div class="logo-section">
        <div class="logo-icon">
          <i class="ti ti-bitcoin"></i>
        </div>
        <div class="logo-text">
          <h1>Nomica · Bitcoin Treasury</h1>
          <p>Gestion inteligente de depositos en Bitcoin</p>
        </div>
      </div>
      <div class="stats-badge">
        <div class="stat-pill">
          <i class="ti ti-calendar"></i>
          <span>${generated}</span>
        </div>
        <div class="stat-pill">
          <i class="ti ti-refresh"></i>
          <span>Actualizacion en tiempo real</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Metricas principales -->
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-title">Depositos validos</span>
        <div class="metric-icon"><i class="ti ti-credit-card"></i></div>
      </div>
      <div class="metric-value">${totalTransactions}</div>
      <div class="metric-sub">transacciones confirmadas</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-title">Clientes activos</span>
        <div class="metric-icon"><i class="ti ti-users"></i></div>
      </div>
      <div class="metric-value">${activeClients}</div>
      <div class="metric-sub">de ${CUSTOMER_ORDER.length} registrados</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-title">Sin referencia</span>
        <div class="metric-icon"><i class="ti ti-help"></i></div>
      </div>
      <div class="metric-value warning">${noRef.count}</div>
      <div class="metric-sub">depositos no identificados</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-title">Total BTC (clientes)</span>
        <div class="metric-icon"><i class="ti ti-chart-bar"></i></div>
      </div>
      <div class="metric-value success">${toBTCFormatted(totalClientSatoshis)}</div>
      <div class="metric-sub">BTC acumulados</div>
    </div>
  </div>
  
  <!-- Depositos por cliente -->
  <div class="customers-section">
    <div class="section-header">
      <div class="section-title">
        <i class="ti ti-chart-pie"></i>
        <span>Distribucion de depositos por cliente</span>
      </div>
      <div class="stat-pill">
        <i class="ti ti-chart-line"></i>
        <span>Ordenado por antiguedad</span>
      </div>
    </div>
    ${CUSTOMER_ORDER.map(customerRow).join("")}
    
    <div class="no-reference">
      <div class="customer-row">
        <div class="customer-info">
          <span class="customer-name" style="color: var(--gray-500);">Sin referencia</span>
          <span class="customer-badge">${noRef.count} transacciones</span>
        </div>
        <div class="customer-stats">
          <div class="progress-container">
            <div class="progress-bar" style="width:${noRefPct}%; background: linear-gradient(90deg, var(--gray-400), var(--gray-500));"></div>
          </div>
          <span class="customer-amount">${toBTCFormatted(noRef.totalSatoshis)} BTC</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Deposito minimo y maximo -->
  <div class="minmax-grid">
    <div class="minmax-card">
      <div class="minmax-icon min">
        <i class="ti ti-arrow-narrow-down"></i>
      </div>
      <div class="minmax-content">
        <div class="minmax-label">Deposito mas pequeno</div>
        <div class="minmax-value">${toBTC(minSatoshis)} BTC</div>
      </div>
    </div>
    
    <div class="minmax-card">
      <div class="minmax-icon max">
        <i class="ti ti-arrow-narrow-up"></i>
      </div>
      <div class="minmax-content">
        <div class="minmax-label">Deposito mas grande</div>
        <div class="minmax-value">${toBTC(maxSatoshis)} BTC</div>
      </div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <div class="footer-content">
      <i class="ti ti-shield-check"></i>
      <span>Generado desde deposits.json · Filtro: category=receive, confirmaciones >= 6, amount > 0 · Datos seguros en la blockchain</span>
    </div>
  </div>
  
</div>
</body>
</html>`;

  return html;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function run() {
  const depositsFile = path.join(__dirname, "deposits.json");

  if (!fs.existsSync(depositsFile)) {
    console.error("No se encontro deposits.json. Ejecuta process.js primero.");
    process.exit(1);
  }

  const { deposits } = JSON.parse(fs.readFileSync(depositsFile, "utf8"));
  const { stats, minSatoshis, maxSatoshis, totalClientSatoshis } = calcStats(deposits);

  // 1. Consola
  printConsole(stats, minSatoshis, maxSatoshis, deposits);

  // 2. HTML
  const html = generateHTML(stats, minSatoshis, maxSatoshis, deposits, totalClientSatoshis);
  fs.writeFileSync(path.join(__dirname, "summary.html"), html, "utf8");
  console.log("summary.html generado correctamente");
  console.log("Visualiza el reporte en: " + path.join(__dirname, "summary.html"));
}

run();
