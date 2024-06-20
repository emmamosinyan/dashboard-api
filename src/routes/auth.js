const express = require("express");
const router = express.Router();

const { signUp, login, update, getProfile, getAllProfiles } = require("../controllers/auth");

router.post("/sign-up", signUp);
router.post("/login", login);
router.put("/update", update);
router.get('/me', getProfile);
router.get('/', getAllProfiles);

module.exports = router;
