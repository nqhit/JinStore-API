const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = require("express").Router();

router.get("/", authMiddleware.verifyToken,userController.getAllUsers);
router.delete("/:id", authMiddleware.verifyTokenAndAdmin, userController.deleteUser);

module.exports = router;