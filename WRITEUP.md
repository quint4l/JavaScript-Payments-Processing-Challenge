# WRITEUP

## Cómo ejecutarlo

node process.js   # procesa los JSON y genera deposits.json
node summary.js   # lee deposits.json e imprime el reporte


Requiere Node.js (cualquier versión >= 14). Sin dependencias externas.

---

## 1. Tres decisiones de criterio

### 1.1 — Confirmaciones negativas se rechazan

En los archivos hay transacciones con `confirmations: -4` y `confirmations: -5`.
Una confirmación negativa indica que la transacción está en una bifurcación
del blockchain que fue descartada (reorganización de cadena). Es decir, la
transacción nunca se confirmó realmente. La condición `confirmations >= 6`
las rechaza naturalmente, pero vale la pena documentarlo: no son simplemente
"poco confirmadas", son activamente inválidas.

### 1.2 — Deduplicación por `txid` entre archivos

Los dos archivos representan dos consultas al nodo en momentos distintos.
Una transacción puede aparecer en ambas (por ejemplo, en la primera consulta
tenía 4 confirmaciones y en la segunda ya tenía 8). Si no se deduplica por
`txid`, se contaría dos veces el mismo depósito, lo que abonaría dinero de
más al cliente.

Decisión: uso la **primera aparición** de cada `txid`. No importa cuál
archivo llega primero al array, la primera vez que veo un `txid` lo proceso;
si aparece de nuevo, lo ignoro.

### 1.3 — Depósitos a direcciones desconocidas siguen siendo válidos

Un depósito que cumple todas las condiciones técnicas (≥6 confirmaciones,
`category=receive`, `amount>0`) es financieramente real aunque la dirección
destino no esté registrada en el sistema. No es un error del nodo ni una
transacción inválida: simplemente no hay cliente al que acreditarlo.

Decisión: los cuento y sumo bajo `"Deposited without reference"` en lugar
de descartarlos. Si los ignorara, perdería visibilidad sobre fondos que
llegaron a billeteras propias sin dueño conocido.

---

## 2. Una pregunta para el equipo

**¿Qué debe pasar si el script se ejecuta múltiples veces?**

Actualmente `deposits.json` se sobreescribe completo en cada ejecución,
lo que es seguro si los archivos de entrada no cambian. Pero en producción,
donde el nodo se consulta cada pocos minutos y los archivos de entrada son
siempre nuevos, necesitaría saber:

- ¿Debo *acumular* depósitos históricos en la base de datos, o cada ejecución
  es un reporte fresco sobre los archivos del momento?
- ¿Existe un mecanismo central de `txid` ya procesados para garantizar que
  nunca se acredite dos veces aunque el mismo archivo se procese dos veces?

La respuesta cambia bastante la arquitectura: acumulación necesita una base
de datos con `txid` como clave única; reporte fresco puede ser solo JSON.

---

## 3. Cómo sé que el código es correcto

**Lo que verifiqué:**

- Conté manualmente cuántas transacciones hay en cada archivo (150 aprox. cada uno,
  316 en total) y el script reporta exactamente eso.
- Busqué manualmente en el JSON transacciones con `confirmations < 6` y verifiqué
  que no aparecen en `deposits.json`.
- Verifiqué que las transacciones `"send"` (montos negativos) no están en el resultado.
- Busqué un `txid` que aparece en ambos archivos y confirmé que solo aparece
  una vez en `deposits.json`.
- Revisé que el depósito más pequeño (`0.00000010`) es un valor real en los datos,
  no un artefacto de redondeo.

**Lo que podría estar mal:**

- La conversión a satoshis usa `Math.round(btc * 1e8)`. Para valores como
  `9.19` esto funciona bien, pero si algún monto tuviera más de 8 decimales
  significativos en el JSON (lo cual no ocurre en estos archivos), podría haber
  un error de un satoshi. En producción usaría una librería como `bignumber.js`.
- No valido el esquema del JSON de entrada. Si el nodo devolviera un campo
  faltante o un tipo inesperado, el script fallaría silenciosamente en lugar
  de lanzar un error claro.
- El criterio de "dirección desconocida = sin referencia" asume que el mapa
  de clientes es la fuente de verdad. Si hay clientes nuevos no listados aquí,
  sus depósitos irán al bucket incorrecto.
- **Las transacciones rechazadas no se persisten en ningún lado.** Esto es una
  limitación importante: una transacción con 4 confirmaciones hoy podría tener
  6 en la próxima consulta y ser válida, pero el sistema actual la descarta sin
  dejar rastro. Lo mismo aplica para confirmaciones negativas (posible intento
  de fraude o reorganización del blockchain) y depósitos a direcciones no
  registradas con montos inusualmente altos. En producción generaría un segundo
  archivo `rejected.json` con cada transacción descartada y el motivo
  (`"confirmations < 6"`, `"category != receive"`, `"duplicate txid"`, etc.)
  para tener trazabilidad completa y poder auditarlas.