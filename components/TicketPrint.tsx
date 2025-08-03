"use client"
import React from "react"
import { formatSoles } from "../lib/utils";

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

interface ProductoCarrito {
  nombre: string
  cantidadBlister: number
  cantidadUnidadesBlister?: number
  precioVentaBlister?: number
  cantidadUnidad: number
  precioVentaUnd: number
  descuento?: number
  subtotal: number
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
  const totalFontSize = 19

  // Calcula el vuelto (si existe)
  let vuelto = 0
  if (venta.metodoPago) {
    const efectivo = venta.metodoPago.efectivo || 0
    const digital = venta.metodoPago.digital || 0
    const pagado = efectivo + digital
    vuelto = pagado > venta.total ? pagado - venta.total : 0
  }

  return (
    <div
      className="ticket-print"
      style={{
        background: "#fff",
        fontFamily: "'Segoe UI', 'monospace', 'Arial'",
        fontSize: `${fontSize}px`,
        width,
        minWidth: width,
        maxWidth: width,
        margin: "8px auto",
        padding: 0,
        boxShadow: "0 0 10px #eee",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        display: "block",
      }}
    >
      <div style={{ width: "98%", margin: "0 auto", padding: "12px 0" }}>
        {/* HEADER */}
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: `${totalFontSize}px`, letterSpacing: "1px", marginBottom: 4 }}>
          {configuracionBoleta.mostrarLogo && (
            <img
              src="/favicon.png"
              alt="Logo"
              style={{ width: 48, height: 48, marginBottom: 2, display: "block", marginLeft: "auto", marginRight: "auto" }}
            />
          )}
          {configuracionGeneral.nombreNegocio}
        </div>
        <div style={{ textAlign: "center", fontSize: "13px" }}>RUC: {configuracionGeneral.ruc}</div>
        <div style={{ textAlign: "center", fontSize: "13px" }}>{configuracionGeneral.direccion}</div>
        <div style={{ textAlign: "center", fontSize: "13px", marginBottom: 2 }}>Tel: {configuracionGeneral.telefono}</div>
        {configuracionGeneral.email && <div style={{ textAlign: "center", fontSize: "12px" }}>{configuracionGeneral.email}</div>}
        <hr style={{ margin: "10px 0" }} />

        {/* DATOS DE VENTA */}
        <div style={{ marginBottom: 5, fontSize: "14px" }}>
          <div>
            <b>Boleta:</b> <span style={{ float: "right" }}>{venta.numero}</span>
          </div>
          <div>
            <b>Fecha:</b> <span style={{ float: "right" }}>{venta.fecha || new Date().toLocaleString()}</span>
          </div>
          <div>
            <b>Cliente:</b> <span style={{ float: "right" }}>{venta.nombreCliente}</span>
          </div>
          <div>
            <b>DNI:</b> <span style={{ float: "right" }}>{venta.dniCliente}</span>
          </div>
          {venta.nombreVendedor && (
            <div>
              <b>Trabajador:</b> <span style={{ float: "right" }}>{venta.nombreVendedor}</span>
            </div>
          )}
        </div>
        <hr style={{ margin: "8px 0" }} />

        {/* TABLA DE PRODUCTOS */}
        <table style={{ width: "100%", fontSize: `${fontSize}px`, marginBottom: 8, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f4f4f4" }}>
              <th style={{ textAlign: "left", padding: "4px 2px" }}>Producto</th>
              <th style={{ textAlign: "center", width: 40, padding: "4px 2px" }}>Cant</th>
              <th style={{ textAlign: "right", width: 65, padding: "4px 2px" }}>P.Unit</th>
              <th style={{ textAlign: "right", width: 65, padding: "4px 2px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {venta.productos.map((item: ProductoCarrito, i: number) => (
              <React.Fragment key={i}>
                {item.cantidadBlister > 0 && item.precioVentaBlister && (
                  <tr>
                    <td style={{ padding: "2px 2px" }}>
                      {item.nombre} <span style={{ color: "#444", fontSize: "12px" }}>[Blister]</span>
                    </td>
                    <td style={{ textAlign: "center", padding: "2px 2px" }}>
                      {item.cantidadBlister} x {item.cantidadUnidadesBlister ?? "?"}
                    </td>
                    <td style={{ textAlign: "right", padding: "2px 2px" }}>
                      {formatSoles(item.precioVentaBlister)}
                    </td>
                    <td style={{ textAlign: "right", padding: "2px 2px" }}>
                      {formatSoles(Number(item.precioVentaBlister) * Number(item.cantidadBlister))}
                    </td>
                  </tr>
                )}
                {item.cantidadUnidad > 0 && (
                  <tr>
                    <td style={{ padding: "2px 2px" }}>
                      {item.nombre} <span style={{ color: "#444", fontSize: "12px" }}>[Unidad]</span>
                    </td>
                    <td style={{ textAlign: "center", padding: "2px 2px" }}>
                      {item.cantidadUnidad}
                    </td>
                    <td style={{ textAlign: "right", padding: "2px 2px" }}>
                      {formatSoles(item.precioVentaUnd)}
                    </td>
                    <td style={{ textAlign: "right", padding: "2px 2px" }}>
                      {formatSoles(
                        Number(item.precioVentaUnd) * Number(item.cantidadUnidad)
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <hr style={{ margin: "8px 0" }} />

        {/* TOTAL */}
        <div
          style={{
            fontWeight: "bold",
            textAlign: "right",
            fontSize: `${totalFontSize}px`,
            marginBottom: 8,
          }}
        >
          TOTAL: {formatSoles(venta.total)}
        </div>

        {/* MÉTODO DE PAGO Y VUELTO */}
        {venta.metodoPago && (
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            Método de pago: <b>{venta.metodoPago.nombre}</b>
            {venta.metodoPago.efectivo > 0 && (
              <div>Efectivo: {formatSoles(venta.metodoPago.efectivo)}</div>
            )}
            {venta.metodoPago.digital > 0 && (
              <div>Yape/Plin: {formatSoles(venta.metodoPago.digital)}</div>
            )}
            {vuelto > 0 && (
              <div style={{ color: "#16a34a", fontWeight: 600 }}>
                Vuelto: {formatSoles(vuelto)}
              </div>
            )}
          </div>
        )}

        <hr style={{ margin: "8px 0" }} />

        {/* MENSAJE DE PIE */}
        {configuracionBoleta.mensajePie && (
          <div
            style={{
              textAlign: "center",
              margin: "16px 0 0 0",
              whiteSpace: "pre-line",
              fontSize: "14px",
              color: "#666",
            }}
          >
            {configuracionBoleta.mensajePie}
          </div>
        )}
      </div>
    </div>
  )
}