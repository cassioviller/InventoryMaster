import {
  users, categories, materials, employees, suppliers, thirdParties,
  materialMovements, auditLogs,
  type User, type InsertUser, type Category, type InsertCategory,
  type Material, type InsertMaterial, type Employee, type InsertEmployee,
  type Supplier, type InsertSupplier, type ThirdParty, type InsertThirdParty,
  type MaterialMovement, type AuditLog, type CreateEntry, type CreateExit,
  type MovementItem
} from "../shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, gte, lte, desc, asc, lt, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

// Data types for creating entries and exits
export interface CreateEntryData {
  type: 'entry';
  supplierId: number;
  items: Array<{
    materialId: number;
    quantity: number;
    unitPrice: string;
  }>;
  observation?: string;
}

export interface CreateExitData {
  type: 'exit';
  employeeId?: number;
  thirdPartyId?: number;
  items: Array<{
    materialId: number;
    quantity: number;
    unitPrice: string;
  }>;
  observation?: string;
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  verifyPassword(password: string, hash: string): Promise<boolean>;

  // Categories
  getAllCategories(ownerId?: number): Promise<Category[]>;
  getCategory(id: number, ownerId?: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>, ownerId?: number): Promise<Category>;
  deleteCategory(id: number, ownerId?: number): Promise<void>;

  // Materials
  getAllMaterials(ownerId?: number): Promise<(Material & { category: Category })[]>;
  getMaterial(id: number, ownerId?: number): Promise<Material | undefined>;
  getMaterialsWithLowStock(ownerId?: number): Promise<(Material & { category: Category })[]>;
  getMaterialsByCategory(categoryId: number, ownerId?: number): Promise<Material[]>;
  searchMaterials(query: string, ownerId?: number): Promise<(Material & { category: Category })[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<InsertMaterial>, ownerId?: number): Promise<Material>;
  deleteMaterial(id: number, ownerId?: number): Promise<void>;
  updateMaterialStock(id: number, quantity: number, operation: 'add' | 'subtract', ownerId?: number): Promise<void>;

  // Employees
  getAllEmployees(ownerId?: number): Promise<Employee[]>;
  getEmployee(id: number, ownerId?: number): Promise<Employee | undefined>;
  getActiveEmployees(ownerId?: number): Promise<Employee[]>;
  searchEmployees(query: string, ownerId?: number): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>, ownerId?: number): Promise<Employee>;
  deleteEmployee(id: number, ownerId?: number): Promise<void>;

  // Suppliers
  getAllSuppliers(ownerId?: number): Promise<Supplier[]>;
  getSupplier(id: number, ownerId?: number): Promise<Supplier | undefined>;
  getActiveSuppliers(ownerId?: number): Promise<Supplier[]>;
  searchSuppliers(query: string, ownerId?: number): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>, ownerId?: number): Promise<Supplier>;
  deleteSupplier(id: number, ownerId?: number): Promise<void>;

  // Third Parties
  getAllThirdParties(ownerId?: number): Promise<ThirdParty[]>;
  getThirdParty(id: number, ownerId?: number): Promise<ThirdParty | undefined>;
  getActiveThirdParties(ownerId?: number): Promise<ThirdParty[]>;
  searchThirdParties(query: string, ownerId?: number): Promise<ThirdParty[]>;
  createThirdParty(thirdParty: InsertThirdParty): Promise<ThirdParty>;
  updateThirdParty(id: number, thirdParty: Partial<InsertThirdParty>, ownerId?: number): Promise<ThirdParty>;
  deleteThirdParty(id: number, ownerId?: number): Promise<void>;

  // Material Movements
  getAllMovements(ownerId?: number): Promise<MaterialMovement[]>;
  getMovement(id: number, ownerId?: number): Promise<MaterialMovement | undefined>;
  getMovementsByType(type: 'entry' | 'exit', ownerId?: number): Promise<MaterialMovement[]>;
  getMovementsByDateRange(startDate: Date, endDate: Date, ownerId?: number): Promise<MaterialMovement[]>;
  getMovementsByEmployee(employeeId: number, ownerId?: number): Promise<MaterialMovement[]>;
  getTodayMovements(ownerId?: number): Promise<{ entries: number; exits: number }>;
  createEntry(userId: number, data: CreateEntryData): Promise<MaterialMovement>;
  createExit(userId: number, data: CreateExitData): Promise<MaterialMovement>;

  // Dashboard Statistics
  getDashboardStats(ownerId?: number): Promise<{
    totalMaterials: number;
    entriesToday: number;
    exitsToday: number;
    criticalItems: number;
  }>;

  // Reports
  getEmployeeMovementReport(employeeId?: number, month?: number, year?: number, ownerId?: number): Promise<any[]>;
  getStockReport(categoryId?: number, ownerId?: number): Promise<any[]>;
  getGeneralMovementsReport(startDate?: Date, endDate?: Date, type?: 'entry' | 'exit', ownerId?: number): Promise<any[]>;
  getMaterialConsumptionReport(startDate?: Date, endDate?: Date, categoryId?: number, ownerId?: number): Promise<any[]>;
  getFinancialStockReport(ownerId?: number, materialSearch?: string, categoryId?: number): Promise<any[]>;

  // Audit Log
  createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  
  // Users methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Email field removed from schema
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await db
      .insert(users)
      .values({ ...user, password: hashedPassword })
      .returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const updateData = { ...user };
    if (user.password) {
      updateData.password = await bcrypt.hash(user.password, 10);
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Categories methods
  async getAllCategories(ownerId?: number): Promise<Category[]> {
    const query = db.select().from(categories);
    if (ownerId) {
      query.where(eq(categories.ownerId, ownerId));
    }
    return await query;
  }

  async getCategory(id: number, ownerId?: number): Promise<Category | undefined> {
    const conditions = [eq(categories.id, id)];
    if (ownerId) {
      conditions.push(eq(categories.ownerId, ownerId));
    }
    
    const [category] = await db
      .select()
      .from(categories)
      .where(and(...conditions));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>, ownerId?: number): Promise<Category> {
    const conditions = [eq(categories.id, id)];
    if (ownerId) {
      conditions.push(eq(categories.ownerId, ownerId));
    }

    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(and(...conditions))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number, ownerId?: number): Promise<void> {
    const conditions = [eq(categories.id, id)];
    if (ownerId) {
      conditions.push(eq(categories.ownerId, ownerId));
    }
    await db.delete(categories).where(and(...conditions));
  }

  // Materials methods
  async getAllMaterials(ownerId?: number): Promise<(Material & { category: Category })[]> {
    const materialsWithCategories = await db
      .select({
        id: materials.id,
        name: materials.name,
        description: materials.description,
        categoryId: materials.categoryId,
        unit: materials.unit,
        quantity: materials.quantity,
        minQuantity: materials.minQuantity,
        unitPrice: materials.unitPrice,
        totalValue: materials.totalValue,
        location: materials.location,
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
      unit: item.unit,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unitPrice: item.unitPrice,
      totalValue: item.totalValue,
      location: item.location,
      ownerId: item.ownerId,
      createdAt: item.createdAt,
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
    if (ownerId) {
      conditions.push(eq(materials.ownerId, ownerId));
    }
    
    const [material] = await db
      .select()
      .from(materials)
      .where(and(...conditions));
    return material || undefined;
  }

  async getMaterialsWithLowStock(ownerId?: number): Promise<(Material & { category: Category })[]> {
    const lowStockMaterials = await db
      .select({
        id: materials.id,
        name: materials.name,
        description: materials.description,
        categoryId: materials.categoryId,
        unit: materials.unit,
        quantity: materials.quantity,
        minQuantity: materials.minQuantity,
        unitPrice: materials.unitPrice,
        totalValue: materials.totalValue,
        location: materials.location,
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
          lt(materials.quantity, materials.minQuantity),
          ownerId ? eq(materials.ownerId, ownerId) : undefined
        )
      );

    return lowStockMaterials.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      unit: item.unit,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unitPrice: item.unitPrice,
      totalValue: item.totalValue,
      location: item.location,
      ownerId: item.ownerId,
      createdAt: item.createdAt,
      category: item.category || {
        id: 0,
        name: 'Sem categoria',
        description: null,
        ownerId: ownerId || 1,
        createdAt: new Date(),
      }
    }));
  }

  async getMaterialsByCategory(categoryId: number, ownerId?: number): Promise<Material[]> {
    const conditions = [eq(materials.categoryId, categoryId)];
    if (ownerId) {
      conditions.push(eq(materials.ownerId, ownerId));
    }
    
    return await db
      .select()
      .from(materials)
      .where(and(...conditions));
  }

  async searchMaterials(query: string, ownerId?: number): Promise<(Material & { category: Category })[]> {
    const conditions = [
      or(
        ilike(materials.name, `%${query}%`),
        ilike(materials.description, `%${query}%`)
      )
    ];
    if (ownerId) {
      conditions.push(eq(materials.ownerId, ownerId));
    }

    const materialsWithCategories = await db
      .select({
        id: materials.id,
        name: materials.name,
        description: materials.description,
        categoryId: materials.categoryId,
        unit: materials.unit,
        quantity: materials.quantity,
        minQuantity: materials.minQuantity,
        unitPrice: materials.unitPrice,
        totalValue: materials.totalValue,
        location: materials.location,
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
      .where(and(...conditions));

    return materialsWithCategories.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      unit: item.unit,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unitPrice: item.unitPrice,
      totalValue: item.totalValue,
      location: item.location,
      ownerId: item.ownerId,
      createdAt: item.createdAt,
      category: item.category || {
        id: 0,
        name: 'Sem categoria',
        description: null,
        ownerId: ownerId || 1,
        createdAt: new Date(),
      }
    }));
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db
      .insert(materials)
      .values({
        ...material,
        quantity: material.quantity || 0,
      })
      .returning();
    return newMaterial;
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>, ownerId?: number): Promise<Material> {
    const conditions = [eq(materials.id, id)];
    if (ownerId) {
      conditions.push(eq(materials.ownerId, ownerId));
    }

    const [updatedMaterial] = await db
      .update(materials)
      .set(material)
      .where(and(...conditions))
      .returning();
    return updatedMaterial;
  }

  async deleteMaterial(id: number, ownerId?: number): Promise<void> {
    const conditions = [eq(materials.id, id)];
    if (ownerId) {
      conditions.push(eq(materials.ownerId, ownerId));
    }
    await db.delete(materials).where(and(...conditions));
  }

  async updateMaterialStock(id: number, quantity: number, operation: 'add' | 'subtract', ownerId?: number): Promise<void> {
    const material = await this.getMaterial(id, ownerId);
    if (!material) {
      throw new Error('Material not found');
    }

    const newQuantity = operation === 'add' 
      ? material.quantity + quantity 
      : material.quantity - quantity;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }

    await db
      .update(materials)
      .set({ 
        quantity: newQuantity,
        totalValue: (parseFloat(material.unitPrice) * newQuantity).toFixed(2)
      })
      .where(
        and(
          eq(materials.id, id),
          ownerId ? eq(materials.ownerId, ownerId) : undefined
        )
      );
  }

  // Employees methods
  async getAllEmployees(ownerId?: number): Promise<Employee[]> {
    const query = db.select().from(employees);
    if (ownerId) {
      query.where(eq(employees.ownerId, ownerId));
    }
    return await query;
  }

  async getEmployee(id: number, ownerId?: number): Promise<Employee | undefined> {
    const conditions = [eq(employees.id, id)];
    if (ownerId) {
      conditions.push(eq(employees.ownerId, ownerId));
    }
    
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(...conditions));
    return employee || undefined;
  }

  async getActiveEmployees(ownerId?: number): Promise<Employee[]> {
    const conditions = [eq(employees.active, true)];
    if (ownerId) {
      conditions.push(eq(employees.ownerId, ownerId));
    }
    
    return await db
      .select()
      .from(employees)
      .where(and(...conditions));
  }

  async searchEmployees(query: string, ownerId?: number): Promise<Employee[]> {
    const conditions = [
      or(
        ilike(employees.name, `%${query}%`),
        ilike(employees.position, `%${query}%`)
      ),
      eq(employees.active, true)
    ];
    if (ownerId) {
      conditions.push(eq(employees.ownerId, ownerId));
    }
    
    return await db
      .select()
      .from(employees)
      .where(and(...conditions));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>, ownerId?: number): Promise<Employee> {
    const conditions = [eq(employees.id, id)];
    if (ownerId) {
      conditions.push(eq(employees.ownerId, ownerId));
    }

    const [updatedEmployee] = await db
      .update(employees)
      .set(employee)
      .where(and(...conditions))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: number, ownerId?: number): Promise<void> {
    const conditions = [eq(employees.id, id)];
    if (ownerId) {
      conditions.push(eq(employees.ownerId, ownerId));
    }
    await db.delete(employees).where(and(...conditions));
  }

  // Suppliers methods  
  async getAllSuppliers(ownerId?: number): Promise<Supplier[]> {
    const query = db.select().from(suppliers);
    if (ownerId) {
      query.where(eq(suppliers.ownerId, ownerId));
    }
    return await query;
  }

  async getSupplier(id: number, ownerId?: number): Promise<Supplier | undefined> {
    const conditions = [eq(suppliers.id, id)];
    if (ownerId) {
      conditions.push(eq(suppliers.ownerId, ownerId));
    }
    
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(and(...conditions));
    return supplier || undefined;
  }

  async getActiveSuppliers(ownerId?: number): Promise<Supplier[]> {
    const conditions = [eq(suppliers.active, true)];
    if (ownerId) {
      conditions.push(eq(suppliers.ownerId, ownerId));
    }
    
    return await db
      .select()
      .from(suppliers)
      .where(and(...conditions));
  }

  async searchSuppliers(query: string, ownerId?: number): Promise<Supplier[]> {
    const conditions = [
      or(
        ilike(suppliers.name, `%${query}%`),
        ilike(suppliers.cnpj, `%${query}%`)
      ),
      eq(suppliers.active, true)
    ];
    if (ownerId) {
      conditions.push(eq(suppliers.ownerId, ownerId));
    }
    
    return await db
      .select()
      .from(suppliers)
      .where(and(...conditions));
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db
      .insert(suppliers)
      .values(supplier)
      .returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>, ownerId?: number): Promise<Supplier> {
    const conditions = [eq(suppliers.id, id)];
    if (ownerId) {
      conditions.push(eq(suppliers.ownerId, ownerId));
    }

    const [updatedSupplier] = await db
      .update(suppliers)
      .set(supplier)
      .where(and(...conditions))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: number, ownerId?: number): Promise<void> {
    const conditions = [eq(suppliers.id, id)];
    if (ownerId) {
      conditions.push(eq(suppliers.ownerId, ownerId));
    }
    await db.delete(suppliers).where(and(...conditions));
  }

  // Third parties methods
  async getAllThirdParties(ownerId?: number): Promise<ThirdParty[]> {
    const query = db.select().from(thirdParties);
    if (ownerId) {
      query.where(eq(thirdParties.ownerId, ownerId));
    }
    return await query;
  }

  async getThirdParty(id: number, ownerId?: number): Promise<ThirdParty | undefined> {
    const conditions = [eq(thirdParties.id, id)];
    if (ownerId) {
      conditions.push(eq(thirdParties.ownerId, ownerId));
    }
    
    const [thirdParty] = await db
      .select()
      .from(thirdParties)
      .where(and(...conditions));
    return thirdParty || undefined;
  }

  async getActiveThirdParties(ownerId?: number): Promise<ThirdParty[]> {
    const conditions = [eq(thirdParties.active, true)];
    if (ownerId) {
      conditions.push(eq(thirdParties.ownerId, ownerId));
    }
    
    return await db
      .select()
      .from(thirdParties)
      .where(and(...conditions));
  }

  async searchThirdParties(query: string, ownerId?: number): Promise<ThirdParty[]> {
    const conditions = [
      or(
        ilike(thirdParties.name, `%${query}%`),
        ilike(thirdParties.document, `%${query}%`)
      ),
      eq(thirdParties.active, true)
    ];
    if (ownerId) {
      conditions.push(eq(thirdParties.ownerId, ownerId));
    }
    
    return await db
      .select()
      .from(thirdParties)
      .where(and(...conditions));
  }

  async createThirdParty(thirdParty: InsertThirdParty): Promise<ThirdParty> {
    const [newThirdParty] = await db
      .insert(thirdParties)
      .values(thirdParty)
      .returning();
    return newThirdParty;
  }

  async updateThirdParty(id: number, thirdParty: Partial<InsertThirdParty>, ownerId?: number): Promise<ThirdParty> {
    const conditions = [eq(thirdParties.id, id)];
    if (ownerId) {
      conditions.push(eq(thirdParties.ownerId, ownerId));
    }

    const [updatedThirdParty] = await db
      .update(thirdParties)
      .set(thirdParty)
      .where(and(...conditions))
      .returning();
    return updatedThirdParty;
  }

  async deleteThirdParty(id: number, ownerId?: number): Promise<void> {
    const conditions = [eq(thirdParties.id, id)];
    if (ownerId) {
      conditions.push(eq(thirdParties.ownerId, ownerId));
    }
    await db.delete(thirdParties).where(and(...conditions));
  }

  // Movement methods
  async getAllMovements(ownerId?: number): Promise<MaterialMovement[]> {
    const query = db.select().from(materialMovements).orderBy(desc(materialMovements.createdAt));
    if (ownerId) {
      query.where(eq(materialMovements.ownerId, ownerId));
    }
    return await query;
  }

  async getMovement(id: number, ownerId?: number): Promise<MaterialMovement | undefined> {
    const conditions = [eq(materialMovements.id, id)];
    if (ownerId) {
      conditions.push(eq(materialMovements.ownerId, ownerId));
    }
    
    const [movement] = await db
      .select()
      .from(materialMovements)
      .where(and(...conditions));
    return movement || undefined;
  }

  async getMovementsByType(type: 'entry' | 'exit', ownerId?: number): Promise<MaterialMovement[]> {
    const conditions = [eq(materialMovements.type, type)];
    if (ownerId) {
      conditions.push(eq(materialMovements.ownerId, ownerId));
    }
    
    return await db
      .select()
      .from(materialMovements)
      .where(and(...conditions))
      .orderBy(desc(materialMovements.createdAt));
  }

  async getMovementsByDateRange(startDate: Date, endDate: Date, ownerId?: number): Promise<MaterialMovement[]> {
    const conditions = [
      gte(materialMovements.createdAt, startDate),
      lte(materialMovements.createdAt, endDate)
    ];
    if (ownerId) {
      conditions.push(eq(materialMovements.ownerId, ownerId));
    }
    
    return await db
      .select()
      .from(materialMovements)
      .where(and(...conditions))
      .orderBy(desc(materialMovements.createdAt));
  }

  async getMovementsByEmployee(employeeId: number, ownerId?: number): Promise<MaterialMovement[]> {
    const conditions = [eq(materialMovements.employeeId, employeeId)];
    if (ownerId) {
      conditions.push(eq(materialMovements.ownerId, ownerId));
    }
    
    return await db
      .select()
      .from(materialMovements)
      .where(and(...conditions))
      .orderBy(desc(materialMovements.createdAt));
  }

  async getTodayMovements(ownerId?: number): Promise<{ entries: number; exits: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const conditions = [
      gte(materialMovements.createdAt, today),
      lt(materialMovements.createdAt, tomorrow)
    ];
    if (ownerId) {
      conditions.push(eq(materialMovements.ownerId, ownerId));
    }

    const movements = await db
      .select({
        type: materialMovements.type
      })
      .from(materialMovements)
      .where(and(...conditions));

    const entries = movements.filter(m => m.type === 'entry').length;
    const exits = movements.filter(m => m.type === 'exit').length;

    return { entries, exits };
  }

  async createEntry(userId: number, data: CreateEntryData): Promise<MaterialMovement> {
    // Create the movement record
    const [movement] = await db
      .insert(materialMovements)
      .values({
        type: 'entry',
        supplierId: data.supplierId,
        observation: data.observation,
        items: data.items,
        ownerId: 1, // Default owner
      })
      .returning();

    // Update material stocks
    for (const item of data.items) {
      await this.updateMaterialStock(item.materialId, item.quantity, 'add');
    }

    return movement;
  }

  async createExit(userId: number, data: CreateExitData): Promise<MaterialMovement> {
    // Create the movement record
    const [movement] = await db
      .insert(materialMovements)
      .values({
        type: 'exit',
        employeeId: data.employeeId,
        thirdPartyId: data.thirdPartyId,
        observation: data.observation,
        items: data.items,
        ownerId: 1, // Default owner
      })
      .returning();

    // Update material stocks
    for (const item of data.items) {
      await this.updateMaterialStock(item.materialId, item.quantity, 'subtract');
    }

    return movement;
  }

  // Dashboard methods
  async getDashboardStats(ownerId?: number): Promise<{
    totalMaterials: number;
    entriesToday: number;
    exitsToday: number;
    criticalItems: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count total materials
    const totalMaterials = await db
      .select({ count: sql<number>`count(*)` })
      .from(materials)
      .where(ownerId ? eq(materials.ownerId, ownerId) : undefined);

    // Count today's movements
    const todayMovements = await this.getTodayMovements(ownerId);

    // Count critical items (low stock)
    const criticalItems = await db
      .select({ count: sql<number>`count(*)` })
      .from(materials)
      .where(
        and(
          lt(materials.quantity, materials.minQuantity),
          ownerId ? eq(materials.ownerId, ownerId) : undefined
        )
      );

    return {
      totalMaterials: Number(totalMaterials[0]?.count) || 0,
      entriesToday: todayMovements.entries,
      exitsToday: todayMovements.exits,
      criticalItems: Number(criticalItems[0]?.count) || 0,
    };
  }

  // Report methods (simplified implementations)
  async getEmployeeMovementReport(employeeId?: number, month?: number, year?: number, ownerId?: number): Promise<any[]> {
    const conditions = [];
    if (employeeId) conditions.push(eq(materialMovements.employeeId, employeeId));
    if (ownerId) conditions.push(eq(materialMovements.ownerId, ownerId));
    
    return await db
      .select()
      .from(materialMovements)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(materialMovements.createdAt));
  }

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
    if (ownerId) conditions.push(eq(materialMovements.ownerId, ownerId));
    
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
    if (ownerId) conditions.push(eq(materialMovements.ownerId, ownerId));
    
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

    const materialsWithCategories = await db
      .select({
        id: materials.id,
        name: materials.name,
        unit: materials.unit,
        quantity: materials.quantity,
        unitPrice: materials.unitPrice,
        totalValue: materials.totalValue,
        category: categories.name,
      })
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return materialsWithCategories.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category || 'Sem categoria',
      unit: item.unit,
      currentStock: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      subtotal: parseFloat(item.totalValue),
    }));
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    await db
      .insert(auditLogs)
      .values(log);
  }

  async getSupplierTrackingReport(ownerId?: number, materialSearch?: string, supplierSearch?: string): Promise<any[]> {
    return [];
  }
}

export const storage = new DatabaseStorage();