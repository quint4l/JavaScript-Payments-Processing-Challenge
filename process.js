/**
 * process.js
 * Lee transactions-1.json y transactions-2.json, filtra los depósitos válidos
 * y los guarda en deposits.json
 *
 * Reglas de validación:
 *  1. category === "receive"
 *  2. confirmations >= 6  (negativas también se rechazan)
 *  3. amount > 0
 *  4. txid único — si la misma tx aparece en ambos archivos, se toma una sola vez
 */

const fs = require("fs");
const path = require("path");

// ─── Direcciones conocidas ────────────────────────────────────────────────────
const KNOWN_CUSTOMERS = {
  mvd6qFeVkqH6MNAS2Y2cLifbdaX5XUkbZJ: "Wesley Crusher",
  mmFFG4jqAtw9MoCC88hw5FNfreQWuEHADp: "Leonard McCoy",
  mzzg8fvHXydKs8j9D2a8t7KpSXpGgAnk4n: "Jonathan Archer",
  "2N1SP7r92ZZJvYKG2oNtzPwYnzw62up7mTo": "Jadzia Dax",
  mutrAf4usv3HKNdpLwVD4ow2oLArL6Rez8: "Montgomery Scott",
  miTHhiX3iFhVnAEecLjybxvV5g8mKYTtnM: "James T. Kirk",
  mvcyJMiAcSXKAEsQxbW9TYZ369rsMG6rVV: "Spock",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convierte BTC a satoshis (entero) para evitar errores de punto flotante */
function toSatoshis(btc) {
  return Math.round(btc * 1e8);
}

/** Carga y parsea un archivo JSON */
function loadJSON(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

// ─── Lógica principal ─────────────────────────────────────────────────────────

function processDeposits() {
  // 1. Cargar ambos archivos
  const file1 = loadJSON(path.join(__dirname, "transactions-1.json"));
  const file2 = loadJSON(path.join(__dirname, "transactions-2.json"));

  const allTxs = [...file1.transactions, ...file2.transactions];
  console.log(`Total de transacciones cargadas: ${allTxs.length}`);

  // 2. Filtrar depósitos válidos con deduplicación por txid
  const seenTxids = new Set();
  const validDeposits = [];

  for (const tx of allTxs) {
    // Deduplicar
    if (seenTxids.has(tx.txid)) continue;
    seenTxids.add(tx.txid);

    // Filtros de validación
    if (tx.category !== "receive") continue;
    if (tx.confirmations < 6) continue;   // También rechaza confirmaciones negativas
    if (tx.amount <= 0) continue;

    validDeposits.push({
      txid: tx.txid,
      address: tx.address,
      customer: KNOWN_CUSTOMERS[tx.address] || null,
      amountSatoshis: toSatoshis(tx.amount),
      confirmations: tx.confirmations,
      blocktime: tx.blocktime,
    });
  }

  console.log(`Depósitos válidos encontrados: ${validDeposits.length}`);

  // 3. Guardar en deposits.json
  const output = {
    processedAt: new Date().toISOString(),
    count: validDeposits.length,
    deposits: validDeposits,
  };

  fs.writeFileSync(
    path.join(__dirname, "deposits.json"),
    JSON.stringify(output, null, 2),
    "utf8"
  );

  console.log("Guardado en deposits.json");
}

processDeposits();