export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PageParams {
  page?: string | string[];
  limit?: string | string[];
  search?: string | string[];
  sortBy?: string | string[];
  sortOrder?: 'asc' | 'desc';
}

export interface AuthContext {
  user: UserDTO | null;
  organization: OrganizationDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
  profileImage?: string;
  createdAt: Date;
}

export interface OrganizationDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  plan: string;
  maxUsers: number;
  owner: UserDTO;
  members: UserDTO[];
  createdAt: Date;
}

export interface PlantationDTO {
  id: string;
  name: string;
  crop: string;
  area: number;
  plantingDate: Date;
  expectedHarvestDate: Date;
  status: string;
  notes?: string;
  expenses: ExpenseDTO[];
  harvests: HarvestDTO[];
  createdAt: Date;
}

export interface ExpenseDTO {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: Date;
  receipt?: string;
  plantation?: PlantationDTO;
  createdAt: Date;
}

export interface HarvestDTO {
  id: string;
  quantity: number;
  unit: string;
  harvestDate: Date;
  revenue?: number;
  notes?: string;
  plantation: PlantationDTO;
  createdAt: Date;
}

export interface AnimalDTO {
  id: string;
  type: string;
  breed?: string;
  quantity: number;
  acquisitionDate: Date;
  status: string;
  notes?: string;
  createdAt: Date;
}

export interface EquipmentDTO {
  id: string;
  name: string;
  type: string;
  acquisitionDate: Date;
  acquisitionCost: number;
  status: string;
  notes?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalPlantations: number;
  totalExpenses: number;
  totalRevenue: number;
  totalAnimals: number;
  recentActivities: ActivityLogDTO[];
  expensesByCategory: Record<string, number>;
  profitByPlantation: Record<string, number>;
}

export interface ActivityLogDTO {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  createdAt: Date;
}
