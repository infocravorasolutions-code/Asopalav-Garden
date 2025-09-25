import express from "express";
import { createCompany, getCompanyById} from '../controller/company.controller.js'

const router = express.Router();

router.post("/companies", createCompany);
router.get("/companies/:id", getCompanyById);

export default router;
