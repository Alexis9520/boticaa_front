"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Plus, Search, ChevronDown, ChevronRight } from "lucide-react"
import { DateRangePicker } from "@/components/date-range-picker"
import jsPDF from "jspdf"

import { getBoletas } from "@/lib/api"
import autoTable from 'jspdf-autotable';




type ProductoVendido = {
  codBarras: string
  nombre: string
  cantidad: number
  precio: string | number
}

type Boleta = {
  id: number
  numero: string
  fecha: string
  cliente: string
  metodoPago?: string
  total: string | number
  usuario?: string
  productos?: ProductoVendido[]
  totalCompra?: string | number
  vuelto?: string | number
}

type Rango = { from: Date | undefined, to: Date | undefined }

function arrayToCSV(rows: string[][]) {
  return rows.map(row =>
    row.map(cell =>
      `"${(cell ?? "").replace(/"/g, '""')}"`
    ).join(",")
  ).join("\n")
}

function downloadCSV(filename: string, rows: string[][]) {
  const BOM = "\uFEFF"
  const csv = arrayToCSV(rows)
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportarBoletasPDF(boletasFiltradas: Boleta[]) {
  const doc = new jsPDF()
  doc.setFont("helvetica", "normal")
  doc.setFontSize(15)
  doc.text("Listado de Boletas", 14, 16)
  autoTable(doc, {
    startY: 22,
    styles: { fontSize: 10, cellPadding: 2 },
    head: [
      ["Número", "Fecha", "Cliente", "Método de Pago", "Total", "Total de Compra", "Vuelto", "Usuario"]
    ],
    body: boletasFiltradas.map(b => [
      b.numero, b.fecha, b.cliente, b.metodoPago ?? "", b.total, b.totalCompra ?? "", b.vuelto ?? "", b.usuario ?? ""
    ]),
    theme: "plain",
    headStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] }
  })
  doc.save("boletas.pdf")
}

export default function VentasPage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [totalBoletas, setTotalBoletas] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)
  const [tamanoPagina, setTamanoPagina] = useState(10)
  const [boletaExpandida, setBoletaExpandida] = useState<number | null>(null)
  const [busquedaBoletas, setBusquedaBoletas] = useState("")
  const [rangoFechasBoletas, setRangoFechasBoletas] = useState<Rango>({ from: undefined, to: undefined })

  useEffect(() => {
    setPaginaActual(1)
  }, [busquedaBoletas, rangoFechasBoletas])

  useEffect(() => {
    // Ahora usamos la función getBoletas, no fetch('/api/boletas')
    const fetchBoletas = async () => {
      try {
        const data = await getBoletas({
          page: paginaActual,
          limit: tamanoPagina,
          search: busquedaBoletas,
          from: rangoFechasBoletas.from ? rangoFechasBoletas.from.toISOString().slice(0, 10) : undefined,
          to: rangoFechasBoletas.to ? rangoFechasBoletas.to.toISOString().slice(0, 10) : undefined,
        });
        if (Array.isArray(data.boletas)) {
          const boletasAdaptadas = data.boletas.map((b: any) => ({
            ...b,
            numero: b.numero ?? b.boleta ?? String(b.id),
            fecha: b.fecha ?? b.fecha_venta ?? "",
            total: b.total ?? b.total_compra ?? "",
            totalCompra: b.totalCompra ?? b.total_compra ?? b.total ?? "",
            vuelto: b.vuelto ?? "",
            cliente: b.cliente ?? b.nombre_cliente ?? "",
            metodoPago: b.metodoPago ?? b.metodo_pago ?? "",
            usuario: b.usuario ?? b.usuario_nombre ?? "",
            productos: b.productos ?? b.detalles ?? [],
          }))
          setBoletas(boletasAdaptadas)
          setTotalBoletas(Number(data.total) || 0)
        } else {
          setBoletas([])
          setTotalBoletas(0)
        }
      } catch {
        setBoletas([])
        setTotalBoletas(0)
      }
    }
    fetchBoletas()
  }, [paginaActual, tamanoPagina, busquedaBoletas, rangoFechasBoletas])

  const totalPaginas = Math.ceil(totalBoletas / tamanoPagina) || 1

  const exportarBoletas = () => {
    const rows: string[][] = [
      ["Número", "Fecha", "Cliente", "Método de Pago", "Total", "Total de Compra", "Vuelto", "Usuario"],
      ...boletas.map(b => [
        String(b.numero),
        "'" + String(b.fecha),
        String(b.cliente),
        String(b.metodoPago ?? ""),
        String(b.total),
        String(b.totalCompra ?? ""),
        String(b.vuelto ?? ""),
        String(b.usuario ?? "")
      ])
    ]
    downloadCSV("boletas.csv", rows)
  }

  function descargarBoletaPDF(boleta: Boleta) {
    const doc = new jsPDF()
    doc.setFont("helvetica", "normal")
    doc.setFontSize(16)
    doc.text(`Detalle de Boleta`, 14, 18)
    doc.setFontSize(12)
    const table1 = autoTable(doc, {
      startY: 28,
      theme: "plain",
      body: [
        ["Número:", boleta.numero],
        ["Fecha:", boleta.fecha],
        ["Cliente:", boleta.cliente],
        ["Método de Pago:", boleta.metodoPago ?? ""],
        ["Total de Compra:", boleta.totalCompra ?? ""],
        ["Vuelto:", boleta.vuelto ?? ""],
        ["Usuario:", boleta.usuario ?? ""]
      ],
      styles: { cellPadding: 2, fontSize: 12 }
    }) as any
    if (boleta.productos && boleta.productos.length > 0) {
      autoTable(doc, {
        startY: (table1?.finalY ?? 28) + 5,
        head: [["Código", "Nombre", "Cantidad", "Precio"]],
        body: boleta.productos.map(prod => [
          prod.codBarras ?? "", prod.nombre ?? "", prod.cantidad ?? "", prod.precio ?? ""
        ]),
        theme: "striped",
        styles: { fontSize: 10 }
      })
    }
    doc.save(`${boleta.numero}.pdf`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Boletas</h1>
          <p className="text-muted-foreground">Administra las boletas emitidas en el sistema</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/ventas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Venta
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Listado de Boletas</CardTitle>
          <CardDescription>Visualiza y gestiona las boletas emitidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por número de boleta o cliente..."
                  className="pl-8"
                  value={busquedaBoletas}
                  onChange={e => setBusquedaBoletas(e.target.value)}
                />
              </div>
              <DateRangePicker
                value={
                  rangoFechasBoletas.from && rangoFechasBoletas.to
                    ? { from: rangoFechasBoletas.from, to: rangoFechasBoletas.to }
                    : undefined
                }
                onChange={range => setRangoFechasBoletas({
                  from: range?.from,
                  to: range?.to
                })}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportarBoletas}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button variant="outline" onClick={() => exportarBoletasPDF(boletas)}>
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {/* Controles de paginación arriba */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <label>
                <span className="mr-2">Boletas por página:</span>
                <select
                  value={tamanoPagina}
                  onChange={e => {
                    setTamanoPagina(Number(e.target.value));
                    setPaginaActual(1);
                  }}
                  className="border rounded px-2 py-1"
                >
                  {[5, 10, 20, 50].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                disabled={paginaActual === 1}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página <b>{paginaActual}</b> de <b>{totalPaginas}</b>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                disabled={paginaActual === totalPaginas || totalPaginas === 0}
              >
                Siguiente
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead>Total de Compra</TableHead>
                  <TableHead>Vuelto</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boletas.length > 0 ? boletas.map(boleta => (
                  <React.Fragment key={boleta.id}>
                    <TableRow key={boleta.id}>
                      <TableCell>{boleta.numero}</TableCell>
                      <TableCell>{boleta.fecha}</TableCell>
                      <TableCell>{boleta.cliente}</TableCell>
                      <TableCell>
                        <Badge variant={
                          (boleta.metodoPago ?? "").toLowerCase() === "efectivo" ? "default"
                            : (["yape", "plin"].includes((boleta.metodoPago ?? "").toLowerCase())) ? "secondary"
                              : "outline"
                        }>
                          {boleta.metodoPago}
                        </Badge>
                      </TableCell>
                      <TableCell>{boleta.totalCompra}</TableCell>
                      <TableCell>{boleta.vuelto}</TableCell>
                      <TableCell>{boleta.usuario}</TableCell>
                      <TableCell className="text-right flex flex-row gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setBoletaExpandida(boletaExpandida === boleta.id ? null : boleta.id)}
                          title={boletaExpandida === boleta.id ? "Ocultar productos" : "Ver productos"}
                        >
                          {boletaExpandida === boleta.id
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                          <span className="sr-only">{boletaExpandida === boleta.id ? "Ocultar" : "Ver más"}</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => descargarBoletaPDF(boleta)}>
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Descargar PDF</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                    {boletaExpandida === boleta.id && (
                      <TableRow key={boleta.id + "-expandida"}>
                        <TableCell colSpan={9}>
                          <div className="p-4 bg-muted rounded">
                            <strong>Productos vendidos:</strong>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Código</TableHead>
                                  <TableHead>Nombre</TableHead>
                                  <TableHead>Cantidad</TableHead>
                                  <TableHead>Precio</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(boleta.productos ?? []).map(prod => (
                                  <TableRow key={prod.codBarras}>
                                    <TableCell>{prod.codBarras}</TableCell>
                                    <TableCell>{prod.nombre}</TableCell>
                                    <TableCell>{prod.cantidad}</TableCell>
                                    <TableCell>{prod.precio}</TableCell>
                                  </TableRow>
                                ))}
                                {/* Fila: Total de Compra */}
                                <TableRow>
                                  <TableCell colSpan={3} className="font-semibold text-right">Total de Compra</TableCell>
                                  <TableCell className="font-semibold">{boleta.totalCompra}</TableCell>
                                </TableRow>
                                {/* Fila: Vuelto */}
                                <TableRow>
                                  <TableCell colSpan={3} className="font-semibold text-right">Vuelto</TableCell>
                                  <TableCell className="font-semibold">{boleta.vuelto}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No se encontraron boletas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Controles de paginación abajo */}
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-xs text-muted-foreground">
                Mostrando {boletas.length} de {totalBoletas} boletas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                disabled={paginaActual === 1}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página <b>{paginaActual}</b> de <b>{totalPaginas}</b>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                disabled={paginaActual === totalPaginas || totalPaginas === 0}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}