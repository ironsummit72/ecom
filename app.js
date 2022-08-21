const port = process.env.PORT || 3000;
const express = require("express");
const app = express();
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const { log } = require("console");
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
var ObjectId = require('mongodb').ObjectId;
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
async function wait (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
   
  });
}
app.get("/",async function (req, res) {
  // Reciving data form mongodb
  MongoClient.connect(database_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("ecom"); //database name
    dbo
      .collection("products") //collection name
      .find({})
      .toArray( function (err, result) {
        if (err) throw err;

        for (var i = 0; i < result.length; i++) {
        resultFromDatabase = result;
        }
        db.close();
      });
  });
  await wait(5*100);
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

findInDatabase(id,(dbId)=>{
 let o_id = new ObjectId(dbId);   // id as a string is passed
  db.collection("products").findOne({"_id":o_id},function(err, result) {
   dbResult=result;
   res.render("productview",{Render:result});
  });
  });
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

app.listen(port,"192.168.1.102", function () {
  console.log(`listening on ${port}`);
});

function insertIndatabase(schema) {
  db.collection("products").insertOne(schema, function (err, collection) {
    if (err) throw err;
    console.log("record insert successfully");
  });
}

 function findInDatabase(dbId,callback) {
callback(dbId)

}





