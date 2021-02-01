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

//// Setup OAuth2 send mail

    const oAuth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
  
    oAuth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN
    });
  
    async function sendMail(mailOptions) {
        try {
            const accessToken = await oAuth2Client.getAccessToken();
      
            const transporter = nodemailer.createTransport({
              service: "gmail",
              mailHost,
              mailPort,
              auth: {
                type: "OAuth2",
                user: process.env.EMAIL,
                accessToken,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN
              },
              tls: {
                rejectUnauthorized: false
              }
            });
      

      
          const result = await transporter.sendMail(mailOptions);
          return result;
        } catch (error) {
          return error;
        }
      }
 
  
  


// Get home page
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find()
        res.render('index', {
            tasks: tasks
        })
    } catch (err) {
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
    try {
        let pay = await task.save()
        console.log(pay)

        res.redirect('/')
    } catch (err) {
        res.send(err)
    }
})

// Not finish pay - Auto Reminder mail
router.get('/debit/:id', async (req, res) => {
    const tasks = await Task.findById(req.params.id)
    // const transporter = nodemailer.createTransport({
    //     host: mailHost,
    //     port: mailPort,
    //     secure: false,
    //     auth: {
    //         user: process.env.AdminUser,
    //         pass: process.env.pass
    //     }
    // })
    try {
        debit = cron.schedule('* * * * *', () => {
           
             const mailOptions = {
                from: process.env.EMAIL,
                to: tasks.to,
                subject: tasks.subject,
                html: tasks.content
            }
            sendMail(mailOptions)
                .then((result) => console.log('Email sent...', result))
                .catch((error) => console.log(error.message));
        })

        debit.start()
        return res.redirect('/')

    } catch (err) {
        res.send(err)
    }

})

// finish pay - delete reminder
router.get('/delete/:id', async (req, res) => {
    let task
    try {
        task = await Task.findById(req.params.id)
        await task.remove()

        if (debit) {
            debit.stop()
            return res.redirect('/')
        }
        return res.redirect('/')

    } catch (err) {
        res.send(err)
    }
})

module.exports = router