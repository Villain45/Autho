//jshint esversion:6
const express=require('express')
const mongoose=require('mongoose')
const bodyparser=require('body-parser')
const ejs=require('ejs')
require('dotenv').config()
var bcrypt = require('bcryptjs');

// For encryption purposes
// const encrypt=require('mongoose-encryption')

// For mdn only
// const md5=require('md5')

const app= express();
app.set('view engine','ejs')
app.use(express.static('public'))
app.use(bodyparser.urlencoded({extended: true}))

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,  useUnifiedTopology: true  })

const userSchema=new mongoose.Schema({
    email:String,
    password:String
})

// Only for encrytion which is easy to hack
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]})

const User=new mongoose.model('User',userSchema)

app.get("/",function(req,res){
    res.render("home")
})
app.get("/register",function(req,res){
    res.render("register")
})
app.get("/login",function(req,res){
    res.render("login")
})


app.post("/register",function(req,res){
    // Format of below line (what should be hashed,saltrounds,callback function)
    bcrypt.hash(req.body.password, 8, function(err, hash) {
        const userInfo=new User({
            email:req.body.email,
            password:hash
        })
        
        userInfo.save(function(err) {
            if(err) 
            res.send(err)
            else
            res.render('secrets')
        })
        
        })
    
    });


app.post('/login', function(req, res){
    const username = req.body.email;
    const password = req.body.password;
    User.findOne({email: username},{password:password},function(err,userResult){
        if(err){
            console.log(err);
        }
        else
        {
            if(userResult){
                bcrypt.compare(password,userResult.password, function(err, result) {
                    if(result===true)
                        res.render('secrets')
                    
                    else
                    console.log("in1");
                    
                });
                
               
            }
            else
            console.log("in2");
            
        }

    })
})

app.listen(3000,function(req,res){
  console.log("Signal has been started");   
})