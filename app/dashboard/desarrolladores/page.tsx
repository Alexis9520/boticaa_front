"use client"

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Github, Linkedin, Mail, Globe, Sparkles, User } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion";

// Imágenes por rol (coloca tus imágenes reales en /public/img/)
const avatarByRole: Record<string, string> = {
  "Full Stack Developer": "https://media-lim1-1.cdn.whatsapp.net/v/t61.24694-24/287256023_1007659493280257_3777711521537036323_n.jpg?ccb=11-4&oh=01_Q5Aa2AFiqm70pMUUb5gyGCVGoVcadB2j854K3jKvQZKgau-gdA&oe=689BB51B&_nc_sid=5e03e0&_nc_cat=100", // Usa aquí el avatar real de Miguel
  "Frontend Developer": "https://i.pinimg.com/736x/1f/7c/21/1f7c216f53bf523ba7fe3b80f92c816c.jpg",   // Usa aquí el avatar real de Alexis
};

const glowByRole: Record<string, string> = {
  "Full Stack Developer": "from-indigo-700/70 via-fuchsia-600/80 to-blue-400/60",
  "Frontend Developer": "from-blue-700/90 via-sky-400/80 to-cyan-300/60",
};

const iconByRole: Record<string, React.ReactNode> = {
  "Full Stack Developer": <Sparkles className="w-7 h-7 text-fuchsia-400 drop-shadow" />,
  "Frontend Developer": <User className="w-7 h-7 text-yellow-400 drop-shadow" />,
};

const developers = [
  {
    "nombre": "Miguel Angel Castillo Valero",
    "rol": "Full Stack Developer",
    "bio": "Desarrollador full stack con experiencia en el desarrollo de aplicaciones empresariales usando Java y Spring Boot. Experto en la creación de APIs REST, integración con bases de datos MySQL y despliegue en VPS. Manejo profesional de control de versiones con Git y buenas prácticas de backend.",
    "avatar": avatarByRole["Full Stack Developer"],
    "github": "https://github.com/miguelcastillovalero",
    "linkedin": "https://linkedin.com/in/miguelcastillovalero",
    "email": "miguel.castillo@email.com",
    "web": "",
    "stack": ["Java", "Spring Boot", "API REST", "MySQL", "Git", "VPS Deployment"]
  },
  {
    "nombre": "Alexis Dasiel Romani Maravi",
    "rol": "Frontend Developer",
    "bio": "Desarrollador frontend especializado en React, TypeScript y Angular. Enfocado en construir interfaces modernas, accesibles y optimizadas. Apasionado por la experiencia de usuario, el diseño responsivo y el uso eficiente de tecnologías web como HTML, CSS y JavaScript.",
    "avatar": avatarByRole["Frontend Developer"],
    "github": "https://github.com/Alexis9520",
    "linkedin": "https://linkedin.com/in/alexisromani",
    "email": "alexis.romani@email.com",
    "web": "",
    "stack": ["React", "TypeScript", "HTML", "JavaScript", "Angular", "CSS"]
  }
];

// Animaciones para tarjetas
const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 60 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.18, type: "spring" as const, duration: 0.7 }
  })
}

export default function DesarrolladoresPage() {
  return (
    <div className="relative flex flex-col gap-8 px-2 md:px-8 py-12 min-h-screen overflow-x-hidden overflow-y-auto">
      {/* FONDO: Luces Futuristas con animación */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1 }}
          className="absolute left-[-150px] top-[-160px] w-[520px] h-[520px] rounded-full blur-3xl bg-gradient-to-br from-fuchsia-700/40 via-violet-600/60 to-sky-400/30 animate-pulse"
        />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ duration: 1.4, delay: 0.2 }}
          className="absolute right-[-200px] top-[120px] w-[420px] h-[400px] rounded-full blur-2xl bg-gradient-to-br from-cyan-400/30 via-blue-700/30 to-transparent animate-pulse"
        />
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 0.7, x: 0 }}
          transition={{ duration: 1.2, delay: 0.35 }}
          className="absolute left-[8vw] bottom-[-130px] w-[290px] h-[300px] rounded-full blur-2xl bg-gradient-to-br from-fuchsia-600/20 via-purple-800/30 to-blue-700/10"
        />
        {/* Líneas animadas */}
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 0.25, y: 0 }}
          transition={{ duration: 1.25, delay: 0.6 }}
          className="absolute left-10 top-1/2 w-[92%] h-[2px] bg-gradient-to-r from-fuchsia-500/50 via-transparent to-blue-400/50 rounded-full"
        />
        <motion.div
          initial={{ opacity: 0, x: 120 }}
          animate={{ opacity: 0.13, x: 0 }}
          transition={{ duration: 1.5, delay: 0.75 }}
          className="absolute right-0 bottom-24 w-[60%] h-[2px] bg-gradient-to-r from-blue-500/30 via-transparent to-fuchsia-200/40 rounded-full"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="mb-6"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-fuchsia-400 via-sky-400 to-indigo-600 bg-clip-text text-transparent drop-shadow-lg animate-gradient-x">
          Equipo de Desarrollo
        </h1>
        <motion.p
          className="text-muted-foreground max-w-2xl text-lg font-medium"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          Creamos tecnología de próxima generación con pasión, creatividad y excelencia. Descubre quién impulsa el motor de innovación detrás de esta plataforma.
        </motion.p>
      </motion.div>

      <div className="grid gap-10 grid-cols-1 md:grid-cols-2">
        {developers.map((dev, i) => (
          <motion.div
            key={dev.nombre}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cardVariants}
          >
            <Card className={`relative flex flex-col h-full border-0 shadow-2xl bg-gradient-to-br ${glowByRole[dev.rol]} dark:to-slate-900 group transition-all duration-300`}>
              {/* Glow animado detrás del avatar */}
              <motion.div
                className="absolute left-1/2 -top-12 -translate-x-1/2 z-0"
                initial={{ opacity: 0, scale: 0.9, filter: "blur(32px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(48px)" }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
              >
                <div className={`w-36 h-36 rounded-full blur-3xl ${glowByRole[dev.rol]} opacity-60`} />
              </motion.div>
              <CardHeader className="flex flex-col items-center gap-2 bg-white/70 dark:bg-slate-900/70 rounded-t-[22px] pb-2 pt-6 relative z-10">
                {/* Badge animado de rol */}
                <motion.span 
                  className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full px-5 py-1 text-xs font-extrabold tracking-widest text-white shadow-2xl uppercase border border-fuchsia-300 bg-gradient-to-r from-fuchsia-600 via-blue-600 to-sky-400 animate-pulse"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.45 + i * 0.12 }}
                >
                  <span className="flex items-center gap-2">
                    {iconByRole[dev.rol]} <span>{dev.rol}</span>
                  </span>
                </motion.span>
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 100, delay: 0.35 + i * 0.11 }}
                  className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-fuchsia-300 shadow-2xl bg-white dark:bg-slate-900"
                  style={{ boxShadow: "0 0 0 8px rgba(236, 72, 153, 0.2), 0 4px 32px 0 #3332" }}
                >
                  <Image
                    src={dev.avatar}
                    alt={dev.nombre}
                    width={112}
                    height={112}
                    className="object-cover w-full h-full"
                    priority
                  />
                  {/* Círculo animado */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-fuchsia-400 animate-spin-slow pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                  />
                </motion.div>
                <CardTitle className="text-center text-2xl font-extrabold mt-3 drop-shadow">{dev.nombre}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center pt-3 pb-6 px-3 z-10">
                <motion.p
                  className="mb-3 text-center text-muted-foreground text-base"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.52 + i * 0.1 }}
                >
                  {dev.bio}
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-2 justify-center mt-1 mb-4"
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.09 }}
                >
                  {dev.stack.map((tech) => (
                    <motion.span
                      key={tech}
                      className="px-3 py-1 rounded-full text-xs font-bold border border-fuchsia-200 bg-white/90 dark:bg-slate-800/80 text-fuchsia-700 dark:text-fuchsia-300 shadow shadow-fuchsia-200/30 group-hover:scale-110 transition-transform"
                      whileHover={{ scale: 1.13, backgroundColor: "#a21caf", color: "#fff" }}
                    >
                      {tech}
                    </motion.span>
                  ))}
                </motion.div>
                <motion.div
                  className="flex gap-4 mt-2"
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.65 + i * 0.08 }}
                >
                  {dev.github && (
                    <a href={dev.github} target="_blank" rel="noopener noreferrer" title="GitHub" className="hover:scale-125 transition">
                      <Github className="h-6 w-6 text-neutral-700 dark:text-neutral-200 hover:text-fuchsia-500" />
                    </a>
                  )}
                  {dev.linkedin && (
                    <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="hover:scale-125 transition">
                      <Linkedin className="h-6 w-6 text-sky-700 dark:text-sky-300 hover:text-fuchsia-500" />
                    </a>
                  )}
                  {dev.email && (
                    <a href={`mailto:${dev.email}`} title="Email" className="hover:scale-125 transition">
                      <Mail className="h-6 w-6 text-emerald-700 dark:text-emerald-300 hover:text-fuchsia-500" />
                    </a>
                  )}
                  {dev.web && (
                    <a href={dev.web} target="_blank" rel="noopener noreferrer" title="Sitio Web" className="hover:scale-125 transition">
                      <Globe className="h-6 w-6 text-amber-600 dark:text-amber-400 hover:text-fuchsia-500" />
                    </a>
                  )}
                </motion.div>
              </CardContent>
              {/* Glow animado en hover */}
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-3xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.28, scale: 1.05 }}
                transition={{ duration: 0.33, type: "spring" }}
              >
                <div className={`w-full h-full rounded-3xl bg-gradient-to-br ${glowByRole[dev.rol]}`} />
              </motion.div>
              {/* Líneas brillantes superiores */}
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-1 bg-gradient-to-r from-fuchsia-300 via-blue-400 to-transparent rounded-full blur-md opacity-60" />
            </Card>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="text-center text-xs mt-14 text-muted-foreground"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        &copy; {new Date().getFullYear()} Quantify | Todos los derechos reservados.
      </motion.div>
    </div>
  )
}

// Tailwind para animación personalizada (ponlo en tu archivo global.css si no existe)
// .animate-spin-slow { animation: spin 5s linear infinite; }
// .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 7s ease-in-out infinite; }
// @keyframes gradient-x { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }