import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import apiRoutes from "./routes";
import { warmUpMlService } from "../ml_model";

// Load environment variables
dotenv.config();

export async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded body parser with generous limit for terrain image uploads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Mount API endpoints FIRST
  app.use("/api", apiRoutes);

  // Vite middleware for development / Static file serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`BhuNetra Full-Stack Server running on http://0.0.0.0:${PORT}`);
    // Non-blocking warmup ping for external ML service
    warmUpMlService();
  });

  return { app, server };
}

// Auto-start when executed directly
if (process.env.NODE_ENV !== "test") {
  startServer();
}
