import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import productRoutes from "./routes/product.route.js";
import { sql } from "./config/db.js";
import { aj } from "./lib/arcjet.js";

// invoke
dotenv.config();
// Variables
const PORT = process.env.PORT || 5001;
// to keep track of directory we are in
const __dirname = path.resolve();

// middleware functions
const app = express();
app.use(express.json()); //this allows to parse the data into json
app.use(cors()); // so will not face the cors errors in the client
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
); //helmet is a security middleware that helps to protect app by setting various http headers
app.use(morgan("dev")); //log the requests

// apply arject rate-limit thorugh all routes
app.use(async (req, res, next) => {
  try {
    const decision = await aj.protect(req, {
      requested: 1, // specifies that each request consumes 1 token
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        res.status(429).json({ error: "Too many requests." });
      } else if (decision.reason.isBot()) {
        res.status(403).json({ error: "Bot access denied." });
      } else {
        res.status(403).json({ error: "Forbidden." });
      }
      return;
    }
    // check for spoofed bots
    if (
      decision.results.some(
        (result) => result.reason.isBot() && result.reason.isSpoofed()
      )
    ) {
      res.status(403).json({ error: "Spoofed Bot Detected" });
      return;
    }
    next();
  } catch (error) {
    console.log("Arcjet Error", error);
    next(error);
  }
});

// endpoints
app.use("/api/products", productRoutes);

if (process.env.NODE_ENV === "production") {
  // serve react app
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// initilizing database
async function initDB() {
  try {
    await sql`
        CREATE TABLE IF NOT EXISTS products(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            image VARCHAR(255) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
    console.log("Database Initilized Successfuly.");
  } catch (error) {
    console.log("ERROR INITDB", error);
  }
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
  });
});
