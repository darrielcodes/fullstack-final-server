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
        scope: userType,
        email: foundUser.email
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
    
    res.json({
      success: true
    })

   } catch (err) {
    console.error(err);
    res.json({
      success: false,
      error: err.toString()
    });
   }
 });

 // GET IND RECIPE
 router.get('/recipe/:recipeID',(req, res) => {
  try {
    
    res.json({
      success: true
    })

  } catch (err) {
   console.error(err);
   res.json({
     success: false,
     error: err.toString()
   });
  }
});

// CREATE NEW CART
router.post('/create-one', async (req, res) => {
  try {
    const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    const token = req.header(tokenHeaderKey);
    
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const verified = jwt.verify(token, jwtSecretKey);
    console.log(verified.userData.email)
    const userEmail = verified.userData.email
    const userInfo = {
      createdAt: new Date(),
      lastModified: new Date(),
      id: uuid(),
      userEmail: userEmail
    }
    const newCart = []
    newCart.push(...req.body);
    newCart.push(userInfo);

    const findUser = await db().collection("users").find([{
      email: userEmail
    }]);

      const updateCart = await db().collection("users").update(
      {
        email: userEmail
      },{
        $push: {
          newCart
        }
      });
      

    res.json({
      success: true,
      newCart: newCart
    })

  } catch (err) {
   console.error(err);
   res.json({
     success: false,
     error: err.toString()
   });
  }
});

// GET ALL CART ITEMS
router.get('/checkout', async (req, res) => {
  try {
    
    const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    const token = req.header(tokenHeaderKey);
    console.log(token)
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const verified = jwt.verify(token, jwtSecretKey);
    console.log(verified.userData.email)
    const userEmail = verified.userData.email
    
    
    const foundUser = await db().collection("users").find({
      email: userEmail
    }).toArray();
    console.log(foundUser)

    res.json({
      success: true,
      foundUser: foundUser
    })

  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      error: err.toString()
    });
  }
});

// CREATE NEW ORDER
router.post('/create-order', async (req, res) => {
  try {
    const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    const token = req.header(tokenHeaderKey);
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const verified = jwt.verify(token, jwtSecretKey);

    console.log(verified.userData.email)
    const userEmail = verified.userData.email
    const orderID = uuid()
    const userInfo = {
      orderID,
      createdAt: new Date()
    }
    const newOrder = []
    newOrder.push(...req.body);
    newOrder.push(userInfo);
    console.log(req.body)

    const createCart = await db().collection("users").updateOne(
      {
        email: userEmail
      },{
        $set: {
          "newCart": []
        },
          $push: {
            newOrder,
            orderHistory: orderID
        }
      }
    );
    res.json({
      success: true,
      newOrder: newOrder
    })
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      error: err.toString()
    });
  }
});

//VIEW USER INFO/ORDER HISTORY



module.exports = router;
