const mongoose = require("mongoose")

const taskSchema = new mongoose.Schema({
    name: {type: String, required:true},
    to:{type: String, required: true},
    createAT: {type: Date, required:true, default: Date.now},
    subject: {type: String, required: true},
    content: {type: String, required: true}
})

module.exports = mongoose.model('Task', taskSchema)