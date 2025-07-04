import type React from "react"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import "@/styles/globals.css"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  )
}