import {
  users, categories, materials, employees, suppliers, thirdParties,
  materialMovements, movementItems, auditLog,
  type User, type InsertUser, type Category, type InsertCategory,
  type Material, type InsertMaterial, type Employee, type InsertEmployee,
  type Supplier, type InsertSupplier, type ThirdParty, type InsertThirdParty,
  type MaterialMovement, type InsertMovement, type MovementItem, type InsertMovementItem,
  type AuditLog, type CreateEntryData, type CreateExitData
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, gte, lte, ilike, or } from "drizzle-orm";
import bcrypt from "bcrypt";

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
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
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
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
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
    return await db.select().from(users).orderBy(asc(users.username));
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Categories
  async getAllCategories(ownerId?: number): Promise<Category[]> {
    if (ownerId) {
      return await db
        .select()
        .from(categories)
        .where(eq(categories.ownerId, ownerId))
        .orderBy(asc(categories.name));
    }
    
    return await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name));
  }

  async getCategory(id: number, ownerId?: number): Promise<Category | undefined> {
    const whereClause = ownerId 
      ? and(eq(categories.id, id), eq(categories.ownerId, ownerId))
      : eq(categories.id, id);
    
    const [category] = await db.select().from(categories).where(whereClause);
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
    const whereClause = ownerId 
      ? and(eq(categories.id, id), eq(categories.ownerId, ownerId))
      : eq(categories.id, id);
      
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(whereClause)
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number, ownerId?: number): Promise<void> {
    const whereClause = ownerId 
      ? and(eq(categories.id, id), eq(categories.ownerId, ownerId))
      : eq(categories.id, id);
      
    await db.delete(categories).where(whereClause);
  }

  // Materials
  async getAllMaterials(ownerId?: number): Promise<(Material & { category: Category, lastSupplier?: Supplier })[]> {
    const query = db
      .select()
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .leftJoin(suppliers, eq(materials.lastSupplierId, suppliers.id))
      .orderBy(asc(materials.name));

    if (ownerId) {
      return await query
        .where(eq(materials.ownerId, ownerId))
        .then(rows => rows.map(row => ({
          ...row.materials,
          category: row.categories!,
          lastSupplier: row.suppliers || undefined
        })));
    }

    return await query.then(rows => rows.map(row => ({
      ...row.materials,
      category: row.categories!,
      lastSupplier: row.suppliers || undefined
    })));
  }

  async getMaterial(id: number, ownerId?: number): Promise<Material | undefined> {
    const whereClause = ownerId 
      ? and(eq(materials.id, id), eq(materials.ownerId, ownerId))
      : eq(materials.id, id);
      
    const [material] = await db.select().from(materials).where(whereClause);
    return material || undefined;
  }

  async getMaterialsWithLowStock(ownerId?: number): Promise<(Material & { category: Category })[]> {
    if (ownerId) {
      return await db
        .select()
        .from(materials)
        .leftJoin(categories, eq(materials.categoryId, categories.id))
        .where(and(
          sql`${materials.currentStock} <= ${materials.minimumStock}`,
          eq(materials.ownerId, ownerId)
        ))
        .orderBy(asc(materials.name))
        .then(rows => rows.map(row => ({
          ...row.materials,
          category: row.categories!
        })));
    }

    return await db
      .select()
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .where(sql`${materials.currentStock} <= ${materials.minimumStock}`)
      .orderBy(asc(materials.name))
      .then(rows => rows.map(row => ({
        ...row.materials,
        category: row.categories!
      })));
  }

  async getMaterialsByCategory(categoryId: number, ownerId?: number): Promise<Material[]> {
    const whereClause = ownerId 
      ? and(eq(materials.categoryId, categoryId), eq(materials.ownerId, ownerId))
      : eq(materials.categoryId, categoryId);
      
    return await db
      .select()
      .from(materials)
      .where(whereClause)
      .orderBy(asc(materials.name));
  }

  async searchMaterials(query: string, ownerId?: number): Promise<(Material & { category: Category })[]> {
    if (ownerId) {
      return await db
        .select()
        .from(materials)
        .leftJoin(categories, eq(materials.categoryId, categories.id))
        .where(and(ilike(materials.name, `%${query}%`), eq(materials.ownerId, ownerId)))
        .orderBy(asc(materials.name))
        .then(rows => rows.map(row => ({
          ...row.materials,
          category: row.categories!
        })));
    }

    return await db
      .select()
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .where(ilike(materials.name, `%${query}%`))
      .orderBy(asc(materials.name))
      .then(rows => rows.map(row => ({
        ...row.materials,
        category: row.categories!
      })));
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db
      .insert(materials)
      .values({
        ...material,
        currentStock: 0 // Sempre inicia com estoque 0
      })
      .returning();
    return newMaterial;
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>, ownerId?: number): Promise<Material> {
    const whereClause = ownerId 
      ? and(eq(materials.id, id), eq(materials.ownerId, ownerId))
      : eq(materials.id, id);
      
    const [updatedMaterial] = await db
      .update(materials)
      .set(material)
      .where(whereClause)
      .returning();
    return updatedMaterial;
  }

  async deleteMaterial(id: number, ownerId?: number): Promise<void> {
    const whereClause = ownerId 
      ? and(eq(materials.id, id), eq(materials.ownerId, ownerId))
      : eq(materials.id, id);
      
    await db.delete(materials).where(whereClause);
  }

  async updateMaterialStock(id: number, quantity: number, operation: 'add' | 'subtract', ownerId?: number): Promise<void> {
    const whereClause = ownerId 
      ? and(eq(materials.id, id), eq(materials.ownerId, ownerId))
      : eq(materials.id, id);
      
    if (operation === 'add') {
      await db
        .update(materials)
        .set({ currentStock: sql`${materials.currentStock} + ${quantity}` })
        .where(whereClause);
    } else {
      await db
        .update(materials)
        .set({ currentStock: sql`${materials.currentStock} - ${quantity}` })
        .where(whereClause);
    }
  }

  // Employees
  async getAllEmployees(ownerId?: number): Promise<Employee[]> {
    if (ownerId) {
      return await db
        .select()
        .from(employees)
        .where(eq(employees.ownerId, ownerId))
        .orderBy(asc(employees.name));
    }
    
    return await db.select().from(employees).orderBy(asc(employees.name));
  }

  async getEmployee(id: number, ownerId?: number): Promise<Employee | undefined> {
    const whereClause = ownerId 
      ? and(eq(employees.id, id), eq(employees.ownerId, ownerId))
      : eq(employees.id, id);
      
    const [employee] = await db.select().from(employees).where(whereClause);
    return employee || undefined;
  }

  async getActiveEmployees(ownerId?: number): Promise<Employee[]> {
    if (ownerId) {
      return await db
        .select()
        .from(employees)
        .where(and(eq(employees.isActive, true), eq(employees.ownerId, ownerId)))
        .orderBy(asc(employees.name));
    }
    
    return await db
      .select()
      .from(employees)
      .where(eq(employees.isActive, true))
      .orderBy(asc(employees.name));
  }

  async searchEmployees(query: string, ownerId?: number): Promise<Employee[]> {
    if (ownerId) {
      return await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.isActive, true),
            eq(employees.ownerId, ownerId),
            or(
              ilike(employees.name, `%${query}%`),
              ilike(employees.department, `%${query}%`)
            )
          )
        )
        .orderBy(asc(employees.name));
    }
    
    return await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.isActive, true),
          or(
            ilike(employees.name, `%${query}%`),
            ilike(employees.department, `%${query}%`)
          )
        )
      )
      .orderBy(asc(employees.name));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>, ownerId?: number): Promise<Employee> {
    const whereClause = ownerId 
      ? and(eq(employees.id, id), eq(employees.ownerId, ownerId))
      : eq(employees.id, id);
      
    const [updatedEmployee] = await db
      .update(employees)
      .set(employee)
      .where(whereClause)
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: number, ownerId?: number): Promise<void> {
    const whereClause = ownerId 
      ? and(eq(employees.id, id), eq(employees.ownerId, ownerId))
      : eq(employees.id, id);
      
    await db.delete(employees).where(whereClause);
  }

  // Suppliers
  async getAllSuppliers(ownerId?: number): Promise<Supplier[]> {
    if (ownerId) {
      return await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.ownerId, ownerId))
        .orderBy(asc(suppliers.name));
    }
    
    return await db.select().from(suppliers).orderBy(asc(suppliers.name));
  }

  async getSupplier(id: number, ownerId?: number): Promise<Supplier | undefined> {
    const whereClause = ownerId 
      ? and(eq(suppliers.id, id), eq(suppliers.ownerId, ownerId))
      : eq(suppliers.id, id);
      
    const [supplier] = await db.select().from(suppliers).where(whereClause);
    return supplier || undefined;
  }

  async getActiveSuppliers(ownerId?: number): Promise<Supplier[]> {
    if (ownerId) {
      return await db
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.isActive, true), eq(suppliers.ownerId, ownerId)))
        .orderBy(asc(suppliers.name));
    }
    
    return await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.isActive, true))
      .orderBy(asc(suppliers.name));
  }

  async searchSuppliers(query: string, ownerId?: number): Promise<Supplier[]> {
    if (ownerId) {
      return await db
        .select()
        .from(suppliers)
        .where(
          and(
            eq(suppliers.isActive, true),
            eq(suppliers.ownerId, ownerId),
            or(
              ilike(suppliers.name, `%${query}%`),
              ilike(suppliers.cnpj, `%${query}%`)
            )
          )
        )
        .orderBy(asc(suppliers.name));
    }
    
    return await db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.isActive, true),
          or(
            ilike(suppliers.name, `%${query}%`),
            ilike(suppliers.cnpj, `%${query}%`)
          )
        )
      )
      .orderBy(asc(suppliers.name));
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db
      .insert(suppliers)
      .values(supplier)
      .returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>, ownerId?: number): Promise<Supplier> {
    const whereClause = ownerId 
      ? and(eq(suppliers.id, id), eq(suppliers.ownerId, ownerId))
      : eq(suppliers.id, id);
      
    const [updatedSupplier] = await db
      .update(suppliers)
      .set(supplier)
      .where(whereClause)
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: number, ownerId?: number): Promise<void> {
    const whereClause = ownerId 
      ? and(eq(suppliers.id, id), eq(suppliers.ownerId, ownerId))
      : eq(suppliers.id, id);
      
    await db.delete(suppliers).where(whereClause);
  }

  // Third Parties
  async getAllThirdParties(ownerId?: number): Promise<ThirdParty[]> {
    if (ownerId) {
      return await db
        .select()
        .from(thirdParties)
        .where(eq(thirdParties.ownerId, ownerId))
        .orderBy(asc(thirdParties.name));
    }
    
    return await db.select().from(thirdParties).orderBy(asc(thirdParties.name));
  }

  async getThirdParty(id: number, ownerId?: number): Promise<ThirdParty | undefined> {
    const whereClause = ownerId 
      ? and(eq(thirdParties.id, id), eq(thirdParties.ownerId, ownerId))
      : eq(thirdParties.id, id);
      
    const [thirdParty] = await db.select().from(thirdParties).where(whereClause);
    return thirdParty || undefined;
  }

  async getActiveThirdParties(ownerId?: number): Promise<ThirdParty[]> {
    if (ownerId) {
      return await db
        .select()
        .from(thirdParties)
        .where(and(eq(thirdParties.isActive, true), eq(thirdParties.ownerId, ownerId)))
        .orderBy(asc(thirdParties.name));
    }
    
    return await db
      .select()
      .from(thirdParties)
      .where(eq(thirdParties.isActive, true))
      .orderBy(asc(thirdParties.name));
  }

  async searchThirdParties(query: string, ownerId?: number): Promise<ThirdParty[]> {
    if (ownerId) {
      return await db
        .select()
        .from(thirdParties)
        .where(
          and(
            eq(thirdParties.isActive, true),
            eq(thirdParties.ownerId, ownerId),
            or(
              ilike(thirdParties.name, `%${query}%`),
              ilike(thirdParties.document, `%${query}%`)
            )
          )
        )
        .orderBy(asc(thirdParties.name));
    }
    
    return await db
      .select()
      .from(thirdParties)
      .where(
        and(
          eq(thirdParties.isActive, true),
          or(
            ilike(thirdParties.name, `%${query}%`),
            ilike(thirdParties.document, `%${query}%`)
          )
        )
      )
      .orderBy(asc(thirdParties.name));
  }

  async createThirdParty(thirdParty: InsertThirdParty): Promise<ThirdParty> {
    const [newThirdParty] = await db
      .insert(thirdParties)
      .values(thirdParty)
      .returning();
    return newThirdParty;
  }

  async updateThirdParty(id: number, thirdParty: Partial<InsertThirdParty>, ownerId?: number): Promise<ThirdParty> {
    const whereClause = ownerId 
      ? and(eq(thirdParties.id, id), eq(thirdParties.ownerId, ownerId))
      : eq(thirdParties.id, id);
      
    const [updatedThirdParty] = await db
      .update(thirdParties)
      .set(thirdParty)
      .where(whereClause)
      .returning();
    return updatedThirdParty;
  }

  async deleteThirdParty(id: number, ownerId?: number): Promise<void> {
    const whereClause = ownerId 
      ? and(eq(thirdParties.id, id), eq(thirdParties.ownerId, ownerId))
      : eq(thirdParties.id, id);
      
    await db.delete(thirdParties).where(whereClause);
  }

  // Material Movements
  async getAllMovements(): Promise<MaterialMovement[]> {
    return await db
      .select()
      .from(materialMovements)
      .orderBy(desc(materialMovements.createdAt));
  }

  async getMovement(id: number): Promise<MaterialMovement | undefined> {
    const [movement] = await db.select().from(materialMovements).where(eq(materialMovements.id, id));
    return movement || undefined;
  }

  async getMovementsByType(type: 'entry' | 'exit'): Promise<MaterialMovement[]> {
    return await db
      .select()
      .from(materialMovements)
      .where(eq(materialMovements.type, type))
      .orderBy(desc(materialMovements.createdAt));
  }

  async getMovementsByDateRange(startDate: Date, endDate: Date): Promise<MaterialMovement[]> {
    return await db
      .select()
      .from(materialMovements)
      .where(
        and(
          gte(materialMovements.date, startDate),
          lte(materialMovements.date, endDate)
        )
      )
      .orderBy(desc(materialMovements.date));
  }

  async getMovementsByEmployee(employeeId: number): Promise<MaterialMovement[]> {
    return await db
      .select()
      .from(materialMovements)
      .where(
        or(
          eq(materialMovements.returnEmployeeId, employeeId),
          eq(materialMovements.destinationEmployeeId, employeeId)
        )
      )
      .orderBy(desc(materialMovements.date));
  }

  async getTodayMovements(ownerId?: number): Promise<{ entries: number; exits: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entriesConditions = [
      eq(materialMovements.type, 'entry'),
      gte(materialMovements.date, today),
      lte(materialMovements.date, tomorrow)
    ];
    
    if (ownerId) {
      entriesConditions.push(eq(materialMovements.userId, ownerId));
    }

    const [entriesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(materialMovements)
      .where(and(...entriesConditions));

    const exitsConditions = [
      eq(materialMovements.type, 'exit'),
      gte(materialMovements.date, today),
      lte(materialMovements.date, tomorrow)
    ];
    
    if (ownerId) {
      exitsConditions.push(eq(materialMovements.userId, ownerId));
    }

    const [exitsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(materialMovements)
      .where(and(...exitsConditions));

    return {
      entries: Number(entriesResult.count) || 0,
      exits: Number(exitsResult.count) || 0,
    };
  }

  async createEntry(userId: number, data: CreateEntryData): Promise<MaterialMovement> {
    return await db.transaction(async (tx) => {
      // Create movement
      const [movement] = await tx
        .insert(materialMovements)
        .values({
          type: 'entry',
          date: new Date(data.date),
          userId,
          originType: data.originType,
          supplierId: data.supplierId,
          returnEmployeeId: data.returnEmployeeId,
          returnThirdPartyId: data.returnThirdPartyId,
          notes: data.notes,
        })
        .returning();

      // Create movement items and update stock
      for (const item of data.items) {
        // Get material's current unit price if not provided
        let unitPrice = item.unitPrice;
        if (!unitPrice) {
          const [material] = await tx
            .select({ unitPrice: materials.unitPrice })
            .from(materials)
            .where(eq(materials.id, item.materialId));
          unitPrice = parseFloat(material?.unitPrice || '0');
        }

        await tx.insert(movementItems).values({
          movementId: movement.id,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: unitPrice.toString(),
        });

        // Update material stock, unit price, and supplier tracking
        const updateData: any = {
          currentStock: sql`${materials.currentStock} + ${item.quantity}`,
          unitPrice: unitPrice.toString()
        };

        // Se a entrada veio de um fornecedor (não é devolução), atualiza o último fornecedor
        if (data.originType === 'supplier' && data.supplierId) {
          updateData.lastSupplierId = data.supplierId;
        }

        await tx
          .update(materials)
          .set(updateData)
          .where(eq(materials.id, item.materialId));
      }

      return movement;
    });
  }

  async createExit(userId: number, data: CreateExitData): Promise<MaterialMovement> {
    return await db.transaction(async (tx) => {
      // Verify stock availability
      for (const item of data.items) {
        const [material] = await tx
          .select()
          .from(materials)
          .where(eq(materials.id, item.materialId));
        
        if (!material || material.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for material ID ${item.materialId}`);
        }
      }

      // Create movement
      const [movement] = await tx
        .insert(materialMovements)
        .values({
          type: 'exit',
          date: new Date(data.date),
          userId,
          destinationType: data.destinationType,
          destinationEmployeeId: data.destinationEmployeeId,
          destinationThirdPartyId: data.destinationThirdPartyId,
          notes: data.notes,
        })
        .returning();

      // Create movement items and update stock
      for (const item of data.items) {
        // Get material's current unit price if not provided
        let unitPrice = item.unitPrice;
        if (!unitPrice) {
          const [material] = await tx
            .select({ unitPrice: materials.unitPrice })
            .from(materials)
            .where(eq(materials.id, item.materialId));
          unitPrice = parseFloat(material?.unitPrice || '0');
        }

        await tx.insert(movementItems).values({
          movementId: movement.id,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: unitPrice.toString(),
          purpose: item.purpose,
        });

        // Update material stock
        await tx
          .update(materials)
          .set({ currentStock: sql`${materials.currentStock} - ${item.quantity}` })
          .where(eq(materials.id, item.materialId));
      }

      return movement;
    });
  }

  // Dashboard Statistics
  async getDashboardStats(ownerId?: number): Promise<{
    totalMaterials: number;
    entriesToday: number;
    exitsToday: number;
    criticalItems: number;
  }> {
    const totalMaterialsQuery = ownerId 
      ? db.select({ count: sql<number>`count(*)` }).from(materials).where(eq(materials.ownerId, ownerId))
      : db.select({ count: sql<number>`count(*)` }).from(materials);
    
    const [totalMaterialsResult] = await totalMaterialsQuery;

    const criticalItemsQuery = ownerId
      ? db.select({ count: sql<number>`count(*)` }).from(materials).where(
          and(
            eq(materials.ownerId, ownerId),
            sql`${materials.currentStock} <= ${materials.minimumStock}`
          )
        )
      : db.select({ count: sql<number>`count(*)` }).from(materials).where(
          sql`${materials.currentStock} <= ${materials.minimumStock}`
        );
    
    const [criticalItemsResult] = await criticalItemsQuery;

    const todayMovements = await this.getTodayMovements(ownerId);

    return {
      totalMaterials: Number(totalMaterialsResult.count) || 0,
      entriesToday: todayMovements.entries,
      exitsToday: todayMovements.exits,
      criticalItems: Number(criticalItemsResult.count) || 0,
    };
  }

  // Reports
  async getEmployeeMovementReport(employeeId?: number, month?: number, year?: number, ownerId?: number, startDate?: Date, endDate?: Date): Promise<any[]> {
    const conditions = [];

    // Filtro obrigatório por usuário (isolamento de dados)
    if (ownerId) {
      conditions.push(eq(materialMovements.userId, ownerId));
    }

    if (employeeId && employeeId !== 0) {
      conditions.push(
        or(
          eq(materialMovements.returnEmployeeId, employeeId),
          eq(materialMovements.destinationEmployeeId, employeeId)
        )
      );
    }

    // Usar startDate e endDate se fornecidos, senão usar month/year
    if (startDate) {
      conditions.push(gte(materialMovements.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(materialMovements.date, endDate));
    }
    
    if (!startDate && !endDate && month && year) {
      const monthStartDate = new Date(year, month - 1, 1);
      const monthEndDate = new Date(year, month, 0);
      conditions.push(gte(materialMovements.date, monthStartDate));
      conditions.push(lte(materialMovements.date, monthEndDate));
    }

    let baseQuery = db
      .select({
        id: materialMovements.id,
        type: materialMovements.type,
        date: materialMovements.date,
        notes: materialMovements.notes,
        quantity: movementItems.quantity,
        employeeName: employees.name,
        materialName: materials.name,
        unit: materials.unit,
        movement: materialMovements,
        employee: employees,
        material: materials,
        items: movementItems
      })
      .from(materialMovements)
      .innerJoin(movementItems, eq(materialMovements.id, movementItems.movementId))
      .innerJoin(materials, eq(movementItems.materialId, materials.id))
      .leftJoin(employees, 
        or(
          eq(materialMovements.returnEmployeeId, employees.id),
          eq(materialMovements.destinationEmployeeId, employees.id)
        )
      );

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as any;
    }

    return await baseQuery.orderBy(desc(materialMovements.date));
  }

  async getStockReport(categoryId?: number, ownerId?: number): Promise<any[]> {
    let query = db
      .select({
        name: materials.name,
        current_stock: materials.currentStock,
        minimum_stock: materials.minimumStock,
        unit: materials.unit,
        categoryName: categories.name,
      })
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id));

    const conditions = [];
    
    if (categoryId) {
      conditions.push(eq(materials.categoryId, categoryId));
    }

    if (ownerId) {
      conditions.push(eq(materials.ownerId, ownerId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(asc(materials.name));
  }

  async getGeneralMovementsReport(startDate?: Date, endDate?: Date, type?: 'entry' | 'exit', ownerId?: number): Promise<any[]> {
    const conditions = [];

    // Filtro obrigatório por usuário (isolamento de dados)
    if (ownerId) {
      conditions.push(eq(materialMovements.userId, ownerId));
    }

    if (startDate) {
      conditions.push(gte(materialMovements.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(materialMovements.date, endDate));
    }

    if (type) {
      conditions.push(eq(materialMovements.type, type));
    }

    let query = db
      .select({
        movement: materialMovements,
        user: users,
        supplier: suppliers,
        employee: employees,
        thirdParty: thirdParties,
        items: movementItems,
        material: materials,
        category: categories
      })
      .from(materialMovements)
      .innerJoin(movementItems, eq(materialMovements.id, movementItems.movementId))
      .innerJoin(materials, eq(movementItems.materialId, materials.id))
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .leftJoin(users, eq(materialMovements.userId, users.id))
      .leftJoin(suppliers, eq(materialMovements.supplierId, suppliers.id))
      .leftJoin(employees, 
        or(
          eq(materialMovements.returnEmployeeId, employees.id),
          eq(materialMovements.destinationEmployeeId, employees.id)
        )
      )
      .leftJoin(thirdParties,
        or(
          eq(materialMovements.returnThirdPartyId, thirdParties.id),
          eq(materialMovements.destinationThirdPartyId, thirdParties.id)
        )
      );

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(materialMovements.date));
  }

  async getMaterialConsumptionReport(startDate?: Date, endDate?: Date, categoryId?: number, ownerId?: number): Promise<any[]> {
    const conditions = [
      eq(materialMovements.type, 'exit')
    ];

    // Filtro obrigatório por usuário (isolamento de dados)
    if (ownerId) {
      conditions.push(eq(materialMovements.userId, ownerId));
    }

    if (startDate) {
      conditions.push(gte(materialMovements.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(materialMovements.date, endDate));
    }

    if (categoryId && categoryId !== 0) {
      conditions.push(eq(materials.categoryId, categoryId));
    }

    let query = db
      .select({
        material: materials,
        category: categories,
        totalConsumed: sql<number>`sum(${movementItems.quantity})`,
      })
      .from(materialMovements)
      .innerJoin(movementItems, eq(materialMovements.id, movementItems.movementId))
      .innerJoin(materials, eq(movementItems.materialId, materials.id))
      .leftJoin(categories, eq(materials.categoryId, categories.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query
      .groupBy(materials.id, categories.id)
      .orderBy(desc(sql`sum(${movementItems.quantity})`));
  }

  // Audit Log
  async getFinancialStockReport(ownerId?: number, materialSearch?: string, categoryId?: number): Promise<any[]> {
    let whereConditions = [];
    
    if (ownerId) {
      whereConditions.push(eq(materials.ownerId, ownerId));
    }
    
    if (materialSearch) {
      whereConditions.push(ilike(materials.name, `%${materialSearch}%`));
    }
    
    if (categoryId) {
      whereConditions.push(eq(materials.categoryId, categoryId));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // First, get the basic material data
    const result = await db
      .select({
        id: materials.id,
        name: materials.name,
        category: categories.name,
        unit: materials.unit,
        currentStock: materials.currentStock,
        unitPrice: materials.unitPrice,
      })
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .where(whereClause)
      .orderBy(asc(categories.name), asc(materials.name));

    // For each material, calculate the weighted average price based on recent entries
    const enrichedResult = await Promise.all(result.map(async (item) => {
      // Get recent entry movements to calculate average price
      const recentEntries = await db
        .select({
          unitPrice: movementItems.unitPrice,
          quantity: movementItems.quantity,
        })
        .from(movementItems)
        .innerJoin(materialMovements, eq(movementItems.movementId, materialMovements.id))
        .where(
          and(
            eq(movementItems.materialId, item.id),
            eq(materialMovements.type, 'entry'),
            ownerId ? eq(materialMovements.ownerId, ownerId) : undefined
          )
        )
        .orderBy(desc(materialMovements.date))
        .limit(10); // Last 10 entries for weighted average

      let finalUnitPrice = parseFloat(item.unitPrice || '0');

      if (recentEntries.length > 0) {
        // Calculate weighted average price from recent entries
        let totalValue = 0;
        let totalQuantity = 0;
        
        recentEntries.forEach(entry => {
          const price = parseFloat(entry.unitPrice || '0');
          const qty = entry.quantity || 0;
          totalValue += price * qty;
          totalQuantity += qty;
        });
        
        if (totalQuantity > 0) {
          finalUnitPrice = totalValue / totalQuantity;
        }
      }

      const subtotal = item.currentStock * finalUnitPrice;
      
      return {
        ...item,
        unitPrice: finalUnitPrice,
        subtotal,
        priceHistory: recentEntries.length > 0 ? `Baseado em ${recentEntries.length} entradas recentes` : 'Preço base do material'
      };
    }));

    return enrichedResult;
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    await db.insert(auditLog).values(log);
  }

  // Relatório de Rastreamento de Fornecedores
  async getSupplierTrackingReport(ownerId?: number, materialSearch?: string, supplierSearch?: string): Promise<any[]> {
    const conditions = [];

    // Filtro obrigatório por usuário (isolamento de dados)
    if (ownerId) {
      conditions.push(eq(materials.ownerId, ownerId));
    }

    // Filtro de busca por material
    if (materialSearch && materialSearch.trim()) {
      conditions.push(ilike(materials.name, `%${materialSearch.trim()}%`));
    }

    // Filtro de busca por fornecedor
    if (supplierSearch && supplierSearch.trim()) {
      conditions.push(ilike(suppliers.name, `%${supplierSearch.trim()}%`));
    }

    let query = db
      .select({
        materialId: materials.id,
        materialName: materials.name,
        categoryName: categories.name,
        currentStock: materials.currentStock,
        unit: materials.unit,
        unitPrice: materials.unitPrice,
        supplierName: sql<string>`COALESCE(${suppliers.name}, 'Sem fornecedor')`.as('supplierName'),
        supplierContact: suppliers.phone,
        supplierEmail: suppliers.email,
        lastSupplyDate: sql<string>`(
          SELECT MAX(mm.date) 
          FROM material_movements mm
          INNER JOIN movement_items mi ON mm.id = mi.movement_id
          WHERE mi.material_id = ${materials.id} 
          AND mm.type = 'entry' 
          AND mm.origin_type = 'supplier'
          AND mm.supplier_id = ${materials.lastSupplierId}
        )`.as('lastSupplyDate'),
        totalValue: sql<number>`CAST(${materials.currentStock} AS DECIMAL) * CAST(COALESCE(${materials.unitPrice}, '0') AS DECIMAL)`.as('totalValue')
      })
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .leftJoin(suppliers, eq(materials.lastSupplierId, suppliers.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(materials.name);
  }
}

export const storage = new DatabaseStorage();
