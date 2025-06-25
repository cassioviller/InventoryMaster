// SCHEMA COMPLETO DRIZZLE - SISTEMA DE GERENCIAMENTO DE ALMOXARIFADO
// Este arquivo contém o schema completo para replicação exata

import { pgTable, text, serial, integer, boolean, timestamp, varchar, decimal, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'user']);
export const movementTypeEnum = pgEnum('movement_type', ['entry', 'exit']);
export const originTypeEnum = pgEnum('origin_type', ['supplier', 'employee_return', 'third_party_return']);
export const destinationTypeEnum = pgEnum('destination_type', ['employee', 'third_party']);

// ============================================================================
// TABELAS
// ============================================================================

// Usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  name: varchar("name", { length: 200 }),
  role: text("role").notNull().default('user'),
  isActive: boolean("isActive").notNull().default(true),
  ownerId: integer("ownerId").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  usernameIdx: index("idx_users_username").on(table.username),
  emailIdx: index("idx_users_email").on(table.email),
  ownerIdx: index("idx_users_owner").on(table.ownerId),
  roleIdx: index("idx_users_role").on(table.role),
}));

// Categorias
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("idx_categories_owner").on(table.ownerId),
  nameIdx: index("idx_categories_name").on(table.name),
}));

// Fornecedores
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("idx_suppliers_owner").on(table.ownerId),
  nameIdx: index("idx_suppliers_name").on(table.name),
  activeIdx: index("idx_suppliers_active").on(table.isActive),
}));

// Materiais
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  currentStock: integer("current_stock").notNull().default(0),
  minimumStock: integer("minimum_stock").notNull().default(0),
  unit: varchar("unit", { length: 20 }).default('unidade'),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default('0.00'),
  description: text("description"),
  lastSupplierId: integer("last_supplier_id").references(() => suppliers.id),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("idx_materials_owner").on(table.ownerId),
  categoryIdx: index("idx_materials_category").on(table.categoryId),
  supplierIdx: index("idx_materials_supplier").on(table.lastSupplierId),
  nameIdx: index("idx_materials_name").on(table.name),
  stockIdx: index("idx_materials_stock").on(table.currentStock),
}));

// Funcionários
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  department: varchar("department", { length: 100 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("isActive").notNull().default(true),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("idx_employees_owner").on(table.ownerId),
  nameIdx: index("idx_employees_name").on(table.name),
  departmentIdx: index("idx_employees_department").on(table.department),
  activeIdx: index("idx_employees_active").on(table.isActive),
}));

// Terceiros
export const thirdParties = pgTable("third_parties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  document: varchar("document", { length: 20 }),
  documentType: varchar("document_type", { length: 10 }).default('CPF'),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("idx_third_parties_owner").on(table.ownerId),
  nameIdx: index("idx_third_parties_name").on(table.name),
  documentIdx: index("idx_third_parties_document").on(table.document),
  activeIdx: index("idx_third_parties_active").on(table.isActive),
}));

// Movimentações de Materiais
export const materialMovements = pgTable("material_movements", {
  id: serial("id").primaryKey(),
  type: movementTypeEnum("type").notNull(),
  date: timestamp("date").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  
  // Para entradas
  originType: originTypeEnum("origin_type"),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  returnEmployeeId: integer("return_employee_id").references(() => employees.id),
  returnThirdPartyId: integer("return_third_party_id").references(() => thirdParties.id),
  
  // Para saídas
  destinationType: destinationTypeEnum("destination_type"),
  employeeId: integer("employee_id").references(() => employees.id),
  thirdPartyId: integer("third_party_id").references(() => thirdParties.id),
  
  // Itens e valores
  items: jsonb("items").notNull(), // Array de { materialId, quantity, unitPrice, totalPrice }
  description: text("description"),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }).default('0.00'),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("idx_movements_owner").on(table.ownerId),
  userIdx: index("idx_movements_user").on(table.userId),
  typeIdx: index("idx_movements_type").on(table.type),
  dateIdx: index("idx_movements_date").on(table.date),
  supplierIdx: index("idx_movements_supplier").on(table.supplierId),
  employeeIdx: index("idx_movements_employee").on(table.employeeId),
  thirdPartyIdx: index("idx_movements_third_party").on(table.thirdPartyId),
}));

// Logs de Auditoria
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  tableName: varchar("table_name", { length: 50 }),
  recordId: integer("record_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ownerId: integer("owner_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("idx_audit_owner").on(table.ownerId),
  userIdx: index("idx_audit_user").on(table.userId),
  tableIdx: index("idx_audit_table").on(table.tableName),
  dateIdx: index("idx_audit_date").on(table.createdAt),
  actionIdx: index("idx_audit_action").on(table.action),
}));

// ============================================================================
// RELACIONAMENTOS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  movements: many(materialMovements),
  auditLogs: many(auditLogs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  materials: many(materials),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  materials: many(materials),
  movements: many(materialMovements),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  category: one(categories, {
    fields: [materials.categoryId],
    references: [categories.id],
  }),
  lastSupplier: one(suppliers, {
    fields: [materials.lastSupplierId],
    references: [suppliers.id],
  }),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  movements: many(materialMovements),
  returnMovements: many(materialMovements),
}));

export const thirdPartiesRelations = relations(thirdParties, ({ many }) => ({
  movements: many(materialMovements),
  returnMovements: many(materialMovements),
}));

export const materialMovementsRelations = relations(materialMovements, ({ one }) => ({
  user: one(users, {
    fields: [materialMovements.userId],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [materialMovements.supplierId],
    references: [suppliers.id],
  }),
  employee: one(employees, {
    fields: [materialMovements.employeeId],
    references: [employees.id],
  }),
  returnEmployee: one(employees, {
    fields: [materialMovements.returnEmployeeId],
    references: [employees.id],
  }),
  thirdParty: one(thirdParties, {
    fields: [materialMovements.thirdPartyId],
    references: [thirdParties.id],
  }),
  returnThirdParty: one(thirdParties, {
    fields: [materialMovements.returnThirdPartyId],
    references: [thirdParties.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// SCHEMAS ZOD PARA VALIDAÇÃO
// ============================================================================

// Login
export const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Usuários
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  password: z.string().min(4, "Senha deve ter pelo menos 4 caracteres"),
}).omit({ id: true, createdAt: true });

export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Categorias
export const insertCategorySchema = createInsertSchema(categories, {
  name: z.string().min(1, "Nome é obrigatório"),
}).omit({ id: true, createdAt: true });

export const selectCategorySchema = createSelectSchema(categories);
export type Category = z.infer<typeof selectCategorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// Fornecedores
export const insertSupplierSchema = createInsertSchema(suppliers, {
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
}).omit({ id: true, createdAt: true });

export const selectSupplierSchema = createSelectSchema(suppliers);
export type Supplier = z.infer<typeof selectSupplierSchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

// Materiais
export const insertMaterialSchema = createInsertSchema(materials, {
  name: z.string().min(1, "Nome é obrigatório"),
  categoryId: z.number().min(1, "Categoria é obrigatória"),
  currentStock: z.number().min(0, "Estoque deve ser positivo"),
  minimumStock: z.number().min(0, "Estoque mínimo deve ser positivo"),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Preço inválido"),
}).omit({ id: true, createdAt: true });

export const selectMaterialSchema = createSelectSchema(materials);
export type Material = z.infer<typeof selectMaterialSchema>;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

// Funcionários
export const insertEmployeeSchema = createInsertSchema(employees, {
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
}).omit({ id: true, createdAt: true });

export const selectEmployeeSchema = createSelectSchema(employees);
export type Employee = z.infer<typeof selectEmployeeSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// Terceiros
export const insertThirdPartySchema = createInsertSchema(thirdParties, {
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
}).omit({ id: true, createdAt: true });

export const selectThirdPartySchema = createSelectSchema(thirdParties);
export type ThirdParty = z.infer<typeof selectThirdPartySchema>;
export type InsertThirdParty = z.infer<typeof insertThirdPartySchema>;

// Movimentações - Schema para itens
export const movementItemSchema = z.object({
  materialId: z.number().min(1, "Material é obrigatório"),
  quantity: z.number().min(1, "Quantidade deve ser positiva"),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Preço inválido"),
  totalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Total inválido"),
});

// Schema para entrada
export const createEntrySchema = z.object({
  originType: z.enum(['supplier', 'employee_return', 'third_party_return']),
  supplierId: z.number().optional(),
  returnEmployeeId: z.number().optional(),
  returnThirdPartyId: z.number().optional(),
  items: z.array(movementItemSchema).min(1, "Pelo menos um item é obrigatório"),
  description: z.string().optional(),
}).refine((data) => {
  if (data.originType === 'supplier') return data.supplierId;
  if (data.originType === 'employee_return') return data.returnEmployeeId;
  if (data.originType === 'third_party_return') return data.returnThirdPartyId;
  return false;
}, {
  message: "Origem da entrada é obrigatória",
  path: ["originType"],
});

// Schema para saída
export const createExitSchema = z.object({
  destinationType: z.enum(['employee', 'third_party']),
  employeeId: z.number().optional(),
  thirdPartyId: z.number().optional(),
  items: z.array(movementItemSchema).min(1, "Pelo menos um item é obrigatório"),
  description: z.string().optional(),
}).refine((data) => {
  if (data.destinationType === 'employee') return data.employeeId;
  if (data.destinationType === 'third_party') return data.thirdPartyId;
  return false;
}, {
  message: "Destino da saída é obrigatório",
  path: ["destinationType"],
});

export const selectMovementSchema = createSelectSchema(materialMovements);
export type MaterialMovement = z.infer<typeof selectMovementSchema>;
export type CreateEntry = z.infer<typeof createEntrySchema>;
export type CreateExit = z.infer<typeof createExitSchema>;
export type MovementItem = z.infer<typeof movementItemSchema>;

// Logs de auditoria
export const selectAuditLogSchema = createSelectSchema(auditLogs);
export type AuditLog = z.infer<typeof selectAuditLogSchema>;

// ============================================================================
// TYPES UTILITÁRIOS
// ============================================================================

export type UserRole = 'super_admin' | 'admin' | 'user';
export type MovementType = 'entry' | 'exit';
export type OriginType = 'supplier' | 'employee_return' | 'third_party_return';
export type DestinationType = 'employee' | 'third_party';

// Tipo para material com informações completas
export type MaterialWithDetails = Material & {
  category?: Category;
  lastSupplier?: Supplier;
  totalValue?: number;
  stockStatus?: 'low_stock' | 'ok';
};

// Tipo para movimentação com informações completas
export type MovementWithDetails = MaterialMovement & {
  user?: User;
  supplier?: Supplier;
  employee?: Employee;
  thirdParty?: ThirdParty;
  returnEmployee?: Employee;
  returnThirdParty?: ThirdParty;
};