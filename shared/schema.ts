import { pgTable, serial, text, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'user']);
export const movementTypeEnum = pgEnum('movement_type', ['entry', 'exit']);
export const originTypeEnum = pgEnum('origin_type', ['supplier', 'employee_return', 'third_party_return']);
export const destinationTypeEnum = pgEnum('destination_type', ['employee', 'third_party']);
export const documentTypeEnum = pgEnum('document_type', ['cpf', 'cnpj']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").notNull().default('user'),
  isActive: boolean("isActive").notNull().default(true),
  ownerId: integer("ownerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Materials table
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  currentStock: integer("current_stock").notNull().default(0),
  minimumStock: integer("minimum_stock").notNull().default(0),
  unit: text("unit").notNull().default('un'),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default('0.00'),
  description: text("description"),
  lastSupplierId: integer("last_supplier_id").references(() => suppliers.id),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department"),
  email: text("email"),
  phone: text("phone"),
  isActive: boolean("isActive").notNull().default(true),
  ownerId: integer("ownerId").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Third parties table
export const thirdParties = pgTable("third_parties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  document: text("document"),
  documentType: documentTypeEnum("document_type").default('cpf'),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Material movements table
export const materialMovements = pgTable("material_movements", {
  id: serial("id").primaryKey(),
  type: movementTypeEnum("type").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  originType: originTypeEnum("origin_type"),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  returnEmployeeId: integer("return_employee_id").references(() => employees.id),
  returnThirdPartyId: integer("return_third_party_id").references(() => thirdParties.id),
  destinationType: destinationTypeEnum("destination_type"),
  destinationEmployeeId: integer("destination_employee_id").references(() => employees.id),
  destinationThirdPartyId: integer("destination_third_party_id").references(() => thirdParties.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Movement items table (for multiple materials per movement)
export const movementItems = pgTable("movement_items", {
  id: serial("id").primaryKey(),
  movementId: integer("movement_id").references(() => materialMovements.id).notNull(),
  materialId: integer("material_id").references(() => materials.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  purpose: text("purpose"),
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
  materials: many(materials),
  materialMovements: many(materialMovements),
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
  movementItems: many(movementItems),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  returnMovements: many(materialMovements, { relationName: "employeeReturns" }),
  destinationMovements: many(materialMovements, { relationName: "employeeDestinations" }),
}));

export const thirdPartiesRelations = relations(thirdParties, ({ many }) => ({
  returnMovements: many(materialMovements, { relationName: "thirdPartyReturns" }),
  destinationMovements: many(materialMovements, { relationName: "thirdPartyDestinations" }),
}));

export const materialMovementsRelations = relations(materialMovements, ({ one, many }) => ({
  user: one(users, {
    fields: [materialMovements.userId],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [materialMovements.supplierId],
    references: [suppliers.id],
  }),
  returnEmployee: one(employees, {
    fields: [materialMovements.returnEmployeeId],
    references: [employees.id],
    relationName: "employeeReturns",
  }),
  returnThirdParty: one(thirdParties, {
    fields: [materialMovements.returnThirdPartyId],
    references: [thirdParties.id],
    relationName: "thirdPartyReturns",
  }),
  destinationEmployee: one(employees, {
    fields: [materialMovements.destinationEmployeeId],
    references: [employees.id],
    relationName: "employeeDestinations",
  }),
  destinationThirdParty: one(thirdParties, {
    fields: [materialMovements.destinationThirdPartyId],
    references: [thirdParties.id],
    relationName: "thirdPartyDestinations",
  }),
  items: many(movementItems),
}));

export const movementItemsRelations = relations(movementItems, ({ one }) => ({
  movement: one(materialMovements, {
    fields: [movementItems.movementId],
    references: [materialMovements.id],
  }),
  material: one(materials, {
    fields: [movementItems.materialId],
    references: [materials.id],
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

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
}).omit({ id: true, createdAt: true });

export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertCategorySchema = createInsertSchema(categories, {
  name: z.string().min(1, "Name is required"),
}).omit({ id: true, createdAt: true });

export const selectCategorySchema = createSelectSchema(categories);
export type Category = z.infer<typeof selectCategorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export const insertSupplierSchema = createInsertSchema(suppliers, {
  name: z.string().min(1, "Name is required"),
}).omit({ id: true, createdAt: true });

export const selectSupplierSchema = createSelectSchema(suppliers);
export type Supplier = z.infer<typeof selectSupplierSchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export const insertMaterialSchema = createInsertSchema(materials, {
  name: z.string().min(1, "Name is required"),
  currentStock: z.number().min(0, "Stock cannot be negative"),
  minimumStock: z.number().min(0, "Minimum stock cannot be negative"),
}).omit({ id: true, createdAt: true });

export const selectMaterialSchema = createSelectSchema(materials);
export type Material = z.infer<typeof selectMaterialSchema>;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export const insertEmployeeSchema = createInsertSchema(employees, {
  name: z.string().min(1, "Name is required"),
}).omit({ id: true, createdAt: true });

export const selectEmployeeSchema = createSelectSchema(employees);
export type Employee = z.infer<typeof selectEmployeeSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export const insertThirdPartySchema = createInsertSchema(thirdParties, {
  name: z.string().min(1, "Name is required"),
}).omit({ id: true, createdAt: true });

export const selectThirdPartySchema = createSelectSchema(thirdParties);
export type ThirdParty = z.infer<typeof selectThirdPartySchema>;
export type InsertThirdParty = z.infer<typeof insertThirdPartySchema>;

// Movement schemas
export const movementItemSchema = z.object({
  materialId: z.number(),
  quantity: z.number().min(1),
  unitPrice: z.string(),
  purpose: z.string().optional(),
});

export const createEntrySchema = z.object({
  supplierId: z.number(),
  observation: z.string().optional(),
  items: z.array(movementItemSchema).min(1),
});

export const createExitSchema = z.object({
  employeeId: z.number().optional(),
  thirdPartyId: z.number().optional(),
  observation: z.string().optional(),
  items: z.array(movementItemSchema).min(1),
});

export const selectMovementSchema = createSelectSchema(materialMovements);
export type MaterialMovement = z.infer<typeof selectMovementSchema>;
export type CreateEntry = z.infer<typeof createEntrySchema>;
export type CreateExit = z.infer<typeof createExitSchema>;
export type MovementItem = z.infer<typeof movementItemSchema>;

export const selectAuditLogSchema = createSelectSchema(auditLogs);
export type AuditLog = z.infer<typeof selectAuditLogSchema>;

// Type aliases for convenience
export type UserRole = 'super_admin' | 'admin' | 'user';
export type MovementType = 'entry' | 'exit';
export type OriginType = 'supplier' | 'employee_return' | 'third_party_return';
export type DestinationType = 'employee' | 'third_party';

// Additional types for UI
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