//  to controll ur website
//build app settings start point
const express = require("express");
const app = express();
const port = 7500;
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
//da esm el model schema bta3na
const User = require("./models/userSchema");
const Product = require("./models/productSchema");
const ProductUser = require("./models/productUserSchema");
//set up for uploads files
const formidable = require('formidable');
const form = formidable({ multiples: true });
const fs = require('fs');
const mv = require('mv');
const path = require('path');
// const util = require('util')
// const EventEmitter = require('events')
// function MyClass() { EventEmitter.call(this) }
// util.inherits(MyClass, EventEmitter)
//body parser types
const bodyParser = require('body-parser');
// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: true })
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//token
const jwt = require("jsonwebtoken");
//session set up
const session = require("express-session");

app.use(
  session({
    secret: "marigerges-e3dadi-taio",
    resave: false,
    saveUninitialized: true,
  })
);

// mongoose
const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://AbanoubSaad:dev@cluster0.yoqimye.mongodb.net/taio?retryWrites=true&w=majority"
  )
  .then((result) => {
    app.listen(process.env.PORT || port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  })

  .catch((err) => {
    console.log(err);
  });
  
  // Generate JWT token
const generateToken = (user) => {
  const secretKey = "marigerges-e3dadi-taio"; // Replace with your own secret key
  const payload = {
    userId: user._id,
    username: user.username,
    // Include any additional data you want in the token payload
  };
  const options = {
    expiresIn: "1h", // Token expiration time
  };

  return jwt.sign(payload, secretKey, options);
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization || req.session.token;

  if (!token) {
    return res.redirect('/login')
  }

  // Verify the token here
  const secretKey = 'marigerges-e3dadi-taio'; // Replace with your own secret key

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).send("Invalid token");
    }

    const userId = decoded.userId;

    User.findById(userId)
      .then((user) => {
        if (!user) {
          return res.status(401).send("Invalid token after decoded");
        }

        req.user = user;
        next();
      })
      .catch((err) => {
        console.error("Error verifying token:", err);
        res.status(500).send("An error occurred while verifying the token");
      });
  });
};

app.post("/profile", function (req, res) {
  const newUser = new User(req.body);

  newUser
    .save()
    .then((result) => {
      const token = generateToken(newUser);
      req.session.token = token
      res.redirect('/product') // Return the token as a JSON response
      console.log('token :>> ', token);
    
    })
    .catch((err) => {
      console.error("Error registering user:", err);
      res.status(500).send("An error occurred while registering the user");
    });
});

app.post('/login', function (req, res) {

  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ username:username, password:password })
    .then((user) => {
      if (!user) {
        return res.status(401).send("Invalid username or password");
      }
      if (user.admin == true){
        const token = generateToken(user);
      req.session.token = token
      res.redirect('/product-admin') // Return the token as a JSON response
      }else{
        const token = generateToken(user);
      req.session.token = token
      res.redirect('/product') // Return the token as a JSON response
      }

      
    })
    .catch((err) => {
      console.error("Error logging in:", err);
      res.status(500).send("An error occurred while logging in");
    });
})
  


app.get("/", (req, res) => {
  res.redirect("/index");
});

app.get("/index", (req, res) => {
  res.render("index", { myTitle: "اسرة مارجرجس اعدادي" });
});

app.get("/register", (req, res) => {
  res.render("register", { myTitle: "sign up" });
});

app.get("/login", (req, res) => {
  res.render("login", { myTitle: "log in" });
});

app.get("/add-new-pro",verifyToken, (req, res) => {
  res.render("add-new-pro", { myTitle: "add new pro" });
});

app.get("/manage-users",verifyToken, (req, res) => {
  User.find()
    .then((result) => {
      res.render("manage-users", { myTitle: " التحكم بالمستخدم  ",arrUser:result });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/mkAdmin/:id',verifyToken, (req, res) => {
  User.findById(req.params.id)
  .then((result)=>{
    res.render('confirm-admin',{myTitle:"make admin",objUser:result})
  })
  .catch((err) => {
    console.log(err);
  })
})

app.get('/deleteUSer/:id',verifyToken, (req, res) => {
  User.findById(req.params.id)
  .then((result)=>{
    res.render('user-delete',{ myTitle:' مسح المستخدم ', objUser:result })
  })
  .catch((err) => {
    console.log(err);
  })
})

app.get("/profile",verifyToken, function(req,res){
  User.findById(req.user._id).then((result) => {
    ProductUser.find({userID: req.user._id}).then(async(Data) => {
      let Allproduct = []
      let i ;
      console.log(Data)
      for(i=0;i<Data.length;i++) {
        let element = Data[i]
        console.log(element)
        let resultproducts = await Product.findOne(element.productID);
        Allproduct.push(resultproducts)
        console.log(Allproduct);
      }
      res.render('profile',{myTitle:"profile" ,objuser:result ,products:Allproduct ,order:Data});
    })
  })
});
app.post('/userImg/:id',verifyToken, function (req, res) {
  const form = new formidable.IncomingForm();

  form.parse(req, function (err, fields, files) { 
    const oldpath = files.userImg.filepath; //userImg is the input file's id in the html form
    let newpath = './public/userImg/' + files.userImg.originalFilename;
    const type = path.extname(newpath)
    newpath = './public/userImg/' + req.params.id+type;
    mv(oldpath, newpath , function(err) {
      if (err) throw err;
    });
    User.updateOne({_id: req.params.id}, {img:req.params.id+type}).then((result)=>{
      console.log("the product image was uploaded successfully");
      res.redirect("/profile");
    }).catch((err)=>{
      console.log('error :>> ', err);
    })
})
})



app.post("/product",verifyToken, function (req, res) {
  const product = new Product(req.body);
  product
    .save()
    .then((result) => {
      const resultID = result._id.toString();
      res.send({"Id": resultID})
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/productImage/:Id",verifyToken, function (req, res) {
  const form = new formidable.IncomingForm();
  
  form.parse(req, function (err, fields, files) { 
    const oldpath = files.proImg.filepath;
    let newpath = './public/productImg/' + files.proImg.originalFilename;
    const type = path.extname(newpath)
    newpath = './public/productImg/' + req.params.Id+type;
    mv(oldpath, newpath , function(err) {
      if (err) throw err;
    });
    Product.updateOne({_id: req.params.Id}, {imgPath:req.params.Id+type})
  .then(result => {
    console.log("The product image was uploaded successfully");
    res.redirect("/product-admin");
  })
  .catch(error => {
    // Handle the error appropriately
    console.error(error);
    res.status(500).send("An error occurred during the image upload.");
  });
  });
});

app.get("/product",verifyToken, (req, res) => {
  Product.find()
    .then((result) => {
      res.render("product", { myTitle: " الهدايا ",arrProduct:result });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/product-admin',verifyToken, (req, res) => {
  Product.find()
  .then((result) => {
    res.render("product-admin", { myTitle: " products ",arrProduct:result });
  })
  .catch((err) => {
    console.log(err);
  });
})

app.get("/manage",verifyToken, (req, res) => {
  Product.find()
    .then((result) => {
      res.render("manage", { myTitle: " التحكم بالهدايا  ",arrProduct:result });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/product/:id',verifyToken, (req, res) => {
  Product.findById(req.params.id)
  .then((result)=>{
    console.log(req.user)
    if (req.user.admin == null || req.user.admin == false)
    {
      res.render('proDetails',{ myTitle:' تفاصيل الهدية ', objProduct:result});
      return
    }
    let productRuslt = result;
    ProductUser.find({ productID: req.params.id }).then( async (result) => {
      let AllUsers = []
      let i ;
      console.log(result)
      for(i=0;i<result.length;i++) {
        let element = result[i]
        console.log(element)
       let resultusers = await User.findOne(element.userID);
        AllUsers.push(resultusers)
      }
      console.log(AllUsers)
      res.render("proDetails-admin", { Users: AllUsers, objProduct: productRuslt ,myTitle:"users who choose this product" });
    });
  })
  .catch((err) => {
    console.log(err);
  })
})

app.get('/deleteProduct/:id',verifyToken, (req, res) => {
  Product.findById(req.params.id)
  .then((result)=>{
    res.render('product-delete',{ myTitle:' مسح الهدية ', objProduct:result })
  })
  .catch((err) => {
    console.log(err);
  })
})

app.get('/updateProduct/:id',verifyToken, (req, res) => {
  Product.findByIdAndUpdate(req.params.id,req.body)
  .then((result)=>{
    res.render('update-product',{ myTitle:' تعديل الهدية ', objProduct:result })
  })
  .catch((err) => {
    console.log(err);
  })
})

app.post('/Buy/:Id',verifyToken, (req, res) => {
  // console.log(req.user._id);
  let Id = new mongoose.Types.ObjectId(req.params.Id);
  ProductUser.find({ userID: req.user._id, productID: Id }).then((result) => {
    if (result.length == 0) {
      const productUser = new ProductUser({
        userID: req.user._id,
        productID: Id,
      });
      console.log(productUser);
      productUser
        .save()
        .then((result) => {
          res.redirect("/product");
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      res.redirect("/product");
    }
  })
  
})



app.post('/mk-Admin/:id',verifyToken, function (req, res) {
  User.findByIdAndUpdate({_id: req.params.id},{admin:true})
  .then((result)=>{
    res.redirect('/manage-users')
  })
  .catch((err) => {
    console.log(err);
  })
})

app.get('/deleteOrder/:id',verifyToken, (req, res) => {
 ProductUser.findOne({productID:req.params.id,userID:req.user._id}).then((result)=>{
  res.render('delete-order',{order:result})
 })
})

app.delete('/product/:id',verifyToken,  (req, res) => {
  //eldata inside el json btt5zn fy var data inside details.ejs
  Product.findByIdAndDelete(req.params.id)
      .then((product) => {
        ProductUser.deleteMany({productID:product._id}).then((result)=>{
          res.json({ myLink: "/manage" }) 
        })
       })
      .catch((err) => {
          console.log(err);
      });
});


app.delete('/user/:id',verifyToken,  (req, res) => {
  //eldata inside el json btt5zn fy var data inside details.ejs
  User.findByIdAndDelete(req.params.id)
      .then((user) => { 
        ProductUser.deleteMany({userID:user._id}).then((result)=>{
          res.json({ myLink: "/manage-users" })
        })
      })
      .catch((err) => {
          console.log(err);
      });
});

app.delete('/productUser/:id',verifyToken,  (req, res) => {
  //eldata inside el json btt5zn fy var data inside details.ejs
  ProductUser.findByIdAndDelete(req.params.id)
      .then((params) => { res.json({ myLink: "/product" }) })
      .catch((err) => {
          console.log(err);
      });
});
