import React from "react"

interface ConfiguracionGeneral {
  nombreNegocio: string
  direccion: string
  telefono: string
  email?: string
  ruc: string
  moneda: string
}

interface ConfiguracionBoleta {
  serieBoleta: string
  mensajePie: string
  mostrarLogo: boolean
  imprimirAutomatico: boolean
  formatoImpresion: "80mm" | "58mm" | "a4"
}

interface TicketPrintProps {
  venta: any
  configuracionGeneral: ConfiguracionGeneral
  configuracionBoleta: ConfiguracionBoleta
}

export default function TicketPrint({
  venta,
  configuracionGeneral,
  configuracionBoleta,
}: TicketPrintProps) {
  const width =
    configuracionBoleta.formatoImpresion === "a4"
      ? "210mm"
      : configuracionBoleta.formatoImpresion === "80mm"
      ? "80mm"
      : "58mm"
  const fontSize = 15
  const totalFontSize = 18

  // Calcula el vuelto (si existe)
  let vuelto = 0
  if (venta.metodoPago) {
    const efectivo = venta.metodoPago.efectivo || 0
    const yape = venta.metodoPago.yape || 0
    const pagado = efectivo + yape
    vuelto = pagado > venta.total ? pagado - venta.total : 0
  }

  return (
    <div
      className="ticket-print"
      style={{
        background: "#fff",
        fontFamily: "monospace",
        fontSize: `${fontSize}px`,
        width,
        minWidth: width,
        maxWidth: width,
        margin: "4px auto",
        padding: 0,
        boxShadow: "none",
        border: "5px solid #eee", // margen visual MUY delgado
        borderRadius: 3,
        display: "block",
      }}
    >
      <div style={{ width: "99%", margin: 0, padding: "8px 0" }}>
        {/* HEADER */}
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: `${totalFontSize}px`, letterSpacing: "1px" }}>
          {configuracionBoleta.mostrarLogo && null}
          {configuracionGeneral.nombreNegocio}
        </div>
        <div style={{ textAlign: "center" }}>RUC: {configuracionGeneral.ruc}</div>
        <div style={{ textAlign: "center" }}>{configuracionGeneral.direccion}</div>
        <div style={{ textAlign: "center", marginBottom: 4 }}>Tel: {configuracionGeneral.telefono}</div>
        <hr style={{ margin: "8px 0" }} />

        {/* DATOS DE VENTA */}
        <div style={{ marginBottom: 3 }}>
          <div>Fecha: <span style={{ float: "right" }}>{venta.fecha || new Date().toLocaleString()}</span></div>
          <div>Cliente: <span style={{ float: "right" }}>{venta.nombreCliente}</span></div>
          <div>DNI: <span style={{ float: "right" }}>{venta.dniCliente}</span></div>
          {venta.nombreVendedor && (
            <div>Trabajador: <span style={{ float: "right" }}>{venta.nombreVendedor}</span></div>
          )}
        </div>
        <hr style={{ margin: "8px 0" }} />

        {/* TABLA DE PRODUCTOS */}
        <table style={{ width: "100%", fontSize: `${fontSize}px`, marginBottom: 6 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Producto</th>
              <th style={{ textAlign: "center", width: 35 }}>Cant</th>
              <th style={{ textAlign: "right", width: 55 }}>P.Unit</th>
              <th style={{ textAlign: "right", width: 55 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {venta.productos.map((item: any, i: number) => (
              <tr key={i}>
                <td>{item.nombre}</td>
                <td style={{ textAlign: "center" }}>{item.cantidad}</td>
                <td style={{ textAlign: "right" }}>{configuracionGeneral.moneda} {item.precioVentaUnd.toFixed(2)}</td>
                <td style={{ textAlign: "right" }}>{configuracionGeneral.moneda} {(item.cantidad * item.precioVentaUnd).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr style={{ margin: "8px 0" }} />

        {/* TOTAL */}
        <div style={{ fontWeight: "bold", textAlign: "right", fontSize: `${totalFontSize}px`, marginBottom: 5 }}>
          TOTAL: {configuracionGeneral.moneda} {venta.total.toFixed(2)}
        </div>

        {/* MÉTODO DE PAGO Y VUELTO */}
        {venta.metodoPago && (
          <div style={{ textAlign: "center", marginBottom: 5 }}>
            Método de pago: <b>{venta.metodoPago.nombre}</b>
            {venta.metodoPago.efectivo > 0 && (
              <div>Efectivo: {configuracionGeneral.moneda} {venta.metodoPago.efectivo.toFixed(2)}</div>
            )}
            {venta.metodoPago.yape > 0 && (
              <div>Yape/Plin: {configuracionGeneral.moneda} {venta.metodoPago.yape.toFixed(2)}</div>
            )}
            {vuelto > 0 && (
              <div style={{ color: "#16a34a", fontWeight: 600 }}>
                Vuelto: {configuracionGeneral.moneda} {vuelto.toFixed(2)}
              </div>
            )}
          </div>
        )}

        <hr style={{ margin: "8px 0" }} />

        {/* MENSAJE DE PIE */}
        {configuracionBoleta.mensajePie && (
          <div style={{
            textAlign: "center",
            margin: "14px 0 0 0",
            whiteSpace: "pre-line"
          }}>
            {configuracionBoleta.mensajePie}
          </div>
        )}
      </div>
    </div>
  )
}