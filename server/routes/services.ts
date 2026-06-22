import { Router, Request, Response, RequestHandler } from "express";
import { prisma } from "../db.js";
import { authenticateJWT, requireRole } from "./auth.js";

export const servicesRouter = Router();

// ==========================================
// TRANSPORT ROUTES
// ==========================================

// GET /transport
servicesRouter.get("/transport", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const routes = await prisma.transportRoute.findMany({
      include: {
        enrollments: {
          include: {
            student: {
              include: { class: true }
            }
          }
        }
      },
      orderBy: { zoneName: "asc" },
    });
    return res.json(routes);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// GET /services/transport/routes (alias for /transport)
servicesRouter.get("/services/transport/routes", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const routes = await prisma.transportRoute.findMany({
      include: {
        enrollments: {
          include: {
            student: {
              include: { class: true }
            }
          }
        }
      },
      orderBy: { zoneName: "asc" },
    });
    return res.json(routes);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /services/transport/routes (alias for /transport)
servicesRouter.post("/services/transport/routes", authenticateJWT, requireRole(["ADMIN", "FINANCE"]), (async (req: Request, res: Response) => {
  try {
    const { zoneName, monthlyFee, oneWayFee, details } = req.body;
    if (!zoneName || monthlyFee === undefined || oneWayFee === undefined) {
      return res.status(400).json({ error: "Zone Name, Monthly Fee, and One-way Fee are required" });
    }

    const exZone = await prisma.transportRoute.findUnique({ where: { zoneName } });
    if (exZone) {
      return res.status(400).json({ error: `Transport route zone '${zoneName}' already exists` });
    }

    const route = await prisma.transportRoute.create({
      data: {
        zoneName,
        monthlyFee: Number(monthlyFee),
        oneWayFee: Number(oneWayFee),
        details: details || "",
      }
    });

    return res.status(201).json(route);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /transport
servicesRouter.post("/transport", authenticateJWT, requireRole(["ADMIN", "FINANCE"]), (async (req: Request, res: Response) => {
  try {
    const { zoneName, monthlyFee, oneWayFee, details } = req.body;
    if (!zoneName || monthlyFee === undefined || oneWayFee === undefined) {
      return res.status(400).json({ error: "Zone Name, Monthly Fee, and One-way Fee are required" });
    }

    const exZone = await prisma.transportRoute.findUnique({ where: { zoneName } });
    if (exZone) {
      return res.status(400).json({ error: `Transport route zone '${zoneName}' already exists` });
    }

    const route = await prisma.transportRoute.create({
      data: {
        zoneName,
        monthlyFee: Number(monthlyFee),
        oneWayFee: Number(oneWayFee),
        details: details || "",
      }
    });

    return res.status(201).json(route);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// DELETE /transport/:id
servicesRouter.delete("/transport/:id", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.transportRoute.delete({ where: { id } });
    return res.json({ message: "Transport zone deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /transport/:id/enroll ( Enroll student on route )
servicesRouter.post("/transport/:id/enroll", authenticateJWT, requireRole(["ADMIN", "FINANCE"]), (async (req: Request, res: Response) => {
  try {
    const { id: routeId } = req.params;
    const { studentId, type } = req.body; // type: "ROUND_TRIP" or "ONE_WAY"

    if (!studentId || !type) {
      return res.status(400).json({ error: "Student ID and boarding type (ROUND_TRIP, ONE_WAY) are required" });
    }

    // Upsert enrollment
    const enrollment = await prisma.studentTransport.upsert({
      where: { studentId },
      update: {
        routeId,
        type,
        active: true,
      },
      create: {
        studentId,
        routeId,
        type,
        active: true,
        enrollDate: new Date().toISOString().split("T")[0],
      }
    });

    return res.status(201).json(enrollment);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// DELETE /transport/students/:studentId/unenroll ( Unenroll student )
servicesRouter.delete("/transport/students/:studentId/unenroll", authenticateJWT, requireRole(["ADMIN", "FINANCE"]), (async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    
    await prisma.studentTransport.deleteMany({
      where: { studentId }
    });

    return res.json({ message: "Student unenrolled from route successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// ==========================================
// LUNCH PROGRAMS
// ==========================================

// GET /lunch
servicesRouter.get("/lunch", authenticateJWT, (async (req: Request, res: Response) => {
  try {
    const plans = await prisma.lunchPlan.findMany({
      include: {
        enrollments: {
          include: {
            student: {
              include: { class: true }
            }
          }
        }
      },
      orderBy: { name: "asc" },
    });
    return res.json(plans);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /lunch
servicesRouter.post("/lunch", authenticateJWT, requireRole(["ADMIN", "FINANCE"]), (async (req: Request, res: Response) => {
  try {
    const { name, pricePerDay, details } = req.body;
    if (!name || pricePerDay === undefined) {
      return res.status(400).json({ error: "Lunch plan Name and Price per Day are required" });
    }

    const exLunch = await prisma.lunchPlan.findUnique({ where: { name } });
    if (exLunch) {
      return res.status(400).json({ error: `Lunch plan '${name}' already exists` });
    }

    const plan = await prisma.lunchPlan.create({
      data: {
        name,
        pricePerDay: Number(pricePerDay),
        details: details || "",
      }
    });

    return res.status(201).json(plan);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// DELETE /lunch/:id
servicesRouter.delete("/lunch/:id", authenticateJWT, requireRole(["ADMIN"]), (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.lunchPlan.delete({ where: { id } });
    return res.json({ message: "Lunch plan deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// POST /lunch/:id/enroll ( Enroll student on lunch plan )
servicesRouter.post("/lunch/:id/enroll", authenticateJWT, requireRole(["ADMIN", "FINANCE"]), (async (req: Request, res: Response) => {
  try {
    const { id: lunchPlanId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Upsert subscription
    const enrollment = await prisma.studentLunch.upsert({
      where: { studentId },
      update: {
        lunchPlanId,
        active: true,
      },
      create: {
        studentId,
        lunchPlanId,
        active: true,
        enrollDate: new Date().toISOString().split("T")[0],
      }
    });

    return res.status(201).json(enrollment);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// DELETE /lunch/students/:studentId/unenroll ( Unenroll student from lunch )
servicesRouter.delete("/lunch/students/:studentId/unenroll", authenticateJWT, requireRole(["ADMIN", "FINANCE"]), (async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    await prisma.studentLunch.deleteMany({
      where: { studentId }
    });

    return res.json({ message: "Student unsubscribed from lunch program successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}) as RequestHandler);
