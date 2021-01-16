require('dotenv').config()
const express = require("express");
const app = express()
const port = 3333
const mongoose = require("mongoose")
const bodyParser = require("body-parser")

// Define router
const inderRouter = require("./routes/pay.router")

// View engine setup
app.set('view engine', 'pug')
app.set('views', 'views')

// Connect DB
mongoose.connect(process.env.DATABASE_URL,{
    useUnifiedTopology: true,
    useNewUrlParser: true,
})
const db = mongoose.connection
db.on('error', error => console.log(error))
db.once('open', () => console.log('Connected to Database'))

// Setup body parse
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))


app.use(inderRouter)
// app.listen(port, () =>{
//     console.log(`Server listening ${port}`)
// })

app.listen(process.env.PORT || 3000)