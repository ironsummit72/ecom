const port = 80;
const express = require("express");
const app = express();
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const multer = require("multer");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", function (req, res) {
  res.render("index");
});


app.get('/upload',(req,res)=>{
    res.render("upload")

});
app.post('/upload',(req,res)=>{
  console.log("Product Name: "+req.body.ProductTitle+" ProductPrice: "+req.body.ProductPrice);
})
app.listen(port, function () {
  console.log(`listening on ${port}`);
});
