import express, { type Request, Response } from "express";
import { db } from "./db";
import { users, categories, materials, employees, suppliers, thirdParties, materialMovements } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";

const router = express.Router();

// Login endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const [user] = await db.select().from(users).where(eq(users.username, username));
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // In a real app, you'd create a JWT token here
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        ownerId: user.ownerId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Users routes
router.get("/users", async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      ownerId: users.ownerId
    }).from(users);
    
    res.json(allUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/users", async (req: Request, res: Response) => {
  try {
    const { username, email, password, name, role, ownerId } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [newUser] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      name,
      role: role || 'user',
      isActive: true,
      ownerId: ownerId || 1
    }).returning();

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      ownerId: newUser.ownerId
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Categories routes
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId ? Number(req.query.ownerId) : 1;
    const allCategories = await db.select().from(categories).where(eq(categories.ownerId, ownerId));
    res.json(allCategories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/categories", async (req: Request, res: Response) => {
  try {
    const { name, description, ownerId } = req.body;
    
    const [newCategory] = await db.insert(categories).values({
      name,
      description,
      ownerId: ownerId || 1
    }).returning();

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Materials routes
router.get("/materials", async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId ? Number(req.query.ownerId) : 1;
    const allMaterials = await db.select().from(materials).where(eq(materials.ownerId, ownerId));
    res.json(allMaterials);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/materials", async (req: Request, res: Response) => {
  try {
    const { name, description, unit, categoryId, currentStock, minStock, unitPrice, ownerId } = req.body;
    
    const [newMaterial] = await db.insert(materials).values({
      name,
      description,
      unit,
      categoryId,
      currentStock: currentStock || 0,
      minStock: minStock || 0,
      unitPrice: unitPrice || 0,
      ownerId: ownerId || 1
    }).returning();

    res.status(201).json(newMaterial);
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Employees routes
router.get("/employees", async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId ? Number(req.query.ownerId) : 1;
    const allEmployees = await db.select().from(employees).where(eq(employees.ownerId, ownerId));
    res.json(allEmployees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/employees", async (req: Request, res: Response) => {
  try {
    const { name, email, department, phone, ownerId } = req.body;
    
    const [newEmployee] = await db.insert(employees).values({
      name,
      email,
      department,
      phone,
      isActive: true,
      ownerId: ownerId || 1
    }).returning();

    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Suppliers routes
router.get("/suppliers", async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId ? Number(req.query.ownerId) : 1;
    const allSuppliers = await db.select().from(suppliers).where(eq(suppliers.ownerId, ownerId));
    res.json(allSuppliers);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/suppliers", async (req: Request, res: Response) => {
  try {
    const { name, cnpj, email, phone, address, notes, ownerId } = req.body;
    
    const [newSupplier] = await db.insert(suppliers).values({
      name,
      cnpj,
      email,
      phone,
      address,
      notes,
      isActive: true,
      ownerId: ownerId || 1
    }).returning();

    res.status(201).json(newSupplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Third parties routes
router.get("/third-parties", async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId ? Number(req.query.ownerId) : 1;
    const allThirdParties = await db.select().from(thirdParties).where(eq(thirdParties.ownerId, ownerId));
    res.json(allThirdParties);
  } catch (error) {
    console.error('Get third parties error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/third-parties", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, ownerId } = req.body;
    
    const [newThirdParty] = await db.insert(thirdParties).values({
      name,
      email,
      phone,
      address,
      ownerId: ownerId || 1
    }).returning();

    res.status(201).json(newThirdParty);
  } catch (error) {
    console.error('Create third party error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Movements routes
router.get("/movements", async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId ? Number(req.query.ownerId) : 1;
    const allMovements = await db.select().from(materialMovements)
      .where(eq(materialMovements.ownerId, ownerId))
      .orderBy(desc(materialMovements.createdAt));
    res.json(allMovements);
  } catch (error) {
    console.error('Get movements error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Dashboard stats
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId ? Number(req.query.ownerId) : 1;
    
    // Get basic counts
    const materialsList = await db.select().from(materials).where(eq(materials.ownerId, ownerId));
    const categoriesList = await db.select().from(categories).where(eq(categories.ownerId, ownerId));
    const employeesList = await db.select().from(employees).where(eq(employees.ownerId, ownerId));
    const suppliersList = await db.select().from(suppliers).where(eq(suppliers.ownerId, ownerId));
    
    res.json({
      materials: materialsList.length,
      categories: categoriesList.length,
      employees: employeesList.length,
      suppliers: suppliersList.length,
      totalValue: 0, // Calculate based on materials
      lowStock: 0 // Materials below minimum stock
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;