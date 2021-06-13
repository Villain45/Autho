//jshint esversion:6
const express=require('express')
const mongoose=require('mongoose')
const bodyparser=require('body-parser')
const ejs=require('ejs')
const encrypt=require('mongoose-encryption')
require('dotenv').config()

const app= express();
app.set('view engine','ejs')
app.use(express.static('public'))
app.use(bodyparser.urlencoded({extended: true}))

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,  useUnifiedTopology: true  })

const userSchema=new mongoose.Schema({
    email:String,
    password:String
})


userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]})

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

const userInfo=new User({
    email:req.body.email,
    password:req.body.password
})

userInfo.save(function(err) {
    if(err) 
    res.send(err)
    else
    res.render('secrets')
})

})

app.post('/login', function(req, res){
    const username = req.body.email;
    const password = req.body.password;
    User.findOne({email: username},function(err,userResult){
        if(err){
            console.log(err);
        }
        else
        {
            if(userResult){
                if(userResult.password===password)
               res.render('secrets')
            }
        }
    })
})

app.listen(3000,function(req,res){
  console.log("Signal has been started");   
})