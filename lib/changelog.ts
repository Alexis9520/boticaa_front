// Changelog estático (front-only).
// La versión más reciente siempre primero.
// Ajusta numeración si tu repositorio ya usa otros números.
//
// FECHAS derivadas de tu explicación (fecha actual: 2025-08-11)
// - "hace 1 semana"  -> 2025-08-04
// - "al día siguiente" sucesivo
// - "dos días después" desde 2025-08-06 => 2025-08-08
// - "ayer" (respecto a 2025-08-11) => 2025-08-10
// - "hoy" => 2025-08-11
//
// TIPOS usados:
// added, changed, fixed, removed, security, internal
//
// Si luego quieres unificar versiones (en vez de tantas diarias) puedes
// mover entradas entre versiones sin problema.

export type ChangeType = "added" | "changed" | "fixed" | "removed" | "security" | "internal"

export interface ChangeEntry {
  type: ChangeType
  title: string
  description?: string
  issueRef?: string | number
  breaking?: boolean
}

export interface VersionLog {
  version: string
  date: string // YYYY-MM-DD
  tag?: string
  entries: ChangeEntry[]
}

export const CHANGELOG: VersionLog[] = [
  {
    version: "1.4.1",
    date: "2025-08-11",
    tag: "stable",
    entries: [
      {
        type: "fixed",
        title: "Corrección de zona horaria",
        description: "Ahora todas las validaciones utilizan hora de Lima (America/Lima) y no la hora del servidor."
      },
      {
        type: "fixed",
        title: "Acceso post-horario de salida",
        description: "Los trabajadores ya no quedan bloqueados indebidamente; el problema era la hora del servidor desfasada."
      }
    ]
  },
  {
    version: "1.4.0",
    date: "2025-08-10",
    entries: [
      {
        type: "added",
        title: "Atributo 'Principio activo' en productos",
        description: "Permite registrar el componente farmacológico principal."
      },
      {
        type: "added",
        title: "Clasificación de tipo de medicamento",
        description: "Distingue productos genéricos vs de marca para mejores filtros y reportes."
      },
      {
        type: "added",
        title: "Código de lote por producto",
        description: "Soporte para trazabilidad y control de vencimientos."
      },
      {
        type: "fixed",
        title: "Errores al actualizar productos",
        description: "Se solucionaron fallos intermitentes durante la edición (validaciones y persistencia)."
      }
    ]
  },
  {
    version: "1.3.9",
    date: "2025-08-08",
    tag: "security",
    entries: [
      {
        type: "security",
        title: "Cambio de contraseña administrado",
        description: "Nueva función para que solo administradores modifiquen contraseña de usuarios."
      },
      {
        type: "security",
        title: "Restricción de acceso fuera de horario",
        description: "Los trabajadores no pueden iniciar sesión después de su horario de salida."
      },
      {
        type: "security",
        title: "Ingreso restringido solo para cierre de caja",
        description: "Si no cerraron caja a tiempo, se permite el acceso únicamente para ejecutar el cierre."
      }
    ]
  },
  {
    version: "1.3.8",
    date: "2025-08-06",
    entries: [
      {
        type: "added",
        title: "Más estadísticas en Dashboard",
        description: "Se agregaron métricas adicionales para mejorar la visibilidad del negocio."
      },
      {
        type: "fixed",
        title: "Movimientos de caja",
        description: "Corrección en el registro y visualización de movimientos (inconsistencias de montos)."
      }
    ]
  },
  {
    version: "1.3.7",
    date: "2025-08-05",
    entries: [
      {
        type: "fixed",
        title: "Orden y visualización de boletas",
        description: "Las boletas ahora se listan de forma consistente y ordenada."
      },
      {
        type: "added",
        title: "Personalización de boleta",
        description: "Parámetros estéticos y de formato para mejorar la presentación al cliente."
      }
    ]
  },
  {
    version: "1.3.6",
    date: "2025-08-04",
    entries: [
      {
        type: "fixed",
        title: "Visual del Dashboard",
        description: "Corrección de desalineaciones y componentes que no se renderizaban correctamente."
      }
    ]
  },

 
  
]

// Utilidades
export const LATEST_VERSION = CHANGELOG[0]?.version

export function isRecent(dateStr: string): boolean {
  const ms = Date.now() - new Date(dateStr + "T00:00:00").getTime()
  return ms / 86400000 <= 7
}