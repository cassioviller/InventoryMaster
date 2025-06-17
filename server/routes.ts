import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertCategorySchema, insertMaterialSchema, insertEmployeeSchema, insertSupplierSchema, insertThirdPartySchema, createEntrySchema, createExitSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware to verify admin role
function requireAdmin(req: any, res: any, next: any) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// Middleware to verify super admin (only axiomtech can create users)
function requireSuperAdmin(req: any, res: any, next: any) {
  if (req.user.username !== 'axiomtech') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
}

// Middleware to verify system super admin (cassio)
function requireSystemSuperAdmin(req: any, res: any, next: any) {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'System super admin access required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await storage.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/verify", authenticateToken, async (req, res) => {
    const user = await storage.getUser(req.user.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  });

  // User management routes (admin or system super admin)
  app.get("/api/users", authenticateToken, async (req, res) => {
    // Allow access for admins or system super admins
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Admin or Super Admin access required' });
    }
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authenticateToken, async (req, res) => {
    // Allow access for super admins (axiomtech) or system super admins (cassio)
    if (req.user.username !== 'axiomtech' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'users',
        recordId: user.id,
        newValues: JSON.stringify(userData),
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      
      const oldUser = await storage.getUser(id);
      const user = await storage.updateUser(id, userData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'UPDATE',
        tableName: 'users',
        recordId: user.id,
        oldValues: JSON.stringify(oldUser),
        newValues: JSON.stringify(userData),
      });

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, async (req, res) => {
    // Allow access for super admins (axiomtech) or system super admins (cassio)
    if (req.user.username !== 'axiomtech' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }
    
    try {
      const id = parseInt(req.params.id);
      
      // Prevent deletion of super admin users
      const userToDelete = await storage.getUser(id);
      if (userToDelete?.role === 'super_admin') {
        return res.status(403).json({ message: 'Cannot delete super admin users' });
      }
      
      await storage.deleteUser(id);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'DELETE',
        tableName: 'users',
        recordId: id,
        oldValues: JSON.stringify(userToDelete),
        newValues: null,
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete user" });
    }
  });

  // Categories routes
  app.get("/api/categories", authenticateToken, async (req, res) => {
    try {
      // Super admin (cassio) sees all data, regular admins see only their data
      const ownerId = req.user.role === 'super_admin' ? undefined : req.user.id;
      const categories = await storage.getAllCategories(ownerId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", authenticateToken, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      // Set ownerId to current user for data isolation
      categoryData.ownerId = req.user.id;
      const category = await storage.createCategory(categoryData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'categories',
        recordId: category.id,
        newValues: JSON.stringify(categoryData),
      });

      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      
      const oldCategory = await storage.getCategory(id);
      const category = await storage.updateCategory(id, categoryData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'UPDATE',
        tableName: 'categories',
        recordId: category.id,
        oldValues: JSON.stringify(oldCategory),
        newValues: JSON.stringify(categoryData),
      });

      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const oldCategory = await storage.getCategory(id);
      await storage.deleteCategory(id);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'DELETE',
        tableName: 'categories',
        recordId: id,
        oldValues: JSON.stringify(oldCategory),
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete category" });
    }
  });

  // Materials routes
  app.get("/api/materials", authenticateToken, async (req, res) => {
    try {
      const { search, categoryId } = req.query;
      // Super admin (cassio) sees all data, regular admins see only their data
      const ownerId = req.user.role === 'super_admin' ? undefined : req.user.id;
      
      let materials;
      if (search) {
        materials = await storage.searchMaterials(search as string, ownerId);
      } else if (categoryId) {
        const materialsOnly = await storage.getMaterialsByCategory(parseInt(categoryId as string), ownerId);
        materials = await Promise.all(materialsOnly.map(async (material) => {
          const category = await storage.getCategory(material.categoryId, ownerId);
          return { ...material, category: category! };
        }));
      } else {
        materials = await storage.getAllMaterials(ownerId);
      }
      
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  app.get("/api/materials/low-stock", authenticateToken, async (req, res) => {
    try {
      const ownerId = req.user.role === 'super_admin' ? undefined : req.user.id;
      const materials = await storage.getMaterialsWithLowStock(ownerId);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock materials" });
    }
  });

  app.post("/api/materials", authenticateToken, async (req, res) => {
    try {
      const materialData = insertMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(materialData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'materials',
        recordId: material.id,
        newValues: JSON.stringify(materialData),
      });

      res.status(201).json(material);
    } catch (error) {
      res.status(400).json({ message: "Failed to create material" });
    }
  });

  app.put("/api/materials/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const materialData = insertMaterialSchema.partial().parse(req.body);
      
      const oldMaterial = await storage.getMaterial(id);
      const material = await storage.updateMaterial(id, materialData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'UPDATE',
        tableName: 'materials',
        recordId: material.id,
        oldValues: JSON.stringify(oldMaterial),
        newValues: JSON.stringify(materialData),
      });

      res.json(material);
    } catch (error) {
      res.status(400).json({ message: "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const oldMaterial = await storage.getMaterial(id);
      await storage.deleteMaterial(id);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'DELETE',
        tableName: 'materials',
        recordId: id,
        oldValues: JSON.stringify(oldMaterial),
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete material" });
    }
  });

  // Employees routes
  app.get("/api/employees", authenticateToken, async (req, res) => {
    try {
      const { search, active } = req.query;
      const ownerId = req.user.role === 'super_admin' ? undefined : req.user.id;
      
      let employees;
      if (search) {
        employees = await storage.searchEmployees(search as string, ownerId);
      } else if (active === 'true') {
        employees = await storage.getActiveEmployees(ownerId);
      } else {
        employees = await storage.getAllEmployees(ownerId);
      }
      
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", authenticateToken, async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'employees',
        recordId: employee.id,
        newValues: JSON.stringify(employeeData),
      });

      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      
      const oldEmployee = await storage.getEmployee(id);
      const employee = await storage.updateEmployee(id, employeeData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'UPDATE',
        tableName: 'employees',
        recordId: employee.id,
        oldValues: JSON.stringify(oldEmployee),
        newValues: JSON.stringify(employeeData),
      });

      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const oldEmployee = await storage.getEmployee(id);
      await storage.deleteEmployee(id);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'DELETE',
        tableName: 'employees',
        recordId: id,
        oldValues: JSON.stringify(oldEmployee),
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete employee" });
    }
  });

  // Suppliers routes
  app.get("/api/suppliers", authenticateToken, async (req, res) => {
    try {
      const { search, active } = req.query;
      const ownerId = req.user.role === 'super_admin' ? undefined : req.user.id;
      
      let suppliers;
      if (search) {
        suppliers = await storage.searchSuppliers(search as string, ownerId);
      } else if (active === 'true') {
        suppliers = await storage.getActiveSuppliers(ownerId);
      } else {
        suppliers = await storage.getAllSuppliers(ownerId);
      }
      
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", authenticateToken, async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'suppliers',
        recordId: supplier.id,
        newValues: JSON.stringify(supplierData),
      });

      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      
      const oldSupplier = await storage.getSupplier(id);
      const supplier = await storage.updateSupplier(id, supplierData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'UPDATE',
        tableName: 'suppliers',
        recordId: supplier.id,
        oldValues: JSON.stringify(oldSupplier),
        newValues: JSON.stringify(supplierData),
      });

      res.json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const oldSupplier = await storage.getSupplier(id);
      await storage.deleteSupplier(id);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'DELETE',
        tableName: 'suppliers',
        recordId: id,
        oldValues: JSON.stringify(oldSupplier),
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete supplier" });
    }
  });

  // Third parties routes
  app.get("/api/third-parties", authenticateToken, async (req, res) => {
    try {
      const { search, active } = req.query;
      const ownerId = req.user.role === 'super_admin' ? undefined : req.user.id;
      
      let thirdParties;
      if (search) {
        thirdParties = await storage.searchThirdParties(search as string, ownerId);
      } else if (active === 'true') {
        thirdParties = await storage.getActiveThirdParties(ownerId);
      } else {
        thirdParties = await storage.getAllThirdParties(ownerId);
      }
      
      res.json(thirdParties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch third parties" });
    }
  });

  app.post("/api/third-parties", authenticateToken, async (req, res) => {
    try {
      const thirdPartyData = insertThirdPartySchema.parse({
        ...req.body,
        ownerId: req.user.id
      });
      const thirdParty = await storage.createThirdParty(thirdPartyData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'third_parties',
        recordId: thirdParty.id,
        oldValues: null,
        newValues: JSON.stringify(thirdPartyData),
      });

      res.status(201).json(thirdParty);
    } catch (error) {
      res.status(400).json({ message: "Failed to create third party" });
    }
  });

  app.put("/api/third-parties/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const thirdPartyData = insertThirdPartySchema.partial().parse(req.body);
      const ownerId = req.user.role === 'super_admin' ? undefined : req.user.id;
      
      const oldThirdParty = await storage.getThirdParty(id, ownerId);
      const thirdParty = await storage.updateThirdParty(id, thirdPartyData, ownerId);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'UPDATE',
        tableName: 'third_parties',
        recordId: thirdParty.id,
        oldValues: JSON.stringify(oldThirdParty),
        newValues: JSON.stringify(thirdPartyData),
      });

      res.json(thirdParty);
    } catch (error) {
      res.status(400).json({ message: "Failed to update third party" });
    }
  });

  app.delete("/api/third-parties/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ownerId = req.user.role === 'super_admin' ? undefined : req.user.id;
      
      const oldThirdParty = await storage.getThirdParty(id, ownerId);
      await storage.deleteThirdParty(id, ownerId);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'DELETE',
        tableName: 'third_parties',
        recordId: id,
        oldValues: JSON.stringify(oldThirdParty),
        newValues: null,
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete third party" });
    }
  });

  // Movement routes
  app.post("/api/movements/entry", authenticateToken, async (req, res) => {
    try {
      const entryData = createEntrySchema.parse(req.body);
      const movement = await storage.createEntry(req.user.id, entryData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'material_movements',
        recordId: movement.id,
        newValues: JSON.stringify(entryData),
      });

      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create entry" });
    }
  });

  app.post("/api/movements/exit", authenticateToken, async (req, res) => {
    try {
      const exitData = createExitSchema.parse(req.body);
      const movement = await storage.createExit(req.user.id, exitData);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'material_movements',
        recordId: movement.id,
        newValues: JSON.stringify(exitData),
      });

      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create exit" });
    }
  });

  app.get("/api/movements", authenticateToken, async (req, res) => {
    try {
      const { type, startDate, endDate, employeeId } = req.query;
      
      let movements;
      if (employeeId) {
        movements = await storage.getMovementsByEmployee(parseInt(employeeId as string));
      } else if (startDate && endDate) {
        movements = await storage.getMovementsByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else if (type) {
        movements = await storage.getMovementsByType(type as 'entry' | 'exit');
      } else {
        movements = await storage.getAllMovements();
      }
      
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch movements" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const ownerId = req.user.role === 'super_admin' ? undefined : req.user.id;
      const stats = await storage.getDashboardStats(ownerId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/low-stock", authenticateToken, async (req, res) => {
    try {
      const ownerId = req.user.role === 'super_admin' ? undefined : req.user.id;
      const materials = await storage.getMaterialsWithLowStock(ownerId);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock alerts" });
    }
  });

  // Reports routes
  app.get("/api/reports/employee-movement", authenticateToken, async (req, res) => {
    try {
      const { employeeId, month, year } = req.query;
      const report = await storage.getEmployeeMovementReport(
        employeeId ? parseInt(employeeId as string) : undefined,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate employee movement report" });
    }
  });

  app.get("/api/reports/stock", authenticateToken, async (req, res) => {
    try {
      const { categoryId } = req.query;
      const report = await storage.getStockReport(
        categoryId ? parseInt(categoryId as string) : undefined
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate stock report" });
    }
  });

  app.get("/api/reports/general-movements", authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, type } = req.query;
      const report = await storage.getGeneralMovementsReport(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        type as 'entry' | 'exit' | undefined
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate general movements report" });
    }
  });

  app.get("/api/reports/material-consumption", authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, categoryId } = req.query;
      const report = await storage.getMaterialConsumptionReport(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        categoryId ? parseInt(categoryId as string) : undefined
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate material consumption report" });
    }
  });

  app.get("/api/reports/financial-stock", authenticateToken, async (req: any, res) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const report = await storage.getFinancialStockReport(ownerId);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate financial stock report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
