import { prisma } from './db';

export class AuthService {
  static async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });
  }

  static async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        organizationId: true,
      },
    });
  }

  static async createUser(data: {
    email: string;
    name: string;
    password: string;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: 'USER',
      },
    });
  }

  static async updateUser(userId: string, data: any) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}

export class OrganizationService {
  static async getOrganizationById(orgId: string) {
    return prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        owner: true,
        members: true,
      },
    });
  }

  static async getOrganizationsByUserId(userId: string) {
    return prisma.organization.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { id: userId } } },
        ],
      },
    });
  }

  static async createOrganization(data: {
    name: string;
    slug: string;
    ownerId: string;
    description?: string;
  }) {
    return prisma.organization.create({
      data,
    });
  }

  static async addMemberToOrganization(orgId: string, userId: string) {
    return prisma.organization.update({
      where: { id: orgId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
    });
  }
}

export class PlantationService {
  static async getPlantationsByOrganization(orgId: string) {
    return prisma.plantation.findMany({
      where: { organizationId: orgId },
      include: {
        expenses: true,
        harvests: true,
      },
    });
  }

  static async getPlantationById(id: string) {
    return prisma.plantation.findUnique({
      where: { id },
      include: {
        expenses: true,
        harvests: true,
      },
    });
  }

  static async createPlantation(data: any) {
    return prisma.plantation.create({ data });
  }

  static async updatePlantation(id: string, data: any) {
    return prisma.plantation.update({
      where: { id },
      data,
    });
  }

  static async deletePlantation(id: string) {
    return prisma.plantation.delete({
      where: { id },
    });
  }
}

export class ExpenseService {
  static async getExpensesByOrganization(orgId: string) {
    return prisma.expense.findMany({
      where: { organizationId: orgId },
      orderBy: { date: 'desc' },
    });
  }

  static async getExpensesByPlantation(plantationId: string) {
    return prisma.expense.findMany({
      where: { plantationId },
      orderBy: { date: 'desc' },
    });
  }

  static async createExpense(data: any) {
    return prisma.expense.create({ data });
  }

  static async updateExpense(id: string, data: any) {
    return prisma.expense.update({
      where: { id },
      data,
    });
  }

  static async deleteExpense(id: string) {
    return prisma.expense.delete({
      where: { id },
    });
  }

  static async getTotalExpensesByOrganization(orgId: string) {
    const result = await prisma.expense.aggregate({
      where: { organizationId: orgId },
      _sum: {
        amount: true,
      },
    });
    return result._sum.amount || 0;
  }
}

export class HarvestService {
  static async getHarvestsByOrganization(orgId: string) {
    return prisma.harvest.findMany({
      where: { organizationId: orgId },
      include: { plantation: true },
      orderBy: { harvestDate: 'desc' },
    });
  }

  static async getHarvestsByPlantation(plantationId: string) {
    return prisma.harvest.findMany({
      where: { plantationId },
      orderBy: { harvestDate: 'desc' },
    });
  }

  static async createHarvest(data: any) {
    return prisma.harvest.create({ data });
  }

  static async updateHarvest(id: string, data: any) {
    return prisma.harvest.update({
      where: { id },
      data,
    });
  }

  static async deleteHarvest(id: string) {
    return prisma.harvest.delete({
      where: { id },
    });
  }

  static async getTotalRevenueByOrganization(orgId: string) {
    const result = await prisma.harvest.aggregate({
      where: { organizationId: orgId },
      _sum: {
        revenue: true,
      },
    });
    return result._sum.revenue || 0;
  }
}

export class ActivityLogService {
  static async logActivity(data: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.activityLog.create({ data });
  }

  static async getActivityLogsByUser(userId: string, limit = 50) {
    return prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
