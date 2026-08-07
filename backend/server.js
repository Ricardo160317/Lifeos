import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import onboardingRoutes from "./routes/onboarding.js";
import planRoutes from "./routes/plan.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/plan", planRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`LifeOS backend corriendo en puerto ${PORT}`));
