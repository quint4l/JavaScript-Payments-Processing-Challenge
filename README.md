# JavaScript-Payments-Processing-Challenge
Procesa transacciones de un nodo Bitcoin, identifica los depósitos válidos y genera un reporte en consola y en HTML.

---

## Requisitos

- Node.js versión 14 o superior
- Sin dependencias externas — usa solo módulos nativos de Node

---

## Archivos del proyecto

```
proyecto/
├── transactions-1.json   ← datos crudos del nodo (consulta 1)
├── transactions-2.json   ← datos crudos del nodo (consulta 2)
├── process.js            ← procesa los JSON y genera deposits.json
├── summary.js            ← lee deposits.json, imprime en consola y genera summary.html
├── deposits.json         ← depósitos válidos persistidos (generado por process.js)
├── summary.html          ← reporte visual en el navegador (generado por summary.js)
└── WRITEUP.md            ← decisiones de diseño, preguntas y verificación
```

---

## Cómo ejecutarlo

**Paso 1 — Procesar las transacciones:**

```bash
node process.js
```

Lee `transactions-1.json` y `transactions-2.json`, filtra los depósitos válidos y los guarda en `deposits.json`.

**Paso 2 — Generar el reporte:**

```bash
node summary.js
```

Lee `deposits.json` e imprime el resumen en consola. También genera `summary.html` automáticamente con los mismos valores.

**Paso 3 — Ver el reporte visual (opcional):**

Abre `summary.html` directamente en el navegador:

- Mac: `open summary.html`
- Windows: `start summary.html`
- Linux: `xdg-open summary.html`

O doble clic en el archivo desde el explorador de archivos. No requiere servidor.

---

## Qué genera cada script

### `process.js` → `deposits.json`

Combina las transacciones de ambos archivos (316 en total), aplica los siguientes filtros y guarda solo las válidas:

| Filtro | Razón |
|---|---|
| `category === "receive"` | Descarta envíos salientes |
| `confirmations >= 6` | Mínimo requerido para considerar una tx confirmada |
| `amount > 0` | Descarta montos vacíos o negativos |
| `txid` único | Evita contar dos veces la misma transacción si aparece en ambos archivos |

Los montos se convierten a **satoshis** (enteros) para evitar errores de punto flotante en JavaScript.

Ejemplo de un depósito en `deposits.json`:

```json
{
  "txid": "d3ddca959ec3...",
  "address": "mutrAf4usv3HKNdpLwVD4ow2oLArL6Rez8",
  "customer": "Montgomery Scott",
  "amountSatoshis": 959358000,
  "confirmations": 9,
  "blocktime": 1627653148873
}
```

Si la dirección no pertenece a ningún cliente conocido, `customer` queda como `null`.

---

### `summary.js` → consola + `summary.html`

Lee `deposits.json`, agrupa por cliente y produce el siguiente reporte:

```
Deposited for Wesley Crusher:    count=35 sum=183.00000000
Deposited for Leonard McCoy:     count=18 sum=97.00000000
Deposited for Jonathan Archer:   count=19 sum=97.49000000
Deposited for Jadzia Dax:        count=15 sum=71.83000000
Deposited for Montgomery Scott:  count=27 sum=131.93253000
Deposited for James T. Kirk:     count=21 sum=1210.60058269
Deposited for Spock:             count=16 sum=827.64088710
Deposited without reference:     count=23 sum=1151.88738228

Smallest valid deposit:          0.00000010
Largest valid deposit:           99.61064066
```

Al mismo tiempo genera `summary.html` con los mismos datos en formato visual: tarjetas de métricas, barras proporcionales por cliente y los valores mínimo y máximo. El HTML siempre refleja los datos actuales de `deposits.json` — no tiene valores hardcodeados.

---

## Clientes conocidos

| Nombre | Dirección Bitcoin |
|---|---|
| Wesley Crusher | `mvd6qFeVkqH6MNAS2Y2cLifbdaX5XUkbZJ` |
| Leonard McCoy | `mmFFG4jqAtw9MoCC88hw5FNfreQWuEHADp` |
| Jonathan Archer | `mzzg8fvHXydKs8j9D2a8t7KpSXpGgAnk4n` |
| Jadzia Dax | `2N1SP7r92ZZJvYKG2oNtzPwYnzw62up7mTo` |
| Montgomery Scott | `mutrAf4usv3HKNdpLwVD4ow2oLArL6Rez8` |
| James T. Kirk | `miTHhiX3iFhVnAEecLjybxvV5g8mKYTtnM` |
| Spock | `mvcyJMiAcSXKAEsQxbW9TYZ369rsMG6rVV` |

Los depósitos a direcciones fuera de esta lista se contabilizan bajo `Deposited without reference`.

---

## Decisiones de diseño

Ver `WRITEUP.md` para el detalle completo. En resumen:

- Las confirmaciones negativas se rechazan — indican una reorganización del blockchain
- Se deduplica por `txid` para evitar acreditar dos veces la misma transacción
- Los depósitos a direcciones desconocidas no se descartan, se agrupan aparte
- Los montos se manejan en satoshis (enteros) para evitar errores de punto flotante