const express = require("express");
const AuthController = require("../controllers/Auth.controller");
const sendMail = require("../middlewares/sendMail.middleware");
const router = express.Router();

router.post("/register",AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);

module.exports = router;
