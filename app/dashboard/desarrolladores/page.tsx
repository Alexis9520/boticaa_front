"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Github, Linkedin, Mail, Globe } from "lucide-react"
import Image from "next/image"

const developers = [
  {
    nombre: "Miguel Hot",
    rol: "Full Stack Developer",
    bio: "Desarrollador apasionado por la tecnología, especializado en aplicaciones web modernas con React, Next.js y Node.js. Experiencia en integración de APIs, bases de datos y despliegue en la nube.",
    avatar: "https://media-lim1-1.cdn.whatsapp.net/v/t61.24694-24/287256023_1007659493280257_3777711521537036323_n.jpg?ccb=11-4&oh=01_Q5Aa1gHG6rx62mAjQYp9j3p8teZ5MV7PhNImdazXV0NuwrDMng&oe=684DB45B&_nc_sid=5e03e0&_nc_cat=100", // Coloca la imagen en public/img/alexis.jpg o usa una URL
    github: "https://github.com/Alexis9520",
    linkedin: "https://linkedin.com/in/alexisrodriguez",
    email: "alexis.rodriguez@email.com",
    web: "https://alexisdev.com",
    stack: ["React", "Next.js", "Node.js", "PostgreSQL", "Tailwind", "TypeScript"],
  },
  {
    nombre: "Mashiro",
    rol: "Frontend Developer",
    bio: "Experta en interfaces y experiencia de usuario. Apasionada por el diseño web accesible, la optimización y la animación. Siempre buscando nuevas tendencias en frontend.",
    avatar: "https://media-lim1-1.cdn.whatsapp.net/v/t61.24694-24/483652723_582684384797339_5719893283381654656_n.jpg?ccb=11-4&oh=01_Q5Aa1gGDGZlvB7AnV_Kj4GU5WBOJUdldbtuwxsYqhDKeJsvkXw&oe=685383F1&_nc_sid=5e03e0&_nc_cat=108",
    github: "https://github.com/mariagarcia",
    linkedin: "https://linkedin.com/in/mariagarcia",
    email: "maria.garcia@email.com",
    web: "",
    stack: ["React", "TypeScript", "Sass", "Figma", "Shadcn/ui"],
  },
  {
    nombre: "Gampi",
    rol: "Backend Developer",
    bio: "Desarrollador backend con fuerte enfoque en arquitectura, seguridad y rendimiento. Amplia experiencia en Node.js, Express y bases de datos SQL/NoSQL.",
    avatar: "https://media-lim1-1.cdn.whatsapp.net/v/t61.24694-24/491840800_1204595124793385_4538768914690434797_n.jpg?ccb=11-4&oh=01_Q5Aa1gHGrIK2rPUCPujsijc9GB9XkTxc2bSAqvgC1JebOT41Gg&oe=684CB6A0&_nc_sid=5e03e0&_nc_cat=111",
    github: "https://github.com/juanperez",
    linkedin: "https://linkedin.com/in/juanperez",
    email: "",
    web: "",
    stack: ["Node.js", "Express", "MongoDB", "PostgreSQL", "Docker", "Redis"],
  },
]

export default function DesarrolladoresPage() {
  return (
    <div className="flex flex-col gap-5 px-2 md:px-8">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Equipo de Desarrolladores</h1>
        <p className="text-muted-foreground max-w-xl">
          Este proyecto ha sido desarrollado por un equipo multidisciplinario de profesionales comprometidos con la excelencia,
          la innovación y la mejora continua. Conoce al equipo detrás del sistema.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {developers.map((dev, i) => (
          <Card key={i} className="flex flex-col h-full shadow-md">
            <CardHeader className="flex flex-col items-center gap-2">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary shadow">
                <Image
                  src={dev.avatar}
                  alt={dev.nombre}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              <CardTitle className="text-center text-xl">{dev.nombre}</CardTitle>
              <CardDescription className="text-primary text-sm">{dev.rol}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center">
              <p className="mb-2 text-center text-muted-foreground">{dev.bio}</p>
              <div className="flex flex-wrap gap-2 justify-center mt-2 mb-2">
                {dev.stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 rounded bg-secondary text-xs font-semibold border border-border"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                {dev.github && (
                  <a href={dev.github} target="_blank" rel="noopener noreferrer" title="GitHub">
                    <Github className="h-5 w-5 hover:text-primary" />
                  </a>
                )}
                {dev.linkedin && (
                  <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                    <Linkedin className="h-5 w-5 hover:text-primary" />
                  </a>
                )}
                {dev.email && (
                  <a href={`mailto:${dev.email}`} title="Email">
                    <Mail className="h-5 w-5 hover:text-primary" />
                  </a>
                )}
                {dev.web && (
                  <a href={dev.web} target="_blank" rel="noopener noreferrer" title="Sitio Web">
                    <Globe className="h-5 w-5 hover:text-primary" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center text-xs mt-8 text-muted-foreground">
        &copy; {new Date().getFullYear()} Equipo de Desarrollo | Todos los derechos reservados.
      </div>
    </div>
  )
}