import { pgTable, serial, varchar, text, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'user']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).unique().notNull(),
  email: varchar("email", { length: 150 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull().default('User'),
  role: userRoleEnum("role").notNull().default('user'),
  isActive: boolean("isActive").notNull().default(true),
  ownerId: integer("ownerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  ownerId: integer("ownerId").notNull().default(2),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Materials
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  categoryId: integer("categoryId").notNull(),
  currentStock: integer("currentStock").notNull().default(0),
  minStock: integer("minStock").notNull().default(0),
  unit: varchar("unit", { length: 20 }).default('UN'),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).default('0.00'),
  description: text("description"),
  location: varchar("location", { length: 100 }),
  ownerId: integer("ownerId").notNull().default(2),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Employees
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  department: varchar("department", { length: 100 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("isActive").notNull().default(true),
  ownerId: integer("ownerId").notNull().default(2),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("isActive").notNull().default(true),
  ownerId: integer("ownerId").notNull().default(2),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Third parties
export const thirdParties = pgTable("third_parties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  document: varchar("document", { length: 20 }),
  documentType: varchar("document_type", { length: 10 }).default('CPF'),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  isActive: boolean("isActive").notNull().default(true),
  ownerId: integer("ownerId").notNull().default(2),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Movement enums
export const movementTypeEnum = pgEnum('movement_type', ['entry', 'exit']);
export const originTypeEnum = pgEnum('origin_type', ['supplier', 'employee_return', 'third_party_return']);
export const destinationTypeEnum = pgEnum('destination_type', ['employee', 'third_party']);

// Material movements
export const materialMovements = pgTable("material_movements", {
  id: serial("id").primaryKey(),
  materialId: integer("materialId").notNull(),
  userId: integer("userId").notNull(),
  ownerId: integer("ownerId").notNull(),
  quantity: integer("quantity").notNull(),
  movementType: movementTypeEnum("movementType").notNull(),
  originType: originTypeEnum("originType"),
  originId: integer("originId"),
  destinationType: destinationTypeEnum("destinationType"),
  destinationId: integer("destinationId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Movement items
export const movementItems = pgTable("movement_items", {
  id: serial("id").primaryKey(),
  movementId: integer("movementId").notNull(),
  materialId: integer("materialId").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).default('0.00'),
});

// Audit log
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  tableName: varchar("tableName", { length: 50 }),
  recordId: integer("recordId"),
  oldValues: text("oldValues"),
  newValues: text("newValues"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  materials: many(materials),
  movements: many(materialMovements),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  materials: many(materials),
}));

export const materialRelations = relations(materials, ({ one, many }) => ({
  category: one(categories, {
    fields: [materials.categoryId],
    references: [categories.id],
  }),
  movements: many(materialMovements),
}));

export const employeeRelations = relations(employees, ({ many }) => ({
  movements: many(materialMovements),
}));

export const supplierRelations = relations(suppliers, ({ many }) => ({
  movements: many(materialMovements),
}));

export const thirdPartyRelations = relations(thirdParties, ({ many }) => ({
  movements: many(materialMovements),
}));

export const movementRelations = relations(materialMovements, ({ one }) => ({
  user: one(users, {
    fields: [materialMovements.userId],
    references: [users.id],
  }),
  material: one(materials, {
    fields: [materialMovements.materialId],
    references: [materials.id],
  }),
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;
export type ThirdParty = typeof thirdParties.$inferSelect;
export type InsertThirdParty = typeof thirdParties.$inferInsert;
export type MaterialMovement = typeof materialMovements.$inferSelect;
export type InsertMaterialMovement = typeof materialMovements.$inferInsert;
export type MovementItem = typeof movementItems.$inferSelect;
export type InsertMovementItem = typeof movementItems.$inferInsert;
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, createdAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertThirdPartySchema = createInsertSchema(thirdParties).omit({ id: true, createdAt: true });
export const insertMaterialMovementSchema = createInsertSchema(materialMovements).omit({ id: true, createdAt: true });
export const insertMovementItemSchema = createInsertSchema(movementItems).omit({ id: true });
export const insertAuditLogSchema = createInsertSchema(auditLog).omit({ id: true, createdAt: true });

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

// Entry and Exit schemas
export const createEntrySchema = z.object({
  materialId: z.number(),
  quantity: z.number().positive(),
  supplierId: z.number().optional(),
  notes: z.string().optional()
});

export const createExitSchema = z.object({
  materialId: z.number(),
  quantity: z.number().positive(),
  employeeId: z.number().optional(),
  thirdPartyId: z.number().optional(),
  notes: z.string().optional()
});

// Movement types
export type CreateEntryData = z.infer<typeof createEntrySchema>;
export type CreateExitData = z.infer<typeof createExitSchema>;