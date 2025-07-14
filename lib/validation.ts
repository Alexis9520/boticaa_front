import { z } from 'zod';

/**
 * Validation schemas using Zod
 */

// User schemas
export const userSchema = z.object({
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos').regex(/^\d{8}$/, 'El DNI debe contener solo números'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre no puede exceder 50 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'El apellido no puede exceder 50 caracteres'),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().regex(/^\d{9}$/, 'El teléfono debe tener 9 dígitos').optional(),
  rol: z.enum(['administrador', 'trabajador'], { required_error: 'El rol es requerido' }),
  activo: z.boolean().default(true),
});

// Login schema
export const loginSchema = z.object({
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos').regex(/^\d{8}$/, 'El DNI debe contener solo números'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100, 'La contraseña no puede exceder 100 caracteres'),
});

// Product schemas
export const productSchema = z.object({
  codigoBarras: z.string().min(1, 'El código de barras es requerido').max(50, 'El código de barras no puede exceder 50 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200, 'El nombre no puede exceder 200 caracteres'),
  descripcion: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
  precio: z.number().positive('El precio debe ser positivo').max(999999.99, 'El precio no puede exceder 999,999.99'),
  stock: z.number().int('El stock debe ser un número entero').min(0, 'El stock no puede ser negativo'),
  stockMinimo: z.number().int('El stock mínimo debe ser un número entero').min(0, 'El stock mínimo no puede ser negativo'),
  categoria: z.string().max(100, 'La categoría no puede exceder 100 caracteres').optional(),
  laboratorio: z.string().max(100, 'El laboratorio no puede exceder 100 caracteres').optional(),
  fechaVencimiento: z.string().datetime().optional(),
});

// Sale schemas
export const saleProductSchema = z.object({
  codigoBarras: z.string().min(1, 'El código de barras es requerido'),
  cantidad: z.number().int('La cantidad debe ser un número entero').positive('La cantidad debe ser positiva'),
  precio: z.number().positive('El precio debe ser positivo').optional(),
});

export const saleSchema = z.object({
  cliente: z.string().max(200, 'El nombre del cliente no puede exceder 200 caracteres').optional(),
  metodoPago: z.enum(['efectivo', 'tarjeta', 'yape', 'plin'], { required_error: 'El método de pago es requerido' }),
  productos: z.array(saleProductSchema).min(1, 'Debe agregar al menos un producto'),
  descuento: z.number().min(0, 'El descuento no puede ser negativo').max(100, 'El descuento no puede exceder 100%').default(0),
});

// Cash register schemas
export const cashMovementSchema = z.object({
  tipo: z.enum(['entrada', 'salida'], { required_error: 'El tipo de movimiento es requerido' }),
  concepto: z.string().min(5, 'El concepto debe tener al menos 5 caracteres').max(200, 'El concepto no puede exceder 200 caracteres'),
  monto: z.number().positive('El monto debe ser positivo').max(999999.99, 'El monto no puede exceder 999,999.99'),
  metodoPago: z.enum(['efectivo', 'tarjeta', 'yape', 'plin'], { required_error: 'El método de pago es requerido' }),
  descripcion: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
});

export const cashRegisterSchema = z.object({
  montoInicial: z.number().min(0, 'El monto inicial no puede ser negativo').max(999999.99, 'El monto inicial no puede exceder 999,999.99'),
  observaciones: z.string().max(500, 'Las observaciones no pueden exceder 500 caracteres').optional(),
});

// Stock schemas
export const stockUpdateSchema = z.object({
  cantidad: z.number().int('La cantidad debe ser un número entero').positive('La cantidad debe ser positiva'),
  motivo: z.string().min(5, 'El motivo debe tener al menos 5 caracteres').max(200, 'El motivo no puede exceder 200 caracteres'),
  tipo: z.enum(['entrada', 'salida'], { required_error: 'El tipo de movimiento es requerido' }),
});

// Filter schemas
export const boletaFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  metodoPago: z.enum(['efectivo', 'tarjeta', 'yape', 'plin']).optional(),
  vendedor: z.string().optional(),
});

export const productFiltersSchema = z.object({
  search: z.string().optional(),
  categoria: z.string().optional(),
  laboratorio: z.string().optional(),
  stockBajo: z.boolean().optional(),
  proximoVencimiento: z.boolean().optional(),
});

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres').max(100, 'La contraseña no puede exceder 100 caracteres'),
  confirmPassword: z.string().min(6, 'La confirmación de contraseña es requerida'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Profile update schema
export const profileUpdateSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre no puede exceder 50 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(50, 'El apellido no puede exceder 50 caracteres'),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().regex(/^\d{9}$/, 'El teléfono debe tener 9 dígitos').optional(),
});

// Export all schemas
export const schemas = {
  user: userSchema,
  login: loginSchema,
  product: productSchema,
  sale: saleSchema,
  saleProduct: saleProductSchema,
  cashMovement: cashMovementSchema,
  cashRegister: cashRegisterSchema,
  stockUpdate: stockUpdateSchema,
  boletaFilters: boletaFiltersSchema,
  productFilters: productFiltersSchema,
  passwordChange: passwordChangeSchema,
  profileUpdate: profileUpdateSchema,
} as const;

// Type inference from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type SaleFormData = z.infer<typeof saleSchema>;
export type CashMovementFormData = z.infer<typeof cashMovementSchema>;
export type CashRegisterFormData = z.infer<typeof cashRegisterSchema>;
export type StockUpdateFormData = z.infer<typeof stockUpdateSchema>;
export type BoletaFiltersData = z.infer<typeof boletaFiltersSchema>;
export type ProductFiltersData = z.infer<typeof productFiltersSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;