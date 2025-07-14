# Boticas Said - Sistema de Gestión Frontend

Sistema integral de gestión para farmacias desarrollado con Next.js 15, TypeScript, Tailwind CSS y Radix UI.

## 🚀 Características

- **Autenticación segura** con JWT y roles de usuario
- **Dashboard administrativo** con métricas en tiempo real
- **Gestión de productos** con código de barras y control de stock
- **Sistema de ventas** con múltiples métodos de pago
- **Control de caja** con movimientos de efectivo
- **Reportes** de ventas y inventario
- **Interfaz responsive** adaptada para dispositivos móviles
- **Tema claro/oscuro** con persistencia de preferencias

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Formularios**: React Hook Form + Zod
- **Iconos**: Lucide React
- **Gráficos**: Recharts
- **Autenticación**: JWT
- **Estado**: React Context API

## 📋 Requisitos previos

- Node.js 18.0 o superior
- npm 9.0 o superior
- Backend API ejecutándose (ver configuración)

## 🚀 Instalación

1. **Clonar el repositorio**:
```bash
git clone <repository-url>
cd boticaa_front
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
```bash
cp .env.example .env.local
```

Editar `.env.local` con las configuraciones correctas:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=Boticas Said
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=development
```

4. **Ejecutar en modo desarrollo**:
```bash
npm run dev
```

5. **Abrir en el navegador**:
```
http://localhost:3000
```

## 🏗️ Scripts disponibles

- `npm run dev` - Ejecuta la aplicación en modo desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta ESLint para verificar el código

## 📁 Estructura del proyecto

```
├── app/                    # App Router (Next.js 13+)
│   ├── dashboard/          # Páginas del dashboard
│   ├── login/              # Páginas de autenticación
│   ├── layout.tsx          # Layout principal
│   └── page.tsx            # Página de inicio
├── components/             # Componentes reutilizables
│   ├── ui/                 # Componentes de interfaz
│   ├── auth-provider.tsx   # Proveedor de autenticación
│   ├── login-form.tsx      # Formulario de login
│   └── sidebar.tsx         # Navegación lateral
├── lib/                    # Utilidades y configuración
│   ├── api.ts              # Cliente API
│   ├── auth.ts             # Funciones de autenticación
│   ├── config.ts           # Configuración de la app
│   ├── types.ts            # Tipos TypeScript
│   ├── utils.ts            # Funciones utilitarias
│   └── validation.ts       # Esquemas de validación
├── hooks/                  # Hooks personalizados
├── styles/                 # Estilos globales
└── public/                 # Archivos estáticos
```

## 🔐 Autenticación

El sistema utiliza JWT para la autenticación. Los tokens se almacenan en localStorage y se incluyen automáticamente en las peticiones API.

### Roles de usuario:
- **Administrador**: Acceso completo al sistema
- **Trabajador**: Acceso limitado a ventas y caja

## 🛡️ Seguridad

- Validación de entrada con Zod
- Sanitización de datos
- Manejo seguro de errores
- Tokens JWT con expiración
- Protección de rutas por roles

## 🎨 Personalización

### Tema
El sistema incluye soporte para temas claro y oscuro usando `next-themes`.

### Componentes
Los componentes UI están basados en Radix UI y pueden personalizarse modificando:
- `tailwind.config.ts` - Configuración de Tailwind
- `app/globals.css` - Estilos globales
- `components/ui/` - Componentes individuales

## 🔧 Configuración de API

Las configuraciones de API se encuentran en `lib/config.ts`:

```typescript
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Boticas Said',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
};
```

## 📊 Funcionalidades principales

### Dashboard
- Métricas de ventas diarias y mensuales
- Saldo de caja en tiempo real
- Productos más vendidos
- Alertas de stock crítico
- Productos próximos a vencer

### Gestión de productos
- Catálogo completo de productos
- Búsqueda y filtrado avanzado
- Control de stock con alertas
- Gestión de precios y descuentos
- Seguimiento de fechas de vencimiento

### Sistema de ventas
- Proceso de venta simplificado
- Múltiples métodos de pago
- Generación de comprobantes
- Historial de ventas
- Reportes detallados

### Control de caja
- Apertura y cierre diario
- Movimientos de efectivo
- Reconciliación automática
- Reportes de caja

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=.next
```

### Servidor tradicional
```bash
npm run build
npm start
```

## 🐛 Solución de problemas

### Error de conexión a API
- Verificar que la URL de la API esté correcta en `.env.local`
- Asegurar que el backend esté ejecutándose
- Revisar la consola para errores específicos

### Problemas de autenticación
- Limpiar localStorage: `localStorage.clear()`
- Verificar que el token JWT no haya expirado
- Revisar la configuración de CORS en el backend

### Errores de build
- Limpiar cache: `rm -rf .next`
- Reinstalar dependencias: `rm -rf node_modules && npm install`
- Verificar versiones de Node.js y npm

## 📝 Contribución

1. Fork el repositorio
2. Crear una rama para la feature (`git checkout -b feature/amazing-feature`)
3. Commit los cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto es propietario de Boticas Said.

## 🆘 Soporte

Para soporte técnico, contactar al equipo de desarrollo:
- Email: soporte@boticassaid.com
- Issues: GitHub Issues

---

**Desarrollado con ❤️ para Boticas Said**