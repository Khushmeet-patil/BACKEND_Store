const express = require("express")
const { getRatingsByUserAdmin } = require("../../controllers/rating.controller")
const router = express.Router()

router.get("/", getRatingsByUserAdmin)

module.exports = router