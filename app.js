const port = 80;
const express = require("express");
const app = express();
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const { log } = require("console");
const directory = "./uploads";
const mongoose = require("mongoose");
var MongoClient = require("mongodb").MongoClient;

var paths = "";
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

//connection establish


// MongoClient.connect("mongodb://127.0.0.1:27017/ecom", function(err, db) {
//   if (err) throw err;
//   console.log("Database created!");
//   db.close();
// });


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

//const upload = multer({ storage: storage });
var upload = multer({ storage: storage }).any(directory);

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/upload", (req, res) => {
  res.render("upload");
});

app.post("/upload", (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
      return;
    }

    //console.log('path ',req.files);
     // TODO:store this path in mongo db database

    console.log("product name", req.body.ProductTitle ,"paths ",paths);
    let schema = {
      ProductName: req.body.ProductTitle,
      ProductPrice: req.body.ProductPrice,
      Paths: req.files,
    };
    insertIndatabase(schema);

    res.end("Your files uploaded.");
    console.log("Yep yep!");
  });

  // console.log(
  //   "Product Name: " +
  //     req.body.ProductTitle +
  //     " ProductPrice: " +
  //     req.body.ProductPrice
  // );
});

app.listen(port, function () {
  console.log(`listening on ${port}`);
});

function insertIndatabase(schema) {
  db.collection("products").insertOne(schema, function (err, collection) {
    if (err) throw err;
    console.log("record insert successfully");
  });
}

// TODO things to add in this project
/**
 * establish a database connection
 *
 */
