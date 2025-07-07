import { 
  users, categories, materials, suppliers, employees, thirdParties, 
  materialMovements, auditLogs, costCenters,
  type User, type InsertUser, type Category, type InsertCategory,
  type Material, type InsertMaterial, type Supplier, type InsertSupplier,
  type Employee, type InsertEmployee, type ThirdParty, type InsertThirdParty,
  type MaterialMovement, type CreateEntry, type CreateExit,
  type MaterialWithDetails, type MovementWithDetails, type CostCenter, type InsertCostCenter
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, lt, count, sum, desc, asc, ilike, ne, isNotNull, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsers(ownerId?: number): Promise<User[]>;
  createAuditLog(data: any): Promise<void>;

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
  deleteMaterial(id: number, ownerId?: number): Promise<{ success: boolean; message?: string }>;
  getLowStockMaterials(ownerId?: number): Promise<MaterialWithDetails[]>;

  // Supplier methods
  getSuppliers(ownerId?: number): Promise<Supplier[]>;
  getSupplier(id: number, ownerId?: number): Promise<Supplier | undefined>;
  createSupplier(insertSupplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, updateSupplier: Partial<InsertSupplier>, ownerId?: number): Promise<Supplier | undefined>;
  deleteSupplier(id: number, ownerId?: number): Promise<boolean>;
  searchSuppliers(query: string, ownerId?: number): Promise<Supplier[]>;

  // Employee methods
  getEmployees(ownerId?: number): Promise<Employee[]>;
  getEmployee(id: number, ownerId?: number): Promise<Employee | undefined>;
  createEmployee(insertEmployee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, updateEmployee: Partial<InsertEmployee>, ownerId?: number): Promise<Employee | undefined>;
  deleteEmployee(id: number, ownerId?: number): Promise<boolean>;
  searchEmployees(query: string, ownerId?: number): Promise<Employee[]>;

  // Third party methods
  getThirdParties(ownerId?: number): Promise<ThirdParty[]>;
  getThirdParty(id: number, ownerId?: number): Promise<ThirdParty | undefined>;
  createThirdParty(insertThirdParty: InsertThirdParty): Promise<ThirdParty>;
  updateThirdParty(id: number, updateThirdParty: Partial<InsertThirdParty>, ownerId?: number): Promise<ThirdParty | undefined>;
  deleteThirdParty(id: number, ownerId?: number): Promise<boolean>;

  // Movement methods
  createEntry(entry: CreateEntry, userId: number): Promise<MaterialMovement>;
  createExit(exit: CreateExit, userId: number): Promise<MaterialMovement>;
  createEmployeeReturn(returnData: any, userId: number): Promise<MaterialMovement>;
  createThirdPartyReturn(returnData: any, userId: number): Promise<MaterialMovement>;
  getMovements(ownerId?: number): Promise<MovementWithDetails[]>;

  // Dashboard methods
  getDashboardStats(ownerId?: number): Promise<{
    totalMaterials: number;
    lowStockItems: number;
    totalValue: number;
    totalMovements: number;
  }>;

  // Cost Center methods
  getCostCenters(ownerId?: number): Promise<CostCenter[]>;
  getCostCenter(id: number, ownerId?: number): Promise<CostCenter | undefined>;
  createCostCenter(insertCostCenter: InsertCostCenter): Promise<CostCenter>;
  updateCostCenter(id: number, updateCostCenter: Partial<InsertCostCenter>, ownerId?: number): Promise<CostCenter | undefined>;
  deleteCostCenter(id: number, ownerId?: number): Promise<boolean>;

  // Stock recalculation methods
  recalculateStock(materialId: number): Promise<number>;
  recalculateAllStocks(ownerId?: number): Promise<void>;

  // Movement management methods
  deleteMovement(id: number, ownerId?: number): Promise<boolean>;

  // Report methods
  getStockReport(categoryId?: number, ownerId?: number): Promise<any[]>;
  getGeneralMovementsReport(startDate?: Date, endDate?: Date, type?: 'entry' | 'exit', ownerId?: number, costCenterId?: number): Promise<any[]>;
  getGeneralMovementsReportWithTotals(startDate?: Date, endDate?: Date, type?: 'entry' | 'exit' | 'return', ownerId?: number, costCenterId?: number, supplierId?: number, materialId?: number, categoryId?: number): Promise<{ movements: any[]; totals: { totalEntries: number; totalExits: number; totalReturns: number; totalGeneral: number; count: number; }; }>;
  getMaterialConsumptionReport(materialId?: number, startDate?: Date, endDate?: Date, ownerId?: number): Promise<any[]>;
  getEmployeeMovementReport(employeeId?: number, month?: number, year?: number, ownerId?: number, startDate?: Date, endDate?: Date): Promise<any[]>;
  getSupplierTrackingReport(supplierId?: number, startDate?: Date, endDate?: Date, ownerId?: number): Promise<any[]>;
  getFinancialStockReport(ownerId?: number, materialSearch?: string, categoryId?: number): Promise<any[]>;
  getCostCenterReport(costCenterId?: number, startDate?: Date, endDate?: Date, ownerId?: number): Promise<any[]>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Funcionalidade não implementada - retorna undefined para compatibilidade
    return undefined;
  }

  async createAuditLog(data: any): Promise<void> {
    // Funcionalidade não implementada - mantém compatibilidade
    return;
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
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
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
    try {
      const conditions = [eq(categories.id, id)];
      if (ownerId) conditions.push(eq(categories.ownerId, ownerId));

      await db.delete(categories).where(and(...conditions));
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  // Material methods
  // Auto-fix stock discrepancies when getting materials
  async autoFixStockDiscrepancies(ownerId?: number): Promise<void> {
    try {
      console.log('🔧 Auto-checking stock discrepancies...');
      
      const conditions = [];
      if (ownerId) conditions.push(eq(materials.ownerId, ownerId));
      
      const materialsList = await db
        .select({ 
          id: materials.id, 
          name: materials.name, 
          currentStock: materials.currentStock 
        })
        .from(materials)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      let fixedCount = 0;
      for (const material of materialsList) {
        try {
          const calculatedStock = await this.calculateMaterialStockFromMovements(material.id);
          
          if (material.currentStock !== calculatedStock) {
            console.log(`🔧 Auto-fixing ${material.name}: ${material.currentStock} → ${calculatedStock}`);
            
            await db
              .update(materials)
              .set({ currentStock: calculatedStock })
              .where(eq(materials.id, material.id));
            
            fixedCount++;
          }
        } catch (error) {
          console.error(`Error fixing stock for material ${material.id}:`, error);
          // Continue with other materials if one fails
        }
      }
      
      if (fixedCount > 0) {
        console.log(`✅ Auto-fixed ${fixedCount} stock discrepancies`);
      }
    } catch (error) {
      console.error('Error in autoFixStockDiscrepancies:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  async getMaterials(ownerId?: number): Promise<MaterialWithDetails[]> {
    // Execute auto-fix before returning materials to ensure data consistency
    try {
      await this.autoFixStockDiscrepancies(ownerId);
    } catch (error) {
      console.error('Auto-fix failed, continuing with normal operation:', error);
    }
    
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

  async deleteMaterial(id: number, ownerId?: number): Promise<{ success: boolean; message?: string }> {
    try {
      // Check if material has movements
      const movementsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(materialMovements)
        .where(eq(materialMovements.materialId, id));
      
      if (movementsCount[0]?.count > 0) {
        return {
          success: false,
          message: `Não é possível excluir este material pois ele possui ${movementsCount[0].count} movimentação(ões) registrada(s). Exclua as movimentações primeiro.`
        };
      }

      const conditions = [eq(materials.id, id)];
      if (ownerId) conditions.push(eq(materials.ownerId, ownerId));

      const result = await db.delete(materials).where(and(...conditions));
      return { success: true };
    } catch (error) {
      console.error('Error deleting material:', error);
      return { 
        success: false, 
        message: 'Erro interno ao excluir material' 
      };
    }
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
    try {
      const conditions = [eq(suppliers.id, id)];
      if (ownerId) conditions.push(eq(suppliers.ownerId, ownerId));

      const result = await db.delete(suppliers).where(and(...conditions));
      return true; // Se não houve erro, consideramos sucesso
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return false;
    }
  }

  async searchSuppliers(query: string, ownerId?: number): Promise<Supplier[]> {
    try {
      const conditions = [
        or(
          ilike(suppliers.name, `%${query}%`),
          ilike(suppliers.cnpj, `%${query}%`),
          ilike(suppliers.email, `%${query}%`)
        )
      ];
      if (ownerId) conditions.push(eq(suppliers.ownerId, ownerId));
      
      return await db.select().from(suppliers).where(and(...conditions));
    } catch (error) {
      console.error('Error searching suppliers:', error);
      throw new Error('Failed to search suppliers');
    }
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
    try {
      const conditions = [eq(employees.id, id)];
      if (ownerId) conditions.push(eq(employees.ownerId, ownerId));

      await db.delete(employees).where(and(...conditions));
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
  }

  async searchEmployees(query: string, ownerId?: number): Promise<Employee[]> {
    try {
      const conditions = [
        or(
          ilike(employees.name, `%${query}%`),
          ilike(employees.department, `%${query}%`),
          ilike(employees.email, `%${query}%`)
        )
      ];
      if (ownerId) conditions.push(eq(employees.ownerId, ownerId));
      
      return await db.select().from(employees).where(and(...conditions));
    } catch (error) {
      console.error('Error searching employees:', error);
      throw new Error('Failed to search employees');
    }
  }

  async searchMaterials(query: string, ownerId?: number): Promise<Material[]> {
    try {
      const conditions = [
        ilike(materials.name, `%${query}%`)
      ];
      if (ownerId) conditions.push(eq(materials.ownerId, ownerId));
      
      return await db.select().from(materials).where(and(...conditions));
    } catch (error) {
      console.error('Error searching materials:', error);
      throw new Error('Failed to search materials');
    }
  }

  async searchThirdParties(query: string, ownerId?: number): Promise<ThirdParty[]> {
    try {
      const conditions = [
        or(
          ilike(thirdParties.name, `%${query}%`),
          ilike(thirdParties.document, `%${query}%`),
          ilike(thirdParties.email, `%${query}%`)
        )
      ];
      if (ownerId) conditions.push(eq(thirdParties.ownerId, ownerId));
      
      return await db.select().from(thirdParties).where(and(...conditions));
    } catch (error) {
      console.error('Error searching third parties:', error);
      throw new Error('Failed to search third parties');
    }
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
    try {
      const conditions = [eq(thirdParties.id, id)];
      if (ownerId) conditions.push(eq(thirdParties.ownerId, ownerId));

      await db.delete(thirdParties).where(and(...conditions));
      return true;
    } catch (error) {
      console.error('Error deleting third party:', error);
      return false;
    }
  }

  // Movement methods
  async createEntry(entry: CreateEntry, userId: number): Promise<MaterialMovement> {
    console.log('=== CREATE ENTRY ===');
    console.log('Entry data:', entry);
    
    // For entries, create one movement record per item
    const firstItem = entry.items[0];
    const result = await db.insert(materialMovements).values({
      type: entry.type,
      date: new Date(), // Always use current timestamp for proper ordering
      userId: userId,
      materialId: firstItem.materialId,
      quantity: firstItem.quantity,
      unitPrice: firstItem.unitPrice,
      originType: entry.originType,
      supplierId: entry.supplierId,
      returnEmployeeId: entry.returnEmployeeId,
      returnThirdPartyId: entry.returnThirdPartyId,
      costCenterId: entry.costCenterId,
      notes: entry.notes,
      ownerId: userId,
    }).returning();

    // Update material stock for each item
    for (const item of entry.items) {
      // Get current stock first
      const [currentMaterial] = await db
        .select({ currentStock: materials.currentStock })
        .from(materials)
        .where(eq(materials.id, item.materialId));

      if (currentMaterial) {
        const newStock = currentMaterial.currentStock + item.quantity;
        console.log(`Updating stock for material ${item.materialId}: ${currentMaterial.currentStock} -> ${newStock}`);
        
        const updateData: any = {
          currentStock: newStock,
        };
        
        // Only update unit price for supplier entries
        if (entry.originType === 'supplier') {
          updateData.unitPrice = item.unitPrice;
        }
        
        await db
          .update(materials)
          .set(updateData)
          .where(eq(materials.id, item.materialId));
        
        // Recalculate stock to ensure accuracy
        await this.recalculateMaterialStock(item.materialId);
      }
    }

    return result[0];
  }

  async createExit(exit: CreateExit, userId: number): Promise<MaterialMovement> {
    console.log('Creating exit with FIFO logic:', exit);
    
    // Process each item in the exit
    const movements: MaterialMovement[] = [];
    
    for (const item of exit.items) {
      // Get current material to check stock
      const [currentMaterial] = await db
        .select({ currentStock: materials.currentStock })
        .from(materials)
        .where(eq(materials.id, item.materialId));

      if (!currentMaterial) {
        throw new Error(`Material ${item.materialId} not found`);
      }

      if (currentMaterial.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for material ${item.materialId}. Available: ${currentMaterial.currentStock}, Requested: ${item.quantity}`);
      }

      // Use FIFO logic to determine which lots to use
      const fifoResult = await this.processExitFIFO(item.materialId, item.quantity, userId);
      
      console.log('FIFO Result for material', item.materialId, ':', fifoResult);

      // Create exit movements for each lot used
      for (const lot of fifoResult.lots) {
        const result = await db.insert(materialMovements).values({
          type: exit.type,
          date: new Date(),
          userId: userId,
          materialId: item.materialId,
          quantity: lot.quantity,
          unitPrice: lot.unitPrice,
          destinationType: exit.destinationType,
          destinationEmployeeId: exit.destinationEmployeeId,
          destinationThirdPartyId: exit.destinationThirdPartyId,
          costCenterId: exit.costCenterId,
          notes: exit.notes ? `${exit.notes} (Lote R$ ${lot.unitPrice})` : `Lote R$ ${lot.unitPrice}`,
          ownerId: userId,
        }).returning();
        
        movements.push(result[0]);

        // Create audit log for each lot
        await this.createAuditLog({
          action: 'exit_created',
          tableName: 'material_movements',
          recordId: result[0].id,
          userId: userId,
          details: `Exit created for material ${item.materialId}, quantity: ${lot.quantity}, price: R$ ${lot.unitPrice} (FIFO)`,
        });
      }

      // Update material stock using accurate recalculation
      await this.recalculateMaterialStock(item.materialId);
    }

    console.log('Exit created successfully with FIFO logic. Total movements:', movements.length);
    
    // Return the first movement for compatibility
    return movements[0];
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

  async createEmployeeReturn(returnData: any, userId: number): Promise<MaterialMovement> {
    console.log("=== CREATE EMPLOYEE RETURN ===");
    console.log("Return data:", returnData);
    
    // Processar cada item da devolução
    const createdMovements = [];
    for (const item of returnData.items) {
      console.log(`Processing item: ${item.materialId}, qty: ${item.quantity}`);
      
      // Atualizar estoque do material
      const [material] = await db
        .select()
        .from(materials)
        .where(eq(materials.id, item.materialId));
      
      if (!material) {
        throw new Error(`Material with ID ${item.materialId} not found`);
      }
      
      const newStock = material.currentStock + item.quantity;
      console.log(`Updating stock for material ${item.materialId}: ${material.currentStock} -> ${newStock}`);
      
      await db
        .update(materials)
        .set({ currentStock: newStock })
        .where(eq(materials.id, item.materialId));
      
      // Criar registro de movimento
      const [movement] = await db
        .insert(materialMovements)
        .values({
          type: 'entry',
          date: new Date(returnData.date),
          userId: userId,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          originType: 'employee_return',
          returnEmployeeId: returnData.employeeId,
          isReturn: true,
          returnReason: item.reason,
          materialCondition: item.condition,
          notes: returnData.notes,
          costCenterId: returnData.costCenterId,
          ownerId: userId,
        })
        .returning();
      
      createdMovements.push(movement);
    }
    
    console.log(`Created ${createdMovements.length} return movements`);
    return createdMovements[0];
  }

  async createThirdPartyReturn(returnData: any, userId: number): Promise<MaterialMovement> {
    console.log("=== CREATE THIRD PARTY RETURN ===");
    console.log("Return data:", returnData);
    
    // Processar cada item da devolução
    const createdMovements = [];
    for (const item of returnData.items) {
      console.log(`Processing item: ${item.materialId}, qty: ${item.quantity}`);
      
      // Atualizar estoque do material
      const [material] = await db
        .select()
        .from(materials)
        .where(eq(materials.id, item.materialId));
      
      if (!material) {
        throw new Error(`Material with ID ${item.materialId} not found`);
      }
      
      const newStock = material.currentStock + item.quantity;
      console.log(`Updating stock for material ${item.materialId}: ${material.currentStock} -> ${newStock}`);
      
      await db
        .update(materials)
        .set({ currentStock: newStock })
        .where(eq(materials.id, item.materialId));
      
      // Criar registro de movimento
      const [movement] = await db
        .insert(materialMovements)
        .values({
          type: 'entry',
          date: new Date(returnData.date),
          userId: userId,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          originType: 'third_party_return',
          returnThirdPartyId: returnData.thirdPartyId,
          isReturn: true,
          returnReason: item.reason,
          materialCondition: item.condition,
          notes: returnData.notes,
          costCenterId: returnData.costCenterId,
          ownerId: userId,
        })
        .returning();
      
      createdMovements.push(movement);
    }
    
    console.log(`Created ${createdMovements.length} return movements`);
    return createdMovements[0];
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
    
    const stockData = await db
      .select({
        id: materials.id,
        name: materials.name,
        description: materials.description,
        unit: materials.unit,
        currentStock: materials.currentStock,
        minimumStock: materials.minimumStock,
        unitPrice: materials.unitPrice,
        categoryId: materials.categoryId,
        category: {
          id: categories.id,
          name: categories.name
        }
      })
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(materials.name);

    return stockData.map(item => ({
      ...item,
      stockStatus: item.currentStock <= item.minimumStock ? 'low_stock' : 'ok',
      totalValue: item.currentStock * parseFloat(item.unitPrice || '0')
    }));
  }

  async getGeneralMovementsReport(startDate?: Date, endDate?: Date, type?: 'entry' | 'exit', ownerId?: number, costCenterId?: number): Promise<any[]> {
    const conditions = [];
    // Use date field instead of createdAt for filtering
    if (startDate) conditions.push(gte(materialMovements.date, startDate));
    if (endDate) conditions.push(lte(materialMovements.date, endDate));
    if (type) conditions.push(eq(materialMovements.type, type));
    if (ownerId) conditions.push(eq(materialMovements.ownerId, ownerId));
    if (costCenterId) conditions.push(eq(materialMovements.costCenterId, costCenterId));
    
    const movements = await db
      .select({
        id: materialMovements.id,
        type: materialMovements.type,
        date: materialMovements.date, // Include movement date
        quantity: materialMovements.quantity,
        unitPrice: materialMovements.unitPrice,
        notes: materialMovements.notes,
        createdAt: materialMovements.createdAt,
        originType: materialMovements.originType,
        destinationType: materialMovements.destinationType,
        materialId: materialMovements.materialId,
        supplierId: materialMovements.supplierId,
        destinationEmployeeId: materialMovements.destinationEmployeeId,
        destinationThirdPartyId: materialMovements.destinationThirdPartyId,
        returnEmployeeId: materialMovements.returnEmployeeId,
        returnThirdPartyId: materialMovements.returnThirdPartyId,
        costCenterId: materialMovements.costCenterId,
        material: {
          id: materials.id,
          name: materials.name,
          unit: materials.unit
        },
        supplier: {
          id: suppliers.id,
          name: suppliers.name
        },
        employee: {
          id: employees.id,
          name: employees.name
        },
        thirdParty: {
          id: thirdParties.id,
          name: thirdParties.name
        },
        costCenter: {
          id: costCenters.id,
          code: costCenters.code,
          name: costCenters.name,
          department: costCenters.department
        }
      })
      .from(materialMovements)
      .leftJoin(materials, eq(materialMovements.materialId, materials.id))
      .leftJoin(suppliers, eq(materialMovements.supplierId, suppliers.id))
      .leftJoin(employees, or(
        eq(materialMovements.destinationEmployeeId, employees.id),
        eq(materialMovements.returnEmployeeId, employees.id)
      ))
      .leftJoin(costCenters, eq(materialMovements.costCenterId, costCenters.id))
      .leftJoin(thirdParties, or(
        eq(materialMovements.destinationThirdPartyId, thirdParties.id),
        eq(materialMovements.returnThirdPartyId, thirdParties.id)
      ))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(materialMovements.date), desc(materialMovements.createdAt)); // Order by movement date, then creation time

    // Add calculated total value and proper origin/destination to each movement
    return movements.map(movement => {
      let originDestination = '';
      let responsiblePerson = '';
      let displayType = movement.type === 'entry' ? 'Entrada' : 'Saída';

      // Determine origin/destination and responsible person based on movement type and origin/destination type
      if (movement.type === 'entry') {
        if (movement.originType === 'supplier' && movement.supplier) {
          originDestination = movement.supplier.name;
          responsiblePerson = '-';
        } else if (movement.originType === 'employee_return' && movement.employee) {
          originDestination = movement.employee.name;
          responsiblePerson = movement.employee.name;
          displayType = 'Devolução';
        } else if (movement.originType === 'third_party_return' && movement.thirdParty) {
          originDestination = movement.thirdParty.name;
          responsiblePerson = movement.thirdParty.name;
          displayType = 'Devolução';
        } else {
          originDestination = 'N/A';
          responsiblePerson = '-';
        }
      } else if (movement.type === 'exit') {
        if (movement.destinationType === 'employee' && movement.employee) {
          originDestination = movement.employee.name;
          responsiblePerson = movement.employee.name;
        } else if (movement.destinationType === 'third_party' && movement.thirdParty) {
          originDestination = movement.thirdParty.name;
          responsiblePerson = movement.thirdParty.name;
        } else {
          originDestination = 'N/A';
          responsiblePerson = '-';
        }
      }

      return {
        ...movement,
        totalValue: movement.quantity * parseFloat(movement.unitPrice || '0'),
        originDestination,
        responsiblePerson,
        displayType
      };
    });
  }

  // Enhanced version with totals and filters
  async getGeneralMovementsReportWithTotals(
    startDate?: Date, 
    endDate?: Date, 
    type?: 'entry' | 'exit' | 'return', 
    ownerId?: number, 
    costCenterId?: number,
    supplierId?: number,
    materialId?: number,
    categoryId?: number,
    employeeId?: number
  ): Promise<{
    movements: any[];
    totals: {
      totalEntries: number;
      totalExits: number;
      totalReturns: number;
      totalGeneral: number;
      count: number;
    };
  }> {
    const conditions = [];
    
    // Date filters
    if (startDate) conditions.push(gte(materialMovements.date, startDate));
    if (endDate) conditions.push(lte(materialMovements.date, endDate));
    if (ownerId) conditions.push(eq(materialMovements.ownerId, ownerId));
    if (costCenterId) conditions.push(eq(materialMovements.costCenterId, costCenterId));
    if (supplierId) conditions.push(eq(materialMovements.supplierId, supplierId));
    if (materialId) conditions.push(eq(materialMovements.materialId, materialId));
    
    // Employee filter (for both destination and return employees)
    if (employeeId) {
      conditions.push(or(
        eq(materialMovements.destinationEmployeeId, employeeId),
        eq(materialMovements.returnEmployeeId, employeeId)
      ));
    }
    
    // Type filter (including returns)
    if (type) {
      if (type === 'return') {
        conditions.push(or(
          eq(materialMovements.originType, 'employee_return'),
          eq(materialMovements.originType, 'third_party_return')
        ));
      } else {
        conditions.push(eq(materialMovements.type, type));
      }
    }
    
    // Category filter
    if (categoryId) {
      conditions.push(eq(materials.categoryId, categoryId));
    }
    
    const movements = await db
      .select({
        id: materialMovements.id,
        type: materialMovements.type,
        date: materialMovements.date,
        quantity: materialMovements.quantity,
        unitPrice: materialMovements.unitPrice,
        notes: materialMovements.notes,
        createdAt: materialMovements.createdAt,
        originType: materialMovements.originType,
        destinationType: materialMovements.destinationType,
        materialId: materialMovements.materialId,
        supplierId: materialMovements.supplierId,
        destinationEmployeeId: materialMovements.destinationEmployeeId,
        destinationThirdPartyId: materialMovements.destinationThirdPartyId,
        returnEmployeeId: materialMovements.returnEmployeeId,
        returnThirdPartyId: materialMovements.returnThirdPartyId,
        costCenterId: materialMovements.costCenterId,
        material: {
          id: materials.id,
          name: materials.name,
          unit: materials.unit
        },
        supplier: {
          id: suppliers.id,
          name: suppliers.name
        },
        employee: {
          id: employees.id,
          name: employees.name
        },
        thirdParty: {
          id: thirdParties.id,
          name: thirdParties.name
        },
        costCenter: {
          id: costCenters.id,
          code: costCenters.code,
          name: costCenters.name,
          department: costCenters.department
        }
      })
      .from(materialMovements)
      .leftJoin(materials, eq(materialMovements.materialId, materials.id))
      .leftJoin(suppliers, eq(materialMovements.supplierId, suppliers.id))
      .leftJoin(employees, or(
        eq(materialMovements.destinationEmployeeId, employees.id),
        eq(materialMovements.returnEmployeeId, employees.id)
      ))
      .leftJoin(costCenters, eq(materialMovements.costCenterId, costCenters.id))
      .leftJoin(thirdParties, or(
        eq(materialMovements.destinationThirdPartyId, thirdParties.id),
        eq(materialMovements.returnThirdPartyId, thirdParties.id)
      ))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(materialMovements.date));

    // Process movements and calculate totals
    let totalEntries = 0;
    let totalExits = 0;
    let totalReturns = 0;
    
    const processedMovements = movements.map(movement => {
      let originDestination = '';
      let responsiblePerson = '';
      let displayType = movement.type === 'entry' ? 'Entrada' : 'Saída';
      const totalValue = movement.quantity * parseFloat(movement.unitPrice || '0');

      // Determine movement type and calculate totals
      if (movement.type === 'entry') {
        if (movement.originType === 'supplier' && movement.supplier) {
          originDestination = movement.supplier.name;
          responsiblePerson = '-';
          totalEntries += totalValue;
        } else if (movement.originType === 'employee_return' && movement.employee) {
          originDestination = movement.employee.name;
          responsiblePerson = movement.employee.name;
          displayType = 'Devolução';
          totalReturns += totalValue;
        } else if (movement.originType === 'third_party_return' && movement.thirdParty) {
          originDestination = movement.thirdParty.name;
          responsiblePerson = movement.thirdParty.name;
          displayType = 'Devolução';
          totalReturns += totalValue;
        } else {
          originDestination = 'N/A';
          responsiblePerson = '-';
          totalEntries += totalValue;
        }
      } else if (movement.type === 'exit') {
        if (movement.destinationType === 'employee' && movement.employee) {
          originDestination = movement.employee.name;
          responsiblePerson = movement.employee.name;
        } else if (movement.destinationType === 'third_party' && movement.thirdParty) {
          originDestination = movement.thirdParty.name;
          responsiblePerson = movement.thirdParty.name;
        } else {
          originDestination = 'N/A';
          responsiblePerson = '-';
        }
        totalExits += totalValue;
      }

      return {
        ...movement,
        totalValue,
        originDestination,
        responsiblePerson,
        displayType
      };
    });

    return {
      movements: processedMovements,
      totals: {
        totalEntries,
        totalExits,
        totalReturns,
        totalGeneral: totalEntries + totalExits + totalReturns,
        count: processedMovements.length
      }
    };
  }

  async getMaterialConsumptionReport(materialId?: number, startDate?: Date, endDate?: Date, ownerId?: number): Promise<any[]> {
    const conditions = [eq(materialMovements.type, 'exit')];
    if (materialId) conditions.push(eq(materialMovements.materialId, materialId));
    if (startDate) conditions.push(gte(materialMovements.createdAt, startDate));
    if (endDate) conditions.push(lte(materialMovements.createdAt, endDate));
    
    const consumptionData = await db
      .select({
        id: materialMovements.id,
        type: materialMovements.type,
        quantity: materialMovements.quantity,
        unitPrice: materialMovements.unitPrice,
        notes: materialMovements.notes,
        createdAt: materialMovements.createdAt,
        destinationType: materialMovements.destinationType,
        materialId: materialMovements.materialId,
        destinationEmployeeId: materialMovements.destinationEmployeeId,
        destinationThirdPartyId: materialMovements.destinationThirdPartyId,
        material: {
          id: materials.id,
          name: materials.name,
          unit: materials.unit,
          unitPrice: materials.unitPrice
        },
        employee: {
          id: employees.id,
          name: employees.name
        },
        thirdParty: {
          id: thirdParties.id,
          name: thirdParties.name
        }
      })
      .from(materialMovements)
      .leftJoin(materials, eq(materialMovements.materialId, materials.id))
      .leftJoin(employees, eq(materialMovements.destinationEmployeeId, employees.id))
      .leftJoin(thirdParties, eq(materialMovements.destinationThirdPartyId, thirdParties.id))
      .where(and(...conditions))
      .orderBy(desc(materialMovements.createdAt));

    return consumptionData.map(item => ({
      ...item,
      totalValue: item.quantity * parseFloat(item.unitPrice || '0'),
      destination: item.employee?.name || item.thirdParty?.name || 'N/A'
    }));
  }

  // Material lots management for FIFO logic
  async getMaterialLots(materialId: number, ownerId?: number): Promise<any[]> {
    const conditions = [eq(materialMovements.materialId, materialId), eq(materialMovements.type, 'entry')];
    if (ownerId) {
      conditions.push(eq(materialMovements.ownerId, ownerId));
    }

    const entries = await db
      .select({
        id: materialMovements.id,
        materialId: materialMovements.materialId,
        unitPrice: materialMovements.unitPrice,
        quantity: materialMovements.quantity,
        date: materialMovements.date,
        supplierId: materialMovements.supplierId,
      })
      .from(materialMovements)
      .where(and(...conditions))
      .orderBy(materialMovements.date);

    // Group by price and calculate available quantity for each lot
    const lotMap = new Map<string, {
      unitPrice: string;
      totalEntries: number;
      entryDate: Date;
      supplierId: number | null;
      availableQuantity: number;
    }>();

    // First, aggregate all entries by price
    entries.forEach(entry => {
      const key = entry.unitPrice || '0';
      if (lotMap.has(key)) {
        const existing = lotMap.get(key)!;
        existing.totalEntries += entry.quantity;
      } else {
        lotMap.set(key, {
          unitPrice: entry.unitPrice || '0',
          totalEntries: entry.quantity,
          entryDate: entry.date,
          supplierId: entry.supplierId,
          availableQuantity: entry.quantity
        });
      }
    });

    // Calculate exits to determine available quantity
    const exits = await db
      .select({
        unitPrice: materialMovements.unitPrice,
        quantity: materialMovements.quantity,
      })
      .from(materialMovements)
      .where(
        and(
          eq(materialMovements.materialId, materialId),
          eq(materialMovements.type, 'exit'),
          ownerId ? eq(materialMovements.ownerId, ownerId) : undefined
        )
      );

    // Subtract exits from available quantities (FIFO order)
    let remainingExits = exits.reduce((sum, exit) => sum + exit.quantity, 0);
    const availableLots = Array.from(lotMap.entries())
      .sort(([,a], [,b]) => a.entryDate.getTime() - b.entryDate.getTime())
      .map(([unitPrice, lot]) => {
        let availableQuantity = lot.totalEntries;
        
        if (remainingExits > 0) {
          const usedFromThisLot = Math.min(remainingExits, lot.totalEntries);
          availableQuantity -= usedFromThisLot;
          remainingExits -= usedFromThisLot;
        }

        return {
          unitPrice,
          totalEntries: lot.totalEntries,
          availableQuantity: Math.max(0, availableQuantity),
          entryDate: lot.entryDate,
          supplierId: lot.supplierId
        };
      })
      .filter(lot => lot.availableQuantity > 0);

    return availableLots;
  }

  // Método específico para devoluções - incluir informações do fornecedor
  async getMaterialLotsForReturn(materialId: number, ownerId?: number): Promise<Array<{
    unitPrice: string;
    totalEntries: number;
    availableQuantity: number;
    entryDate: Date;
    supplierId: number | null;
    supplierName?: string;
    lastEntryDate: Date;
  }>> {
    // Buscar lotes disponíveis
    const availableLots = await this.getMaterialLots(materialId, ownerId);
    
    // Enriquecer com informações do fornecedor
    const enrichedLots = [];
    for (const lot of availableLots) {
      let supplierName = null;
      if (lot.supplierId) {
        try {
          const [supplier] = await db
            .select({ name: suppliers.name })
            .from(suppliers)
            .where(eq(suppliers.id, lot.supplierId));
          supplierName = supplier?.name;
        } catch (error) {
          console.log('Could not fetch supplier name:', error);
        }
      }
      
      enrichedLots.push({
        ...lot,
        supplierName,
        lastEntryDate: lot.entryDate
      });
    }
    
    return enrichedLots.sort((a, b) => b.lastEntryDate.getTime() - a.lastEntryDate.getTime());
  }

  async processExitFIFO(materialId: number, quantity: number, ownerId?: number): Promise<{
    lots: Array<{ unitPrice: string; quantity: number; }>;
    totalValue: number;
  }> {
    // Auto-fix before processing exit to ensure accurate stock data
    try {
      await this.autoFixStockDiscrepancies(ownerId);
    } catch (error) {
      console.error('Auto-fix failed during FIFO processing:', error);
    }
    const availableLots = await this.getMaterialLots(materialId, ownerId);
    const totalAvailable = availableLots.reduce((sum, lot) => sum + lot.availableQuantity, 0);

    if (totalAvailable < quantity) {
      throw new Error(`Estoque insuficiente. Disponível: ${totalAvailable}, Solicitado: ${quantity}`);
    }

    const usedLots: Array<{ unitPrice: string; quantity: number; }> = [];
    let remainingQuantity = quantity;
    let totalValue = 0;

    for (const lot of availableLots) {
      if (remainingQuantity <= 0) break;

      const quantityFromThisLot = Math.min(remainingQuantity, lot.availableQuantity);
      const unitPrice = parseFloat(lot.unitPrice);
      
      usedLots.push({
        unitPrice: lot.unitPrice,
        quantity: quantityFromThisLot
      });

      totalValue += quantityFromThisLot * unitPrice;
      remainingQuantity -= quantityFromThisLot;
    }

    return { lots: usedLots, totalValue };
  }

  async getFinancialStockReport(ownerId?: number, materialSearch?: string, categoryId?: number): Promise<any[]> {
    const conditions = [];
    if (ownerId) {
      conditions.push(eq(materials.ownerId, ownerId));
    }

    // Get current stock from materials table and calculate financial value based on supplier entries only
    const materialsData = await db
      .select({
        id: materials.id,
        name: materials.name,
        categoryId: materials.categoryId,
        categoryName: categories.name,
        unit: materials.unit,
        currentStock: materials.currentStock,
        unitPrice: materials.unitPrice
      })
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(materials.name);

    // Apply material search filter if provided
    let filteredMaterials = materialsData;
    if (materialSearch) {
      const searchTerm = materialSearch.toLowerCase();
      filteredMaterials = materialsData.filter(material => 
        material.name.toLowerCase().includes(searchTerm) ||
        (material.categoryName && material.categoryName.toLowerCase().includes(searchTerm))
      );
    }

    // Apply category filter if provided
    if (categoryId) {
      filteredMaterials = filteredMaterials.filter(material => 
        material.categoryId === categoryId
      );
    }

    // For each material, get the financial value based on FIFO (first supplier entries)
    const result = await Promise.all(filteredMaterials.map(async (material) => {
      // Get supplier entries for this material for financial calculation (FIFO)
      const supplierEntries = await db
        .select({
          unitPrice: materialMovements.unitPrice,
          quantity: materialMovements.quantity,
          date: materialMovements.date
        })
        .from(materialMovements)
        .where(
          and(
            eq(materialMovements.materialId, material.id),
            eq(materialMovements.type, 'entry'),
            eq(materialMovements.originType, 'supplier'),
            ownerId ? eq(materialMovements.ownerId, ownerId) : undefined
          )
        )
        .orderBy(materialMovements.date); // FIFO order

      // Get available lots for this material (FIFO logic)
      let lots: any[] = [];
      try {
        lots = await this.getMaterialLots(material.id, ownerId);
      } catch (error) {
        console.log(`Erro ao buscar lotes para material ${material.name}:`, error);
      }

      // If no lots available, return empty record
      if (lots.length === 0) {
        return {
          id: material.id,
          name: material.name,
          category: material.categoryName || 'Sem categoria',
          unit: material.unit || 'UN',
          currentStock: material.currentStock || 0,
          unitPrice: '0.00',
          totalValue: 0,
          lotInfo: 'Sem estoque',
          lots: []
        };
      }

      // Group lots by unit price to show separate entries
      const lotsByPrice = lots.reduce((acc, lot) => {
        const price = lot.unitPrice;
        if (!acc[price]) {
          acc[price] = {
            unitPrice: price,
            quantity: 0,
            totalValue: 0
          };
        }
        acc[price].quantity += lot.availableQuantity;
        acc[price].totalValue += lot.availableQuantity * parseFloat(price);
        return acc;
      }, {} as Record<string, any>);

      // Create base entry with total values
      const totalStock = Object.values(lotsByPrice).reduce((sum: number, lot: any) => sum + lot.quantity, 0);
      const totalValue = Object.values(lotsByPrice).reduce((sum: number, lot: any) => sum + lot.totalValue, 0);
      const avgPrice = totalStock > 0 ? (totalValue / totalStock).toFixed(2) : '0.00';

      return {
        id: material.id,
        name: material.name,
        category: material.categoryName || 'Sem categoria',
        unit: material.unit || 'UN',
        currentStock: totalStock,
        unitPrice: avgPrice,
        totalValue: totalValue,
        lotInfo: `${Object.keys(lotsByPrice).length} lote(s)`,
        lots: Object.entries(lotsByPrice).map(([price, data]: [string, any]) => ({
          unitPrice: parseFloat(price).toFixed(2),
          quantity: data.quantity,
          totalValue: data.totalValue,
          description: `${data.quantity} ${material.unit || 'UN'} × R$ ${parseFloat(price).toFixed(2)} = R$ ${data.totalValue.toFixed(2)}`
        }))
      };
    }));

    // Filter out materials with zero stock if desired
    return result.filter(item => item.currentStock > 0);
  }

  async getEmployeeMovementReport(employeeId?: number, month?: number, year?: number, ownerId?: number, startDate?: Date, endDate?: Date): Promise<any[]> {
    const { sql } = await import('drizzle-orm');
    const conditions = [];
    if (employeeId) {
      conditions.push(or(
        eq(materialMovements.destinationEmployeeId, employeeId),
        eq(materialMovements.returnEmployeeId, employeeId)
      ));
    }
    if (month) conditions.push(eq(sql`EXTRACT(MONTH FROM ${materialMovements.createdAt})`, month));
    if (year) conditions.push(eq(sql`EXTRACT(YEAR FROM ${materialMovements.createdAt})`, year));
    if (startDate) conditions.push(gte(materialMovements.createdAt, startDate));
    if (endDate) conditions.push(lte(materialMovements.createdAt, endDate));
    
    const movements = await db
      .select({
        id: materialMovements.id,
        type: materialMovements.type,
        quantity: materialMovements.quantity,
        unitPrice: materialMovements.unitPrice,
        notes: materialMovements.notes,
        createdAt: materialMovements.createdAt,
        materialId: materialMovements.materialId,
        destinationEmployeeId: materialMovements.destinationEmployeeId,
        returnEmployeeId: materialMovements.returnEmployeeId,
        material: {
          id: materials.id,
          name: materials.name,
          unit: materials.unit
        },
        employee: {
          id: employees.id,
          name: employees.name
        }
      })
      .from(materialMovements)
      .leftJoin(materials, eq(materialMovements.materialId, materials.id))
      .leftJoin(employees, or(
        eq(materialMovements.destinationEmployeeId, employees.id),
        eq(materialMovements.returnEmployeeId, employees.id)
      ))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(materialMovements.createdAt));

    return movements;
  }

  async getSupplierTrackingReport(supplierId?: number, startDate?: Date, endDate?: Date, ownerId?: number): Promise<any[]> {
    const conditions = [eq(materialMovements.type, 'entry')];
    if (supplierId) conditions.push(eq(materialMovements.supplierId, supplierId));
    if (startDate) conditions.push(gte(materialMovements.createdAt, startDate));
    if (endDate) conditions.push(lte(materialMovements.createdAt, endDate));
    
    const supplierData = await db
      .select({
        id: materialMovements.id,
        type: materialMovements.type,
        quantity: materialMovements.quantity,
        unitPrice: materialMovements.unitPrice,
        notes: materialMovements.notes,
        createdAt: materialMovements.createdAt,
        materialId: materialMovements.materialId,
        supplierId: materialMovements.supplierId,
        material: {
          id: materials.id,
          name: materials.name,
          unit: materials.unit
        },
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          contact: suppliers.email,
          email: suppliers.email
        }
      })
      .from(materialMovements)
      .leftJoin(materials, eq(materialMovements.materialId, materials.id))
      .leftJoin(suppliers, eq(materialMovements.supplierId, suppliers.id))
      .where(and(...conditions))
      .orderBy(desc(materialMovements.createdAt));

    return supplierData.map(item => ({
      ...item,
      totalValue: item.quantity * parseFloat(item.unitPrice || '0')
    }));
  }

  // Cost Center methods
  async getCostCenters(ownerId?: number): Promise<CostCenter[]> {
    const conditions = ownerId ? eq(costCenters.ownerId, ownerId) : undefined;
    return await db.select().from(costCenters).where(conditions).orderBy(costCenters.name);
  }

  async getCostCenter(id: number, ownerId?: number): Promise<CostCenter | undefined> {
    const conditions = ownerId ? and(eq(costCenters.id, id), eq(costCenters.ownerId, ownerId)) : eq(costCenters.id, id);
    const result = await db.select().from(costCenters).where(conditions).limit(1);
    return result[0] || undefined;
  }

  async createCostCenter(insertCostCenter: InsertCostCenter): Promise<CostCenter> {
    const [costCenter] = await db.insert(costCenters).values(insertCostCenter).returning();
    return costCenter;
  }

  async updateCostCenter(id: number, updateCostCenter: Partial<InsertCostCenter>, ownerId?: number): Promise<CostCenter | undefined> {
    const conditions = ownerId ? and(eq(costCenters.id, id), eq(costCenters.ownerId, ownerId)) : eq(costCenters.id, id);
    const [costCenter] = await db.update(costCenters).set(updateCostCenter).where(conditions).returning();
    return costCenter || undefined;
  }

  async deleteCostCenter(id: number, ownerId?: number): Promise<boolean> {
    try {
      const conditions = ownerId ? and(eq(costCenters.id, id), eq(costCenters.ownerId, ownerId)) : eq(costCenters.id, id);
      await db.delete(costCenters).where(conditions);
      return true;
    } catch (error) {
      console.error('Error deleting cost center:', error);
      return false;
    }
  }

  // Recalculate material stock based on movements
  async recalculateStock(materialId: number): Promise<number> {
    console.log(`Recalculating stock for material ${materialId}`);
    
    // Get all movements for this material
    const movements = await db
      .select({
        type: materialMovements.type,
        quantity: materialMovements.quantity,
      })
      .from(materialMovements)
      .where(eq(materialMovements.materialId, materialId))
      .orderBy(materialMovements.createdAt);

    let calculatedStock = 0;
    for (const movement of movements) {
      if (movement.type === 'entry') {
        calculatedStock += movement.quantity;
      } else if (movement.type === 'exit') {
        calculatedStock -= movement.quantity;
      }
    }

    console.log(`Calculated stock for material ${materialId}: ${calculatedStock}`);

    // Update material stock
    await db
      .update(materials)
      .set({ currentStock: calculatedStock })
      .where(eq(materials.id, materialId));

    return calculatedStock;
  }

  // Calculate material stock from movements (without updating database)
  async calculateMaterialStockFromMovements(materialId: number): Promise<number> {
    console.log(`Calculating stock for material ${materialId} from movements...`);
    
    const movements = await db
      .select({
        type: materialMovements.type,
        quantity: materialMovements.quantity,
        isReturn: materialMovements.isReturn,
        createdAt: materialMovements.createdAt,
        date: materialMovements.date,
      })
      .from(materialMovements)
      .where(eq(materialMovements.materialId, materialId))
      .orderBy(sql`COALESCE(${materialMovements.date}, ${materialMovements.createdAt}) ASC`);

    let stock = 0;
    
    for (const movement of movements) {
      if (movement.type === 'entry') {
        stock += movement.quantity;
      } else if (movement.type === 'exit') {
        if (movement.isReturn) {
          // Devolução aumenta o estoque
          stock += movement.quantity;
        } else {
          // Saída normal diminui o estoque
          stock -= movement.quantity;
        }
      }
    }

    const finalStock = Math.max(0, stock);
    console.log(`Material ${materialId}: Calculated stock = ${finalStock} (from ${movements.length} movements)`);
    return finalStock;
  }

  // Recalculate all material stocks
  async recalculateAllStocks(ownerId?: number): Promise<void> {
    console.log('Recalculating all material stocks...');
    
    const conditions = [];
    if (ownerId) conditions.push(eq(materials.ownerId, ownerId));
    
    const materialsList = await db
      .select({ id: materials.id, name: materials.name })
      .from(materials)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    for (const material of materialsList) {
      await this.recalculateStock(material.id);
    }
    
    console.log(`Recalculated stocks for ${materialsList.length} materials`);
  }

  // Delete movement and recalculate stock
  async deleteMovement(id: number, ownerId?: number): Promise<boolean> {
    try {
      console.log(`Deleting movement ${id}`);
      
      // First, get the movement details before deleting
      const conditions = [eq(materialMovements.id, id)];
      if (ownerId) conditions.push(eq(materialMovements.ownerId, ownerId));
      
      const [movement] = await db
        .select({
          materialId: materialMovements.materialId,
          type: materialMovements.type,
          quantity: materialMovements.quantity,
        })
        .from(materialMovements)
        .where(and(...conditions));

      if (!movement) {
        console.log(`Movement ${id} not found`);
        return false;
      }

      // Delete the movement
      const result = await db
        .delete(materialMovements)
        .where(and(...conditions));

      console.log(`Movement ${id} deleted, recalculating stock for material ${movement.materialId}`);
      
      // Recalculate stock for the affected material
      await this.recalculateStock(movement.materialId);
      
      return true;
    } catch (error) {
      console.error('Error deleting movement:', error);
      return false;
    }
  }

  async getCostCenterReport(costCenterId?: number, startDate?: Date, endDate?: Date, ownerId?: number): Promise<any[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(materialMovements.createdAt, startDate));
    if (endDate) conditions.push(lte(materialMovements.createdAt, endDate));
    if (ownerId) conditions.push(eq(materialMovements.ownerId, ownerId));
    
    // Centro de custo - NUNCA mostrar entradas de fornecedor
    // Apenas saídas (type = 'exit') ou devoluções (entry com originType = return)
    conditions.push(
      or(
        eq(materialMovements.type, 'exit'),
        and(
          eq(materialMovements.type, 'entry'),
          or(
            eq(materialMovements.originType, 'employee_return'),
            eq(materialMovements.originType, 'third_party_return')
          )
        )
      )
    );

    // Se um centro específico for selecionado, filtra por esse centro
    if (costCenterId) {
      conditions.push(eq(materialMovements.costCenterId, costCenterId));
    }

    const movements = await db
      .select({
        id: materialMovements.id,
        type: materialMovements.type,
        quantity: materialMovements.quantity,
        unitPrice: materialMovements.unitPrice,
        notes: materialMovements.notes,
        createdAt: materialMovements.createdAt,
        date: materialMovements.date,
        originType: materialMovements.originType,
        destinationType: materialMovements.destinationType,
        materialId: materialMovements.materialId,
        costCenterId: materialMovements.costCenterId,
        destinationEmployeeId: materialMovements.destinationEmployeeId,
        destinationThirdPartyId: materialMovements.destinationThirdPartyId,
        returnEmployeeId: materialMovements.returnEmployeeId,
        returnThirdPartyId: materialMovements.returnThirdPartyId,
        material: {
          id: materials.id,
          name: materials.name,
          unit: materials.unit
        },
        costCenter: {
          id: costCenters.id,
          code: costCenters.code,
          name: costCenters.name,
          department: costCenters.department
        }
      })
      .from(materialMovements)
      .leftJoin(materials, eq(materialMovements.materialId, materials.id))
      .leftJoin(costCenters, eq(materialMovements.costCenterId, costCenters.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(materialMovements.date), desc(materialMovements.createdAt));

    return movements.map(item => ({
      ...item,
      totalValue: item.quantity * parseFloat(item.unitPrice || '0'),
      displayType: (item.originType === 'employee_return' || item.originType === 'third_party_return') ? 'Devolução' : 'Saída'
    }));
  }
}

export const storage = new DatabaseStorage();