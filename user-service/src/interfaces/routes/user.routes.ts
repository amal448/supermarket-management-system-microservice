import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.post("/create-user",authorizeRoles('admin','manager'), UserController.create);
router.post("/update-user", UserController.update);
router.post("/delete-user", UserController.delete);
router.get("/getalluser",authorizeRoles('manager'), UserController.getall);
router.get("/get-all-manager", UserController.getmanagers);
router.get("/getuser", UserController.getuser);
// router.get("/get-managers", UserController.getmanagers);


export default router;
