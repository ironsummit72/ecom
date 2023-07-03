console.log("working");
let addcart = document.getElementById("addtocart");
addcart.addEventListener("click", addtocart);
let url = window.location.search;
function addtocart() {
  const urlParams = new URLSearchParams(url);
  const id = urlParams.get("id");
if(localStorage.getItem("cartData")!=null && localStorage.getItem("cartData").includes(id))
{
document.getElementById("message").style.display='inline'
document.getElementById("message").innerText="You already added this item to cart."
document.getElementById("message").style.color="red";
}else{

  
    saveToLocalStorage(id);
    document.getElementById("message").style.display = "inline";
    document.getElementById("message").innerText="Added this item to your cart.";
    document.getElementById("message").style.color="green";
  
}

}
function saveToLocalStorage(productid) {
  let cartObj = [];
  if (localStorage.getItem("cartData") == null) {
    cartObj.push(productid);
    localStorage.setItem("cartData", JSON.stringify(cartObj));
  } else {
    cartObj = JSON.parse(localStorage.getItem("cartData"));
    cartObj.push(productid);
    localStorage.setItem("cartData", JSON.stringify(cartObj));
   
  }
}