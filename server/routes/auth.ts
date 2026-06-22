import { Router, Request, Response, RequestHandler } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "royal_school_jwt_secret_key_1234";

// Middleware to extract and verify JWT
export const authenticateJWT = (async (req: any, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; username: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        teacherProfile: true,
        parentProfile: true,
        studentProfile: true,
      },
    });

    if (!user || user.status === "INACTIVE") {
      return res.status(403).json({ error: "User is inactive or deleted" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token is invalid or expired" });
  }
}) as RequestHandler;

// Middleware to verify Admin role
export const requireRole = (roles: string[]) => {
  return ((req: any, res: Response, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient credentials" });
    }
    next();
  }) as RequestHandler;
};

// POST /auth/login
authRouter.post("/login", (async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        teacherProfile: true,
        studentProfile: true,
        parentProfile: true,
      },
    });

    if (!user || user.status === "INACTIVE") {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const valid = await bcryptjs.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate Token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        teacherProfile: user.teacherProfile,
        studentProfile: user.studentProfile,
        parentProfile: user.parentProfile,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}) as RequestHandler);

// GET /auth/me
authRouter.get("/me", authenticateJWT, (async (req: any, res: Response) => {
  return res.json({
    id: req.user.id,
    username: req.user.username,
    role: req.user.role,
    name: req.user.name,
    status: req.user.status,
    teacherProfile: req.user.teacherProfile,
    studentProfile: req.user.studentProfile,
    parentProfile: req.user.parentProfile,
  });
}) as RequestHandler);

// PATCH /auth/password
authRouter.patch("/password", authenticateJWT, (async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }

    const valid = await bcryptjs.compare(currentPassword, req.user.password);
    if (!valid) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    const hashed = await bcryptjs.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    // Logging action
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: "PASSWORD_CHANGE",
        details: `Password changed for user ${req.user.username}`,
      },
    });

    return res.json({ message: "Password updated successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}) as RequestHandler);

// GET /auth/users (admin only)
authRouter.get("/users", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        name: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /auth/users (admin only)
authRouter.post("/users", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { username, password, role, name } = req.body;
    if (!username || !password || !role || !name) {
      return res.status(400).json({ error: "All account fields are required (username, password, role, name)" });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const hashed = await bcryptjs.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        role,
        name,
        status: "ACTIVE",
      },
    });

    // If role is TEACHER, create base profile too
    if (role === "TEACHER") {
      const parts = name.split(" ");
      await prisma.teacher.create({
        data: {
          userId: user.id,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "TBD",
          status: "ACTIVE",
        },
      });
    }

    return res.status(201).json({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      status: user.status,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// PATCH /auth/users/:id (admin only - reset password, toggle status)
authRouter.patch("/users/:id", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password, status, role, name, username } = req.body;

    const data: any = {};
    if (password) {
      data.password = await bcryptjs.hash(password, 10);
    }
    if (status) {
      data.status = status;
    }
    if (role) {
      data.role = role;
    }
    if (name) {
      data.name = name;
    }
    if (username) {
      data.username = username;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        role: true,
        name: true,
        status: true,
      },
    });

    return res.json(updatedUser);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// DELETE /auth/users/:id (admin only)
authRouter.delete("/users/:id", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    return res.json({ message: "User account deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);
