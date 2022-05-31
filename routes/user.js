var express = require('express');
var router = express.Router();
const localStorage = require("localStorage");
var connection  = require('../lib/db');

const bcrypt = require("bcrypt-nodejs");
/* GET home page. */
router.get('/list', function(req, res, next) {
    connection.query('SELECT * FROM usertable where user_type=0 ORDER BY id desc',function(err,rows)     {
        
        if(err){
         req.flash('error', err); 
         res.render('customer',{main:{page:'/customer/list',data:''}});   
        }else{
         res.render('customer',{main:{page:'/customer/list',data:rows}});
        }
    });
});
router.get('/view/(:id)', function(req, res, next) {
        if(localStorage.getItem('userInfo')){
             connection.query(`SELECT * FROM usertable join bank_details  on bank_details.user_id=usertable.id where usertable.id = ${req.params.id}`,function(err1,result1){
                    if(err1){
                       throw err1 
                    }
                    if(result1[0]){
                      res.render('customer',{main:{page:"/customer/view",data:result1}}); 
                           
                    }else{
                          connection.query(`SELECT * FROM usertable  where usertable.id = ${req.params.id}`,function(err,rows)     {
                            if(err){
                           throw err
                            }
                                res.render('customer',{main:{page:"/customer/view",data:rows}}); 
                           
                            });
                    }
                  
                });  
        
        }
        else{
            res.redirect('/login')
        }
        
      
});
router.get('/profile', function(req, res, next) {
        if(localStorage.getItem('userInfo')){
            let id =localStorage.getItem('userInfo');
          
                connection.query(`SELECT * FROM usertable join bank_details  on bank_details.user_id=usertable.id where usertable.id = ${id}`,function(err1,result1){
                    if(err1){
                       throw err1 
                    }
                    if(result1[0]){
                        res.render('pages',{page_title:"User - Node.js",data:result1});  

                    }else{
                          connection.query(`SELECT * FROM usertable  where usertable.id = ${id}`,function(err,rows)     {
                            if(err){
                           throw err
                            }
                                res.render('pages',{page_title:"User - Node.js",data:rows}); 
                           
                            });
                    }
                  
                });  
               
          
        
        }
        else{
            res.redirect('/login')
        }
        
      
});

// SHOW ADD USER FORM
router.get('/add', function(req, res, next){    
// render to views/user/add.ejs
    res.render('customer',{main:{page:'/customer/add',data:{
                     firstName:'',
                     email:''}}})
})
// ADD NEW USER POST ACTION
router.post('/add', function(req, res, next){    
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
            res.render('customer', {main:{page:'/customer/add', data:{
            name: req.body.name,
            email: req.body.email,
            password:''
                           
            }}})
        } else {                
            req.flash('success', 'User Added done successfully!');
            res.redirect('/user/list');
        }
        })
        }else {                
            req.flash('error', 'Please Enter all the details');
             res.render('customer', {main:{page:'/customer/add', data:{
               name: req.body.name,
                email: req.body.email,
                password:''
                           
            }}})
        }
   
})
// SHOW EDIT USER FORM
router.get('/edit/(:id)', function(req, res, next){
    connection.query('SELECT * FROM usertable WHERE id = ' + req.params.id, function(err, rows, fields) {
    if(err) throw err
    // if user not found
    if (rows.length <= 0) {
        req.flash('error', 'Customers not found with id = ' + req.params.id)
        res.redirect('/user/list')
    }
    else { // if user found
    // render to views/user/edit.ejs template file
        res.render('customer', {
            main:{
                page:'/customer/edit',
                data:{ id: rows[0].id,
                        name: rows[0].firstName,
                        email: rows[0].email }
            }

                          
        })
    }            
    })
})
// EDIT USER POST ACTION
router.post('/update/:id', function(req, res, next) {
        if(!req.body.name){
            req.flash('error', 'Please enter details')
            res.render('customer', {main:{page:'/customer/edit',data:{
            title: 'Edit Customer',
            id: req.params.id,
            name: req.body.name,
            }}}
           )
        }
        var user = {
        firstName: req.body.name
        }
        connection.query('UPDATE usertable SET ? WHERE id = ' + req.params.id, user, function(err, result) {
        //if(err) throw err
        console.log(result)
        if (err) {
            req.flash('error', err)
            // render to views/user/add.ejs
            //   req.flash('error', 'Please enter details')
            res.render('customer', {main:{page:'/customer/edit',data:{
            title: 'Edit Customer',
            id: req.params.id,
            name: req.body.name,
            }}}
           )
        } else {
            req.flash('success', 'Data updated successfully!');
            res.redirect('/user/list');
        }
        })
    
})
// DELETE USER
router.get('/delete/(:id)', function(req, res, next) {
    var user = { id: req.params.id }
    connection.query('DELETE FROM usertable WHERE id = ' + req.params.id, user, function(err, result) {
    //if(err) throw err
    if (err) {
        req.flash('error', err)
        // redirect to users list page
        res.redirect('/user/list')
    } else {
        req.flash('success', 'Customer deleted successfully! id = ' + req.params.id)
        // redirect to users list page
        res.redirect('/user/list')
    }
    })
})
module.exports = router;