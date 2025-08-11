"use client"

import { useState } from "react"
import { VersionLog, isRecent } from "@/lib/changelog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChangeTypeBadge, BreakingBadge } from "./ChangeTypeBadge"
import { ChevronDown, Link2, CalendarDays } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Props {
  version: VersionLog
  defaultOpen?: boolean
  index: number
}

export function VersionBlock({ version, defaultOpen, index }: Props) {
  const [open, setOpen] = useState(Boolean(defaultOpen))
  const anchorId = `v-${version.version.replace(/\./g, "-")}`
  const recent = isRecent(version.date)

  const copyLink = () => {
    const url = window.location.href.split("#")[0] + "#" + anchorId
    navigator.clipboard.writeText(url)
  }

  return (
    <Card
      id={anchorId}
      className={`transition-all ${index === 0 ? "border-primary/70 shadow-md" : ""}`}
    >
      <CardHeader
        className="cursor-pointer pb-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-semibold text-lg leading-none">
              v{version.version}
            </h2>
            {version.tag && (
              <Badge variant="outline" className="uppercase text-[10px]">
                {version.tag}
              </Badge>
            )}
            {index === 0 && (
              <Badge className="bg-primary text-primary-foreground text-[10px]">
                Última
              </Badge>
            )}
            {recent && (
              <Badge variant="secondary" className="text-[10px]">
                Nuevo
              </Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(version.date), "PPP", { locale: es })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); copyLink() }}
              className="h-7 text-xs"
            >
              <Link2 className="h-3.5 w-3.5 mr-1" />
              Copiar link
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-7 text-xs gap-1 ${open ? "" : "opacity-70"}`}
              onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
            >
              {open ? "Ocultar" : "Ver cambios"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <div className="relative mt-2 pl-5">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
            <ul className="space-y-4">
              {version.entries.map((e, i) => (
                <li
                  key={i}
                  className="relative pl-4"
                >
                  <span className="absolute left-[-9px] top-2 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <ChangeTypeBadge type={e.type} />
                    {e.breaking && <BreakingBadge />}
                    {e.issueRef && (
                      <Badge variant="outline" className="text-[10px]">
                        Ref: {e.issueRef}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-sm leading-snug">
                    {e.title}
                  </h3>
                  {e.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {e.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  )
}