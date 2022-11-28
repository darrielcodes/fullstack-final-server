var express = require('express');
var router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../mongo");
const { uuid } = require("uuidv4")
let user = {};

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// REGISTER USER //
router.post('/register', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const saltRounds = 5;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    
    user = {
      email,
      password: hash,
      id: uuid()
    };

    const insertUser = db().collection('users').insertOne(user);

    res.json({
      success: true
    });

  } catch (err){
    console.error(err);
    res.json({
      success: false,
      error: err.toString()
    });
  }
});

// LOGIN USER //
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const foundUser = await db().collection('users').findOne({
      email: email
    });

      if (!foundUser){
        res.json({
          success: false,
          message: "Could not find user."
        }).status(204);
        return;
      };
      const match = await bcrypt.compare(password, foundUser.password);
      
      if (match === false){
        res.json({
          success: false,
          message: "Incorrect password."
        }).status(204);
        return;
      };
    // ADMIN USER TYPE
      const userType = email.includes("codeimmersives.com") ? "admin" : "user";
      const userData = {
        date: new Date(),
        userID: foundUser.id,
        scope: userType
      }
      // create JSON webtoken:
     const exp = Math.floor(Date.now() / 1000) + (60 * 60)
     const payload = {
        userData,
        exp 
      };
      const jwtSecretKey = process.env.JWT_SECRET_KEY;
      console.log(jwtSecretKey)
      const token = jwt.sign(payload, jwtSecretKey)

      res.json({
        success: true,
        token: token,
        email: foundUser.email
      })

  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      error: err.toString()
    });
  }
});

// VERIFY TOKEN //
router.get('/message', (req, res) => {
  try {
    const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    const token = req.header(tokenHeaderKey);
   
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const verified = jwt.verify(token, jwtSecretKey);
    console.log(verified.header)
    if (!verified) {
      return res.json({
        success: false,
        message: "ID Token could not be verified."
      })
    };

    if (verified.userData && verified.userData.scope === "user") {
      return res.json({
        success: true,
        message: "I am a normal user",
        scope: verified.userData.scope
      });
    }
    
    if (verified.userData && verified.userData.scope === "admin") {
      return res.json({
        success: true,
        message: "I am an admin user",
        scope: verified.userData.scope
      });
    }

  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      error: err.toString()
    });
  }
});

// GET ALL RECIPES //
 router.get('/recipes',(req, res) => {
   try {


   } catch (err) {
    console.error(err);
    res.json({
      success: false,
      error: err.toString()
    });
   }
 });

module.exports = router;
