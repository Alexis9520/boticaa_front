"use client"

export default function ReportesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-fuchsia-500 shadow-xl mb-4">
        <span role="img" aria-label="Herramienta" className="text-4xl text-white animate-bounce">🛠️</span>
      </div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-fuchsia-500 bg-clip-text text-transparent">
        Página en desarrollo
      </h1>
      <p className="text-muted-foreground max-w-md text-lg">
        Estamos trabajando para traerte esta funcionalidad pronto.<br />
        ¡Vuelve más tarde!
      </p>
    </div>
  )
}