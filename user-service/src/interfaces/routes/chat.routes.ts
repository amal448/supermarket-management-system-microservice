import { Router } from "express";
import { authorizeRoles } from "../middleware/role.middleware";
import { getChatHistory , } from "../controllers/chatcontroller";
// import { sendByAdminAlert } from "../controllers/socketcontrollers";

const router = Router();

router.get("/history/:userId/:otherId",authorizeRoles('admin','manager'), getChatHistory);
export default router;
