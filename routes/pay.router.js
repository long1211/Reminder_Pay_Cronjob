const express = require("express")
const router = express.Router()
const Task = require("../models/pay.model")

const nodemailer = require("nodemailer")
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
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

 
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
  
    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN
    });
  
    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          reject("Failed to create access token :(");
        }
        resolve(token);
      });
    });
  
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: mailHost,
      port: mailPort,
      secure: false,
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        accessToken,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
      }
    });
  
   try{
      debit = cron.schedule('* * * * *', () => {
          const mailOptions = {
              from: process.env.EMAIL,
              to: tasks.to,
              subject: tasks.subject,
              html: tasks.content
          }

          transporter.sendMail(mailOptions, (err, info) => {
              if(err){
                 console.log("Error occured", err)
              }else{
                  console.log("email sent", info)
                 
              }
          })
      })      

     debit.start() 
     return res.redirect('/')  

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