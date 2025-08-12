/**
 * Utilidades para construir HTML + CSS de impresión de tickets
 * Corregido para separar bien las columnas numéricas, ideal para tickets pequeños.
 */

export type FormatoImpresion = "58mm" | "80mm" | "a4"

export interface VentaItem {
  nombre: string
  cantidad: number
  precio: number
  subtotal: number
}

export interface MetodoPago {
  nombre: string
  efectivo?: number
  digital?: number
  vuelto?: number
}

export interface VentaPreview {
  numero: string
  fecha: string
  cliente: string
  dni?: string
  vendedor?: string
  items: VentaItem[]
  total: number
  metodo?: MetodoPago
}

export interface NegocioInfo {
  nombreNegocio: string
  direccion: string
  telefono: string
  email?: string
  ruc?: string
  moneda: string
}

export interface BoletaOpciones {
  mensajePie?: string
  mostrarLogo?: boolean
  logoUrl?: string
  formatoImpresion: FormatoImpresion
  altoContraste?: boolean
  anchoContenidoMm?: number
  alinearDecimales?: boolean
  mostrarBordeFilas?: boolean
  truncarNombreEn?: number
  separarColumnasNumericas?: boolean
  separadoresVerticales?: boolean
  anchoMinColNumerica?: number
  encabezadosCortos?: boolean
  factorFuente?: number
  modoCompacto?: boolean
  espacioColsNumericasMm?: number
  verticalSeparatorsSuaves?: boolean
}

/* --------------------------------- Helpers ---------------------------------- */

function formatMoney(v: any): string {
  const n = Number(v ?? 0)
  return isFinite(n) ? n.toFixed(2) : "0.00"
}

function formatCantidad(v: any): string {
  const n = Number(v ?? 0)
  return Number.isInteger(n) ? n.toString() : n.toFixed(2)
}

function splitNombreExtra(raw: string): { nombre: string; extra: string | null } {
  const match = raw.match(/^(.*?)\s*\[(.+)\]\s*$/)
  if (match) {
    return { nombre: match[1].trim(), extra: match[2].trim() }
  }
  return { nombre: raw.trim(), extra: null }
}

function splitDecimal(v: string): { ent: string; dec: string } {
  const [ent, dec] = v.split(".")
  return { ent, dec: dec ?? "00" }
}

/* --------------------------------- CSS Base ---------------------------------- */

export function getPrintCss(
  formato: FormatoImpresion,
  opts?: {
    altoContraste?: boolean
    anchoContenidoMm?: number
    mostrarBordeFilas?: boolean
    alinearDecimales?: boolean
    separarColumnasNumericas?: boolean
    separadoresVerticales?: boolean
    anchoMinColNumerica?: number
    factorFuente?: number
    modoCompacto?: boolean
    espacioColsNumericasMm?: number
    verticalSeparatorsSuaves?: boolean
  }
) {
  const {
    altoContraste,
    anchoContenidoMm,
    mostrarBordeFilas,
    alinearDecimales,
    separarColumnasNumericas,
    separadoresVerticales,
    anchoMinColNumerica,
    factorFuente = 0.7,
    modoCompacto,
    espacioColsNumericasMm = 3.2, // MÁS espacio por defecto (ajusta si necesitas más)
    verticalSeparatorsSuaves = false
  } = opts || {}

  // Base sizes
  const baseBody = 12
  const baseTicket = formato === "58mm" ? 11 : 12
  const baseItems = formato === "58mm" ? 11 : 11
  const baseProdExtra = 9
  const baseSmall = 9
  const baseTotales = 12
  const baseMeta = 11
  const baseMensajePie = 10

  const fs = (n: number) => (n * factorFuente).toFixed(3) + "px"

  const lineHeight = modoCompacto ? 1.15 : 1.25
  const lineHeightItems = modoCompacto ? 1.10 : 1.15
  const paddingFila = modoCompacto ? "0.42mm 0 0.22mm" : "0.6mm 0 0."
  const paddingHead = modoCompacto ? "0.55mm 0 0.75mm" : "0.8mm 0 1mm"
  const paddingMeta = modoCompacto ? "0.3mm 0" : "0.4mm 0"

  const widthMap: Record<FormatoImpresion, number> = {
    "58mm": 52,
    "80mm": 72,
    "a4": 180
  }
  const contentW = (anchoContenidoMm ?? widthMap[formato]) + "mm"
  const pageSize = formato === "a4" ? "210mm auto" : `${formato} auto`
  const filaBorde = mostrarBordeFilas ? "border-bottom:1px solid #000;" : ""

  const minNum = anchoMinColNumerica ?? 10
  const minNumPx = Math.round(minNum * 3.78)

  const decimalCss = alinearDecimales ? `
.ticket .num.dec-align {
  display:flex;
  justify-content:flex-end;
  font-variant-numeric: tabular-nums;
}
.ticket .num.dec-align .ent { text-align:right; padding-right:1px; }
.ticket .num.dec-align .sep { width:2px; text-align:center; display:inline-block; }
.ticket .num.dec-align .dec { text-align:left; padding-left:1px; min-width:16px; }
` : `
.ticket .num {
  font-variant-numeric: tabular-nums;
  text-align:right;
  white-space:nowrap;
}
`

  // === Separación entre columnas numéricas ===
  const sep = Math.max(0.6, espacioColsNumericasMm) // mm
  const sepRight = sep * 0.35
  const sepHeaderLeft = Math.max(0.4, sep - 0.3)

  const separacionNumericaCss = `
.ticket table.items thead th.cant,
.ticket table.items thead th.unit,
.ticket table.items thead th.total { white-space:nowrap; }

.ticket table.items tbody td.cant,
.ticket table.items tbody td.unit,
.ticket table.items tbody td.line-total {
  padding-left:${sep.toFixed(2)}mm;
  padding-right:${sepRight.toFixed(2)}mm;
  min-width:${minNumPx}px;
}

.ticket table.items thead th.cant,
.ticket table.items thead th.unit,
.ticket table.items thead th.total {
  padding-left:${sepHeaderLeft.toFixed(2)}mm;
  padding-right:${(sepRight * 0.6).toFixed(2)}mm;
}

${separarColumnasNumericas ? `
.ticket table.items td.cant::before {
  content:"";
  display:inline-block;
  width:0;
  margin-left:0;
}
` : ""}

${(separadoresVerticales || verticalSeparatorsSuaves) ? `
.ticket table.items thead th.cant,
.ticket table.items tbody td.cant { border-left:0.18mm solid #000; }
.ticket table.items thead th.unit,
.ticket table.items tbody td.unit { border-left:0.18mm solid #000; }
.ticket table.items thead th.total,
.ticket table.items tbody td.line-total { border-left:0.18mm solid #000; }
` : ""}
`

  const altoContrasteCss = altoContraste ? `
.ticket, .ticket * {
  color:#000 !important;
  background:transparent !important;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  text-shadow:none !important;
  box-shadow:none !important;
}
.ticket img.logo {
  filter: grayscale(100%) contrast(300%) brightness(0);
}
` : ""

  return `
@page { size:${pageSize}; margin:0; }

html, body {
  margin:0;
  padding:0;
  font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
  font-size:${fs(baseBody)};
  line-height:${lineHeight};
  background:#fff;
  color:#000;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.ticket {
  width:${contentW};
  margin:0 auto;
  box-sizing:border-box;
  padding:${modoCompacto ? "3mm 2.5mm 2.5mm" : "4mm 3mm 3mm"};
  overflow:hidden;
  word-break:break-word;
  font-size:${fs(baseTicket)};
}

.ticket img.logo {
  display:block;
  margin:0 auto 2mm;
  max-width:100%;
  height:auto;
}

.ticket table.meta {
  width:100%;
  border-collapse:collapse;
  font-size:${fs(baseMeta)};
  line-height:${lineHeight};
  margin-bottom:2mm;
}
.ticket table.meta td {
  padding:${paddingMeta};
  vertical-align:top;
}

.ticket table.items {
  width:100%;
  border-collapse:collapse;
  font-size:${fs(baseItems)};
  table-layout:fixed;
  margin-top:1mm;
}

/* Ajuste de anchos: Producto más angosto para dejar espacio a números */
.ticket table.items col.col-prod { width:44%; }
.ticket table.items col.col-cant { width:18%; }
.ticket table.items col.col-unit { width:18%; }
.ticket table.items col.col-total { width:20%; }

.ticket table.items thead th {
  padding:${paddingHead};
  font-weight:600;
  border-bottom:1px solid #000;
  text-align:left;
  font-size:${fs(baseItems)};
  line-height:1;
}

.ticket table.items thead th.cant,
.ticket table.items thead th.unit,
.ticket table.items thead th.total { text-align:right; }

.ticket table.items tbody tr.item-row td {
  padding:${paddingFila};
  vertical-align:top;
  line-height:${lineHeightItems};
  ${filaBorde}
  font-size:${fs(baseItems)};
}

.ticket table.items tbody tr.item-row:last-of-type td {
  ${filaBorde || "border-bottom:1px solid #000;"}
}

.ticket td.prod { padding-right:1mm; overflow:hidden; word-break:break-word; }

.ticket .prod-name { font-weight:500; }
.ticket .prod-extra {
  font-size:${fs(baseProdExtra)};
  line-height:1.05;
  margin-top:0.2mm;
  opacity:.95;
}

${decimalCss}
${separacionNumericaCss}

.ticket .totales-block {
  margin-top:2mm;
  font-size:${fs(baseTotales)};
  font-weight:600;
  text-align:right;
  border-top:1px solid #000;
  padding-top:1.2mm;
  width:100%;
}
.ticket .resumen-pago { margin-top:2mm; font-size:${fs(baseItems)}; line-height:${lineHeight}; }
.ticket .resumen-pago table { width:100%; border-collapse:collapse; font-size:${fs(baseItems)}; }
.ticket .resumen-pago td { padding:${modoCompacto ? "0.4mm 0" : "0.5mm 0"}; vertical-align:top; }
.ticket .resumen-pago td.label { width:55%; }
.ticket .resumen-pago td.val { text-align:right; font-variant-numeric: tabular-nums; }
.ticket .mensaje-pie {
  margin-top:3mm;
  text-align:center;
  font-size:${fs(baseMensajePie)};
  font-style:italic;
}
.ticket small { font-size:${fs(baseSmall)}; }

${altoContrasteCss}

@media screen {
  body { padding:12px; }
  .ticket { background:#fff; }
}
`
}

/* ----------------------------- buildTicketHTML ------------------------------- */

export function buildTicketHTML(
  venta: VentaPreview,
  negocio: NegocioInfo,
  opciones: BoletaOpciones
) {
  const {
    mensajePie,
    mostrarLogo = true,
    logoUrl = "/logo-said.png",
    alinearDecimales = false,
    truncarNombreEn,
    encabezadosCortos
  } = opciones

  const headCant = encabezadosCortos ? "Cant." : "Cant"
  const headPU = "P.U."
  const headTot = "Total"

  const lineasItems = (venta.items || []).map(it => {
    const { nombre, extra } = splitNombreExtra(it.nombre ?? "")
    const nombreMostrar = truncarNombreEn && nombre.length > truncarNombreEn
      ? nombre.slice(0, truncarNombreEn - 1) + "…"
      : nombre

    const cant = formatCantidad(it.cantidad)
    const unit = formatMoney(it.precio ?? 0)
    const subtotal = formatMoney(it.subtotal != null
      ? it.subtotal
      : (it.cantidad * (it.precio ?? 0))
    )

    let unitHTML = unit
    let subtotalHTML = subtotal
    if (alinearDecimales) {
      const u = splitDecimal(unit)
      const s = splitDecimal(subtotal)
      unitHTML = `
        <span class="num dec-align">
          <span class="ent">${u.ent}</span><span class="sep">.</span><span class="dec">${u.dec}</span>
        </span>
      `
      subtotalHTML = `
        <span class="num dec-align">
          <span class="ent">${s.ent}</span><span class="sep">.</span><span class="dec">${s.dec}</span>
        </span>
      `
    } else {
      unitHTML = `<span class="num">${unit}</span>`
      subtotalHTML = `<span class="num">${subtotal}</span>`
    }

    return `
      <tr class="item-row">
        <td class="prod">
          <div class="prod-name">${nombreMostrar}</div>
          ${extra ? `<div class="prod-extra">${extra}</div>` : ""}
        </td>
        <td class="cant num">${cant}</td>
        <td class="unit">${unitHTML}</td>
        <td class="line-total">${subtotalHTML}</td>
      </tr>
    `
  }).join("")

  const logoHTML = mostrarLogo
    ? `<img class="logo" src="${logoUrl}" alt="Logo" />`
    : ""

  const metodo: MetodoPago = venta.metodo ?? { nombre: "EFECTIVO" }
  const vuelto = metodo.vuelto != null ? formatMoney(metodo.vuelto) : null
  const totalFmt = formatMoney(venta.total)

  return `
    <div style="text-align:center; margin-bottom:2mm;">
      ${logoHTML}
      <div style="font-size:13px; font-weight:600;">${negocio.nombreNegocio}</div>
      <div style="font-size:10px;">${negocio.direccion}</div>
      <div style="font-size:10px;">Tel: ${negocio.telefono}</div>
      ${negocio.ruc ? `<div style="font-size:10px;">RUC: ${negocio.ruc}</div>` : ""}
    </div>

    <table class="meta">
      <tbody>
        <tr><td style="width:40%;">Boleta:</td><td>${venta.numero}</td></tr>
        <tr><td>Fecha:</td><td>${venta.fecha}</td></tr>
        <tr><td>Cliente:</td><td>${venta.cliente || "Público general"}</td></tr>
        ${venta.vendedor ? `<tr><td>Vendedor:</td><td>${venta.vendedor}</td></tr>` : ""}
      </tbody>
    </table>

    <table class="items">
      <colgroup>
        <col class="col-prod" />
        <col class="col-cant" />
        <col class="col-unit" />
        <col class="col-total" />
      </colgroup>
      <thead>
        <tr>
          <th class="prod">Producto</th>
          <th class="cant">${headCant}</th>
          <th class="unit">${headPU}</th>
          <th class="total">${headTot}</th>
        </tr>
      </thead>
      <tbody>
        ${lineasItems}
      </tbody>
    </table>

    <div class="totales-block">
      TOTAL: ${negocio.moneda}${totalFmt}
    </div>

    <div class="resumen-pago">
      <table>
        <tbody>
          <tr>
            <td class="label">Método de pago:</td>
            <td class="val">${(metodo.nombre || "EFECTIVO").toUpperCase()}</td>
          </tr>
          ${metodo.efectivo != null ? `
            <tr>
              <td class="label">Efectivo:</td>
              <td class="val">${negocio.moneda}${formatMoney(metodo.efectivo)}</td>
            </tr>` : ""
          }
          ${metodo.digital != null ? `
            <tr>
              <td class="label">Digital:</td>
              <td class="val">${negocio.moneda}${formatMoney(metodo.digital)}</td>
            </tr>` : ""
          }
          ${vuelto != null ? `
            <tr>
              <td class="label">Vuelto:</td>
              <td class="val">${negocio.moneda}${vuelto}</td>
            </tr>` : ""
          }
        </tbody>
      </table>
    </div>

    ${mensajePie ? `<div class="mensaje-pie">${mensajePie}</div>` : ""}
    <div style="text-align:center;margin-top:3mm;">
      <small></small>
    </div>
  `
}