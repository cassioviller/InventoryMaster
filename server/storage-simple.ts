import { db } from "./db";
import { users, categories, materials, employees, suppliers, thirdParties, materialMovements } from "@shared/schema";
import { eq, desc, asc, count, sql, and, gte, lte } from "drizzle-orm";
import bcrypt from "bcrypt";
import type { 
  User, InsertUser, 
  Category, InsertCategory,
  Material, InsertMaterial,
  Employee, InsertEmployee,
  Supplier, InsertSupplier,
  ThirdParty, InsertThirdParty,
  MaterialMovement, InsertMaterialMovement
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Categories
  getCategories(ownerId: number): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Materials
  getMaterials(ownerId: number): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, updates: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: number): Promise<boolean>;
  getLowStockMaterials(ownerId: number): Promise<Material[]>;

  // Employees
  getEmployees(ownerId: number): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;

  // Suppliers
  getSuppliers(ownerId: number): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;

  // Third parties
  getThirdParties(ownerId: number): Promise<ThirdParty[]>;
  createThirdParty(thirdParty: InsertThirdParty): Promise<ThirdParty>;

  // Movements
  getMovements(ownerId: number): Promise<MaterialMovement[]>;
  createMovement(movement: InsertMaterialMovement): Promise<MaterialMovement>;

  // Dashboard
  getDashboardStats(ownerId: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (insertUser.password) {
      insertUser.password = await bcrypt.hash(insertUser.password, 10);
    }
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.id));
  }

  async getCategories(ownerId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.ownerId, ownerId)).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return category || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  async getMaterials(ownerId: number): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.ownerId, ownerId)).orderBy(asc(materials.name));
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db.insert(materials).values(material).returning();
    return newMaterial;
  }

  async updateMaterial(id: number, updates: Partial<InsertMaterial>): Promise<Material | undefined> {
    const [material] = await db.update(materials).set(updates).where(eq(materials.id, id)).returning();
    return material || undefined;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const result = await db.delete(materials).where(eq(materials.id, id));
    return result.rowCount > 0;
  }

  async getLowStockMaterials(ownerId: number): Promise<Material[]> {
    return await db.select().from(materials)
      .where(and(
        eq(materials.ownerId, ownerId),
        sql`${materials.currentStock} <= ${materials.minStock}`
      ))
      .orderBy(asc(materials.name));
  }

  async getEmployees(ownerId: number): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.ownerId, ownerId)).orderBy(asc(employees.name));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async getSuppliers(ownerId: number): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.ownerId, ownerId)).orderBy(asc(suppliers.name));
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async getThirdParties(ownerId: number): Promise<ThirdParty[]> {
    return await db.select().from(thirdParties).where(eq(thirdParties.ownerId, ownerId)).orderBy(asc(thirdParties.name));
  }

  async createThirdParty(thirdParty: InsertThirdParty): Promise<ThirdParty> {
    const [newThirdParty] = await db.insert(thirdParties).values(thirdParty).returning();
    return newThirdParty;
  }

  async getMovements(ownerId: number): Promise<MaterialMovement[]> {
    return await db.select().from(materialMovements)
      .where(eq(materialMovements.ownerId, ownerId))
      .orderBy(desc(materialMovements.createdAt));
  }

  async createMovement(movement: InsertMaterialMovement): Promise<MaterialMovement> {
    const [newMovement] = await db.insert(materialMovements).values(movement).returning();
    return newMovement;
  }

  async getDashboardStats(ownerId: number): Promise<any> {
    try {
      const [materialCount] = await db.select({ count: count() }).from(materials).where(eq(materials.ownerId, ownerId));
      const [categoryCount] = await db.select({ count: count() }).from(categories).where(eq(categories.ownerId, ownerId));
      const [employeeCount] = await db.select({ count: count() }).from(employees).where(eq(employees.ownerId, ownerId));
      const [supplierCount] = await db.select({ count: count() }).from(suppliers).where(eq(suppliers.ownerId, ownerId));

      return {
        totalMaterials: materialCount?.count || 0,
        totalCategories: categoryCount?.count || 0,
        totalEmployees: employeeCount?.count || 0,
        totalSuppliers: supplierCount?.count || 0,
        totalValue: 0,
        lowStockItems: 0
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalMaterials: 0,
        totalCategories: 0,
        totalEmployees: 0,
        totalSuppliers: 0,
        totalValue: 0,
        lowStockItems: 0
      };
    }
  }
}

export const storage = new DatabaseStorage();