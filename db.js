// db.js

const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ticketsDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the ticket schema
const ticketSchema = new mongoose.Schema({
  name: String,
  contactNumber: String,
  email: String,
  companyName: String,
  issueCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'IssueCategory' },
  description: String,
  image: String,
  ticketId: String,
  date: Date,
  time: String,
});


// Create the Ticket model
const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
