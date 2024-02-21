const express = require("express");
const path = require("path");
const router = express.Router();
const bodyParser = require("body-parser");
const userModel = require("../models/userModel.js");

var urlencodedParser = bodyParser.urlencoded({ extended: false });

// ROUTES
router.get("/", (req, res) => {
	if (req.session.user) {
		res.sendFile(path.join(__dirname, "../views/overview.html"));
	} else {
		res.redirect("/signin?error=Sign_in_first");
	}
});

router.get("/signin", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/signin.html"));
});

router.post("/signin", urlencodedParser, async (req, res) => {
	try {
		const user = await userModel.checkCredentials(
			await req.body.username,
			await req.body.password
		);
		const isCorrect = user.count > 0 ? true : false;
		req.session.user = {
			username: user.username,
			email: user.email,
			id: user.id,
			uuid: user.user_uuid,
		};
		isCorrect
			? res.redirect(`/?uuid=${req.session.user.uuid}`)
			: res.redirect("/signin?error=Invalid_username_or_password");
	} catch (error) {
		res.redirect("/signin?error=Something_went_wrong_please_try_again");
	}
});

router.get("/signup", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/signup.html"));
});

router.post("/signup", urlencodedParser, async (req, res) => {
	if ((await req.body.password) != (await req.body.confirmPassword)) {
		res.redirect("/signup?error=Passwords_do_not_match");
	} else {
		const userExists = await userModel.checkExist(await req.body.email);
		if (userExists) {
			res.redirect("/signup?error=Email_already_in_use");
		} else {
			try {
				try {
					await userModel.createUser(
						await req.body.username,
						await req.body.email,
						await req.body.password
					);
					res.redirect("/signin?success=Account_created");
				} catch (error) {
					res.redirect("/signup?error=Username_already_in_use");
				}
			} catch (error) {
				res.redirect("/signup?error=Could_not_create_user");
			}
		}
	}
});

router.get("/login", (req, res) => {
	res.redirect("/signin");
});

router.get("/register", (req, res) => {
	res.redirect("/signup");
});

router.get("/logout", (req, res) => {
	req.session.destroy();
	res.redirect("/signin");
});

module.exports = router;
