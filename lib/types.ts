/**
 * TypeScript interfaces for the application
 */

// User related types
export interface User {
  id?: number;
  dni: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  rol: 'administrador' | 'trabajador';
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

// Product related types
export interface Product {
  id?: number;
  codigoBarras: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoria?: string;
  laboratorio?: string;
  fechaVencimiento?: string;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface ProductoRequest {
  codigoBarras: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoria?: string;
  laboratorio?: string;
  fechaVencimiento?: string;
}

// Sale related types
export interface Sale {
  id?: number;
  numeroComprobante: string;
  tipoComprobante: 'boleta' | 'factura';
  cliente?: string;
  total: number;
  subtotal: number;
  impuesto: number;
  descuento: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'yape' | 'plin';
  estado: 'pendiente' | 'completado' | 'cancelado';
  vendedor: string;
  fechaVenta: string;
  productos: SaleProduct[];
}

export interface SaleProduct {
  id?: number;
  codigoBarras: string;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

// Cash register types
export interface CashRegister {
  id?: number;
  dniUsuario: string;
  montoInicial: number;
  montoFinal?: number;
  montoEfectivo: number;
  montoTarjeta: number;
  montoYape: number;
  estado: 'abierto' | 'cerrado';
  fechaApertura: string;
  fechaCierre?: string;
  observaciones?: string;
}

export interface CashMovement {
  id?: number;
  cajaId: number;
  tipo: 'entrada' | 'salida';
  concepto: string;
  monto: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'yape' | 'plin';
  descripcion?: string;
  fechaMovimiento: string;
}

// Stock types
export interface StockItem {
  id?: number;
  codigoBarras: string;
  nombre: string;
  stock: number;
  stockMinimo: number;
  categoria?: string;
  fechaUltimaEntrada?: string;
  fechaUltimaSalida?: string;
}

export interface StockMovement {
  id?: number;
  codigoBarras: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo: string;
  usuario: string;
  fechaMovimiento: string;
}

// Dashboard types
export interface DashboardData {
  ventasDia: {
    monto: number;
    variacion: number;
  };
  ventasMes: {
    monto: number;
    variacion: number;
  };
  saldoCaja: {
    total: number;
    efectivo: number;
    yape: number;
    tarjeta?: number;
  };
  clientesAtendidos: {
    cantidad: number;
    variacion: number;
  };
  ultimasVentas: {
    boleta: string;
    cliente: string;
    monto: number;
    fecha?: string;
  }[];
  productosMasVendidos: {
    nombre: string;
    unidades: number;
    porcentaje: number;
  }[];
  productosCriticos: {
    nombre: string;
    stock: number;
    stockMinimo: number;
  }[];
  productosVencimiento: {
    nombre: string;
    dias: number;
    fechaVencimiento: string;
  }[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Form types
export interface LoginForm {
  dni: string;
  password: string;
}

export interface ProductForm {
  codigoBarras: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoria?: string;
  laboratorio?: string;
  fechaVencimiento?: string;
}

export interface SaleForm {
  cliente?: string;
  metodoPago: 'efectivo' | 'tarjeta' | 'yape' | 'plin';
  productos: {
    codigoBarras: string;
    cantidad: number;
  }[];
}

// Filter types
export interface BoletaFilters {
  page: number;
  limit: number;
  search?: string;
  from?: string;
  to?: string;
  metodoPago?: string;
  vendedor?: string;
}

export interface ProductFilters {
  search?: string;
  categoria?: string;
  laboratorio?: string;
  stockBajo?: boolean;
  proximoVencimiento?: boolean;
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  endpoint: string;
  timestamp: string;
}