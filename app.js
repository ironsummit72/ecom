const port = process.env.PORT || 3000;
const express = require("express");
const app = express();
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const { log, error } = require("console");
const url = require("url");
const directory = "./uploads";
const mongoose = require("mongoose");
var MongoClient = require("mongodb").MongoClient;
var database_url = "mongodb://127.0.0.1:27017/ecom";
let resultFromDatabase = "";
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: true }));
var ObjectId = require("mongodb").ObjectId;
let onIp = false;

let Cartarray=[]
const uuid = require("./modules/uuid");
var bcrypt = require("bcryptjs");
var cookieParser = require("cookie-parser");
app.use(cookieParser());
//connection establish
mongoose.connect("mongodb://127.0.0.1:27017/ecom");
var db = mongoose.connection;
db.on("error", console.log.bind(console, "connection error"));
db.once("open", function (callback) {
  console.log("connection succeeded");
});

// checking if the upload folder exist
if (fs.existsSync(directory)) {
  console.log("Directory exists!");
} else {
  console.log("Directory not found.");
  fs.mkdirSync(directory);
}
// this is multer a bridge between file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + " " + uniqueSuffix + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage }).any(directory);
async function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}
app.get("/logout", (req, res) => {
  deleteSessionData();
});
app.get("/", async function (req, res) {
  // Reciving data form mongodb
  MongoClient.connect(database_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("ecom"); //database name
    dbo
      .collection("products") //collection name
      .find({})
      .toArray(function (err, result) {
        if (err) throw err;

        for (var i = 0; i < result.length; i++) {
          resultFromDatabase = result;
        }
        db.close();
      });
  });
  await wait(5 * 100);
  res.render("index", { ProductListArr: resultFromDatabase });
});
//product view html page
app.get("/productview", function (req, res) {
  var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl; // getting the full current url of the route
  const current_url = new URL(fullUrl);
  // get access to URLSearchParams object
  const search_params = current_url.searchParams;
  // get url parameters
  const id = search_params.get("id");
  //TODO :getting id of database
  console.log("result", req.originalUrl);

  findInDatabase(id, (dbId) => {
    let o_id = new ObjectId(dbId); // id as a string is passed
    db.collection("products").findOne({ _id: o_id }, function (err, result) {
      result;
      res.render("productview", { Render: result });
    });
  });
});
app.get("/cart", (req, res) => {
  res.sendFile(path.join(__dirname+'/views/cart.html'));
});


app.get("/cartData", (req, res) => {
  
  var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  const current_url = new URL(fullUrl);
  // get access to URLSearchParams object
  const search_params = current_url.searchParams;
  // get url parameters
  const cartitems = search_params.get("cartitems");
  let IdToArray = JSON.parse(cartitems);

 try{
  IdToArray.forEach((items) => {
    findInDatabase(items, (dbId) => {
      let o_id = new ObjectId(dbId); // id as a string is passed
        db.collection("products").findOne({ _id: o_id }, function (err, result) {
          // console.log("result is ",result);
           Cartarray.push(result)

      });
    });
  });
 }
 catch(error)
 {
  console.log("no items in cart");
  Cartarray=[]
 }

res.send(Cartarray)

Cartarray=[]

});


app.get("/upload", (req, res) => {
  let cookieSessionUuid = req.cookies.userData.uuid;
  checkSession(
    cookieSessionUuid,
    () => {
      res.render("upload");
    },
    () => {
      res.redirect("/adminlogin");
    }
  );
});

app.post("/upload", (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("product name", req.body.ProductTitle, "paths ");
    let schema = {
      ProductName: req.body.ProductTitle,
      ProductPrice: req.body.ProductPrice,
      Paths: req.files,
    };
    insertIndatabase(schema);

    res.end("Your files uploaded.");
    console.log("Yep yep!");
  });
});

app.get("/admin", (req, res) => {
  res.render("admin_login");
});
app.get("/adminlogin", (req, res) => {
  res.render("login");
});
app.get("/adminregister", (req, res) => {
  res.render("register");
});
app.post("/register", (req, res) => {
  const { email, password, username } = req.body;
  EncryptUserInfo(username, password, email);
});
app.post("/login", (req, res) => {
  // checking username and password

  db.collection("userinfo").find({}, function (err, result) {
    const { lusername, lpassword } = req.body;
    result.forEach((element) => {
      bcrypt.compare(lusername, element.Username, function (err, userMatched) {
        // res === true
        bcrypt.compare(
          lpassword,
          element.Password,
          function (err, passwordMatched) {
            console.log(
              `username matched :${userMatched} password matched :${passwordMatched}`
            );

            if (userMatched && passwordMatched) {
              let uuidObj = { uuid: uuid() };
              res.cookie("userData", uuidObj);
              res.render("admin");
              insertDataSession(uuidObj);
            } else {
              res.render("login");
            }
            // res === true
          }
        );
      });
    });
  });
});

if (onIp) {
  app.listen(port, "192.168.1.101", function () {
    console.log(`listening on ${port}`);
  });
} else {
  app.listen(port, function () {
    console.log(`listening on ${port}`);
  });
}

function insertIndatabase(schema) {
  db.collection("products").insertOne(schema, function (err, collection) {
    if (err) throw err;
    console.log("record insert successfully");
  });
}

function findInDatabase(dbId, callback) {
  callback(dbId);
}

function EncryptUserInfo(user, password, email) {
  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(user, salt, function (err, hashUser) {
      // Store hash in your password DB.

      bcrypt.hash(password, salt, function (err, hashPassword) {
        const schema = {
          Username: hashUser,
          Password: hashPassword,
          Email: email,
        };
        console.log(schema);
        InsertUserData(schema);
      });
    });
  });
}

// this function is actually saving the user credentials in the database
function InsertUserData(schema) {
  db.collection("userinfo").insertOne(schema, function (err, collection) {
    if (err) throw err;
    console.log("user insert successfully");
  });
}

// TODO create sessions using uuids
function insertDataSession(schema) {
  db.collection("session").insertOne(schema, (err, result) => {
    if (err) throw err;
    else {
      console.log("session saved successfully");
    }
  });
}
function deleteSessionData() {
  mongoose.connection.db
    .listCollections({ name: "session" })
    .next(function (err, collinfo) {
      if (collinfo) {
        // The collection exists
        // delete the session table if exists
        MongoClient.connect(database_url, function (err, db) {
          if (err) throw err;
          var dbo = db.db("ecom");
          dbo.collection("session").drop(function (err, delOK) {
            if (err) throw err;
            if (delOK) console.log("Collection deleted");
            db.close();
          });
        });
      }
    });
}
function checkSession(cookieSessionUuid, logincalback, errorcallback) {
  db.collection("session").findOne(
    { uuid: cookieSessionUuid },
    function (err, db) {
      try {
        if (db.uuid == cookieSessionUuid) {
          console.log("login successful");
          logincalback();
        } else {
          console.log("login failed");
        }
      } catch (error) {
        errorcallback();
      }
    }
  );
}
