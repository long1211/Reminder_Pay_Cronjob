const express = require("express")
const router = express.Router()
const Task = require("../models/pay.model")

const nodemailer = require("nodemailer")
const cron = require("node-cron")
const mailHost = 'smtp.gmail.com'
const mailPort = 587
let debit

// Get home page
router.get('/', async (req, res) => {
    try{ 
        const tasks = await Task.find()
        res.render('index', {
            tasks: tasks
        })
    }catch(err){
        res.send(err)
   }
   
})

// Create Reminder Pay
router.post('/', async (req, res) => {
   const task = new Task({
       name: req.body.name,
       to: req.body.to,
       subject: req.body.subject,
       content: req.body.content
   })
   try{
          let pay = await task.save()
          console.log(pay)

          res.redirect('/')
   }catch(err){
         res.send(err)
   }
})

// Not finish pay - Auto Reminder mail
router.get('/debit/:id', async(req, res) => {
   const tasks = await Task.findById(req.params.id)
   const transporter = nodemailer.createTransport({
       host: mailHost,
       port: mailPort,
       secure: false,
       auth:{
           user: process.env.AdminUser,
           pass: process.env.pass
       }
   })
   try{
      debit = cron.schedule('* * * * *', () => {
          const mailOptions = {
              from: process.env.AdminUser,
              to: tasks.to,
              subject: tasks.subject,
              html: tasks.content
          }

          transporter.sendMail(mailOptions, (err, info) => {
              if(err){
                 console.log("Error occured", err)
              }else{
                  console.log("email sent", info)
                  return res.redirect('/')
              }
          })
      })      

     debit.start()   
    }catch(err){
         res.send(err)
    }

})

// finish pay - delete reminder
router.get('/delete/:id', async (req, res) => {
    let task
    try{
         task = await Task.findById(req.params.id)
         await task.remove()
         
         debit.stop()
         res.redirect('/')
    }catch(err){
         res.send(err)
    }
})

module.exports = router