//jshint esversion:6
const express=require('express')
const mongoose=require('mongoose')
const bodyparser=require('body-parser')
const ejs=require('ejs')
require('dotenv').config()
var session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const findOrCreate=require('mongoose-findorcreate')


// For bcrypt(salt +password)
// var bcrypt = require('bcryptjs');

// For encryption purposes
// const encrypt=require('mongoose-encryption')

// For mdn only
// const md5=require('md5')

const app= express();
app.use(express.static('public'))
app.set('view engine','ejs')
app.use(bodyparser.urlencoded({extended: true}))



app.use(session({
    secret:"Our little secret",
    resave:false,
    saveUninitialized:false
}))
app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,  useUnifiedTopology: true  })
// for warning 
mongoose.set('useCreateIndex',true);  
const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

// Only for encrytion which is easy to hack
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]})

const User=new mongoose.model('User',userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

// Google
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, done) {
      console.log(profile);
       User.findOrCreate({ googleId: profile.id }, function (err, user) {
         return done(err, user);
       });
  }
));

app.get("/",function(req,res){
    res.render("home")
})
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    //   if successful
    res.redirect('/secrets');
  });

  app.get("/login",function(req,res){
    res.render("login")
})

  app.get("/register",function(req,res){
    res.render("register")
})

app.get("/secrets",function(req,res){
   User.find({"secrets":{$ne:null}},function(err,foundUser){
       if(err){
           console.log(err);

       }
       else
       {
           if(foundUser){
               res.render("secrets",{usersWithsecrets:foundUser})
           }
       }
   })
})

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("/submit")
    }else
    {
        res.redirect("/login")
    }
})

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;

    User.findById(req.user.id,function(err,founduser){
        if(err)
        {
            console.log(err);
        }
        else
        {
            if(founduser)
            {
                founduser.secret=submittedSecret;
                founduser.save(function(){
                    res.redirect("/secrets");
                })
            }
        }
    })
})

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
})

app.post("/register",function(req,res){
    
    User.register({username:req.body.email},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register")
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
    
})
    
    
    
    // Format of below line (what should be hashed,saltrounds,callback function) 
    // For low level authorization
    // bcrypt.hash(req.body.password, 8, function(err, hash) {
    //     const userInfo=new User({
    //         email:req.body.email,
    //         password:hash
    //     })
        
    //     userInfo.save(function(err) {
    //         if(err) 
    //         res.send(err)
    //         else
    //         res.render('secrets')
    //     })
        
    //     })
    
    // });


app.post('/login', function(req, res){

    const user=new User({
        username:req.body.email,
        password:req.body.password
    })
    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })

        }
    })
    


    // For low level authentication
    //     const username = req.body.email;
//     const password = req.body.password;
//     User.findOne({email: username},{password:password},function(err,userResult){
//         if(err){
//             console.log(err);
//         }
//         else
//         {
//             if(userResult){
//                 bcrypt.compare(password,userResult.password, function(err, result) {
//                     if(result===true)
//                         res.render('secrets')
                    
//                     else
//                     console.log("in1");
                    
//                 });
                
               
//             }
//             else
//             console.log("in2");
            
//         }

//     })
})

app.listen(3000,function(req,res){
  console.log("Signal has been started");   
})