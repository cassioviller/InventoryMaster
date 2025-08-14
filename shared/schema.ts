import { pgTable, serial, text, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'user']);
export const movementTypeEnum = pgEnum('movement_type', ['entry', 'exit']);
export const originTypeEnum = pgEnum('origin_type', ['supplier', 'employee_return', 'third_party_return']);
export const destinationTypeEnum = pgEnum('destination_type', ['employee', 'third_party']);

// Users table - aligned with database structure
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('user'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  ownerId: integer("owner_id"),
});

// Categories table - aligned with database  
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Materials table - aligned with database structure
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  currentStock: integer("current_stock").notNull().default(0),
  minimumStock: integer("minimum_stock").notNull().default(0),
  unit: text("unit").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  unitPrice: decimal("unit_price"),
  lastSupplierId: integer("last_supplier_id").references(() => suppliers.id),
});

// Suppliers table - aligned with database
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  notes: text("notes"),
});

// Employees table - aligned with database
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department"),
  email: text("email"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Third parties table - aligned with database
export const thirdParties = pgTable("third_parties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  document: text("document"),
  documentType: text("document_type"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cost Centers table - new implementation
export const costCenters = pgTable("cost_centers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  department: text("department").notNull(),
  responsible: text("responsible").notNull(),
  monthlyBudget: decimal("monthly_budget", { precision: 10, scale: 2 }),
  annualBudget: decimal("annual_budget", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Material movements table - aligned with database structure
export const materialMovements = pgTable("material_movements", {
  id: serial("id").primaryKey(),
  type: movementTypeEnum("type").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  materialId: integer("material_id").notNull().references(() => materials.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: text("unit_price"),
  originType: originTypeEnum("origin_type"),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  returnEmployeeId: integer("return_employee_id").references(() => employees.id),
  returnThirdPartyId: integer("return_third_party_id").references(() => thirdParties.id),
  destinationType: destinationTypeEnum("destination_type"),
  destinationEmployeeId: integer("destination_employee_id").references(() => employees.id),
  destinationThirdPartyId: integer("destination_third_party_id").references(() => thirdParties.id),
  notes: text("notes"),
  costCenterId: integer("cost_center_id").references(() => costCenters.id),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit logs table - aligned with database
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id").notNull(),
  changes: text("changes"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLogs),
  movements: many(materialMovements),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  materials: many(materials),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  materials: many(materials),
  movements: many(materialMovements),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  category: one(categories, {
    fields: [materials.categoryId],
    references: [categories.id],
  }),
  lastSupplier: one(suppliers, {
    fields: [materials.lastSupplierId],
    references: [suppliers.id],
  }),
  movements: many(materialMovements),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  movements: many(materialMovements),
  returnMovements: many(materialMovements),
}));

export const thirdPartiesRelations = relations(thirdParties, ({ many }) => ({
  movements: many(materialMovements),
  returnMovements: many(materialMovements),
}));

export const costCentersRelations = relations(costCenters, ({ many }) => ({
  movements: many(materialMovements),
}));

export const materialMovementsRelations = relations(materialMovements, ({ one }) => ({
  user: one(users, {
    fields: [materialMovements.userId],
    references: [users.id],
  }),
  material: one(materials, {
    fields: [materialMovements.materialId],
    references: [materials.id],
  }),
  supplier: one(suppliers, {
    fields: [materialMovements.supplierId],
    references: [suppliers.id],
  }),
  employee: one(employees, {
    fields: [materialMovements.destinationEmployeeId],
    references: [employees.id],
  }),
  thirdParty: one(thirdParties, {
    fields: [materialMovements.destinationThirdPartyId],
    references: [thirdParties.id],
  }),
  returnEmployee: one(employees, {
    fields: [materialMovements.returnEmployeeId],
    references: [employees.id],
  }),
  returnThirdParty: one(thirdParties, {
    fields: [materialMovements.returnThirdPartyId],
    references: [thirdParties.id],
  }),
  costCenter: one(costCenters, {
    fields: [materialMovements.costCenterId],
    references: [costCenters.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

// User schemas
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(1).max(50),
  password: z.string().min(4),
}).omit({
  id: true,
  createdAt: true,
});

export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Category schemas
export const insertCategorySchema = createInsertSchema(categories, {
  name: z.string().min(1).max(100),
}).omit({
  id: true,
  createdAt: true,
});

export const selectCategorySchema = createSelectSchema(categories);
export type Category = z.infer<typeof selectCategorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// Supplier schemas
export const insertSupplierSchema = createInsertSchema(suppliers, {
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const selectSupplierSchema = createSelectSchema(suppliers);
export type Supplier = z.infer<typeof selectSupplierSchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

// Material schemas
export const insertMaterialSchema = createInsertSchema(materials, {
  name: z.string().min(1).max(100),
  unit: z.string().min(1).max(20),
  currentStock: z.number().min(0).default(0),
  minimumStock: z.number().min(0).default(0),
}).omit({
  id: true,
  createdAt: true,
});

// Schema for material updates that excludes currentStock to prevent overwriting
export const updateMaterialSchema = insertMaterialSchema.omit({
  currentStock: true,
});

export const selectMaterialSchema = createSelectSchema(materials);
export type Material = z.infer<typeof selectMaterialSchema>;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

// Employee schemas
export const insertEmployeeSchema = createInsertSchema(employees, {
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const selectEmployeeSchema = createSelectSchema(employees);
export type Employee = z.infer<typeof selectEmployeeSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// Third party schemas
export const insertThirdPartySchema = createInsertSchema(thirdParties, {
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const selectThirdPartySchema = createSelectSchema(thirdParties);
export type ThirdParty = z.infer<typeof selectThirdPartySchema>;
export type InsertThirdParty = z.infer<typeof insertThirdPartySchema>;

// Movement schemas
export const movementItemSchema = z.object({
  materialId: z.number(),
  quantity: z.number().min(0.01),
  unitPrice: z.string().optional(),
});

export const createEntrySchema = z.object({
  type: z.literal("entry"),
  date: z.string().optional(),
  originType: z.enum(["supplier", "employee_return", "third_party_return"]),
  supplierId: z.number().optional(),
  returnEmployeeId: z.number().optional(),
  returnThirdPartyId: z.number().optional(),
  costCenterId: z.number().optional(),
  items: z.array(movementItemSchema).min(1),
  notes: z.string().optional(),
});

export const createExitSchema = z.object({
  type: z.literal("exit"),
  date: z.string().optional(),
  destinationType: z.enum(["employee", "third_party"]),
  destinationEmployeeId: z.number().optional(),
  destinationThirdPartyId: z.number().optional(),
  costCenterId: z.number().min(1, "Centro de custo é obrigatório"),
  items: z.array(movementItemSchema).min(1),
  notes: z.string().optional(),
});

export const selectMovementSchema = createSelectSchema(materialMovements);
export type MaterialMovement = z.infer<typeof selectMovementSchema>;
export type CreateEntry = z.infer<typeof createEntrySchema>;
export type CreateExit = z.infer<typeof createExitSchema>;
export type MovementItem = z.infer<typeof movementItemSchema>;

// Audit log schemas
export const selectAuditLogSchema = createSelectSchema(auditLogs);
export type AuditLog = z.infer<typeof selectAuditLogSchema>;

// Type exports
export type UserRole = 'super_admin' | 'admin' | 'user';
export type MovementType = 'entry' | 'exit';
export type OriginType = 'supplier' | 'employee_return' | 'third_party_return';
export type DestinationType = 'employee' | 'third_party';

// Extended types for detailed views
export type MaterialWithDetails = Material & {
  category?: Category;
  lastSupplier?: Supplier;
  totalValue?: number;
  stockStatus?: 'low_stock' | 'ok';
};

export type MovementWithDetails = MaterialMovement & {
  user?: User;
  supplier?: Supplier;
  employee?: Employee;
  thirdParty?: ThirdParty;
  returnEmployee?: Employee;
  returnThirdParty?: ThirdParty;
  costCenter?: CostCenter;
};

// Cost Center Zod schemas
export const insertCostCenterSchema = createInsertSchema(costCenters, {
  code: z.string().min(1, "Código é obrigatório").max(20, "Código deve ter no máximo 20 caracteres"),
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  department: z.string().min(1, "Departamento é obrigatório"),
  responsible: z.string().min(1, "Responsável é obrigatório"),
  monthlyBudget: z.string().optional(),
  annualBudget: z.string().optional(),
}).omit({ id: true, createdAt: true, ownerId: true });

export const selectCostCenterSchema = createSelectSchema(costCenters);
export type CostCenter = z.infer<typeof selectCostCenterSchema>;
export type InsertCostCenter = z.infer<typeof insertCostCenterSchema>;