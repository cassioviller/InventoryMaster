import { 
  users, categories, materials, suppliers, employees, thirdParties, 
  materialMovements, auditLogs,
  type User, type InsertUser, type Category, type InsertCategory,
  type Material, type InsertMaterial, type Supplier, type InsertSupplier,
  type Employee, type InsertEmployee, type ThirdParty, type InsertThirdParty,
  type MaterialMovement, type CreateEntry, type CreateExit,
  type MaterialWithDetails, type MovementWithDetails
} from "@shared/schema";
import { db } from "./db-compatibility";
import { eq, and, or, gte, lte, lt, count, sum, desc, asc, ilike } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsers(ownerId?: number): Promise<User[]>;

  // Category methods
  getCategories(ownerId?: number): Promise<Category[]>;
  getCategory(id: number, ownerId?: number): Promise<Category | undefined>;
  createCategory(insertCategory: InsertCategory): Promise<Category>;
  updateCategory(id: number, updateCategory: Partial<InsertCategory>, ownerId?: number): Promise<Category | undefined>;
  deleteCategory(id: number, ownerId?: number): Promise<boolean>;

  // Material methods
  getMaterials(ownerId?: number): Promise<MaterialWithDetails[]>;
  getMaterial(id: number, ownerId?: number): Promise<Material | undefined>;
  createMaterial(insertMaterial: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, updateMaterial: Partial<InsertMaterial>, ownerId?: number): Promise<Material | undefined>;
  deleteMaterial(id: number, ownerId?: number): Promise<boolean>;
  getLowStockMaterials(ownerId?: number): Promise<MaterialWithDetails[]>;

  // Supplier methods
  getSuppliers(ownerId?: number): Promise<Supplier[]>;
  getSupplier(id: number, ownerId?: number): Promise<Supplier | undefined>;
  createSupplier(insertSupplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, updateSupplier: Partial<InsertSupplier>, ownerId?: number): Promise<Supplier | undefined>;
  deleteSupplier(id: number, ownerId?: number): Promise<boolean>;

  // Employee methods
  getEmployees(ownerId?: number): Promise<Employee[]>;
  getEmployee(id: number, ownerId?: number): Promise<Employee | undefined>;
  createEmployee(insertEmployee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, updateEmployee: Partial<InsertEmployee>, ownerId?: number): Promise<Employee | undefined>;
  deleteEmployee(id: number, ownerId?: number): Promise<boolean>;

  // Third party methods
  getThirdParties(ownerId?: number): Promise<ThirdParty[]>;
  getThirdParty(id: number, ownerId?: number): Promise<ThirdParty | undefined>;
  createThirdParty(insertThirdParty: InsertThirdParty): Promise<ThirdParty>;
  updateThirdParty(id: number, updateThirdParty: Partial<InsertThirdParty>, ownerId?: number): Promise<ThirdParty | undefined>;
  deleteThirdParty(id: number, ownerId?: number): Promise<boolean>;

  // Movement methods
  createEntry(entry: CreateEntry, userId: number): Promise<MaterialMovement>;
  createExit(exit: CreateExit, userId: number): Promise<MaterialMovement>;
  getMovements(ownerId?: number): Promise<MovementWithDetails[]>;

  // Dashboard methods
  getDashboardStats(ownerId?: number): Promise<{
    totalMaterials: number;
    lowStockItems: number;
    totalValue: number;
    totalMovements: number;
  }>;

  // Report methods
  getStockReport(categoryId?: number, ownerId?: number): Promise<any[]>;
  getGeneralMovementsReport(startDate?: Date, endDate?: Date, type?: 'entry' | 'exit', ownerId?: number): Promise<any[]>;
  getMaterialConsumptionReport(startDate?: Date, endDate?: Date, categoryId?: number, ownerId?: number): Promise<any[]>;
  getFinancialStockReport(ownerId?: number, materialSearch?: string, categoryId?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(updateUser).where(eq(users.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getUsers(ownerId?: number): Promise<User[]> {
    const conditions = ownerId ? eq(users.ownerId, ownerId) : undefined;
    return await db.select().from(users).where(conditions);
  }

  // Category methods
  async getCategories(ownerId?: number): Promise<Category[]> {
    const conditions = ownerId ? eq(categories.ownerId, ownerId) : undefined;
    return await db.select().from(categories).where(conditions);
  }

  async getCategory(id: number, ownerId?: number): Promise<Category | undefined> {
    const conditions = [eq(categories.id, id)];
    if (ownerId) conditions.push(eq(categories.ownerId, ownerId));
    
    const result = await db.select().from(categories).where(and(...conditions)).limit(1);
    return result[0] || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values({
      ...insertCategory,
      ownerId: insertCategory.ownerId || 1,
    }).returning();
    return result[0];
  }

  async updateCategory(id: number, updateCategory: Partial<InsertCategory>, ownerId?: number): Promise<Category | undefined> {
    const conditions = [eq(categories.id, id)];
    if (ownerId) conditions.push(eq(categories.ownerId, ownerId));

    const result = await db.update(categories).set(updateCategory).where(and(...conditions)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteCategory(id: number, ownerId?: number): Promise<boolean> {
    const conditions = [eq(categories.id, id)];
    if (ownerId) conditions.push(eq(categories.ownerId, ownerId));

    const result = await db.delete(categories).where(and(...conditions));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Material methods
  async getMaterials(ownerId?: number): Promise<MaterialWithDetails[]> {
    const materialsWithCategories = await db
      .select({
        id: materials.id,
        name: materials.name,
        description: materials.description,
        categoryId: materials.categoryId,
        currentStock: materials.currentStock,
        minimumStock: materials.minimumStock,
        unit: materials.unit,
        unitPrice: materials.unitPrice,
        lastSupplierId: materials.lastSupplierId,
        ownerId: materials.ownerId,
        createdAt: materials.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
          ownerId: categories.ownerId,
          createdAt: categories.createdAt,
        }
      })
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .where(ownerId ? eq(materials.ownerId, ownerId) : undefined);

    return materialsWithCategories.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      unit: item.unit,
      unitPrice: item.unitPrice,
      lastSupplierId: item.lastSupplierId,
      ownerId: item.ownerId,
      createdAt: item.createdAt,
      stockStatus: (item.currentStock <= item.minimumStock) ? 'low_stock' as const : 'ok' as const,
      category: item.category || {
        id: 0,
        name: 'Sem categoria',
        description: null,
        ownerId: ownerId || 1,
        createdAt: new Date(),
      }
    }));
  }

  async getMaterial(id: number, ownerId?: number): Promise<Material | undefined> {
    const conditions = [eq(materials.id, id)];
    if (ownerId) conditions.push(eq(materials.ownerId, ownerId));

    const result = await db.select().from(materials).where(and(...conditions)).limit(1);
    return result[0] || undefined;
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const result = await db.insert(materials).values({
      ...insertMaterial,
      ownerId: insertMaterial.ownerId || 1,
    }).returning();
    return result[0];
  }

  async updateMaterial(id: number, updateMaterial: Partial<InsertMaterial>, ownerId?: number): Promise<Material | undefined> {
    const conditions = [eq(materials.id, id)];
    if (ownerId) conditions.push(eq(materials.ownerId, ownerId));

    const result = await db.update(materials).set(updateMaterial).where(and(...conditions)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteMaterial(id: number, ownerId?: number): Promise<boolean> {
    const conditions = [eq(materials.id, id)];
    if (ownerId) conditions.push(eq(materials.ownerId, ownerId));

    const result = await db.delete(materials).where(and(...conditions));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getLowStockMaterials(ownerId?: number): Promise<MaterialWithDetails[]> {
    const result = await db
      .select({
        id: materials.id,
        name: materials.name,
        description: materials.description,
        categoryId: materials.categoryId,
        currentStock: materials.currentStock,
        minimumStock: materials.minimumStock,
        unit: materials.unit,
        unitPrice: materials.unitPrice,
        lastSupplierId: materials.lastSupplierId,
        ownerId: materials.ownerId,
        createdAt: materials.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
          ownerId: categories.ownerId,
          createdAt: categories.createdAt,
        }
      })
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .where(
        and(
          lte(materials.currentStock, materials.minimumStock),
          ownerId ? eq(materials.ownerId, ownerId) : undefined
        )
      );

    return result.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      unit: item.unit,
      unitPrice: item.unitPrice,
      lastSupplierId: item.lastSupplierId,
      ownerId: item.ownerId,
      createdAt: item.createdAt,
      stockStatus: 'low_stock' as const,
      category: item.category || {
        id: 0,
        name: 'Sem categoria',
        description: null,
        ownerId: ownerId || 1,
        createdAt: new Date(),
      }
    }));
  }

  // Supplier methods
  async getSuppliers(ownerId?: number): Promise<Supplier[]> {
    const conditions = ownerId ? eq(suppliers.ownerId, ownerId) : undefined;
    return await db.select().from(suppliers).where(conditions);
  }

  async getSupplier(id: number, ownerId?: number): Promise<Supplier | undefined> {
    const conditions = [eq(suppliers.id, id)];
    if (ownerId) conditions.push(eq(suppliers.ownerId, ownerId));
    
    const result = await db.select().from(suppliers).where(and(...conditions)).limit(1);
    return result[0] || undefined;
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values({
      ...insertSupplier,
      ownerId: insertSupplier.ownerId || 1,
    }).returning();
    return result[0];
  }

  async updateSupplier(id: number, updateSupplier: Partial<InsertSupplier>, ownerId?: number): Promise<Supplier | undefined> {
    const conditions = [eq(suppliers.id, id)];
    if (ownerId) conditions.push(eq(suppliers.ownerId, ownerId));

    const result = await db.update(suppliers).set(updateSupplier).where(and(...conditions)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteSupplier(id: number, ownerId?: number): Promise<boolean> {
    const conditions = [eq(suppliers.id, id)];
    if (ownerId) conditions.push(eq(suppliers.ownerId, ownerId));

    const result = await db.delete(suppliers).where(and(...conditions));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Employee methods
  async getEmployees(ownerId?: number): Promise<Employee[]> {
    try {
      const conditions = ownerId ? eq(employees.ownerId, ownerId) : undefined;
      return await db.select().from(employees).where(conditions);
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw new Error('Failed to fetch employees');
    }
  }

  async getEmployee(id: number, ownerId?: number): Promise<Employee | undefined> {
    const conditions = [eq(employees.id, id)];
    if (ownerId) conditions.push(eq(employees.ownerId, ownerId));
    
    const result = await db.select().from(employees).where(and(...conditions)).limit(1);
    return result[0] || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const result = await db.insert(employees).values({
      ...insertEmployee,
      ownerId: insertEmployee.ownerId || 1,
    }).returning();
    return result[0];
  }

  async updateEmployee(id: number, updateEmployee: Partial<InsertEmployee>, ownerId?: number): Promise<Employee | undefined> {
    const conditions = [eq(employees.id, id)];
    if (ownerId) conditions.push(eq(employees.ownerId, ownerId));

    const result = await db.update(employees).set(updateEmployee).where(and(...conditions)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteEmployee(id: number, ownerId?: number): Promise<boolean> {
    const conditions = [eq(employees.id, id)];
    if (ownerId) conditions.push(eq(employees.ownerId, ownerId));

    const result = await db.delete(employees).where(and(...conditions));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Third party methods
  async getThirdParties(ownerId?: number): Promise<ThirdParty[]> {
    const conditions = ownerId ? eq(thirdParties.ownerId, ownerId) : undefined;
    return await db.select().from(thirdParties).where(conditions);
  }

  async getThirdParty(id: number, ownerId?: number): Promise<ThirdParty | undefined> {
    const conditions = [eq(thirdParties.id, id)];
    if (ownerId) conditions.push(eq(thirdParties.ownerId, ownerId));
    
    const result = await db.select().from(thirdParties).where(and(...conditions)).limit(1);
    return result[0] || undefined;
  }

  async createThirdParty(insertThirdParty: InsertThirdParty): Promise<ThirdParty> {
    const result = await db.insert(thirdParties).values({
      ...insertThirdParty,
      ownerId: insertThirdParty.ownerId || 1,
    }).returning();
    return result[0];
  }

  async updateThirdParty(id: number, updateThirdParty: Partial<InsertThirdParty>, ownerId?: number): Promise<ThirdParty | undefined> {
    const conditions = [eq(thirdParties.id, id)];
    if (ownerId) conditions.push(eq(thirdParties.ownerId, ownerId));

    const result = await db.update(thirdParties).set(updateThirdParty).where(and(...conditions)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteThirdParty(id: number, ownerId?: number): Promise<boolean> {
    const conditions = [eq(thirdParties.id, id)];
    if (ownerId) conditions.push(eq(thirdParties.ownerId, ownerId));

    const result = await db.delete(thirdParties).where(and(...conditions));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Movement methods
  async createEntry(entry: CreateEntry, userId: number): Promise<MaterialMovement> {
    const result = await db.insert(materialMovements).values({
      type: entry.type,
      userId: userId,
      originType: entry.originType,
      supplierId: entry.supplierId,
      returnEmployeeId: entry.returnEmployeeId,
      returnThirdPartyId: entry.returnThirdPartyId,
      notes: entry.notes,
    }).returning();

    // Update material stock for each item
    for (const item of entry.items) {
      // Get current stock first
      const [currentMaterial] = await db
        .select({ currentStock: materials.currentStock })
        .from(materials)
        .where(eq(materials.id, item.materialId));

      if (currentMaterial) {
        await db
          .update(materials)
          .set({
            currentStock: currentMaterial.currentStock + item.quantity,
            unitPrice: item.unitPrice || undefined,
          })
          .where(eq(materials.id, item.materialId));
      }
    }

    return result[0];
  }

  async createExit(exit: CreateExit, userId: number): Promise<MaterialMovement> {
    const result = await db.insert(materialMovements).values({
      type: exit.type,
      userId: userId,
      destinationType: exit.destinationType,
      destinationEmployeeId: exit.destinationEmployeeId,
      destinationThirdPartyId: exit.destinationThirdPartyId,
      notes: exit.notes,
    }).returning();

    // Update material stock for each item
    for (const item of exit.items) {
      // Get current stock first
      const [currentMaterial] = await db
        .select({ currentStock: materials.currentStock })
        .from(materials)
        .where(eq(materials.id, item.materialId));

      if (currentMaterial) {
        await db
          .update(materials)
          .set({
            currentStock: Math.max(0, currentMaterial.currentStock - item.quantity),
          })
          .where(eq(materials.id, item.materialId));
      }
    }

    return result[0];
  }

  async getMovements(ownerId?: number): Promise<MovementWithDetails[]> {
    const result = await db
      .select({
        id: materialMovements.id,
        type: materialMovements.type,
        date: materialMovements.date,
        userId: materialMovements.userId,
        originType: materialMovements.originType,
        supplierId: materialMovements.supplierId,
        returnEmployeeId: materialMovements.returnEmployeeId,
        returnThirdPartyId: materialMovements.returnThirdPartyId,
        destinationType: materialMovements.destinationType,
        destinationEmployeeId: materialMovements.destinationEmployeeId,
        destinationThirdPartyId: materialMovements.destinationThirdPartyId,
        notes: materialMovements.notes,
        createdAt: materialMovements.createdAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
        },
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
        },
        employee: {
          id: employees.id,
          name: employees.name,
        },
        thirdParty: {
          id: thirdParties.id,
          name: thirdParties.name,
        }
      })
      .from(materialMovements)
      .leftJoin(users, eq(materialMovements.userId, users.id))
      .leftJoin(suppliers, eq(materialMovements.supplierId, suppliers.id))
      .leftJoin(employees, eq(materialMovements.destinationEmployeeId, employees.id))
      .leftJoin(thirdParties, eq(materialMovements.destinationThirdPartyId, thirdParties.id))
      .orderBy(desc(materialMovements.createdAt));

    return result as MovementWithDetails[];
  }

  // Dashboard methods
  async getDashboardStats(ownerId?: number): Promise<{
    totalMaterials: number;
    lowStockItems: number;
    totalValue: number;
    totalMovements: number;
  }> {
    try {
      const statsConditions = ownerId ? eq(materials.ownerId, ownerId) : undefined;

      const [materialStats] = await db
        .select({
          totalMaterials: count(),
        })
        .from(materials)
        .where(statsConditions);

      const [lowStockStats] = await db
        .select({
          lowStockItems: count(),
        })
        .from(materials)
        .where(
          and(
            lte(materials.currentStock, materials.minimumStock),
            statsConditions
          )
        );

      const [movementStats] = await db
        .select({
          totalMovements: count(),
        })
        .from(materialMovements);

      // Calculate total value manually
      const allMaterials = await db
        .select({
          currentStock: materials.currentStock,
          unitPrice: materials.unitPrice,
        })
        .from(materials)
        .where(statsConditions);

      const totalValue = allMaterials.reduce((sum, material) => {
        const price = parseFloat(material.unitPrice || '0');
        const stock = material.currentStock || 0;
        return sum + (price * stock);
      }, 0);

      return {
        totalMaterials: materialStats?.totalMaterials || 0,
        lowStockItems: lowStockStats?.lowStockItems || 0,
        totalValue: totalValue,
        totalMovements: movementStats?.totalMovements || 0,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw new Error('Failed to fetch dashboard stats');
    }
  }

  // Report methods
  async getStockReport(categoryId?: number, ownerId?: number): Promise<any[]> {
    const conditions = [];
    if (categoryId) conditions.push(eq(materials.categoryId, categoryId));
    if (ownerId) conditions.push(eq(materials.ownerId, ownerId));
    
    return await db
      .select()
      .from(materials)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  }

  async getGeneralMovementsReport(startDate?: Date, endDate?: Date, type?: 'entry' | 'exit', ownerId?: number): Promise<any[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(materialMovements.createdAt, startDate));
    if (endDate) conditions.push(lte(materialMovements.createdAt, endDate));
    if (type) conditions.push(eq(materialMovements.type, type));
    
    return await db
      .select()
      .from(materialMovements)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(materialMovements.createdAt));
  }

  async getMaterialConsumptionReport(startDate?: Date, endDate?: Date, categoryId?: number, ownerId?: number): Promise<any[]> {
    const conditions = [eq(materialMovements.type, 'exit')];
    if (startDate) conditions.push(gte(materialMovements.createdAt, startDate));
    if (endDate) conditions.push(lte(materialMovements.createdAt, endDate));
    
    return await db
      .select()
      .from(materialMovements)
      .where(and(...conditions))
      .orderBy(desc(materialMovements.createdAt));
  }

  async getFinancialStockReport(ownerId?: number, materialSearch?: string, categoryId?: number): Promise<any[]> {
    const conditions = [];
    if (materialSearch) {
      conditions.push(ilike(materials.name, `%${materialSearch}%`));
    }
    if (categoryId) {
      conditions.push(eq(materials.categoryId, categoryId));
    }
    if (ownerId) {
      conditions.push(eq(materials.ownerId, ownerId));
    }

    const materialsData = await db
      .select({
        id: materials.id,
        name: materials.name,
        currentStock: materials.currentStock,
        unitPrice: materials.unitPrice,
      })
      .from(materials)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Calculate total value in JavaScript
    return materialsData.map(material => ({
      ...material,
      totalValue: material.currentStock * parseFloat(material.unitPrice || '0'),
    }));
  }
}

export const storage = new DatabaseStorage();