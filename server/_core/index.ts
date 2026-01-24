import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeRealEventsCrawlerSchedule } from "../realEventsCrawler";
import { initializeRealApiCrawlerSchedule } from "../realApiCrawler";
import { initializeRSSNewsCrawlerSchedule } from "../rssNewsCrawler";
import { initializeNewsExcerptGeneratorSchedule } from "../newsExcerptGenerator";
import { runAllAICompanyCrawlers } from "../aiCompanyCrawlers";
import adminRoutes from "../adminRoutes";
import { testRouter } from "../testRouter";
import fixLinksRouter from "../fixLinksRouter";
import { runMigrations } from "../migrate";
import { crawlerEndpoint } from "../crawlerEndpoint";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Run database migrations before starting server
  try {
    await runMigrations();
  } catch (error) {
    console.error("[Server] Migration failed, but continuing...", error);
  }

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Admin routes under /api/admin
  app.use("/api/admin", adminRoutes);
  // Test routes under /api/test
  app.use("/api/test", testRouter);
  // Fix links routes under /api/fix
  app.use("/api/fix", fixLinksRouter);
  // Crawler endpoint
  app.use(crawlerEndpoint);
  
  // Add a simple health check endpoint to verify API routing
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Delay crawler startup to ensure database is ready
    setTimeout(() => {
      console.log("[Server] Starting crawlers after 30 second delay...");
      
      // Start real events crawler schedule (only real events, fake crawlers removed)
      initializeRealEventsCrawlerSchedule();
      
      // Start real API crawler schedule
      initializeRealApiCrawlerSchedule();
      
      // Start RSS news crawler schedule
      initializeRSSNewsCrawlerSchedule();
      
      // Start news excerpt generator schedule
      initializeNewsExcerptGeneratorSchedule();
      
      // Start AI company crawlers schedule
      console.log("[Server] Starting AI company crawlers...");
      runAllAICompanyCrawlers();
      setInterval(() => {
        runAllAICompanyCrawlers();
      }, 10 * 60 * 1000); // Run every 10 minutes
    }, 30000); // 30 second delay
  });
}

startServer().catch(console.error);
