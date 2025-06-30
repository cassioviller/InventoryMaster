import { pgTable, text, integer, serial, timestamp, boolean, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'user']);
export const movementTypeEnum = pgEnum('movement_type', ['entry', 'exit']);
export const originTypeEnum = pgEnum('origin_type', ['supplier', 'employee_return', 'third_party_return']);
export const destinationTypeEnum = pgEnum('destination_type', ['employee', 'third_party']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('user'),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj"),
  contact: text("contact"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  active: boolean("active").default(true).notNull(),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Materials table
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  unit: text("unit").notNull(),
  quantity: integer("quantity").default(0).notNull(),
  minQuantity: integer("min_quantity").default(0).notNull(),
  unitPrice: decimal("unit_price").default('0').notNull(),
  totalValue: decimal("total_value").default('0').notNull(),
  location: text("location"),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position"),
  department: text("department"),
  email: text("email"),
  phone: text("phone"),
  active: boolean("active").default(true).notNull(),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Third parties table
export const thirdParties = pgTable("third_parties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  document: text("document"),
  contact: text("contact"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  active: boolean("active").default(true).notNull(),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Material movements table
export const materialMovements = pgTable("material_movements", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").references(() => materials.id).notNull(),
  type: movementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price").default('0').notNull(),
  totalValue: decimal("total_value").default('0').notNull(),
  
  // Entry fields
  supplierId: integer("supplier_id").references(() => suppliers.id),
  
  // Exit fields
  employeeId: integer("employee_id").references(() => employees.id),
  thirdPartyId: integer("third_party_id").references(() => thirdParties.id),
  
  // Return fields
  returnEmployeeId: integer("return_employee_id").references(() => employees.id),
  returnThirdPartyId: integer("return_third_party_id").references(() => thirdParties.id),
  
  // Common fields
  observation: text("observation"),
  userId: integer("user_id").references(() => users.id).notNull(),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id").notNull(),
  oldValues: text("old_values"),
  newValues: text("new_values"),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  materialMovements: many(materialMovements),
  auditLogs: many(auditLogs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  materials: many(materials),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  materialMovements: many(materialMovements),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  category: one(categories, {
    fields: [materials.categoryId],
    references: [categories.id],
  }),
  movements: many(materialMovements),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  materialMovements: many(materialMovements),
  returnMovements: many(materialMovements),
}));

export const thirdPartiesRelations = relations(thirdParties, ({ many }) => ({
  materialMovements: many(materialMovements),
  returnMovements: many(materialMovements),
}));

export const materialMovementsRelations = relations(materialMovements, ({ one }) => ({
  material: one(materials, {
    fields: [materialMovements.materialId],
    references: [materials.id],
  }),
  supplier: one(suppliers, {
    fields: [materialMovements.supplierId],
    references: [suppliers.id],
  }),
  employee: one(employees, {
    fields: [materialMovements.employeeId],
    references: [employees.id],
  }),
  thirdParty: one(thirdParties, {
    fields: [materialMovements.thirdPartyId],
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
  user: one(users, {
    fields: [materialMovements.userId],
    references: [users.id],
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
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['super_admin', 'admin', 'user']).default('user'),
}).omit({ id: true, createdAt: true });

export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export const insertCategorySchema = createInsertSchema(categories, {
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
}).omit({ id: true, createdAt: true });

export const selectCategorySchema = createSelectSchema(categories);
export type Category = z.infer<typeof selectCategorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export const insertSupplierSchema = createInsertSchema(suppliers, {
  name: z.string().min(1, 'Name is required'),
  cnpj: z.string().optional(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  active: z.boolean().default(true),
}).omit({ id: true, createdAt: true });

export const selectSupplierSchema = createSelectSchema(suppliers);
export type Supplier = z.infer<typeof selectSupplierSchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export const insertMaterialSchema = createInsertSchema(materials, {
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.number().int().positive('Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  quantity: z.number().int().min(0).default(0),
  minQuantity: z.number().int().min(0).default(0),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format').default('0'),
  location: z.string().optional(),
}).omit({ id: true, createdAt: true, totalValue: true });

export const selectMaterialSchema = createSelectSchema(materials);
export type Material = z.infer<typeof selectMaterialSchema>;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export const insertEmployeeSchema = createInsertSchema(employees, {
  name: z.string().min(1, 'Name is required'),
  position: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  active: z.boolean().default(true),
}).omit({ id: true, createdAt: true });

export const selectEmployeeSchema = createSelectSchema(employees);
export type Employee = z.infer<typeof selectEmployeeSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export const insertThirdPartySchema = createInsertSchema(thirdParties, {
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  document: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  active: z.boolean().default(true),
}).omit({ id: true, createdAt: true });

export const selectThirdPartySchema = createSelectSchema(thirdParties);
export type ThirdParty = z.infer<typeof selectThirdPartySchema>;
export type InsertThirdParty = z.infer<typeof insertThirdPartySchema>;

// Movement schemas
export const movementItemSchema = z.object({
  materialId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
});

export const createEntrySchema = z.object({
  type: z.literal('entry'),
  supplierId: z.number().int().positive(),
  items: z.array(movementItemSchema).min(1, 'At least one item is required'),
  observation: z.string().optional(),
});

export const createExitSchema = z.object({
  type: z.literal('exit'),
  employeeId: z.number().int().positive().optional(),
  thirdPartyId: z.number().int().positive().optional(),
  items: z.array(movementItemSchema).min(1, 'At least one item is required'),
  observation: z.string().optional(),
}).refine(data => data.employeeId || data.thirdPartyId, {
  message: 'Either employee or third party must be selected',
});

export const selectMovementSchema = createSelectSchema(materialMovements);
export type MaterialMovement = z.infer<typeof selectMovementSchema>;
export type CreateEntry = z.infer<typeof createEntrySchema>;
export type CreateExit = z.infer<typeof createExitSchema>;
export type MovementItem = z.infer<typeof movementItemSchema>;

export const selectAuditLogSchema = createSelectSchema(auditLogs);
export type AuditLog = z.infer<typeof selectAuditLogSchema>;

// Type aliases
export type UserRole = 'super_admin' | 'admin' | 'user';
export type MovementType = 'entry' | 'exit';
export type OriginType = 'supplier' | 'employee_return' | 'third_party_return';
export type DestinationType = 'employee' | 'third_party';

// Extended types with relations
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
};