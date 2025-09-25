import Company from "../models/company.models.js";

// // POST /companies - create company
export const createCompany = async (req, res) => {
    try {
        const { name, code, address, timezone } = req.body;

        // check if code already exists
        const existing = await Company.findOne({ code });
        if (existing) {
            return res.status(400).json({ message: "Company code already exists" });
        }

        const company = new Company({
            name,
            code,
            address,
            timezone: timezone || "Asia/Kolkata",
        });

        await company.save();
        res.status(201).json({ message: "Company created successfully", company });
    } catch (error) {
        res.status(500).json({ message: "Error creating company", error: error.message });
    }
};

// GET /companies/:id - get company details
export const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        res.json(company);
    } catch (error) {
        res.status(500).json({ message: "Error fetching company", error: error.message });
    }
};
