import { pgTable, text, serial, integer, boolean, timestamp, varchar, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based access
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'user']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  name: varchar("name", { length: 200 }),
  role: text("role").notNull().default('user'),
  isActive: boolean("isActive").notNull().default(true),
  ownerId: integer("ownerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Categories for materials
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull().default(1), // sistema padrão
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Materials inventory
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  categoryId: integer("category_id").notNull(),
  currentStock: integer("current_stock").notNull().default(0),
  minimumStock: integer("minimum_stock").notNull().default(0),
  unit: varchar("unit", { length: 20 }).default('unidade'),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default('0.00'),
  description: text("description"),
  lastSupplierId: integer("last_supplier_id"),
  ownerId: integer("owner_id").notNull().default(1), // sistema padrão
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employees
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  department: varchar("department", { length: 100 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: integer("owner_id").notNull().default(2), // axiomtech is ID 2
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  notes: text("notes"), // Materials and services provided
  isActive: boolean("is_active").notNull().default(true),
  ownerId: integer("owner_id").notNull().default(1), // sistema padrão
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Third parties (external entities)
export const thirdParties = pgTable("third_parties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  document: varchar("document", { length: 20 }),
  documentType: varchar("document_type", { length: 10 }).default('CPF'), // CPF or CNPJ
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: integer("owner_id").notNull().default(1), // sistema padrão
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Movement types
export const movementTypeEnum = pgEnum('movement_type', ['entry', 'exit']);
export const originTypeEnum = pgEnum('origin_type', ['supplier', 'employee_return', 'third_party_return']);
export const destinationTypeEnum = pgEnum('destination_type', ['employee', 'third_party']);

// Material movements (unified for entries and exits)
export const materialMovements = pgTable("material_movements", {
  id: serial("id").primaryKey(),
  type: movementTypeEnum("type").notNull(),
  date: timestamp("date").notNull(),
  userId: integer("user_id").notNull(),
  
  // For entries
  originType: originTypeEnum("origin_type"),
  supplierId: integer("supplier_id"),
  returnEmployeeId: integer("return_employee_id"),
  returnThirdPartyId: integer("return_third_party_id"),
  
  // For exits
  destinationType: destinationTypeEnum("destination_type"),
  destinationEmployeeId: integer("destination_employee_id"),
  destinationThirdPartyId: integer("destination_third_party_id"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Items within movements
export const movementItems = pgTable("movement_items", {
  id: serial("id").primaryKey(),
  movementId: integer("movement_id").notNull(),
  materialId: integer("material_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default('0.00'),
  purpose: text("purpose"), // For exits - what the material will be used for
});

// Audit log for tracking changes
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  tableName: varchar("table_name", { length: 50 }).notNull(),
  recordId: integer("record_id"),
  oldValues: text("old_values"),
  newValues: text("new_values"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  movements: many(materialMovements),
  auditLogs: many(auditLog),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  materials: many(materials),
}));

export const materialRelations = relations(materials, ({ one, many }) => ({
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

export const employeeRelations = relations(employees, ({ many }) => ({
  returnMovements: many(materialMovements, { relationName: "returnEmployee" }),
  destinationMovements: many(materialMovements, { relationName: "destinationEmployee" }),
}));

export const supplierRelations = relations(suppliers, ({ many }) => ({
  movements: many(materialMovements),
}));

export const thirdPartyRelations = relations(thirdParties, ({ many }) => ({
  returnMovements: many(materialMovements, { relationName: "returnThirdParty" }),
  destinationMovements: many(materialMovements, { relationName: "destinationThirdParty" }),
}));

export const movementRelations = relations(materialMovements, ({ one, many }) => ({
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
    relationName: "returnEmployee",
  }),
  returnThirdParty: one(thirdParties, {
    fields: [materialMovements.returnThirdPartyId],
    references: [thirdParties.id],
    relationName: "returnThirdParty",
  }),
  destinationEmployee: one(employees, {
    fields: [materialMovements.destinationEmployeeId],
    references: [employees.id],
    relationName: "destinationEmployee",
  }),
  destinationThirdParty: one(thirdParties, {
    fields: [materialMovements.destinationThirdPartyId],
    references: [thirdParties.id],
    relationName: "destinationThirdParty",
  }),
  items: many(movementItems),
}));

export const movementItemRelations = relations(movementItems, ({ one }) => ({
  movement: one(materialMovements, {
    fields: [movementItems.movementId],
    references: [materialMovements.id],
  }),
  material: one(materials, {
    fields: [movementItems.materialId],
    references: [materials.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export const insertThirdPartySchema = createInsertSchema(thirdParties).omit({
  id: true,
  createdAt: true,
});

export const insertMovementSchema = createInsertSchema(materialMovements).omit({
  id: true,
  createdAt: true,
});

export const insertMovementItemSchema = createInsertSchema(movementItems).omit({
  id: true,
});

// Login schema - simplified for compatibility
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Movement creation schemas
export const createEntrySchema = z.object({
  date: z.string(),
  originType: z.enum(['supplier', 'employee_return', 'third_party_return']),
  supplierId: z.number().optional(),
  returnEmployeeId: z.number().optional(),
  returnThirdPartyId: z.number().optional(),
  items: z.array(z.object({
    materialId: z.number(),
    quantity: z.number().min(1),
    unitPrice: z.number().optional(),
  })),
  notes: z.string().optional(),
});

export const createExitSchema = z.object({
  date: z.string(),
  destinationType: z.enum(['employee', 'third_party']),
  destinationEmployeeId: z.number().optional(),
  destinationThirdPartyId: z.number().optional(),
  items: z.array(z.object({
    materialId: z.number(),
    quantity: z.number().min(1),
    unitPrice: z.number().optional(),
    purpose: z.string().optional(),
  })),
  notes: z.string().optional(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type ThirdParty = typeof thirdParties.$inferSelect;
export type InsertThirdParty = z.infer<typeof insertThirdPartySchema>;
export type MaterialMovement = typeof materialMovements.$inferSelect;
export type InsertMovement = z.infer<typeof insertMovementSchema>;
export type MovementItem = typeof movementItems.$inferSelect;
export type InsertMovementItem = z.infer<typeof insertMovementItemSchema>;
export type AuditLog = typeof auditLog.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type CreateEntryData = z.infer<typeof createEntrySchema>;
export type CreateExitData = z.infer<typeof createExitSchema>;
