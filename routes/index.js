var express = require('express');
var router = express.Router();
var connection = require('../lib/db');
const localStorage = require("localStorage");

const bcrypt = require("bcrypt-nodejs");
const { query } = require('express-validator');

/* GET home page. */
router.get('/login', function(req, res, next) {
    if(localStorage.getItem('userInfo')){
        res.redirect(`/user/profile`)
    }else{
            res.render('auth/login',{
            page_title:"User - Node.js",
            email:'',
            password:''});
    }
      
});
router.get('/', function(req, res, next) {
  
        if(localStorage.getItem('userInfo')){
        res.redirect(`/user/profile`)
        }else{
                res.render('auth/login',{
                page_title:"User - Node.js",
                email:'',
                password:''});
        }
      
});
router.post('/login', function(req, res, next) {
    if(!req.body.email || !req.body.password){
         req.flash('error', "Please enter the details")
    }else{
        connection.query(`select  * from usertable where email= '${req.body.email}'`,function (err,result) {
                if (err) throw err;
                if(result[0]){
                      var checkPassword = bcrypt.compareSync(req.body.password, result[0].password);
                    if (checkPassword) {
                        if(result[0].user_type===1){
                            localStorage.setItem('userInfo',  result[0].id) 
                            res.redirect(`/admin`)
                        }else{
                            localStorage.setItem('userInfo',  result[0].id) 
                            res.redirect(`/user/profile`)
                          }
                    } else {
                        req.flash('error', 'combination of email and password is wrong');
                              res.render('auth/login', {
                            title: 'Login',
                            email: req.body.email,
                            password:''
                                        
                            })
                    } 
                }else{
                    req.flash('error', 'combination of email and password is wrong');
                   return res.render('auth/login', {
                    title: 'Login',
                    email: req.body.email,
                    password:''
                    })
                }
               
            })
    }
    
  
});

router.get('/register', function(req, res, next) {
      res.render('auth/register',{
            page_title:"User - Node.js",
            title: 'Registration',
            name: '',
            email:'',
            password:'' } );
  
});
router.post('/register', function(req, res, next){    
   
        if (req.body.email && req.body.password && req.body.name ) {
        let salt = bcrypt.genSaltSync(10);
        req.body.password = bcrypt.hashSync(req.body.password, salt);
        var user = {
        firstName: req.body.name,
        email: req.body.email,
        password:req.body.password
        }
        connection.query('INSERT INTO usertable SET ?', user, function(err, result) {
        //if(err) throw err
        if (err) {
            req.flash('error', err)
            // render to views/user/add.ejs
            res.render('auth/register', {
            title: 'Registration',
            name: user.firstName,
            email: user.email,
            password:''
                           
            })
        } else {                
            req.flash('success', 'Resgiration done successfully!');
            res.redirect('/');
        }
        })
        }else {                
            req.flash('error', 'Something Failed');
            res.render('auth/register', {
            title: 'Registration',
            name: req.body.name,
            email: req.body.email,
            password:''
                           
            })
        }
   
})
router.get('/logout', function(req, res, next) {
        if(localStorage.getItem('userInfo')){
            localStorage.removeItem('userInfo');
            
        }
        res.redirect('/login')
        
      
});
router.get('/admin', function(req, res, next) {
        if(localStorage.getItem('userInfo')){
            let id =localStorage.getItem('userInfo');
            connection.query(`SELECT * FROM usertable  where usertable.id = ${id}`,function(err,rows)     {
                 if(err){
                     req.flash('error', err); 
                     res.render('admin',{data:''}); 
                }
                
                     res.render('admin',{data:rows});  

                
               
            });
        
        }
        else{
            res.redirect('/login')
        }
        
      
});
module.exports = router;