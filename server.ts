import express from "express";
import path from "path";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { createServer as createViteServer } from "vite";
import { seedDatabase } from "./server/db.js";
import { authRouter } from "./server/routes/auth.js";
import { academicRouter } from "./server/routes/academic.js";
import { studentsRouter } from "./server/routes/students.js";
import { financeRouter } from "./server/routes/finance.js";
import { servicesRouter } from "./server/routes/services.js";
import { payrollRouter } from "./server/routes/payroll.js";
import { invoiceRouter } from "./server/routes/invoices.js";


async function startServer() {
  try {
    // 1. Initialise and seed local SQLite Database
    // await seedDatabase(); // Disabled - will create tables manually
    const app = express();
    const server = createServer(app);
    
    // 2. Initialise real-time Socket.IO communication
    const io = new SocketServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "DELETE"],
      },
    });

    io.on("connection", (socket) => {
      console.log(`Socket client connected [ID: ${socket.id}]`);
      
      socket.on("joinRoleRoom", (role: string) => {
        socket.join(`role-${role}`);
        console.log(`Socket ${socket.id} joined notification room for role: ${role}`);
      });

      socket.on("disconnect", () => {
        console.log(`Socket client disconnected [ID: ${socket.id}]`);
      });
    });

    // Make Socket.IO engine accessible inside route controllers
    app.use((req: any, res, next) => {
      req.io = io;
      next();
    });

    // Body parsing middleware
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));

    // Request Logging
    app.use((req: any, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });

    // ==========================================
    // BACKEND API ROUTES
    // ==========================================
    app.use("/api/v1/auth", authRouter);
    app.use("/api/v1/students", studentsRouter);
    app.use("/api/v1/finance", financeRouter);
    app.use("/api/v1", academicRouter);
    app.use("/api/v1", servicesRouter);
    app.use("/api/v1/payroll", payrollRouter);
    app.use("/api/v1/invoices", invoiceRouter);
    

    // Dynamic router health check
    app.get("/api/v1/health", (req, res) => {
      res.json({ status: "healthy", timestamp: new Date() });
    });

    // ==========================================
    // FRONTEND SPA SERVING OR VITE MIDDLEWARE
    // ==========================================
    if (process.env.NODE_ENV !== "production") {
      console.log("Starting development mode with Vite middleware...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      console.log("Starting production mode. Serving static files from /dist...");
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`====================================================`);
      console.log(` ROYAL SCHOOL MANAGEMENT SYSTEM (RSMS) BOOTED SUCCESS `);
      console.log(` Server Address : http://localhost:${PORT}               `);
      console.log(` Local Time     : ${new Date().toISOString()}           `);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error("FATAL ERROR: Failed to boot RSMS Application Server:", error);
    process.exit(1);
  }
}

startServer();
