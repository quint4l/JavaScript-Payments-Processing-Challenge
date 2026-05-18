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
  console.log("  RESUMEN DE DEPÓSITOS");
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
    console.log("No hay depósitos válidos.");
  }

  console.log("\n════════════════════════════════════════════════════════\n");
}

// ─── 2. Generar HTML ──────────────────────────────────────────────────────────

function generateHTML(stats, minSatoshis, maxSatoshis, deposits, totalClientSatoshis) {
  const noRef     = stats["(sin referencia)"];
  const generated = new Date().toLocaleString("es-MX");

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
    return `
      <div class="row">
        <span class="name">${name}</span>
        <div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div>
        <span class="amount">${btc}</span>
        <span class="count">${s.count} txs</span>
      </div>`;
  }

  const noRefPct = maxSat > 0 ? ((noRef.totalSatoshis / maxSat) * 100).toFixed(1) : 0;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bitcoin Deposit Summary</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f5f4f0;
      color: #1a1a18;
      min-height: 100vh;
      padding: 2.5rem 1.5rem;
    }
    .page { max-width: 780px; margin: 0 auto; }
    .header { margin-bottom: 2rem; }
    .header h1 { font-size: 22px; font-weight: 500; letter-spacing: -0.3px; }
    .header p  { font-size: 13px; color: #5f5e5a; margin-top: 5px; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 1.5rem;
    }
    .metric {
      background: #fff;
      border: 0.5px solid rgba(0,0,0,0.12);
      border-radius: 12px;
      padding: 1rem 1.25rem;
    }
    .metric-label { font-size: 12px; color: #888780; margin-bottom: 6px; }
    .metric-value { font-size: 24px; font-weight: 500; }
    .metric-value.green { color: #0f6e56; }
    .card {
      background: #fff;
      border: 0.5px solid rgba(0,0,0,0.12);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;
    }
    .card-title {
      font-size: 11px;
      font-weight: 500;
      color: #888780;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin-bottom: 1.25rem;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 11px;
    }
    .row:last-child { margin-bottom: 0; }
    .name {
      font-size: 14px;
      min-width: 168px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .name.muted { color: #888780; }
    .bar-wrap {
      flex: 1;
      background: #f1efe8;
      border-radius: 4px;
      height: 7px;
      overflow: hidden;
    }
    .bar { height: 7px; border-radius: 4px; background: #1d9e75; }
    .bar.gray { background: #b4b2a9; }
    .amount {
      font-size: 13px;
      color: #5f5e5a;
      min-width: 130px;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .count {
      font-size: 12px;
      color: #b4b2a9;
      min-width: 44px;
      text-align: right;
    }
    .divider {
      border: none;
      border-top: 0.5px solid rgba(0,0,0,0.08);
      margin: 14px 0;
    }
    .min-max {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .mm-card {
      background: #fff;
      border: 0.5px solid rgba(0,0,0,0.12);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .mm-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .mm-icon.down { background: #e1f5ee; color: #0f6e56; }
    .mm-icon.up   { background: #faeeda; color: #854f0b; }
    .mm-label { font-size: 12px; color: #888780; margin-bottom: 3px; }
    .mm-val   { font-size: 15px; font-weight: 500; font-variant-numeric: tabular-nums; }
    .footer {
      margin-top: 2rem;
      font-size: 12px;
      color: #b4b2a9;
      text-align: center;
    }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <h1>Bitcoin deposit summary</h1>
    <p>${deposits.length} depósitos válidos &nbsp;·&nbsp; generado el ${generated}</p>
  </div>

  <div class="metrics">
    <div class="metric">
      <div class="metric-label">Depósitos válidos</div>
      <div class="metric-value">${deposits.length}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Clientes con depósitos</div>
      <div class="metric-value">${CUSTOMER_ORDER.filter(n => stats[n].count > 0).length}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Sin referencia</div>
      <div class="metric-value">${noRef.count}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Total BTC (clientes)</div>
      <div class="metric-value green">${toBTCFormatted(totalClientSatoshis)}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Depósitos por cliente</div>
    ${CUSTOMER_ORDER.map(customerRow).join("")}
    <hr class="divider" />
    <div class="row">
      <span class="name muted">Sin referencia</span>
      <div class="bar-wrap"><div class="bar gray" style="width:${noRefPct}%"></div></div>
      <span class="amount" style="color:#b4b2a9">${toBTCFormatted(noRef.totalSatoshis)}</span>
      <span class="count">${noRef.count} txs</span>
    </div>
  </div>

  <div class="min-max">
    <div class="mm-card">
      <div class="mm-icon down"><i class="ti ti-arrow-narrow-down" aria-hidden="true"></i></div>
      <div>
        <div class="mm-label">Depósito más pequeño</div>
        <div class="mm-val">${toBTC(minSatoshis)} BTC</div>
      </div>
    </div>
    <div class="mm-card">
      <div class="mm-icon up"><i class="ti ti-arrow-narrow-up" aria-hidden="true"></i></div>
      <div>
        <div class="mm-label">Depósito más grande</div>
        <div class="mm-val">${toBTC(maxSatoshis)} BTC</div>
      </div>
    </div>
  </div>

  <div class="footer">
    Generado desde deposits.json &nbsp;·&nbsp; Filtro: category=receive, confirmations ≥ 6, amount > 0
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
    console.error("No se encontró deposits.json. Ejecuta process.js primero.");
    process.exit(1);
  }

  const { deposits } = JSON.parse(fs.readFileSync(depositsFile, "utf8"));
  const { stats, minSatoshis, maxSatoshis, totalClientSatoshis } = calcStats(deposits);

  // 1. Consola
  printConsole(stats, minSatoshis, maxSatoshis, deposits);

  // 2. HTML
  const html = generateHTML(stats, minSatoshis, maxSatoshis, deposits, totalClientSatoshis);
  fs.writeFileSync(path.join(__dirname, "summary.html"), html, "utf8");
  console.log("summary.html generado\n");
}

run();
