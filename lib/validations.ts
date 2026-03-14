import * as z from 'zod';

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: 'Você deve aceitar os termos',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    newPassword: z.string().min(8, 'Nova senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

// Plantation Schemas
export const plantationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  crop: z.string().min(2, 'Tipo de cultura deve ter no mínimo 2 caracteres'),
  area: z.number().positive('Área deve ser maior que 0'),
  plantingDate: z.date(),
  expectedHarvestDate: z.date(),
  notes: z.string().optional(),
});

// Expense Schemas
export const expenseSchema = z.object({
  category: z.string(),
  description: z.string().min(2, 'Descrição deve ter no mínimo 2 caracteres'),
  amount: z.number().positive('Valor deve ser maior que 0'),
  date: z.date(),
  plantationId: z.string().optional(),
});

// Harvest Schemas
export const harvestSchema = z.object({
  plantationId: z.string().min(1, 'Selecione uma plantação'),
  quantity: z.number().positive('Quantidade deve ser maior que 0'),
  unit: z.string().min(1, 'Unidade obrigatória'),
  harvestDate: z.date(),
  revenue: z.number().positive().optional(),
  notes: z.string().optional(),
});

// Animal Schemas
export const animalSchema = z.object({
  type: z.string().min(2, 'Tipo deve ter no mínimo 2 caracteres'),
  breed: z.string().optional(),
  quantity: z.number().positive('Quantidade deve ser maior que 0'),
  acquisitionDate: z.date(),
  notes: z.string().optional(),
});

// Equipment Schemas
export const equipmentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  type: z.string().min(2, 'Tipo deve ter no mínimo 2 caracteres'),
  acquisitionDate: z.date(),
  acquisitionCost: z.number().positive('Custo deve ser maior que 0'),
  notes: z.string().optional(),
});

// Organization Schemas
export const organizationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  slug: z.string().min(2, 'Slug deve ter no mínimo 2 caracteres').regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type PlantationInput = z.infer<typeof plantationSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type HarvestInput = z.infer<typeof harvestSchema>;
export type AnimalInput = z.infer<typeof animalSchema>;
export type EquipmentInput = z.infer<typeof equipmentSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
