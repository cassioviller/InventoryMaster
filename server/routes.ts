import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { db } from "./db";
import { ExportService, EXPORT_CONFIGS } from "./export-utils";
import { PDFGenerator } from "./pdf-generator";
import { 
  users, 
  categories, 
  materials, 
  suppliers, 
  employees, 
  thirdParties, 
  costCenters, 
  materialMovements 
} from "@shared/schema";
import { eq, desc, and, like, or } from "drizzle-orm";
import {
  loginSchema,
  insertUserSchema,
  insertCategorySchema,
  insertMaterialSchema,
  updateMaterialSchema,
  insertSupplierSchema,
  insertEmployeeSchema,
  insertThirdPartySchema,
  insertCostCenterSchema,
  createEntrySchema,
  createExitSchema,
  type User,
  type Category,
  type Material,
  type Supplier,
  type Employee,
  type ThirdParty,
  type CostCenter,
  type MaterialMovement,
  type CreateEntry,
  type CreateExit,
  type MovementItem,
  type UserRole,
} from "../shared/schema";

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
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// Middleware to verify super admin 
function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'super_admin') {
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
    console.log('=== LOGIN REQUEST DEBUG ===');
    console.log('Request headers:', req.headers);
    console.log('Raw body:', req.body);
    console.log('Body type:', typeof req.body);
    console.log('Body keys:', Object.keys(req.body || {}));
    
    try {
      // Manual validation for debugging
      if (!req.body || typeof req.body !== 'object') {
        console.log('Invalid body structure');
        return res.status(400).json({ message: "Invalid request format" });
      }
      
      const { username, password } = req.body;
      console.log(`Extracted: username="${username}", password="${password}"`);
      
      if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ message: "Username and password required" });
      }
      
      // Get user from database
      console.log('Searching for user in database...');
      const user = await storage.getUserByUsername(username);
      console.log('User query result:', user ? `Found: ${user.username}` : 'Not found');
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password using bcrypt
      console.log('Verifying password...');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password verification result:', isPasswordValid);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      console.log('Generating JWT token...');
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('=== LOGIN SUCCESS ===');
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        } 
      });
    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error details:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/auth/verify", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // User routes
  app.get("/api/users", authenticateToken, requireSystemSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getUsers();
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
      
      // Hash password before creating user
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userToCreate = {
        ...userData,
        password: hashedPassword
      };
      
      const user = await storage.createUser(userToCreate);
      
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

  // Update user route
  app.put("/api/users/:id", authenticateToken, requireSystemSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const updateData = req.body;

      // Hash password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'UPDATE',
        tableName: 'users',
        recordId: userId,
        oldValues: null,
        newValues: JSON.stringify(updateData),
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  // Delete user route
  app.delete("/api/users/:id", authenticateToken, requireSystemSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent deletion of super admin users
      const userToDelete = await storage.getUser(userId);
      if (userToDelete?.role === 'super_admin') {
        return res.status(403).json({ message: "Cannot delete super admin users" });
      }

      await storage.deleteUser(userId);
      
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'DELETE',
        tableName: 'users',
        recordId: userId,
        oldValues: null,
        newValues: null,
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(400).json({ message: "Failed to delete user" });
    }
  });

  // Categories routes
  app.get("/api/categories", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const categories = await storage.getCategories(ownerId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("=== CREATE CATEGORY DEBUG ===");
      console.log("Request body:", req.body);
      console.log("User:", req.user);
      
      const categoryData = insertCategorySchema.parse(req.body);
      categoryData.ownerId = req.user!.id;
      
      console.log("Parsed category data:", categoryData);
      
      const category = await storage.createCategory(categoryData);
      
      console.log("Created category:", category);
      res.status(201).json(category);
    } catch (error) {
      console.error("Category creation error:", error);
      res.status(400).json({ 
        message: "Failed to create category",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
      const search = req.query.search as string;
      
      let materials;
      if (search) {
        materials = await storage.searchMaterials(search, ownerId);
      } else {
        materials = await storage.getMaterials(ownerId);
      }
      
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  app.post("/api/materials", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("=== CREATE MATERIAL DEBUG ===");
      console.log("Request body:", req.body);
      console.log("User:", req.user);
      
      const materialData = insertMaterialSchema.parse(req.body);
      materialData.ownerId = req.user!.id;
      
      console.log("Parsed material data:", materialData);
      
      const material = await storage.createMaterial(materialData);
      
      console.log("Created material:", material);
      res.status(201).json(material);
    } catch (error) {
      console.error("Material creation error:", error);
      res.status(400).json({ 
        message: "Failed to create material",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
      const materials = await storage.getLowStockMaterials(ownerId);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock alerts" });
    }
  });

  // Additional material endpoints
  app.put("/api/materials/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Remove currentStock from request body to prevent overwriting
      const { currentStock, ...cleanData } = req.body;
      
      const materialData = insertMaterialSchema.partial().parse(cleanData);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const material = await storage.updateMaterial(id, materialData, ownerId);
      res.json(material);
    } catch (error) {
      console.error('Material update error:', error);
      res.status(400).json({ 
        message: "Failed to update material",
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
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

      const result = await storage.deleteMaterial(id, ownerId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete material" });
    }
  });

  // Employee routes
  app.get("/api/employees", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const search = req.query.search as string;
      
      let employeesList;
      if (search) {
        employeesList = await storage.searchEmployees(search, ownerId);
      } else {
        employeesList = await storage.getEmployees(ownerId);
      }
      
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
      const search = req.query.search as string;
      
      let suppliers;
      if (search) {
        suppliers = await storage.searchSuppliers(search, ownerId);
      } else {
        suppliers = await storage.getSuppliers(ownerId);
      }
      
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
      const search = req.query.search as string;
      
      let thirdParties;
      if (search) {
        thirdParties = await storage.searchThirdParties(search, ownerId);
      } else {
        thirdParties = await storage.getThirdParties(ownerId);
      }
      
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
      const movements = await storage.getMovements(ownerId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch movements" });
    }
  });

  app.post("/api/movements/entry", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("=== RECEIVED ENTRY REQUEST ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("User:", req.user);
      
      const entryData = createEntrySchema.parse(req.body);
      console.log("Parsed entry data:", entryData);
      
      const movement = await storage.createEntry(entryData, req.user!.id);
      console.log("Entry created successfully:", movement);
      
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating entry:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: (error as any).errors 
        });
      }
      res.status(500).json({ 
        message: "Failed to create entry",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/movements/exit", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("=== CREATE EXIT DEBUG ===");
      console.log("Request body:", req.body);
      console.log("User:", req.user);
      
      const exitData = createExitSchema.parse(req.body);
      console.log("Parsed exit data:", exitData);
      
      const movement = await storage.createExit(exitData, req.user!.id);
      console.log("Exit created successfully:", movement);
      
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating exit:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: (error as any).errors 
        });
      }
      res.status(500).json({ 
        message: "Failed to create exit",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Employee return endpoint
  app.post("/api/movements/employee-return", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("=== EMPLOYEE RETURN REQUEST ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const returnData = req.body;
      
      console.log("Return data:", returnData);
      
      // Criar entrada como devolução
      const movement = await storage.createEmployeeReturn(returnData, req.user!.id);
      console.log("Employee return created successfully:", movement);
      
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating employee return:", error);
      res.status(500).json({ 
        message: "Failed to create employee return",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Third party return endpoint
  app.post("/api/movements/third-party-return", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("=== THIRD PARTY RETURN REQUEST ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const returnData = req.body;
      
      console.log("Return data:", returnData);
      
      // Criar entrada como devolução
      const movement = await storage.createThirdPartyReturn(returnData, req.user!.id);
      console.log("Third party return created successfully:", movement);
      
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating third party return:", error);
      res.status(500).json({ 
        message: "Failed to create third party return",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get material lots (for return interface)
  app.get("/api/materials/:id/lots", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const materialId = parseInt(req.params.id);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const lots = await storage.getMaterialLots(materialId, ownerId);
      res.json(lots);
    } catch (error) {
      console.error("Error fetching material lots:", error);
      res.status(500).json({ 
        message: "Failed to fetch material lots",
        error: error instanceof Error ? error.message : String(error)
      });
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
      res.json(Array.isArray(report) ? report : []);
    } catch (error) {
      console.error('Error generating employee movement report:', error);
      res.status(500).json({ 
        message: "Failed to generate employee movement report",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
      res.json(Array.isArray(report) ? report : []);
    } catch (error) {
      console.error('Error generating stock report:', error);
      res.status(500).json({ 
        message: "Failed to generate stock report",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
      res.json(Array.isArray(report) ? report : []);
    } catch (error) {
      console.error('Error generating general movements report:', error);
      res.status(500).json({ 
        message: "Failed to generate general movements report",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
      res.json(Array.isArray(report) ? report : []);
    } catch (error) {
      console.error('Error generating material consumption report:', error);
      res.status(500).json({ 
        message: "Failed to generate material consumption report",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

// Enhanced general movements report with totals and advanced filters
app.get("/api/reports/general-movements-enhanced", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, type, costCenterId, supplierId, materialId, categoryId, employeeId } = req.query;
    const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
    
    let adjustedStartDate, adjustedEndDate;
    if (startDate) {
      adjustedStartDate = new Date(startDate as string);
      adjustedStartDate.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      adjustedEndDate = new Date(endDate as string);
      adjustedEndDate.setHours(23, 59, 59, 999);
    }
    
    const report = await storage.getGeneralMovementsReportWithTotals(
      adjustedStartDate,
      adjustedEndDate,
      type as 'entry' | 'exit' | 'return' | undefined,
      ownerId,
      costCenterId ? parseInt(costCenterId as string) : undefined,
      supplierId ? parseInt(supplierId as string) : undefined,
      materialId ? parseInt(materialId as string) : undefined,
      categoryId ? parseInt(categoryId as string) : undefined,
      employeeId ? parseInt(employeeId as string) : undefined
    );
    
    res.json(report);
  } catch (error) {
    console.error('Error generating enhanced general movements report:', error);
    res.status(500).json({ 
      message: "Failed to generate enhanced general movements report",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Material lots routes for FIFO logic
app.get("/api/materials/:id/lots", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const materialId = parseInt(req.params.id);
    const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
    
    const lots = await storage.getMaterialLots(materialId, ownerId);
    res.json(lots);
  } catch (error) {
    console.error('Error fetching material lots:', error);
    res.status(500).json({ 
      message: "Failed to fetch material lots",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Endpoint específico para devoluções - busca lotes disponíveis
app.get("/api/materials/:id/return-lots", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const materialId = parseInt(req.params.id);
    const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
    
    const lots = await storage.getMaterialLotsForReturn(materialId, ownerId);
    res.json(lots);
  } catch (error) {
    console.error('Error fetching return lots:', error);
    res.status(500).json({ 
      message: "Failed to fetch return lots",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

app.post("/api/materials/:id/simulate-exit", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const materialId = parseInt(req.params.id);
    const { quantity } = req.body;
    const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
    
    const fifoResult = await storage.processExitFIFO(materialId, quantity, ownerId);
    res.json(fifoResult);
  } catch (error) {
    console.error('Error simulating exit:', error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Failed to simulate exit"
    });
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
      res.json(Array.isArray(report) ? report : []);
    } catch (error) {
      console.error('Error generating financial stock report:', error);
      res.status(500).json({ 
        message: "Failed to generate financial stock report",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
      res.json(Array.isArray(report) ? report : []);
    } catch (error) {
      console.error('Error generating supplier tracking report:', error);
      res.status(500).json({ 
        message: "Failed to generate supplier tracking report",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Cost Center routes
  // Stock recalculation routes
  app.post('/api/materials/:id/recalculate-stock', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const materialId = parseInt(req.params.id);
      
      if (isNaN(materialId)) {
        return res.status(400).json({ error: 'Invalid material ID' });
      }

      const newStock = await storage.recalculateStock(materialId);
      
      res.json({ 
        success: true, 
        materialId, 
        newStock,
        message: `Stock recalculated: ${newStock} units`
      });
    } catch (error) {
      console.error('Error recalculating stock:', error);
      res.status(500).json({ error: 'Failed to recalculate stock' });
    }
  });

  app.post('/api/materials/recalculate-all-stocks', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      
      await storage.recalculateAllStocks(user?.id);
      
      res.json({ 
        success: true,
        message: 'All stocks recalculated successfully'
      });
    } catch (error) {
      console.error('Error recalculating all stocks:', error);
      res.status(500).json({ error: 'Failed to recalculate all stocks' });
    }
  });

  // Validate and fix stock discrepancies 
  app.post("/api/materials/validate-stocks", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('Validating stock discrepancies...');
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      
      // Get current materials and their calculated stocks
      const materials = await storage.getMaterials(ownerId);
      const discrepancies = [];
      
      for (const material of materials) {
        const calculatedStock = await storage.calculateMaterialStockFromMovements(material.id);
        if (material.currentStock !== calculatedStock) {
          discrepancies.push({
            materialId: material.id,
            materialName: material.name,
            storedStock: material.currentStock,
            calculatedStock: calculatedStock,
            difference: calculatedStock - material.currentStock
          });
          
          // Auto-fix the discrepancy
          await storage.recalculateStock(material.id);
        }
      }
      
      if (discrepancies.length > 0) {
        console.log(`Fixed ${discrepancies.length} stock discrepancies:`, discrepancies);
        res.json({ 
          success: true, 
          message: `Found and fixed ${discrepancies.length} stock discrepancies`,
          discrepancies 
        });
      } else {
        res.json({ 
          success: true, 
          message: "No stock discrepancies found - all stocks are accurate",
          discrepancies: [] 
        });
      }
    } catch (error) {
      console.error('Error validating stocks:', error);
      res.status(500).json({ message: "Failed to validate stocks" });
    }
  });

  // Movement management routes
  app.delete('/api/movements/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const movementId = parseInt(req.params.id);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      
      if (isNaN(movementId)) {
        return res.status(400).json({ error: 'Invalid movement ID' });
      }

      const success = await storage.deleteMovement(movementId, ownerId);
      
      if (!success) {
        return res.status(404).json({ error: 'Movement not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting movement:', error);
      res.status(500).json({ error: 'Failed to delete movement' });
    }
  });

  app.get("/api/cost-centers", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const costCenters = await storage.getCostCenters(ownerId);
      res.json(costCenters);
    } catch (error) {
      console.error('Error fetching cost centers:', error);
      res.status(500).json({ message: "Failed to fetch cost centers" });
    }
  });

  app.get("/api/cost-centers/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const costCenter = await storage.getCostCenter(id, ownerId);
      
      if (!costCenter) {
        return res.status(404).json({ message: "Cost center not found" });
      }
      
      res.json(costCenter);
    } catch (error) {
      console.error('Error fetching cost center:', error);
      res.status(500).json({ message: "Failed to fetch cost center" });
    }
  });

  app.post("/api/cost-centers", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const validatedData = insertCostCenterSchema.parse(req.body);
      
      const costCenterData = {
        ...validatedData,
        ownerId: ownerId || 1
      };
      
      const costCenter = await storage.createCostCenter(costCenterData);
      res.status(201).json(costCenter);
    } catch (error) {
      console.error('Error creating cost center:', error);
      res.status(400).json({ message: "Failed to create cost center" });
    }
  });

  app.put("/api/cost-centers/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const validatedData = insertCostCenterSchema.partial().parse(req.body);
      
      const costCenter = await storage.updateCostCenter(id, validatedData, ownerId);
      
      if (!costCenter) {
        return res.status(404).json({ message: "Cost center not found" });
      }
      
      res.json(costCenter);
    } catch (error) {
      console.error('Error updating cost center:', error);
      res.status(400).json({ message: "Failed to update cost center" });
    }
  });

  app.delete("/api/cost-centers/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const success = await storage.deleteCostCenter(id, ownerId);
      
      if (!success) {
        return res.status(404).json({ message: "Cost center not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting cost center:', error);
      res.status(500).json({ message: "Failed to delete cost center" });
    }
  });

  // Cost Center Report route
  app.get("/api/reports/cost-center", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      const { costCenterId, startDate, endDate } = req.query;
      
      const costCenterIdNum = costCenterId ? parseInt(costCenterId as string) : undefined;
      const startDateObj = startDate ? new Date(startDate as string) : undefined;
      const endDateObj = endDate ? new Date(endDate as string) : undefined;
      
      const report = await storage.getCostCenterReport(costCenterIdNum, startDateObj, endDateObj, ownerId);
      res.json(Array.isArray(report) ? report : []);
    } catch (error) {
      console.error('Error generating cost center report:', error);
      res.status(500).json({ 
        message: "Failed to generate cost center report",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Export routes for all entities
  
  // Materials export
  app.get("/api/export/materials/:format", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const format = req.params.format as 'pdf' | 'excel';
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      
      const materials = await storage.getMaterials(ownerId);
      const config = EXPORT_CONFIGS.materials;
      
      const exportData = {
        ...config,
        data: materials,
        filters: [`Usuário: ${req.user?.username}`, `Data: ${new Date().toLocaleString('pt-BR')}`]
      };
      
      if (format === 'pdf') {
        const pdfBuffer = ExportService.generatePDF(exportData);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename="materiais.txt"');
        res.send(pdfBuffer);
      } else {
        const excelBuffer = ExportService.generateExcel(exportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="materiais.xlsx"');
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error('Error exporting materials:', error);
      res.status(500).json({ message: "Failed to export materials" });
    }
  });

  // Categories export
  app.get("/api/export/categories/:format", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const format = req.params.format as 'pdf' | 'excel';
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      
      const categories = await storage.getCategories(ownerId);
      const config = EXPORT_CONFIGS.categories;
      
      const exportData = {
        ...config,
        data: categories,
        filters: [`Usuário: ${req.user?.username}`, `Data: ${new Date().toLocaleString('pt-BR')}`]
      };
      
      if (format === 'pdf') {
        const pdfBuffer = ExportService.generatePDF(exportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="categorias.pdf"');
        res.send(pdfBuffer);
      } else {
        const excelBuffer = ExportService.generateExcel(exportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="categorias.xlsx"');
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error('Error exporting categories:', error);
      res.status(500).json({ message: "Failed to export categories" });
    }
  });

  // Employees export
  app.get("/api/export/employees/:format", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const format = req.params.format as 'pdf' | 'excel';
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      
      const employees = await storage.getEmployees(ownerId);
      const config = EXPORT_CONFIGS.employees;
      
      const exportData = {
        ...config,
        data: employees,
        filters: [`Usuário: ${req.user?.username}`, `Data: ${new Date().toLocaleString('pt-BR')}`]
      };
      
      if (format === 'pdf') {
        const pdfBuffer = ExportService.generatePDF(exportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="funcionarios.pdf"');
        res.send(pdfBuffer);
      } else {
        const excelBuffer = ExportService.generateExcel(exportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="funcionarios.xlsx"');
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error('Error exporting employees:', error);
      res.status(500).json({ message: "Failed to export employees" });
    }
  });

  // Suppliers export
  app.get("/api/export/suppliers/:format", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const format = req.params.format as 'pdf' | 'excel';
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      
      const suppliers = await storage.getSuppliers(ownerId);
      const config = EXPORT_CONFIGS.suppliers;
      
      const exportData = {
        ...config,
        data: suppliers,
        filters: [`Usuário: ${req.user?.username}`, `Data: ${new Date().toLocaleString('pt-BR')}`]
      };
      
      if (format === 'pdf') {
        const pdfBuffer = ExportService.generatePDF(exportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="fornecedores.pdf"');
        res.send(pdfBuffer);
      } else {
        const excelBuffer = ExportService.generateExcel(exportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="fornecedores.xlsx"');
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error('Error exporting suppliers:', error);
      res.status(500).json({ message: "Failed to export suppliers" });
    }
  });

  // Third parties export
  app.get("/api/export/third-parties/:format", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const format = req.params.format as 'pdf' | 'excel';
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      
      const thirdParties = await storage.getThirdParties(ownerId);
      const config = EXPORT_CONFIGS.thirdParties;
      
      const exportData = {
        ...config,
        data: thirdParties,
        filters: [`Usuário: ${req.user?.username}`, `Data: ${new Date().toLocaleString('pt-BR')}`]
      };
      
      if (format === 'pdf') {
        const pdfBuffer = ExportService.generatePDF(exportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="terceiros.pdf"');
        res.send(pdfBuffer);
      } else {
        const excelBuffer = ExportService.generateExcel(exportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="terceiros.xlsx"');
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error('Error exporting third parties:', error);
      res.status(500).json({ message: "Failed to export third parties" });
    }
  });

  // Cost centers export
  app.get("/api/export/cost-centers/:format", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const format = req.params.format as 'pdf' | 'excel';
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      
      const costCenters = await storage.getCostCenters(ownerId);
      const config = EXPORT_CONFIGS.costCenters;
      
      const exportData = {
        ...config,
        data: costCenters,
        filters: [`Usuário: ${req.user?.username}`, `Data: ${new Date().toLocaleString('pt-BR')}`]
      };
      
      if (format === 'pdf') {
        const pdfBuffer = ExportService.generatePDF(exportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="centros-de-custo.pdf"');
        res.send(pdfBuffer);
      } else {
        const excelBuffer = ExportService.generateExcel(exportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="centros-de-custo.xlsx"');
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error('Error exporting cost centers:', error);
      res.status(500).json({ message: "Failed to export cost centers" });
    }
  });

  // Export movements report with filters
  app.get("/api/export/movements/:format", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { format } = req.params;
      const ownerId = req.user?.role === 'super_admin' ? undefined : req.user?.id;
      
      if (format !== 'pdf' && format !== 'excel') {
        return res.status(400).json({ message: "Invalid format. Use 'pdf' or 'excel'" });
      }

      // Get filter parameters from query string
      const {
        startDate,
        endDate,
        movementType,
        costCenterId,
        supplierId,
        materialId,
        categoryId,
        employeeId
      } = req.query;

      // Parse dates if provided
      let adjustedStartDate, adjustedEndDate;
      if (startDate) {
        adjustedStartDate = new Date(startDate as string);
        adjustedStartDate.setHours(0, 0, 0, 0);
      }
      if (endDate) {
        adjustedEndDate = new Date(endDate as string);
        adjustedEndDate.setHours(23, 59, 59, 999);
      }

      // Fetch real data from database with filters
      const report = await storage.getGeneralMovementsReportWithTotals(
        adjustedStartDate,
        adjustedEndDate,
        movementType as 'entry' | 'exit' | 'return' | undefined,
        ownerId,
        costCenterId ? parseInt(costCenterId as string) : undefined,
        supplierId ? parseInt(supplierId as string) : undefined,
        materialId ? parseInt(materialId as string) : undefined,
        categoryId ? parseInt(categoryId as string) : undefined,
        employeeId ? parseInt(employeeId as string) : undefined
      );

      // Build filters description
      const appliedFilters = [];
      if (startDate || endDate) {
        const startStr = startDate ? new Date(startDate as string).toLocaleDateString('pt-BR') : '';
        const endStr = endDate ? new Date(endDate as string).toLocaleDateString('pt-BR') : '';
        if (startStr && endStr) {
          appliedFilters.push(`Período: ${startStr} até ${endStr}`);
        } else if (startStr) {
          appliedFilters.push(`A partir de: ${startStr}`);
        } else if (endStr) {
          appliedFilters.push(`Até: ${endStr}`);
        }
      }
      if (movementType && movementType !== 'all') {
        const typeLabels = { entry: 'Entradas', exit: 'Saídas', return: 'Devoluções' };
        appliedFilters.push(`Tipo: ${typeLabels[movementType as keyof typeof typeLabels]}`);
      }
      if (employeeId) {
        appliedFilters.push(`Funcionário filtrado`);
      }
      if (costCenterId) {
        appliedFilters.push(`Centro de custo filtrado`);
      }
      if (supplierId) {
        appliedFilters.push(`Fornecedor filtrado`);
      }
      if (materialId) {
        appliedFilters.push(`Material filtrado`);
      }
      if (categoryId) {
        appliedFilters.push(`Categoria filtrada`);
      }

      // Format data for export
      const exportData = {
        title: 'Relatório de Movimentações',
        columns: [
          { key: 'data', label: 'Data' },
          { key: 'tipo', label: 'Tipo' },
          { key: 'material', label: 'Material' },
          { key: 'quantidade', label: 'Quantidade' },
          { key: 'valor', label: 'Valor Total' },
          { key: 'origem', label: 'Origem/Destino' },
          { key: 'responsavel', label: 'Responsável' },
          { key: 'centro', label: 'Centro de Custo' }
        ],
        data: (report.movements || []).map((movement: any) => ({
          data: new Date(movement.date || movement.createdAt).toLocaleDateString('pt-BR'),
          tipo: movement.displayType || (movement.type === 'entry' ? 'Entrada' : movement.type === 'exit' ? 'Saída' : 'Devolução'),
          material: movement.material?.name || '-',
          quantidade: `${movement.quantity || 0} ${movement.material?.unit || ''}`,
          valor: `R$ ${(movement.totalValue || 0).toFixed(2).replace('.', ',')}`,
          origem: movement.originDestination || '-',
          responsavel: movement.responsiblePerson || '-',
          centro: movement.costCenter ? `${movement.costCenter.code} - ${movement.costCenter.name}` : '-'
        })),
        filters: appliedFilters.length > 0 ? [
          'Relatório de Movimentações',
          `Filtros aplicados: ${appliedFilters.join(', ')}`
        ] : [
          'Relatório de Movimentações',
          'Filtros aplicados: Todos os dados'
        ],
        totals: report.totals ? [
          `Total de Entradas: R$ ${(report.totals.totalEntries || 0).toFixed(2).replace('.', ',')}`,
          `Total de Saídas: R$ ${(report.totals.totalExits || 0).toFixed(2).replace('.', ',')}`,
          `Total de Devoluções: R$ ${(report.totals.totalReturns || 0).toFixed(2).replace('.', ',')}`,
          `Total Geral: R$ ${(report.totals.totalGeneral || 0).toFixed(2).replace('.', ',')}`
        ] : []
      };

      if (format === 'pdf') {
        // Use new PDF generator
        const pdfData = {
          title: 'Relatório de Movimentações',
          filters: appliedFilters.length > 0 ? [
            'Relatório de Movimentações',
            `Filtros aplicados: ${appliedFilters.join(', ')}`
          ] : [
            'Relatório de Movimentações',
            'Filtros aplicados: Todos os dados'
          ],
          headers: ['Data', 'Tipo', 'Material', 'Quantidade', 'Valor Total', 'Origem/Destino', 'Responsável', 'Centro de Custo'],
          rows: (report.movements || []).map((movement: any) => PDFGenerator.formatRowData(movement)),
          totals: report.totals ? [
            `Total de Entradas: R$ ${(report.totals.totalEntries || 0).toFixed(2).replace('.', ',')}`,
            `Total de Saídas: R$ ${(report.totals.totalExits || 0).toFixed(2).replace('.', ',')}`,
            `Total de Devoluções: R$ ${(report.totals.totalReturns || 0).toFixed(2).replace('.', ',')}`,
            `Total Geral: R$ ${(report.totals.totalGeneral || 0).toFixed(2).replace('.', ',')}`
          ] : []
        };
        
        const pdfBuffer = PDFGenerator.generatePDFText(pdfData);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-movimentacoes.txt"');
        res.send(pdfBuffer);
      } else {
        // Keep using the existing Excel generator
        const excelBuffer = ExportService.generateExcel(exportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-movimentacoes.xlsx"');
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error('Error exporting movements:', error);
      res.status(500).json({ message: "Failed to export movements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}