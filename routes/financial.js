var express = require('express');
var router = express.Router();
var connection  = require('../lib/db');

const localStorage = require("localStorage");

router.get('/transaction', function(req, res, next) {
        connection.query('SELECT trans.*,usertable.firstName as firstName FROM transaction_table as trans join usertable  on usertable.id=trans.user_id  ORDER BY id desc ',function(err,rows)     {  
        if(err){
         req.flash('error', err); 
         res.render('financial/admin_index',{page_layout:{name:'/financial/list',data:''}});   
        }else{
           res.render('financial/admin_index',{page_layout:{name:'/financial/list',data:rows}});   
      }
    });
});

router.get('/transaction-view/(:id)', function(req, res, next) {
        if(localStorage.getItem('userInfo')){
             connection.query(`select * from transaction_table join ( SELECT usertable.id as user_id,usertable.firstName as firstName,usertable.email as email ,bank_details.id as bank_details_id,bank_details.total_amount as total_amount FROM usertable join bank_details  on bank_details.user_id=usertable.id ) as data on transaction_table.bank_detail_id=data.bank_details_id where transaction_table.id = ${req.params.id}`,function(err1,result1){
                    if(err1){
                       throw err1 
                    }
                    if(result1[0]){
                      res.render('financial/admin_index',{page_layout:{name:"/financial/view",data:result1}}); 
                           
                    }
                  
                });  
        
        }
        else{
            res.redirect('/login')
        }
        
      
});
router.get('/bank-details', function(req, res, next){ 
        if(localStorage.getItem('userInfo')){
        let id = localStorage.getItem('userInfo')  
         res.render('financial',{page_layout:{name:'financial/bank_details',data: {
            title: 'Request',
            account_no: '',
            account_branch:'',
            transaction_account_no: '' ,
            transaction_amount: ''       
            }}})
   
    }
    else{
        res.redirect('/login')
    }
   
})

router.post('/bank-details', function(req, res, next){    
    if(localStorage.getItem('userInfo')){
        let id = localStorage.getItem('userInfo')
         
        connection.query('select * from bank_details where user_id='+id, function(err, bankdetails) {
            if(bankdetails[0].id){
                req.flash('error', 'YOu have an account.');
               return res.redirect('/user/profile','error', 'YOu have an account.');
            }
          
                    var tran_req = {
                            account_no: req.body.account_no,
                            account_branch: req.body.account_branch,
                            transaction_account_no:  req.body.transaction_account_no,
                            total_amount:Number(req.body.total_amount),
                             user_id:id
                            }
                          connection.query('INSERT INTO bank_details SET ?', tran_req, function(err, result) {
                        if (err) {
                            req.flash('error', err)
                         return   res.render('financial/bank_details', {
                            title: 'Add New Customer',
                            account_no: req.body.account_no,
                            account_branch: req.body.account_branch,
                            transaction_account_no:  req.body.transaction_account_no ,
                                  
                            })
                        } else {             
                            req.flash('success', 'Data added successfully!');
                            res.redirect('/finance/bank-details');
                        }
                    })
                
            
          
        });
 
    }else{
        res.redirect('/login')
    }
        
   
})
router.get('/financial-request', function(req, res, next){ 
        if(localStorage.getItem('userInfo')){
        let id = localStorage.getItem('userInfo')  
         connection.query('select * from bank_details where user_id='+id, function(err, bankdetails) {
         if(err){
                req.flash('error', err);
               
         }
         console.log(bankdetails)
         if(bankdetails[0]){
              
            return  res.render('financial',{page_layout:{name:'financial/create-request',data: {
            title: 'Request',
            account_no: bankdetails[0].account_no,
            account_branch:bankdetails[0].account_branch,
            transaction_account_no: '' ,
            transaction_amount: ''       
            }}})
         
        }else{
            req.flash('error', 'Please Create your bank account first');
            return  res.redirect('/finance/bank-details','error', 'Please Create your bank account first');
         
        }
     });
    }
    else{
     return   res.redirect('/login')
    }
   
})

// ADD NEW USER POST ACTION
router.post('/financial-request', function(req, res, next){    
    if(localStorage.getItem('userInfo')){
        let id = localStorage.getItem('userInfo')
         if(req.body.transaction_account_no===""){
                            req.flash('error', 'All fields are required')
                            res.redirect('/finance/financial-request','error', 'All fields are required' )
         }
        connection.query('select * from bank_details where user_id='+id, function(err, bankdetails) {
            if(bankdetails[0].account_no !==req.body.account_no || bankdetails[0].account_branch!== req.body.account_branch ){
                req.flash('error', 'BankDetails not registered');
               return res.redirect('/user/profile','error', 'BankDetails not registered');
            }
            if(bankdetails[0].total_amount ){
                if( req.body.transaction_amount>0){
                    var tran_req = {account_no: req.body.account_no,
                                    account_branch: req.body.account_branch,
                                    transaction_account_no:  req.body.transaction_account_no ,
                                    transaction_amount:  req.body.transaction_amount  ,
                                    bank_detail_id:bankdetails[0].id,
                                    transaction_type:req.body.request,
                                    user_id:id  }
                            connection.query('INSERT INTO transaction_table SET ?', tran_req, function(err, result) {
                             let total_amount_calculated = 0 
                            let transaction_Type = 0
                            if(req.body.request==1){
                                transaction_Type = 1;
                                total_amount_calculated = parseInt(bankdetails[0].total_amount) - parseInt(req.body.transaction_amount)
                            } else{
                                total_amount_calculated = Number(bankdetails[0].total_amount) + Number(req.body.transaction_amount)
                            }
                            if(total_amount_calculated<0){
                                  req.flash('error', 'Something Failed');
                                return res.redirect('/finance/financial-request', 'error','Something Failed')
                            }
                             console.log(req.body.request,total_amount_calculated)
                          
                        if (err) {
                            req.flash('error', err)
                            res.render('financial/create-request', {
                            title: 'Add New Customer',
                            account_no: req.body.account_no,
                            account_branch: req.body.account_branch,
                            transaction_account_no:  req.body.transaction_account_no ,
                            transaction_amount:  req.body.transaction_amount  ,
                            bank_detail_id:bankdetails[0].id         
                            })
                        } else {
                            var bankAmount = {total_amount:total_amount_calculated}   
                            connection.query('UPDATE bank_details SET ? WHERE user_id ='+id,bankAmount,function(err1,result){
                                if(err1){
                                    
                                     req.flash('error', err1);
                                     throw err1
                                }
                                   req.flash('success', 'Data added successfully!');
                          return  res.redirect('/finance/financial-request');
                      
                            } );           
                           }
                    })
                }
            }
          
        });
 
    }else{
        res.redirect('/login')
    }
        
   
})


// withdraw//

module.exports = router;