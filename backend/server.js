import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from "node-cron";
import XLSX from "xlsx";
import { createServer } from 'http';

// Import routes & models
import managerRoutes from './routes/manager.routes.js';
import authRouter from "./routes/auth.routes.js";
import adminRoutes from './routes/admin.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import dashboardRoutes from "./routes/dashboard.routes.js";
import attendenceRoutes from "./routes/attendence.routes.js";
import companyRoutes from "./routes/company.routes.js"
// Settings routes removed - now using static configuration
import { autoStepOut, updateStepInUserLocations, updateAllEmployeeLocations } from './controller/cron.controller.js';
import Employee from "./models/employee.models.js";
import LocationRouter from "./routes/location.routes.js";
import { initializeSocket, startSocketHealthCheck } from './socket/socketServer.js';

dotenv.config();
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5678;
const MONGO_URI = process.env.MONGODB_URI;
console.log("MONGO_URI ==> ", MONGO_URI);

// Middleware
app.use(cors({
  origin: "*",
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static("upload"));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/attendence", attendenceRoutes);
app.use("/api", companyRoutes);

// Settings routes removed - now using static configuration
app.use("/api/auth", authRouter);
app.use("/api/location", LocationRouter)

// Cron jobs
cron.schedule("*/30 * * * *", autoStepOut); // Auto step-out every 30 minutes
cron.schedule("*/10 * * * *", updateAllEmployeeLocations); // Update all employee latest locations every 10 minutes
cron.schedule("*/10 * * * *", updateStepInUserLocations); // Update step-in user locations every 10 minutes

console.log("⏰ Cron jobs initialized:");
console.log("   - Auto step-out: Every 30 minutes");
console.log("   - All employee locations: Every 10 minutes");
console.log("   - Step-in user locations: Every 10 minutes");

// ✅ Employee Import Function
const importEmployees = async () => {
  try {
    const workbook = XLSX.readFile("./excelff.xlsx");
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(sheet, { range: 7 });
    console.log("First raw row:", jsonData[0]);

    const normalizeKey = (key) =>
      key.replace(/\r?\n|\r/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

    const employees = jsonData.map(row => {
      const cleanRow = {};
      for (const key in row) {
        cleanRow[normalizeKey(key)] = row[key];
      }

      const attendance = {};
      for (let i = 1; i <= 31; i++) {
        const dayKey = i.toString();
        attendance[dayKey] = cleanRow[dayKey] || "";
      }

      return {
        empCode: cleanRow["EMP CODE"] || "",
        name: cleanRow["NAME OF EMPLOYEE"] || "",
        designation: cleanRow["DESIGNATION"] || "",
        category: cleanRow["CATEGORY (HS/S/SS/US)"] || "",
        uan: cleanRow["UAN"] || "",
        esic: cleanRow["ESIC"] || "",
        accountNo: cleanRow["ACCOUNT NO"] || "",
        ifsc: cleanRow["IFSC"] || "",
        attendance: attendance // Include attendance if needed
      };
    });

    const validEmployees = employees.filter(e => e.empCode && e.name);
    console.log(`Valid employees count: ${validEmployees.length}`);

    if (validEmployees.length === 0) {
      console.warn("⚠ No valid employees found.");
      return;
    }

    // Check for existing employees and only insert new ones
    const existingEmpCodes = await Employee.find({
      empCode: { $in: validEmployees.map(e => e.empCode) }
    }).select('empCode');

    const existingCodesSet = new Set(existingEmpCodes.map(e => e.empCode));
    const newEmployees = validEmployees.filter(e => !existingCodesSet.has(e.empCode));

    if (newEmployees.length > 0) {
      await Employee.insertMany(newEmployees);
      console.log(`✅ Imported ${newEmployees.length} new employees successfully.`);
    } else {
      console.log("ℹ️ No new employees to import.");
    }

    process.exit();

  } catch (error) {
    console.error("❌ Error importing employees:", error);
    process.exit(1);
  }
};

// Connect to MongoDB and THEN start server
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    // Initialize Socket.IO server
    const io = initializeSocket(server);
    console.log("🔌 Socket.IO server initialized");

    // Start socket health check
    startSocketHealthCheck();
    console.log("🏥 Socket health check started (every 10 minutes)");

    // Import employees after DB connection
    // await importEmployees();

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Labor Management API');
});

// importEmployees()

// Note: Server is started above after MongoDB connection 

