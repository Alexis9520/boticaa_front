"use client"
import { Wrench } from "lucide-react"
import { motion } from "framer-motion"

export default function EnDesarrollo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <motion.div
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-fuchsia-500 shadow-xl"
      >
        <Wrench className="w-12 h-12 text-white animate-bounce" />
      </motion.div>
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