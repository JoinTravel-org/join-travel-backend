import authService from "../services/auth.service.js";

export const getAtus = async (_req, res, next) => {
    try {
        const atus = await authService.getOmegaAtus();
        res.json({ success: true, data: atus });
    } catch (err) {
        next(err);
    }
};
