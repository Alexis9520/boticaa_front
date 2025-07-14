"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Pill } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { login } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { loginSchema, type LoginFormData } from "@/lib/validation"
import { config } from "@/lib/config"

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      dni: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginFormData) {
    setIsLoading(true)

    try {
      const success = await login(values.dni, values.password)

      if (success) {
        toast({
          variant: "default",
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        })
        router.push("/dashboard")
        router.refresh()
      } else {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "DNI o contraseña incorrectos",
        })
      }
    } catch (error) {
      console.error('Error durante el login:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al iniciar sesión. Inténtalo de nuevo.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-2">
          <Pill className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
        </div>
        <CardTitle className="text-2xl text-center">{config.appName}</CardTitle>
        <CardDescription className="text-center">Ingresa tus credenciales para acceder al sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingresa tu DNI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Ingresa tu contraseña" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">Sistema de gestión de ventas</p>
      </CardFooter>
    </Card>
  )
}