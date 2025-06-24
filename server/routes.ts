import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertCategorySchema, insertMaterialSchema, insertEmployeeSchema, insertSupplierSchema, insertThirdPartySchema, createEntrySchema, createExitSchema } from "@shared/schema";

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// Middleware to verify super admin (only axiomtech can create users)
function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.username !== 'axiomtech') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
}

// Middleware to verify system super admin (cassio)
function requireSystemSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ message: 'System super admin access required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // Get user from database
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isPasswordValid = await storage.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.get("/api/auth/verify", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // User routes
  app.get("/api/users", authenticateToken, requireSystemSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authenticateToken, requireSystemSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('Creating user with data:', req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'CREATE',
        tableName: 'users',
        recordId: user.id,
        oldValues: null,
        newValues: JSON.stringify(userData),
      });

      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Failed to create user" });
      }
    }
  });

  app.put("/api/users/:id", authenticateToken, requireSystemSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireSystemSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(id);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'DELETE',
        tableName: 'users',
        recordId: id,
        oldValues: JSON.stringify(user),
        newValues: null,
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete user" });
    }
  });

  // Categories routes
  app.get("/api/categories", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const categories = await storage.getAllCategories(ownerId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      categoryData.ownerId = req.user!.id;
      const category = await storage.createCategory(categoryData);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'CREATE',
        tableName: 'categories',
        recordId: category.id,
        oldValues: null,
        newValues: JSON.stringify(categoryData),
      });

      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const category = await storage.updateCategory(id, categoryData, ownerId);
      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(400).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const category = await storage.getCategory(id, ownerId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      await storage.deleteCategory(id, ownerId);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'DELETE',
        tableName: 'categories',
        recordId: id,
        oldValues: JSON.stringify(category),
        newValues: null,
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete category" });
    }
  });

  // Materials routes
  app.get("/api/materials", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const materials = await storage.getAllMaterials(ownerId);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  app.post("/api/materials", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const materialData = insertMaterialSchema.parse(req.body);
      materialData.ownerId = req.user!.id;
      const material = await storage.createMaterial(materialData);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'CREATE',
        tableName: 'materials',
        recordId: material.id,
        oldValues: null,
        newValues: JSON.stringify(materialData),
      });

      res.status(201).json(material);
    } catch (error) {
      res.status(400).json({ message: "Failed to create material" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const stats = await storage.getDashboardStats(ownerId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/low-stock", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const materials = await storage.getMaterialsWithLowStock(ownerId);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock alerts" });
    }
  });

  // Additional material endpoints
  app.put("/api/materials/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const materialData = insertMaterialSchema.partial().parse(req.body);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const material = await storage.updateMaterial(id, materialData, ownerId);
      res.json(material);
    } catch (error) {
      res.status(400).json({ message: "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const material = await storage.getMaterial(id, ownerId);
      
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      await storage.deleteMaterial(id, ownerId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete material" });
    }
  });

  // Employee routes
  app.get("/api/employees", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('Fetching employees for user:', req.user);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      console.log('Using ownerId:', ownerId);
      
      const employeesList = await storage.getAllEmployees(ownerId);
      console.log('Storage result:', employeesList);
      res.json(employeesList || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ message: "Failed to fetch employees", error: error.message });
    }
  });

  app.post("/api/employees", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      employeeData.ownerId = req.user!.id;
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      console.error('Error creating employee:', error);
      res.status(400).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const employee = await storage.updateEmployee(id, employeeData, ownerId);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      await storage.deleteEmployee(id, ownerId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete employee" });
    }
  });

  // Supplier routes
  app.get("/api/suppliers", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const suppliers = await storage.getAllSuppliers(ownerId);
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      supplierData.ownerId = req.user!.id;
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const supplier = await storage.updateSupplier(id, supplierData, ownerId);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      await storage.deleteSupplier(id, ownerId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete supplier" });
    }
  });

  // Third parties routes
  app.get("/api/third-parties", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const thirdParties = await storage.getAllThirdParties(ownerId);
      res.json(thirdParties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch third parties" });
    }
  });

  app.post("/api/third-parties", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const thirdPartyData = insertThirdPartySchema.parse(req.body);
      thirdPartyData.ownerId = req.user!.id;
      const thirdParty = await storage.createThirdParty(thirdPartyData);
      res.status(201).json(thirdParty);
    } catch (error) {
      res.status(400).json({ message: "Failed to create third party" });
    }
  });

  app.put("/api/third-parties/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const thirdPartyData = insertThirdPartySchema.partial().parse(req.body);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const thirdParty = await storage.updateThirdParty(id, thirdPartyData, ownerId);
      res.json(thirdParty);
    } catch (error) {
      res.status(400).json({ message: "Failed to update third party" });
    }
  });

  app.delete("/api/third-parties/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      await storage.deleteThirdParty(id, ownerId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete third party" });
    }
  });

  // Movement routes
  app.get("/api/movements", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const movements = await storage.getAllMovements(ownerId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch movements" });
    }
  });

  app.post("/api/movements/entry", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const entryData = createEntrySchema.parse(req.body);
      const movement = await storage.createEntry(req.user!.id, entryData);
      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({ message: "Failed to create entry" });
    }
  });

  app.post("/api/movements/exit", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const exitData = createExitSchema.parse(req.body);
      const movement = await storage.createExit(req.user!.id, exitData);
      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({ message: "Failed to create exit" });
    }
  });

  // Reports routes
  app.get("/api/reports/employee-movement", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { employeeId, month, year, startDate, endDate } = req.query;
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      
      let adjustedStartDate: Date | undefined;
      let adjustedEndDate: Date | undefined;
      
      if (startDate) {
        adjustedStartDate = new Date(startDate as string);
        adjustedStartDate.setHours(0, 0, 0, 0);
      }
      
      if (endDate) {
        adjustedEndDate = new Date(endDate as string);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        adjustedEndDate.setHours(0, 0, 0, 0);
      }
      
      const report = await storage.getEmployeeMovementReport(
        employeeId ? parseInt(employeeId as string) : undefined,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined,
        ownerId,
        adjustedStartDate,
        adjustedEndDate
      );
      res.json(report);
    } catch (error) {
      console.error('Error generating employee movement report:', error);
      res.status(500).json({ message: "Failed to generate employee movement report" });
    }
  });

  app.get("/api/reports/stock", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { categoryId } = req.query;
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const report = await storage.getStockReport(
        categoryId ? parseInt(categoryId as string) : undefined,
        ownerId
      );
      res.json(report);
    } catch (error) {
      console.error('Error generating stock report:', error);
      res.status(500).json({ message: "Failed to generate stock report" });
    }
  });

  app.get("/api/reports/general-movements", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { startDate, endDate, type } = req.query;
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      
      let adjustedStartDate: Date | undefined;
      let adjustedEndDate: Date | undefined;
      
      if (startDate) {
        adjustedStartDate = new Date(startDate as string);
        adjustedStartDate.setHours(0, 0, 0, 0);
      }
      
      if (endDate) {
        adjustedEndDate = new Date(endDate as string);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        adjustedEndDate.setHours(0, 0, 0, 0);
      }
      
      const report = await storage.getGeneralMovementsReport(
        adjustedStartDate,
        adjustedEndDate,
        type as 'entry' | 'exit',
        ownerId
      );
      res.json(report);
    } catch (error) {
      console.error('Error generating general movements report:', error);
      res.status(500).json({ message: "Failed to generate general movements report" });
    }
  });

  app.get("/api/reports/material-consumption", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { startDate, endDate, categoryId } = req.query;
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      
      let adjustedStartDate: Date | undefined;
      let adjustedEndDate: Date | undefined;
      
      if (startDate) {
        adjustedStartDate = new Date(startDate as string);
        adjustedStartDate.setHours(0, 0, 0, 0);
      }
      
      if (endDate) {
        adjustedEndDate = new Date(endDate as string);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        adjustedEndDate.setHours(0, 0, 0, 0);
      }
      
      const report = await storage.getMaterialConsumptionReport(
        adjustedStartDate,
        adjustedEndDate,
        categoryId ? parseInt(categoryId as string) : undefined,
        ownerId
      );
      res.json(report);
    } catch (error) {
      console.error('Error generating material consumption report:', error);
      res.status(500).json({ message: "Failed to generate material consumption report" });
    }
  });

  app.get("/api/reports/financial-stock", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const { materialSearch, categoryId } = req.query;
      const report = await storage.getFinancialStockReport(
        ownerId,
        materialSearch as string,
        categoryId ? parseInt(categoryId as string) : undefined
      );
      res.json(report);
    } catch (error) {
      console.error('Error generating financial stock report:', error);
      res.status(500).json({ message: "Failed to generate financial stock report" });
    }
  });

  app.get("/api/reports/supplier-tracking", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const { materialSearch, supplierSearch } = req.query;
      const report = await storage.getSupplierTrackingReport(
        ownerId, 
        materialSearch as string, 
        supplierSearch as string
      );
      res.json(report);
    } catch (error) {
      console.error('Error generating supplier tracking report:', error);
      res.status(500).json({ message: "Failed to generate supplier tracking report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}