'use client'

/**
 * Página /print con:
 * - Recuperación de job desde localStorage (ticket_preview_job)
 * - Altura dinámica @page para 58mm / 80mm
 * - Alto contraste, ancho configurable, alineación decimales (se configuran vía job + buildTicketHTML)
 * - Panel debug opcional
 *
 * Cómo generar job en otra parte de tu app (ejemplo):
 *
 * import { buildTicketHTML } from '@/lib/print-utils'
 *
 * const html = buildTicketHTML(venta, negocio, {
 *   formatoImpresion: '58mm',
 *   mensajePie: '',
 *   mostrarLogo: true,
 *   logoUrl: '/logo-said.png',
 *   altoContraste: true,
 *   anchoContenidoMm: 52,
 *   alinearDecimales: true,
 *   mostrarBordeFilas: false,
 *   truncarNombreEn: 38
 * })
 *
 * localStorage.setItem('ticket_preview_job', JSON.stringify({
 *   html,
 *   formato: '58mm',
 *   altoContraste: true,
 *   anchoContenidoMm: 52,
 *   alinearDecimales: true,
 *   mostrarBordeFilas: false,
 *   auto: false,
 *   debug: false
 * }))
 * window.open('/print', '_blank')
 */

import React, { useEffect, useMemo, useState } from 'react'
import { getPrintCss, FormatoImpresion } from '@/lib/print-utils'

interface PrintJob {
  html: string
  formato: FormatoImpresion
  altoContraste?: boolean
  anchoContenidoMm?: number
  alinearDecimales?: boolean
  mostrarBordeFilas?: boolean
  auto?: boolean
  alturaForzadaMm?: number
  margenExtraMm?: number
  desactivarAlturaDinamica?: boolean
  debug?: boolean
  // Si quieres que sea dinámico por job, puedes agregar:
  espacioColsNumericasMm?: number
  separarColumnasNumericas?: boolean
}

export default function PrintPage() {
  const [job, setJob] = useState<PrintJob | null>(null)
  const [dynamicCss, setDynamicCss] = useState<string>("")
  const [medicion, setMedicion] = useState<{ px: number; mm: number; finalMm: number } | null>(null)

  // Cargar job inicial
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ticket_preview_job')
      if (raw) setJob(JSON.parse(raw))
    } catch (e) {
      console.warn('No se pudo parsear ticket_preview_job', e)
    }
  }, [])

  // Escuchar cambios externos
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'ticket_preview_job' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as PrintJob
          setJob(prev => (JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed))
        } catch (err) {
          console.warn('Cambio de storage inválido', err)
        }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // CSS base (sin altura fija; luego se inyecta dynamicCss)
  const baseCss = useMemo(() => {
    if (!job) return ''
    return getPrintCss(job.formato, {
      altoContraste: job.altoContraste,
      anchoContenidoMm: job.anchoContenidoMm,
      mostrarBordeFilas: job.mostrarBordeFilas,
      alinearDecimales: job.alinearDecimales,
      // SEPARACIÓN EXTRA ENTRE COLUMNAS NUMÉRICAS:
      espacioColsNumericasMm: job.espacioColsNumericasMm ?? 3.2,
      separarColumnasNumericas: job.separarColumnasNumericas ?? true,
    })
  }, [job])

  // Calcular altura dinámica
  useEffect(() => {
    if (!job) {
      setDynamicCss('')
      setMedicion(null)
      return
    }

    if (job.formato === 'a4' && !job.alturaForzadaMm) {
      setDynamicCss('')
      setMedicion(null)
      return
    }

    if (job.desactivarAlturaDinamica && !job.alturaForzadaMm) {
      setDynamicCss('')
      setMedicion(null)
      return
    }

    const MIN_MM = 40
    const MAX_MM = 800
    const margenExtra = typeof job.margenExtraMm === 'number' ? job.margenExtraMm : 4
    let cancel = false

    const medir = () => {
      if (cancel) return
      const ticket = document.querySelector('.ticket') as HTMLElement | null
      if (!ticket) {
        setTimeout(medir, 30)
        return
      }

      if (job.alturaForzadaMm) {
        const finalMm = Math.min(Math.max(job.alturaForzadaMm, MIN_MM), MAX_MM)
        setDynamicCss(`@page { size:${job.formato} ${finalMm}mm; margin:0; }`)
        setMedicion({ px: -1, mm: finalMm, finalMm })
        return
      }

      const rect = ticket.getBoundingClientRect()
      const px = rect.height
      const mmContenido = (px / 96) * 25.4
      const mm = Math.ceil(mmContenido + margenExtra)
      const finalMm = Math.min(Math.max(mm, MIN_MM), MAX_MM)
      setDynamicCss(`@page { size:${job.formato} ${finalMm}mm; margin:0; }`)
      setMedicion({ px, mm: mmContenido, finalMm })
    }

    const t = setTimeout(medir, 30)
    return () => {
      cancel = true
      clearTimeout(t)
    }
  }, [job])

  // Impresión automática
  useEffect(() => {
    if (!job?.auto) return
    const necesitaAltura = (job.formato === '58mm' || job.formato === '80mm') && !job.desactivarAlturaDinamica
    if (necesitaAltura && !dynamicCss && !job.alturaForzadaMm) return

    const t = setTimeout(() => {
      try { window.print() } catch (e) { console.error(e) }
    }, 200)
    return () => clearTimeout(t)
  }, [job, dynamicCss])

  // Panel debug
  const DebugPanel = () => {
    if (!job?.debug) return null
    return (
      <div
        style={{
          position: 'fixed',
          top: 8,
          right: 8,
          zIndex: 9999,
          background: '#111',
          color: '#fff',
          fontSize: 12,
          padding: '8px 10px',
          fontFamily: 'monospace',
          borderRadius: 4,
          maxWidth: 360,
          lineHeight: 1.3
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>DEBUG TICKET</div>
        <div>Formato: {job.formato}</div>
        <div>AltoContraste: {job.altoContraste ? 'sí' : 'no'}</div>
        <div>Ancho mm: {job.anchoContenidoMm ?? '(defecto)'}</div>
        <div>Alinear decimales: {job.alinearDecimales ? 'sí' : 'no'}</div>
        <div>Borde filas: {job.mostrarBordeFilas ? 'sí' : 'no'}</div>
        <div>AlturaForzada: {job.alturaForzadaMm ?? '(no)'}</div>
        <div>AlturaDinámica OFF: {job.desactivarAlturaDinamica ? 'sí' : 'no'}</div>
        <div>espacioColsNumericasMm: {job.espacioColsNumericasMm ?? 'def 3.2'}</div>
        <div>separarColumnasNumericas: {job.separarColumnasNumericas ?? true ? 'sí' : 'no'}</div>
        {medicion && (
          <>
            <div>px contenido: {medicion.px >= 0 ? medicion.px.toFixed(1) : '(forzado)'}</div>
            <div>mm contenido (sin colchón): {medicion.px >= 0 ? medicion.mm.toFixed(2) : '(forzado)'}</div>
            <div>mm final aplicado: {medicion.finalMm}</div>
          </>
        )}
        <div>Auto print: {job.auto ? 'sí' : 'no'}</div>
        <button
          style={{
            marginTop: 6,
            width: '100%',
            padding: '4px 6px',
            background: '#444',
            color: '#fff',
            border: '1px solid #666',
            cursor: 'pointer'
          }}
          onClick={() => { try { window.print() } catch {} }}
        >
          Imprimir ahora
        </button>
        <button
          style={{
            marginTop: 4,
            width: '100%',
            padding: '4px 6px',
            background: '#444',
            color: '#fff',
            border: '1px solid #666',
            cursor: 'pointer'
          }}
          onClick={() => {
            try {
              localStorage.removeItem('ticket_preview_job')
              setJob(null)
            } catch {}
          }}
        >
          Limpiar job
        </button>
      </div>
    )
  }

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Vista previa ticket</title>
        {baseCss && (
          <style id="baseTicketCss" dangerouslySetInnerHTML={{ __html: baseCss }} />
        )}
        {dynamicCss && (
          <style id="dynamicPageSize" dangerouslySetInnerHTML={{ __html: dynamicCss }} />
        )}
      </head>
      <body>
        <div id="print-root">
          {job ? (
            <div
              className="ticket"
              dangerouslySetInnerHTML={{ __html: job.html }}
            />
          ) : (
            <div style={{ padding: 16, fontFamily: 'system-ui, Arial, sans-serif' }}>
              No hay un ticket en localStorage (ticket_preview_job).
            </div>
          )}
        </div>
        <DebugPanel />
      </body>
    </html>
  )
}