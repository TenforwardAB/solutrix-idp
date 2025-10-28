import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import userRoutes from "./routes/userRoutes";
import licenseRoute from "./routes/licenseRoute";
import fileTrekkerRoutes from "./routes/fileTrekkerRoutes";
import  mailrouter  from "./routes"
import dnsRoutes from "./routes/dnsRoutes"
import dotenv from "dotenv";
import {logger} from "./services/loggerService";
import multer from "multer";

dotenv.config();
const upload = multer();
const app: Application = express();

logger.info("Starting Solutrix-API")

// Set up logging middleware
app.use(morgan("combined"));

// Set up CORS
app.use(
    cors({
        origin: ["https://localhost:5173","https://127.0.0.1:5173", "http://localhost:5173","http://127.0.0.1:5173"], // Specify the exact origin
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Verify-Code-Secret"], // Define the necessary headers explicitly
        credentials: true, // Allow credentials like cookies, authorization headers, etc.
    })
);

app.options("*", cors());

// Parse JSON requests
app.use(express.json({ limit: '50mb' }));

// Auth routes
app.use("/api/auth", authRoutes);

app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/license", licenseRoute);
app.use("/api/v1/fileTrekker", fileTrekkerRoutes);
app.use("/api/v1/dns", dnsRoutes);
app.use("/api/v1/mail", mailrouter);


const PORT: number = parseInt(process.env.PORT || '8080');

// Start the server
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
