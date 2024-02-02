const express = require("express");
const router = express.Router();

// ROUTES
router.get("/", (req, res) => {
	if (req.query.userId) {
		res.send({ msg: "Overview" });
	} else {
		res.send({ msg: "Signin" });
	}
});

router.get("/signin", (req, res) => {
	res.send({ msg: "Signin" });
});

router.get("/signup", (req, res) => {
	res.send({ msg: "Signup" });
});

router.get("/login", (req, res) => {
	res.redirect("/signin");
});

router.get("/register", (req, res) => {
	res.redirect("/signup");
});

router.get("/logout", (req, res) => {
	// req.session.destroy();
	res.redirect("/signin");
});

module.exports = router;
