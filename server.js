  // Import necessary modules
  const express = require("express");
  const mongoose = require("mongoose");
  const brevo = require("@getbrevo/brevo"); // Import the Brevo package
  const bodyParser = require("body-parser");
  const multer = require("multer");
  const path = require("path");
  const dotenv = require("dotenv");
  const axios = require("axios");
  const cors = require("cors"); // Import the CORS middleware
  const moment = require('moment'); // Import moment
  const FormData = require("form-data");
  const fs = require("fs");
  const SibApiV3Sdk = require("sib-api-v3-sdk");
  dotenv.config();
  const app = express();
  const port = process.env.PORT || 5174;
  const fsPromises = require('fs').promises;
  // Configure Brevo API client with hardcoded API key
  const brevoapiKey = process.env.BREVO_API_KEY;;
  const brevoapiInstance = new brevo.TransactionalEmailsApi();
  brevoapiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    brevoapiKey
  );

  // Middleware
  app.use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    })
  ); // Enable CORS for all routes
  app.use(bodyParser.json());
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

  // MongoDB Atlas connection string

  // /mongodb://localhost:27017/ticketsDB
  const mongoURI = "mongodb://172.31.1.9:27017/ticketsDB";
  //mongodb+srv://deskAssure:Foxnet%40123%23@cluster01.fb97t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01
  // Connect to MongoDB
  mongoose
    .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

  // Function to send closed tickets email using Brevo template 152
  const sendClosedTicketsMail = async (
    recipientEmail,
    ticketId,
    issueCategory,
    issueDescription,
    firstName
  ) => {
    const emailData = {
      sender: {
        email: "support@foxnetglobal.com",
        name: "Vyomika from Foxnet",
      },
      to: [{ email: recipientEmail, name: firstName }],
      replyTo: {
        email: "support@foxnetglobal.com",
        name: "Vyomika from Foxnet",
      },
      headers: {
        "Some-Custom-Name": "unique-id-7890",
      },
      templateId: 152, // Template ID for "Closed Tickets Mail"
      params: {
        ticketId: ticketId,
        issueCategory: issueCategory,
        issueDescription: issueDescription,
        firstName: firstName,
      },
    };

    try {
      const response = await brevoapiInstance.sendTransacEmail(emailData);
      return response;
    } catch (error) {
      throw new Error(
        "Error sending email: " +
          (error.response ? error.response.body.message : error.message)
      );
    }
  };

  // API endpoint to send the closed tickets mail
  app.post("/send-closed-tickets-mail", async (req, res) => {
  const {
    recipientEmails,
    ticketId,
    issueCategory,
    issueDescription,
    firstName,
  } = req.body;

  // Define the default email address
  const defaultEmail = "pulkit.verma@foxnetglobal.com"; // Replace with your default email address

  // Validate input
  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return res.status(400).json({ message: "Invalid recipient emails" });
  }

  // Add the default email to the recipient list
  const allRecipientEmails = [...recipientEmails, defaultEmail];

  // Log the final list of recipient emails for debugging
  console.log("Final recipient emails:", allRecipientEmails);

  // Send emails to all recipients including the default email
  const promises = allRecipientEmails.map((recipientEmail) => {
    return sendClosedTicketsMail(
      recipientEmail,
      ticketId,
      issueCategory,
      issueDescription,
      firstName
    );
  });

  try {
    const responses = await Promise.all(promises);
    res.status(200).json({
      message: "Closed tickets email sent successfully to all recipients",
      responses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Under Observation 
const sendUnderObservationMail = async (
  recipientEmail,
  ticketId,
  issueCategory,
  issueDescription,
  firstName,
  daysPassed // New parameter
) => {
  const emailData = {
    sender: {
      email: "support@foxnetglobal.com",
      name: "Vyomika from Foxnet",
    },
    to: [{ email: recipientEmail, name: firstName }],
    replyTo: {
      email: "support@foxnetglobal.com",
      name: "Vyomika from Foxnet",
    },
    headers: {
      "Some-Custom-Name": "unique-id-7890", // Add any custom header if needed
    },
    templateId: 175, // Template ID for "Under Observation Mail"
    params: {
      firstName: firstName,
      ticketId: ticketId,
      issueCategory: issueCategory,
      issueDescription: issueDescription,
      daysPassed: daysPassed, // Add the new parameter here
    },
  };

  try {
    const response = await brevoapiInstance.sendTransacEmail(emailData);
    return response;
  } catch (error) {
    throw new Error(
      "Error sending email: " + (error.response ? error.response.body.message : error.message)
    );
  }
};

// API endpoint to send the under observation email
app.post("/send-under-observation-mail", async (req, res) => {
  const {
    recipientEmails,
    ticketId,
    issueCategory,
    issueDescription,
    firstName,
    daysPassed // New parameter in the request body
  } = req.body;

  // Define the default email address
  const defaultEmail = "pulkit.verma@foxnetglobal.com"; // Replace with your default email address

  // Validate input
  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return res.status(400).json({ message: "Invalid recipient emails" });
  }

  if (daysPassed === undefined || isNaN(daysPassed)) {
    return res.status(400).json({ message: "Invalid 'daysPassed' value" });
  }

  // Add the default email to the recipient list
  const allRecipientEmails = [...recipientEmails, defaultEmail];

  // Log the final list of recipient emails for debugging
  console.log("Final recipient emails:", allRecipientEmails);

  // Send emails to all recipients including the default email
  const promises = allRecipientEmails.map((recipientEmail) => {
    return sendUnderObservationMail(
      recipientEmail,
      ticketId,
      issueCategory,
      issueDescription,
      firstName,
      daysPassed // Pass the daysPassed parameter
    );
  });

  try {
    const responses = await Promise.all(promises);
    res.status(200).json({
      message: "Under observation email sent successfully to all recipients",
      responses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Function to send the monthly report email
const sendMonthlyReportMail = async (
  recipientEmail,
  firstName,
  startDate,
  endDate,
  totalTickets,
  totalClosedTickets,
  cctvCount,
  averageCctvETA,
  accessControlCount,
  averageAccessControlETA,
  fireAlarmCount,
  averageFireAlarmETA,
  othersCount,
  averageOthersETA,
  monthlyETA,
  healthCheck, // Added field
  ppmStatus,   // Added field
  customerSatisfaction, // Added field
  initial      // Added initial parameter
) => {
  // Logging the parameters being sent
  console.log("Sending email with parameters:", {
    recipientEmail,
    firstName,
    startDate,
    endDate,
    totalTickets,
    totalClosedTickets,
    cctvCount,
    averageCctvETA,
    accessControlCount,
    averageAccessControlETA,
    fireAlarmCount,
    averageFireAlarmETA,
    othersCount,
    averageOthersETA,
    monthlyETA,
    healthCheck,
    ppmStatus,
    customerSatisfaction,
    initial   // Log initial
  });

  const emailData = {
    sender: {
      email: "support@foxnetglobal.com",
      name: "Vyomika from Foxnet",
    },
    to: [{ email: recipientEmail, name: firstName }],
    replyTo: {
      email: "support@foxnetglobal.com",
      name: "Vyomika from Foxnet",
    },
    headers: {
      "Some-Custom-Name": "unique-id-7890", // Add any custom header if needed
    },
    templateId: 167, // Template ID for the Monthly Report
    params: {
      firstName: firstName,
      startDate: startDate,  // Replaced month with startDate
      endDate: endDate,      // Replaced month with endDate
      totalTickets: totalTickets,
      totalClosedTickets: totalClosedTickets,
      monthlyETA: monthlyETA,
      cctvCount: cctvCount,
      accessControlCount: accessControlCount,
      fireAlarmCount: fireAlarmCount,
      othersCount: othersCount,
      averageCctvETA: averageCctvETA,
      averageAccessControlETA: averageAccessControlETA,
      averageFireAlarmETA: averageFireAlarmETA,
      averageOthersETA: averageOthersETA,
      healthCheck: healthCheck, // Added healthCheck
      ppmStatus: ppmStatus,   // Added ppmStatus
      customerSatisfaction: customerSatisfaction, // Added customerSatisfaction
      initial: initial // Added initial
    },
  };

  try {
    // Send the email via Brevo API
    const response = await brevoapiInstance.sendTransacEmail(emailData);
    console.log("Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(
      "Error sending email: " + (error.response ? error.response.body.message : error.message)
    );
  }
};




// API endpoint to send the Monthly Report email
// API endpoint to send the Monthly Report email
// API endpoint to send the Monthly Report email
app.post("/send-monthly-report-mail", async (req, res) => {
  const {
    recipientEmails, // List of recipient emails
    firstName,       // First name of the recipient
    startDate,       // Start date for the report
    endDate,         // End date for the report
    totalTickets,
    totalClosedTickets,
    cctvCount,
    averageCctvETA,
    accessControlCount,
    averageAccessControlETA,
    fireAlarmCount,
    averageFireAlarmETA,
    othersCount,
    averageOthersETA,
    monthlyETA,
    healthCheck, // Added field
    ppmStatus,   // Added field
    customerSatisfaction, // Added field
    initial // Added initial field
  } = req.body;

  // Validate input
  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return res.status(400).json({ message: "Invalid recipient emails" });
  }

  if (!startDate || !endDate || typeof startDate !== "string" || typeof endDate !== "string") {
    return res.status(400).json({ message: "Invalid 'startDate' or 'endDate' value" });
  }

  // Log the incoming request for debugging
  console.log("Received request data:", req.body);

  // Add default email for testing (optional)
  const defaultEmail = "pulkit.verma@foxnetglobal.com";
  const allRecipientEmails = [...recipientEmails, defaultEmail];

  const promises = allRecipientEmails.map((recipientEmail) => {
    return sendMonthlyReportMail(
      recipientEmail,
      firstName,
      startDate,
      endDate,
      totalTickets,
      totalClosedTickets,
      cctvCount,
      averageCctvETA,
      accessControlCount,
      averageAccessControlETA,
      fireAlarmCount,
      averageFireAlarmETA,
      othersCount,
      averageOthersETA,
      monthlyETA,
      healthCheck,        // Pass healthCheck
      ppmStatus,          // Pass ppmStatus
      customerSatisfaction, // Pass customerSatisfaction
      initial             // Pass initial parameter
    );
  });

  try {
    const responses = await Promise.all(promises);
    res.status(200).json({
      message: "Monthly report email sent successfully to all recipients",
      responses,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: error.message });
  }
});





// Function to send PPM Report email
const sendPPMReportMail = async (
  recipientEmail,
  timePeriod,
  firstName
) => {
  const emailData = {
    sender: {
      email: "support@foxnetglobal.com",
      name: "Vyomika from Foxnet",
    },
    to: [{ email: recipientEmail, name: firstName }],
    replyTo: {
      email: "support@foxnetglobal.com",
      name: "Vyomika from Foxnet",
    },
    headers: {
      "Some-Custom-Name": "unique-id-7890", // Add any custom header if needed
    },
    templateId: 178, // Template ID for "PPM Report"
    params: {
      firstName: firstName,
      timePeriod: timePeriod, // Add the new parameter here
    },
  };

  try {
    const response = await brevoapiInstance.sendTransacEmail(emailData);
    return response;
  } catch (error) {
    throw new Error(
      "Error sending email: " + (error.response ? error.response.body.message : error.message)
    );
  }
};
// API endpoint to send the PPM Report email
app.post("/send-ppm-report-mail", async (req, res) => {
  const {
    recipientEmails,  // List of recipient emails
    timePeriod,       // Time period for the report
    firstName         // First name of the recipient
  } = req.body;

  // Define the default email address (optional)
  const defaultEmail = "pulkit.verma@foxnetglobal.com"; // Replace with your default email address

  // Validate input
  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return res.status(400).json({ message: "Invalid recipient emails" });
  }

  if (!timePeriod || typeof timePeriod !== "string") {
    return res.status(400).json({ message: "Invalid 'timePeriod' value" });
  }

  // Add the default email to the recipient list (optional)
  const allRecipientEmails = [...recipientEmails, defaultEmail];

  // Log the final list of recipient emails for debugging
  console.log("Final recipient emails:", allRecipientEmails);

  // Send emails to all recipients, including the default email (if any)
  const promises = allRecipientEmails.map((recipientEmail) => {
    return sendPPMReportMail(
      recipientEmail,
      timePeriod,
      firstName // Pass the firstName parameter
    );
  });

  try {
    const responses = await Promise.all(promises);
    res.status(200).json({
      message: "PPM Report email sent successfully to all recipients",
      responses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Function to send Healthcheck Report email
const sendHealthcheckReportMail = async (
  recipientEmail,
  timePeriod,
  firstName
) => {
  const emailData = {
    sender: {
      email: "support@foxnetglobal.com",
      name: "Vyomika from Foxnet",
    },
    to: [{ email: recipientEmail, name: firstName }],
    replyTo: {
      email: "support@foxnetglobal.com",
      name: "Vyomika from Foxnet",
    },
    headers: {
      "Some-Custom-Name": "unique-id-7890", // Add any custom header if needed
    },
    templateId: 158, // Template ID for "Healthcheck Report"
    params: {
      firstName: firstName,
      timePeriod: timePeriod, // Time period for the healthcheck report
    },
  };

  try {
    const response = await brevoapiInstance.sendTransacEmail(emailData);
    return response;
  } catch (error) {
    throw new Error(
      "Error sending email: " + (error.response ? error.response.body.message : error.message)
    );
  }
};
// API endpoint to send the Healthcheck Report email
app.post("/send-healthcheck-report-mail", async (req, res) => {
  const {
    recipientEmails,  // List of recipient emails
    timePeriod,       // Time period for the report
    firstName         // First name of the recipient
  } = req.body;

  // Define the default email address (optional)
  const defaultEmail = "pulkit.verma@foxnetglobal.com"; // Replace with your default email address

  // Validate input
  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return res.status(400).json({ message: "Invalid recipient emails" });
  }

  if (!timePeriod || typeof timePeriod !== "string") {
    return res.status(400).json({ message: "Invalid 'timePeriod' value" });
  }

  // Add the default email to the recipient list (optional)
  const allRecipientEmails = [...recipientEmails, defaultEmail];

  // Log the final list of recipient emails for debugging
  console.log("Final recipient emails:", allRecipientEmails);

  // Send emails to all recipients, including the default email (if any)
  const promises = allRecipientEmails.map((recipientEmail) => {
    return sendHealthcheckReportMail(
      recipientEmail,
      timePeriod,
      firstName // Pass the firstName parameter
    );
  });

  try {
    const responses = await Promise.all(promises);
    res.status(200).json({
      message: "Healthcheck Report email sent successfully to all recipients",
      responses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Function to send PPM Reminder email
const sendPPMReminderMail = async (recipientEmail, timePeriod, firstName) => {
  const emailData = {
    sender: {
      email: "support@foxnetglobal.com",
      name: "Vyomika from Foxnet",
    },
    to: [{ email: recipientEmail, name: firstName }],
    replyTo: {
      email: "support@foxnetglobal.com",
      name: "Vyomika from Foxnet",
    },
    headers: {
      "Some-Custom-Name": "unique-id-7890", // Add any custom header if needed
    },
    templateId: 159, // Template ID for "PPM Reminder"
    params: {
      firstName: firstName,
      timePeriod: timePeriod, // Time period for the reminder (dynamic based on logic)
    },
  };

  try {
    const response = await brevoapiInstance.sendTransacEmail(emailData);
    return response;
  } catch (error) {
    throw new Error(
      "Error sending email: " + (error.response ? error.response.body.message : error.message)
    );
  }
};

// Helper function to calculate next quarter, month, or year based on the timePeriod
const calculateNextTimePeriod = (timePeriod) => {
  const currentDate = new Date();

  // Logic to determine the next time period based on the current date and provided timePeriod
  if (timePeriod.toLowerCase() === "quarter") {
    // Calculate the next quarter (check which quarter the current date is in)
    const currentMonth = currentDate.getMonth();
    let nextQuarterStartMonth;
    
    if (currentMonth >= 0 && currentMonth < 3) {
      nextQuarterStartMonth = 3;  // Quarter 2 starts in April
    } else if (currentMonth >= 3 && currentMonth < 6) {
      nextQuarterStartMonth = 6;  // Quarter 3 starts in July
    } else if (currentMonth >= 6 && currentMonth < 9) {
      nextQuarterStartMonth = 9;  // Quarter 4 starts in October
    } else {
      nextQuarterStartMonth = 0;  // Quarter 1 starts in January
    }

    // Calculate the next quarter start date
    currentDate.setMonth(nextQuarterStartMonth);
    currentDate.setDate(1);  // Set to the first day of the next quarter

    // Format timePeriod (next quarter date)
    return `Q${Math.floor((nextQuarterStartMonth + 3) / 3)} ${currentDate.getFullYear()}`;
  } 
  else if (timePeriod.toLowerCase() === "monthly") {
    // For monthly, get the next month
    currentDate.setMonth(currentDate.getMonth() + 1); // Move to next month
    return `${currentDate.toLocaleString("default", { month: "long" })} ${currentDate.getFullYear()}`;
  }
  else if (timePeriod.toLowerCase() === "yearly") {
    // For yearly, move to the next year
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    return `${currentDate.getFullYear()}`;
  }
  
  // If timePeriod is not recognized, return the current time period
  return timePeriod;
};

// API endpoint to send the PPM Reminder email
app.post("/send-ppm-reminder-mail", async (req, res) => {
  const { recipientEmails, timePeriod, firstName } = req.body;

  // Validate input
  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return res.status(400).json({ message: "Invalid recipient emails" });
  }

  if (!timePeriod || typeof timePeriod !== "string") {
    return res.status(400).json({ message: "Invalid 'timePeriod' value" });
  }

  // Add the default email to the recipient list (optional)
  const defaultEmail = "pulkit.verma@foxnetglobal.com"; // Replace with your default email address
  const allRecipientEmails = [...recipientEmails, defaultEmail]; // Include the default email in the list

  // Log the final list of recipient emails for debugging
  console.log("Final recipient emails:", allRecipientEmails);

  // Calculate the next time period for the reminder
  const nextTimePeriod = calculateNextTimePeriod(timePeriod);

  // Send emails to all recipients, including the default email (if any)
  const promises = allRecipientEmails.map((recipientEmail) => {
    return sendPPMReminderMail(
      recipientEmail,
      nextTimePeriod,
      firstName // Pass the firstName parameter
    );
  });

  try {
    const responses = await Promise.all(promises);
    res.status(200).json({
      message: "PPM Reminder email sent successfully to all recipients",
      responses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


  // Function to send feedback email using Brevo template 153
const sendFeedbackMail = async (recipientEmail, ticketId, firstName) => {
  const emailData = {
    sender: {
      email: "support@foxnetglobal.com",
      name: "Vyomika from Foxnet",
    },
    to: [{ email: recipientEmail, name: firstName }],
    replyTo: {
      email: "support@foxnetglobal.com",
      name: "Vyomika from Foxnet",
    },
    headers: {
      "Some-Custom-Name": "unique-id-7890",
    },
    templateId: 172, // Template ID for "Feedback Mail"
    params: {
      ticketId: ticketId,
      firstName: firstName
    },
  };

  // Log the emailData for debugging
  console.log("Sending feedback email with the following data:", emailData);

  try {
    // Set delay of 10 minutes (600000 ms)
    setTimeout(async () => {
      try {
        const response = await brevoapiInstance.sendTransacEmail(emailData);
        console.log("Feedback email sent successfully:", response);
        return response;
      } catch (error) {
        console.error("Error sending email:", error);
        throw new Error(
          "Error sending email: " + (error.response ? error.response.body.message : error.message)
        );
      }
    }, 600000); // Delay of 10 minutes
  } catch (error) {
    console.error("Error sending feedback email after delay:", error);
  }
};



// API endpoint to send the feedback mail
// API endpoint to send the feedback mail
app.post("/send-feedback-mail", async (req, res) => {
  const { recipientEmails, ticketId, firstName } = req.body;

  // Validate input
  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return res.status(400).json({ message: "Invalid recipient emails" });
  }

  if (!ticketId || !firstName) {
    return res.status(400).json({ message: "Ticket ID and first name are required" });
  }

  // Define the default email address
  const defaultEmail = "pulkit.verma@foxnetglobal.com"; // Replace with your default email address

  // Add the default email to the recipient list
  const allRecipientEmails = [...recipientEmails, defaultEmail];

  // Log the final list of recipient emails for debugging
  console.log("Final recipient emails:", allRecipientEmails);

  // Send feedback emails to all recipients including the default email
  const promises = allRecipientEmails.map((recipientEmail) => {
    return sendFeedbackMail(recipientEmail, ticketId, firstName);
  });

  try {
    // You don't need to wait for the feedback emails here since they're delayed
    console.log("Scheduled feedback emails for sending.");
    res.status(200).json({
      message: "Feedback emails will be sent after a delay.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



  // Function to send in-progress tickets email using Brevo template 151
  const sendInProgressTicketsMail = async (
    recipientEmail,
    ticketId,
    issueCategory,
    issueDescription,
    firstName
  ) => {
    const emailData = {
      sender: {
        email: "support@foxnetglobal.com",
        name: "Vyomika from Foxnet",
      },
      to: [{ email: recipientEmail, name: firstName }],
      replyTo: {
        email: "support@foxnetglobal.com",
        name: "Vyomika from Foxnet",
      },
      headers: {
        "Some-Custom-Name": "unique-id-7890",
      },
      templateId: 151, // Template ID for "In Progress Tickets Mail"
      params: {
        ticketId: ticketId,
        issueCategory: issueCategory,
        issueDescription: issueDescription,
        firstName: firstName,
      },
    };

    try {
      const response = await brevoapiInstance.sendTransacEmail(emailData);
      return response;
    } catch (error) {
      throw new Error(
        "Error sending email: " +
          (error.response ? error.response.body.message : error.message)
      );
    }
  };

  // API endpoint to send the in-progress tickets mail to multiple recipients
  app.post("/send-in-progress-tickets-mail", async (req, res) => {
  const {
    recipientEmails,
    ticketId,
    issueCategory,
    issueDescription,
    firstName,
  } = req.body;

  // Default email to be added to every email send request
  const defaultEmail = "pulkit.verma@foxnetglobal.com"; // Replace with your desired default email address

  // Validate input
  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return res.status(400).json({ message: "Invalid recipient emails" });
  }

  // Add the default email to the recipient list (only if it's not already present)
  if (!recipientEmails.includes(defaultEmail)) {
    recipientEmails.push(defaultEmail);
  }

  // Now, we have a recipient list that includes the default email
  const promises = recipientEmails.map((recipientEmail) => {
    return sendInProgressTicketsMail(
      recipientEmail,
      ticketId,
      issueCategory,
      issueDescription,
      firstName
    );
  });

  try {
    const responses = await Promise.all(promises);
    res.status(200).json({
      message: "In-progress tickets email sent successfully to all recipients",
      responses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



  // Function to send new user email using Brevo template 154
  const sendNewUserMail = async (recipientEmail, firstName) => {
    const emailData = {
      sender: {
        email: "support@foxnetglobal.com",
        name: "Vyomika from Foxnet",
      },
      to: [{ email: recipientEmail, name: firstName }],
      replyTo: {
        email: "support@foxnetglobal.com",
        name: "Vyomika from Foxnet",
      },
      headers: {
        "Some-Custom-Name": "unique-id-7890",
      },
      templateId: 154, // Template ID for "Add User Mail"
      params: {
        firstName: firstName,
      },
    };

    try {
      const response = await brevoapiInstance.sendTransacEmail(emailData);
      return response;
    } catch (error) {
      throw new Error(
        "Error sending email: " +
          (error.response ? error.response.body.message : error.message)
      );
    }
  };

  // API endpoint to send the new user mail
  app.post("/send-new-user-mail", async (req, res) => {
    const { recipientEmail, firstName } = req.body;

    try {
      const response = await sendNewUserMail(recipientEmail, firstName);
      res
        .status(200)
        .json({ message: "New user email sent successfully", response });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Email function to send email using Brevo template
  const sendEmailWithTemplate = async (
    recipientEmail,
    ticketId,
    issueCategory,
    issueDescription,
    firstName
  ) => {
    const emailData = {
      sender: {
        email: "support@foxnetglobal.com",
        name: "Vyomika from Foxnet",
      },
      to: [{ email: recipientEmail, name: firstName }],
      replyTo: {
        email: "support@foxnetglobal.com",
        name: "Vyomika from Foxnet",
      },
      headers: {
        "Some-Custom-Name": "unique-id-1234",
      },
      templateId: 139,
      params: {
        ticketId: ticketId,
        issueCategory: issueCategory,
        issueDescription: issueDescription,
        firstName: firstName,
      },
    };

    try {
      const response = await brevoapiInstance.sendTransacEmail(emailData);
      return response;
    } catch (error) {
      throw new Error(
        "Error sending email: " +
          (error.response ? error.response.body.message : error.message)
      );
    }
  };

  // API endpoint to send email with dynamic data to multiple recipients
app.post("/send-email", async (req, res) => {
  const {
    recipientEmails,
    ticketId,
    issueCategory,
    issueDescription,
    firstName,
  } = req.body;

  // Default email to receive all emails
  const defaultEmail = "pulkit.verma@foxnetglobal.com";  // Replace with your actual default email address

  // Validate input
  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return res.status(400).json({ message: "Invalid recipient emails" });
  }

  // Add default email to the list of recipients
  const allRecipients = [...recipientEmails, defaultEmail];

  // Send email to each recipient
  const promises = allRecipients.map((recipientEmail) => {
    return sendEmailWithTemplate(
      recipientEmail,
      ticketId,
      issueCategory,
      issueDescription,
      firstName
    );
  });

  try {
    const responses = await Promise.all(promises);
    res.status(200).json({
      message: "Email sent successfully to all recipients",
      responses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Directory to save the uploaded files
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // File name
    },
  });

  const upload = multer({ storage });
  // const KALEYRA_API_KEY = 'A17d7d416a4abf01de27c9dc4107272ec';

// Company schema
const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  gst: { type: String, required: true },
  website: String,
  address: { type: String, required: true },
  logo: String,
  
  // Health check and ppm check
  healthCheck: {
    frequency: { type: String, enum: ['yearly', 'quarterly', 'monthly'], required: true },
    pdf: [{
      quarter: { type: Number },   // Quarter (1-4 for quarterly)
      month: { type: Number },     // Month (1-12 for monthly)
      year: { type: Number },      // Year for yearly
      filePath: { type: String },  // File path to the uploaded PDF
    }],
  },
  maintenanceStartDate: { type: Date },
  maintenanceEndDate: { type: Date },
  ppmCheck: {
    frequency: { type: String, enum: ['yearly', 'quarterly', 'monthly'], required: true },
    pdf: [{
      quarter: { type: Number },   // Quarter (1-4 for quarterly)
      month: { type: Number },     // Month (1-12 for monthly)
      year: { type: Number },      // Year for yearly
      filePath: { type: String },  // File path to the uploaded PDF
    }],
  },

  // Support timings
  supportTimings: { 
    type: String, 
    enum: ['7am - 8pm', '24*7', 'default'], 
    default: 'default' 
  },

  // Contacts
  contacts: [{
    title: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  }],

  // New contract matrix
  contractMatrix: [{
    role: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
  }]
});

const Company = mongoose.model("Company", companySchema);


// Define the notification API endpoint that uses the company name
app.get("/api/notification/:companyName", async (req, res) => {
  try {
    const companyName = req.params.companyName;

    // Find the company document by name (case insensitive search)
    const company = await Company.findOne({ name: new RegExp('^' + companyName + '$', 'i') });
    
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    let notifications = [];

    // Check if there are new files in the healthCheck section
    if (company.healthCheck && company.healthCheck.pdf.length > 0) {
      notifications.push("New file(s) uploaded in Health Check section.");
    }

    // Check if there are new files in the ppmCheck section
    if (company.ppmCheck && company.ppmCheck.pdf.length > 0) {
      notifications.push("New file(s) uploaded in PPM Check section.");
    }

    // If no new files were found, notify the user
    if (notifications.length === 0) {
      return res.status(200).json({ message: "No new files uploaded in Health Check or PPM Check sections." });
    }

    // Return the notifications about new files
    res.status(200).json({ message: notifications.join(" ") });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});
// Add a new contract matrix entry
// app.post('/api/company/:companyName/contract', async (req, res) => {
//   const { companyName } = req.params;
//   const { role, name, phone, email } = req.body;

//   try {
//     // Find the company by its name
//     const company = await Company.findOne({ name: companyName });
//     if (!company) {
//       return res.status(404).json({ message: 'Company not found' });
//     }

//     // Add the new contract matrix entry to the company
//     company.contractMatrix.push({ role, name, phone, email });

//     // Save the company with the updated contract matrix
//     await company.save();

//     res.status(200).json({ message: 'Contract matrix entry added successfully', company });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
app.get('/api/company/:companyName/contract', async (req, res) => {
  const { companyName } = req.params;

  try {
    // Find the company by its name
    const company = await Company.findOne({ name: companyName });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Return the contract matrix of the company
    res.status(200).json({
      message: 'Contract matrix retrieved successfully',
      contractMatrix: company.contractMatrix
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a contract matrix entry by company name and mobile number
app.delete('/api/company/:companyName/contract/:mobileNumber', async (req, res) => {
  const { companyName, mobileNumber } = req.params;

  try {
    // Find the company by its name
    const company = await Company.findOne({ name: companyName });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Find and remove the contract matrix entry by phone number
    const contractIndex = company.contractMatrix.findIndex(contact => contact.phone === mobileNumber);
    if (contractIndex === -1) {
      return res.status(404).json({ message: 'Contract not found for the given phone number' });
    }

    // Remove the contact matrix entry
    company.contractMatrix.splice(contractIndex, 1);

    // Save the updated company document
    await company.save();

    res.status(200).json({ message: 'Contract matrix entry deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/company/:companyName/contact
app.post("/api/company/:companyName/contact", async (req, res) => {
  const { title, name, email } = req.body;
  const { companyName } = req.params;

  // Validate the required fields
  if (!title || !name || !email) {
    return res.status(400).json({ message: "Title, name, and email are required." });
  }

  try {
    // Find the company by name
    const company = await Company.findOne({ name: companyName });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // Check if contact with the same email already exists
    const existingContact = company.contacts.find(contact => contact.email === email);
    if (existingContact) {
      return res.status(400).json({ message: "Contact with this email already exists." });
    }

    // Add the new contact
    const newContact = { title, name, email };
    company.contacts.push(newContact);
    await company.save();

    res.status(201).json(newContact); // Return the newly created contact
  } catch (err) {
    console.error("Error adding contact:", err);
    res.status(500).json({ message: "Error adding contact" });
  }
});

// PUT /api/company/:companyName/contact/:contactId
app.put("/api/company/:companyName/contact/:contactId", async (req, res) => {
  const { title, name, email } = req.body;
  const { companyName, contactId } = req.params;

  // Validate the required fields
  if (!title || !name || !email) {
    return res.status(400).json({ message: "Title, name, and email are required." });
  }

  try {
    // Find the company by name
    const company = await Company.findOne({ name: companyName });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // Find the contact by ID and update it
    const contact = company.contacts.id(contactId);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found." });
    }

    // Update the contact
    contact.title = title;
    contact.name = name;
    contact.email = email;

    await company.save(); // Save the updated company

    res.json(contact); // Return the updated contact
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating contact" });
  }
});
// DELETE /api/company/:companyName/contact/:contactId
app.delete("/api/company/:companyName/contact/:contactId", async (req, res) => {
  const { companyName, contactId } = req.params;

  try {
    // Find the company by name
    const company = await Company.findOne({ name: companyName });

    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // Find the contact by matching the contactId with the contact's _id field
    const contactIndex = company.contacts.findIndex(contact => contact._id.toString() === contactId);

    if (contactIndex === -1) {
      return res.status(404).json({ message: "Contact not found." });
    }

    // Remove the contact from the contacts array
    company.contacts.splice(contactIndex, 1); // This removes the contact at the found index
    await company.save(); // Save the updated company

    res.status(200).json({ message: "Contact deleted successfully." });
  } catch (err) {
    console.error("Error deleting contact:", err);
    res.status(500).json({ message: "Error deleting contact" });
  }
});


// GET /api/company/:companyName/contacts
app.get("/api/company/:companyName/contacts", async (req, res) => {
  const { companyName } = req.params;

  try {
    // Find the company by name
    const company = await Company.findOne({ name: companyName });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // Return the list of contacts
    res.json(company.contacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching contacts" });
  }
});



// Set up multer for file uploads
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const checkType = req.params.checkType;  // Either 'healthcheck' or 'ppmcheck'
    const frequency = req.body.frequency;   // Frequency (quarterly, monthly, yearly)
    let periodFolder = '';  // Variable to store the period folder (e.g., 'q1', 'month1')

    // Ensure 'frequency' and 'quarter' are passed in the body for quarterly uploads
    if (frequency === 'quarterly') {
      const quarter = req.body.quarter;  // Quarter (1-4) passed in the request body
      // Validate quarter (ensure it's between 1 and 4)
      if (!quarter || quarter < 1 || quarter > 4) {
        return cb(new Error('Invalid quarter specified.'), false); // Reject if invalid quarter
      }
      periodFolder = `q${quarter}`;  // Set period folder to 'q1', 'q2', etc.
    } else if (frequency === 'monthly') {
      const month = req.body.month;  // Month (1-12) passed in the request body
      // Validate month (ensure it's between 1 and 12)
      if (!month || month < 1 || month > 12) {
        return cb(new Error('Invalid month specified.'), false); // Reject if invalid month
      }
      periodFolder = `month${month}`;  // Set period folder to 'month1', 'month2', etc.
    } else if (frequency === 'yearly') {
      periodFolder = 'yearly';  // Set period folder to 'yearly'
    }

    // Get the current year dynamically
    const year = new Date().getFullYear();

    // Create the full directory path dynamically
    const uploadDir = `./uploads/${year}/${checkType}/${periodFolder}`;

    // Ensure the directory exists, create if it doesn't
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });  // Create the directory if it doesn't exist
    }

    // Set the upload directory dynamically based on the period (quarter, month, yearly)
    cb(null, uploadDir);  // Use the dynamic directory path
  },
  filename: (req, file, cb) => {
    // Generate unique file name based on the current timestamp and original file name
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});



// File filter to only accept PDF files
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);  // Accept PDF files
  } else {
    cb(new Error('Only PDF files are allowed'), false);  // Reject non-PDF files
  }
};

// Initialize multer with storage and file filter options
const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
});

// Helper function to determine number of files to upload based on frequency
const getExpectedPdfCount = (frequency) => {
  switch (frequency) {
    case 'quarterly':
      return 4; // 4 files for quarterly (Q1, Q2, Q3, Q4)
    case 'monthly':
      return 12; // 12 files for monthly (Jan-Dec)
    case 'yearly':
      return 1; // 1 file for yearly
    default:
      return 0;
  }
};

// Helper function to format the PDF data for the response
const formatPdfData = (pdfData, frequency) => {
  return pdfData.map((data) => {
    if (frequency === 'monthly') {
      return { month: data.month, filePath: data.filePath };
    } else if (frequency === 'quarterly') {
      return { quarter: data.quarter, filePath: data.filePath };
    } else if (frequency === 'yearly') {
      return { year: data.year, filePath: data.filePath };
    }
  });
};

// API to upload Health Check and PPM Check PDFs for a specific company
app.post('/upload/:checkType/:companyId', uploadPdf.array('file', 1), async (req, res) => {
  const { companyId, checkType } = req.params;
  const files = req.files;

  try {
    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Determine the frequency and expected file count based on the check type
    const checkFrequency = checkType === 'healthcheck' ? company.healthCheck.frequency : company.ppmCheck.frequency;

    // Ensure only one file is uploaded for the current quarter/month
    if (files.length !== 1) {
      return res.status(400).json({ error: 'You need to upload exactly one PDF.' });
    }

    // Get the quarter/month to which the file belongs
    let periodData = {};
    if (checkFrequency === 'quarterly') {
      const quarter = req.body.quarter; // Expecting quarter as part of the request body
      if (!quarter || quarter < 1 || quarter > 4) {
        return res.status(400).json({ error: 'Invalid quarter specified.' });
      }
      periodData = { quarter, filePath: files[0].path };
    } else if (checkFrequency === 'monthly') {
      const month = req.body.month; // Expecting month as part of the request body
      if (!month || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Invalid month specified.' });
      }
      periodData = { month, filePath: files[0].path };
    } else if (checkFrequency === 'yearly') {
      periodData = { year: 2024, filePath: files[0].path }; // Yearly file
    }

    // Update the healthCheck or ppmCheck field based on checkType
    let updated = false;
    if (checkType === 'healthcheck') {
      // Add the new file to the healthCheck pdf array
      company.healthCheck.pdf.push(periodData); // Simply push the new file to the array
      updated = true;
    } else if (checkType === 'ppmcheck') {
      // Add the new file to the ppmCheck pdf array
      company.ppmCheck.pdf.push(periodData); // Simply push the new file to the array
      updated = true;
    }

    // If a field was updated, save the company data
    if (updated) {
      await company.save();
    }

    // Send back the response
    res.status(200).json({
      message: `${checkType.charAt(0).toUpperCase() + checkType.slice(1)} PDF uploaded successfully.`,
      filePath: periodData.filePath, // Send the path of the uploaded file back
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to delete a file
async function deleteFile(fileData) {
  try {
    // Construct the full file path
    const filePath = path.join(__dirname, fileData.filePath);
    const normalizedFilePath = path.normalize(filePath);
    console.log('Attempting to delete file at:', normalizedFilePath);

    // Check if the file exists
    await fs.promises.access(normalizedFilePath, fs.constants.F_OK);
    console.log('File exists, attempting deletion...');

    // Delete the file
    await fs.promises.unlink(normalizedFilePath);
    console.log(`File at ${normalizedFilePath} successfully deleted.`);
    return { success: true, message: 'File deleted successfully' };
  } catch (err) {
    console.error('Error during deletion:', err.message);
    return { success: false, error: 'File not found or could not be deleted' };
  }
}

// API to delete a file (healthcheck or ppmcheck) from a company
app.delete('/deleteFile/:companyId/:checkType/:fileId', async (req, res) => {
  const { companyId, checkType, fileId } = req.params;

  try {
    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Determine the check type and locate the file
    const checkField = checkType === 'healthcheck' ? 'healthCheck' : 'ppmCheck';
    const fileData = company[checkField].pdf.find(file => file._id.toString() === fileId);

    if (!fileData) {
      return res.status(404).json({ error: 'File not found for the specified ID' });
    }

    // Delete the file from the server
    const result = await deleteFile(fileData);
    if (result.success) {
      // Remove the file from the database
      company[checkField].pdf = company[checkField].pdf.filter(file => file._id.toString() !== fileId);
      await company.save();

      return res.status(200).json({ message: 'File deleted successfully and removed from database' });
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error occurred while deleting the file' });
  }
});




//companies route
app.post("/companies", async (req, res) => {
  const { name, gst, website, address, healthCheckFrequency, maintenanceStartDate, maintenanceEndDate, ppmCheckFrequency, supportTimings } = req.body;

  // Validate required fields
  if (!name || !gst || !address || !healthCheckFrequency || !ppmCheckFrequency) {
    return res
      .status(400)
      .json({ error: "Name, GST, address, health check frequency, and ppm check frequency are required." });
  }

  try {
    const company = new Company({
      name,
      gst,
      website,
      address,
      healthCheck: {
        frequency: healthCheckFrequency,
        // No longer handling PDF upload
      },
      maintenanceStartDate: maintenanceStartDate ? new Date(maintenanceStartDate) : null,
      maintenanceEndDate: maintenanceEndDate ? new Date(maintenanceEndDate) : null,
      ppmCheck: {
        frequency: ppmCheckFrequency,
        // No longer handling PDF upload
      },
      supportTimings: supportTimings || 'default', // Set the support timings
    });

    const savedCompany = await company.save();
    res.status(201).json(savedCompany);
  } catch (err) {
    res.status(400).send(err.message);
  }
});




const issueCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    prompts: { type: [String], required: false }, // New field for storing prompts
  },
  { collection: "issuecategories" }
);

const IssueCategory = mongoose.model("IssueCategory", issueCategorySchema);

app.put('/api/categories/:name/prompts', async (req, res) => {
  try {
    const categoryName = req.params.name;
    const { prompts } = req.body;

    if (!prompts || !Array.isArray(prompts)) {
      return res.status(400).json({ message: "Prompts must be an array" });
    }

    const updatedCategory = await IssueCategory.findOneAndUpdate(
      { name: categoryName },
      { $set: { prompts } },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(updatedCategory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get('/api/categories/:name/prompts', async (req, res) => {
  try {
    const categoryName = req.params.name;

    const category = await IssueCategory.findOne({ name: categoryName });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ prompts: category.prompts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.delete('/api/categories/:name/prompts', async (req, res) => {
  try {
    const categoryName = req.params.name;
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required to delete" });
    }

    const category = await IssueCategory.findOne({ name: categoryName });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Remove the specific prompt from the array
    const promptIndex = category.prompts.indexOf(prompt);
    if (promptIndex === -1) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    category.prompts.splice(promptIndex, 1);

    await category.save();

    res.status(200).json({ message: "Prompt deleted successfully", category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



const operatorSchema = new mongoose.Schema({
  title: { type: String, required: true },
  operatorName: { type: String, required: true },
  email: { type: String, required: true },
  companyName: { type: String, required: true },
  mobile: { type: String },
  contractType: { type: String },
  managers: [
    {
      name: { type: String, required: true },
      email: { type: String, required: true },
      designation: { type: String, required: true },
      contactNumber: { type: String, required: true }, // Add contactNumber
    },
  ],
  notifications: [
    {
      message: { type: String, required: true },
      status: { type: String, enum: ['unread', 'read'], default: 'unread' },
      date: { type: Date, default: Date.now },
    },
  ],
});

const Operator = mongoose.model("Operator", operatorSchema);

// 1. Get Notifications by Mobile Number
app.get("/notifications/:mobile", async (req, res) => {
  try {
    const operator = await Operator.findOne({ mobile: req.params.mobile });
    if (!operator) {
      return res.status(404).json({ message: "Operator not found" });
    }

    res.json(operator.notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// 2. Delete a Specific Notification
app.delete("/notification/:mobile/:notificationId", async (req, res) => {
  try {
    const operator = await Operator.findOne({ mobile: req.params.mobile });
    if (!operator) {
      return res.status(404).json({ message: "Operator not found" });
    }

    // Remove the notification by its ID
    const notificationIndex = operator.notifications.findIndex(
      (notif) => notif._id.toString() === req.params.notificationId
    );

    if (notificationIndex === -1) {
      return res.status(404).json({ message: "Notification not found" });
    }

    operator.notifications.splice(notificationIndex, 1);
    await operator.save();

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// 3. Delete All Notifications
app.delete("/notifications/:mobile", async (req, res) => {
  try {
    const operator = await Operator.findOne({ mobile: req.params.mobile });
    if (!operator) {
      return res.status(404).json({ message: "Operator not found" });
    }

    operator.notifications = []; // Clear all notifications
    await operator.save();

    res.json({ message: "All notifications deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// 4. Mark Notifications as Read
app.put("/notifications/read/:mobile", async (req, res) => {
  try {
    const operator = await Operator.findOne({ mobile: req.params.mobile });
    if (!operator) {
      return res.status(404).json({ message: "Operator not found" });
    }

    // Mark all unread notifications as read
    operator.notifications.forEach((notification) => {
      if (notification.status === 'unread') {
        notification.status = 'read';
      }
    });

    await operator.save();

    res.json({ message: "All unread notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});
//Add noti
app.put("/notification/:mobile", async (req, res) => {
  try {
    const { message } = req.body; // Extract message from request body

    if (!message) {
      return res.status(400).json({ message: "Notification message is required" });
    }

    const operator = await Operator.findOne({ mobile: req.params.mobile });
    if (!operator) {
      return res.status(404).json({ message: "Operator not found" });
    }

    // Create a new notification object
    const newNotification = {
      message: message,
      status: "unread", // Default status is "unread"
    };

    // Add the new notification to the operator's notifications array
    operator.notifications.push(newNotification);
    await operator.save();

    res.status(200).json({
      message: "Notification added successfully",
      notification: newNotification,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});
//Add noti for all operator
app.put("/notification/company/:companyName", async (req, res) => {
  try {
    const { message } = req.body; // Extract message from request body

    if (!message) {
      return res.status(400).json({ message: "Notification message is required" });
    }

    // Find all operators associated with the company
    const company = await Company.findOne({ name: req.params.companyName });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Find all operators for the company (assuming companyName is linked in operators)
    const operators = await Operator.find({ companyName: company.name });

    if (operators.length === 0) {
      return res.status(404).json({ message: "No operators found for this company" });
    }

    // Create a new notification object
    const newNotification = {
      message: message,
      status: "unread", // Default status is "unread"
    };

    // Add the new notification to each operator's notifications array
    for (let operator of operators) {
      operator.notifications.push(newNotification);
      await operator.save(); // Save the operator after adding the notification
    }

    res.status(200).json({
      message: "Notification added successfully to all operators",
      notification: newNotification,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

const engineerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String },
    contractType: { type: String },
    managerName: { type: String },
    rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        default: 0 // Optional, default value in case there's no rating yet
    },
});

const Engineer = mongoose.model("Engineer", engineerSchema);
// API to GET the rating of an engineer by their ID
app.get('/engineer/:id/rating', async (req, res) => {
    try {
        const engineer = await Engineer.findById(req.params.id);
        if (!engineer) {
            return res.status(404).json({ message: "Engineer not found" });
        }
        res.json({ rating: engineer.rating });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// API to PUT (update) the rating of an engineer by their ID
app.put('/engineer/:id/rating', async (req, res) => {
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    try {
        const engineer = await Engineer.findByIdAndUpdate(
            req.params.id, 
            { rating },
            { new: true } // This returns the updated document
        );

        if (!engineer) {
            return res.status(404).json({ message: "Engineer not found" });
        }

        res.json({ message: "Rating updated successfully", rating: engineer.rating });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
const ticketSchema = new mongoose.Schema({
  name: String,
  contactNumber: String,
  email: String,
  companyName: String,
  issueCategory: { type: mongoose.Schema.Types.ObjectId, ref: "IssueCategory" },
  description: String,
  image: String,
  ticketId: String,
  date: Date,
  time: String,
  status: { type: String, default: "Open" }, // Status field
  closeDate: String, // Close date field (e.g., "09/21/2024")
  closeTime: String, // Close time field (e.g., "11:51 am")
  eta: {
    totalHours: Number,
    totalDays: Number,
    exceeds24Hours: Boolean,
  },
  resolution: String, // New field for Resolution
  preventiveAction: String, // New field for Preventive Action
  warrantyCategory: String, // New field for Warranty Category
  engineerId: { type: mongoose.Schema.Types.ObjectId, ref: "Engineer" }, // New field for Engineer (Linked to Engineer schema)
  managerEmails: [
    {
      email: String,
      name: String,
      designation: String,
    },
  ],
  feedbackSubmitted: { type: Boolean, default: false }, // Boolean field for feedback status
});

const Ticket = mongoose.model("Ticket", ticketSchema);


// 1. GET API to get the feedback submission status
app.get('/ticket/:ticketId/feedback-status', async (req, res) => {
  const { ticketId } = req.params;

  try {
    // Find the ticket by its ticketId
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Return the feedback status
    res.status(200).json({
      ticketId: ticket.ticketId,
      feedbackSubmitted: ticket.feedbackSubmitted,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving feedback status", error: error.message });
  }
});

// 2. PUT API to update the feedback submission status
app.put('/ticket/:ticketId/feedback-status', async (req, res) => {
  const { ticketId } = req.params;
  const { feedbackSubmitted } = req.body; // Expecting a boolean (true or false)

  if (typeof feedbackSubmitted !== 'boolean') {
    return res.status(400).json({ message: "feedbackSubmitted must be a boolean" });
  }

  try {
    // Find the ticket by its ticketId and update the feedback status
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { feedbackSubmitted },
      { new: true } // Return the updated document
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json({
      message: "Feedback status updated successfully",
      feedbackSubmitted: ticket.feedbackSubmitted,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating feedback status", error: error.message });
  }
});

// API to check the latest 10 tickets marked as closed
app.get('/tickets/recently-closed', async (req, res) => {
    try {
        // Fetch the latest 10 tickets with status 'Closed'
        const closedTickets = await Ticket.find({ status: "Closed" })
            .sort({ date: -1 }) // Sort by date, descending (latest first)
            .limit(10); // Get only the latest 10

        if (!closedTickets.length) {
            return res.status(404).json({ message: "No closed tickets found." });
        }

        res.json({ closedTickets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error while fetching tickets." });
    }
});
  // Auto-suggestion API endpoint
app.get('/api/tickets/suggestions', async (req, res) => {
  try {
    const query = req.query.q;  // The search query from the frontend (e.g., user input)

    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // Use MongoDB's $regex operator for basic text matching (case-insensitive)
    const tickets = await Ticket.find({
      description: { $regex: query, $options: 'i' }  // 'i' for case-insensitive search
    })
      .limit(10)  // Limit the number of suggestions returned
      .select('description');  // Only return the 'description' field for the suggestions

    const suggestions = tickets.map(ticket => ticket.description);

    res.json(suggestions);  // Return suggestions as a JSON array
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
  // Define the notification API endpoint
app.get("/api/notifications/:mobileNumber", async (req, res) => {
  try {
    const mobileNumber = req.params.mobileNumber;

    // Get the current date and the date for two days ago
    const currentDate = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(currentDate.getDate() - 2); // Subtract 2 days from current date

    // Find tickets where the contact number matches, status is 'Open', 'In-Progress', or 'Closed',
    // and the ticket date is within the last 2 days
    const tickets = await Ticket.find({
      contactNumber: mobileNumber,
      status: { $in: ["Open", "In-Progress", "Closed"] }, // Include 'Open' status as well
      date: { $gte: twoDaysAgo } // Filter tickets with date greater than or equal to two days ago
    }).populate("issueCategory").populate("engineerId");  // Populate additional fields as needed

    if (tickets.length === 0) {
      return res.status(404).json({ message: "No tickets found for this mobile number in the last 2 days." });
    }

    // Return the tickets
    res.status(200).json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.get('/ticketsByCompany', async (req, res) => {
  try {
    const { companyName, startDate, endDate } = req.query;

    // Validate the input
    if (!companyName) {
      return res.status(400).json({ error: "Company name is required" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start date and end date are required" });
    }

    // Parse the start and end dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate the date format and range
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format. Please use YYYY-MM-DD." });
    }

    if (start > end) {
      return res.status(400).json({ error: "Start date cannot be later than end date." });
    }

    // Fetch tickets for the given company within the selected date range
    const tickets = await Ticket.find({
      companyName,
      date: {
        $gte: start,  // Tickets from the start date
        $lte: end,    // Tickets until the end date
      },
    });

    if (!tickets || tickets.length === 0) {
      return res.status(404).json({ message: `No tickets found for the company '${companyName}' in the date range ${startDate} to ${endDate}` });
    }

    // Calculate statistics for the tickets
    const totalTickets = tickets.length;
    const totalClosedTickets = tickets.filter(ticket => ticket.status === 'Closed').length;

    // Define the categories to calculate their counts
    const issueCategories = ['CCTV', 'Access Control', 'Fire Alarm System'];

    let totalCategoryCount = 0;
    const categoryCounts = {};

    for (const category of issueCategories) {
      const categoryDoc = await IssueCategory.findOne({ name: category }).select('_id');
      const count = await Ticket.countDocuments({
        companyName,
        issueCategory: categoryDoc._id,
        date: { $gte: start, $lte: end }
      });
      categoryCounts[category] = count;
      totalCategoryCount += count;
    }

    // Calculate "Others" category count by subtracting the sum of predefined categories from total tickets
    categoryCounts['Others'] = totalTickets - totalCategoryCount;

    // Function to calculate ETA for a specific issue category
    const calculateETAsForCategory = (categoryName) => {
      return tickets.filter(ticket => 
        ticket.status === 'Closed' && ticket.issueCategory.toString() === categoryName
      ).map(ticket => {
        // If ETA is invalid (undefined, null, or empty), treat it as 0
        if (!ticket.eta || ticket.eta.totalHours === undefined || ticket.eta.totalHours === null) {
          return { totalHours: 0, totalDays: 0, exceeds24Hours: false };
        }
        return ticket.eta; // Return the valid ETA if available
      });
    };

    // Get the category IDs for Access Control, Fire Alarm System, and CCTV
    const accessControlCategory = await IssueCategory.findOne({ name: 'Access Control' }).select('_id');
    const fireAlarmCategory = await IssueCategory.findOne({ name: 'Fire Alarm System' }).select('_id');
    const cctvCategory = await IssueCategory.findOne({ name: 'CCTV' }).select('_id');

    if (!accessControlCategory || !fireAlarmCategory || !cctvCategory) {
      return res.status(404).json({ message: "One or more categories not found" });
    }

    // Get all closed tickets for CCTV, Access Control, Fire Alarm System, and "Others"
    const cctvETAs = calculateETAsForCategory(cctvCategory._id.toString());
    const accessControlETAs = calculateETAsForCategory(accessControlCategory._id.toString());
    const fireAlarmETAs = calculateETAsForCategory(fireAlarmCategory._id.toString());

    // Get the "Others" tickets (tickets that don't belong to any of the predefined categories)
    const othersETAs = tickets.filter(ticket => {
      return ticket.status === 'Closed' &&
        ![cctvCategory._id.toString(), accessControlCategory._id.toString(), fireAlarmCategory._id.toString()]
          .includes(ticket.issueCategory.toString());
    }).map(ticket => {
      // If ETA is invalid (undefined, null, or empty), treat it as 0
      if (!ticket.eta || ticket.eta.totalHours === undefined || ticket.eta.totalHours === null) {
        return { totalHours: 0, totalDays: 0, exceeds24Hours: false };
      }
      return ticket.eta; // Return the valid ETA if available
    });

    // Function to calculate the average ETA for a given list of ETAs
    const calculateAverageETA = (etas) => {
      const totalHours = etas.reduce((acc, eta) => acc + eta.totalHours, 0);
      return etas.length > 0 ? totalHours / etas.length : 0; // Avoid division by zero
    };

    // Calculate average ETA for each category
    const averageCctvETA = calculateAverageETA(cctvETAs);
    const averageAccessControlETA = calculateAverageETA(accessControlETAs);
    const averageFireAlarmETA = calculateAverageETA(fireAlarmETAs);
    const averageOthersETA = calculateAverageETA(othersETAs);

    // Calculate Monthly ETA: Combine all ETAs and calculate the overall average
    const allETAs = [...cctvETAs, ...accessControlETAs, ...fireAlarmETAs, ...othersETAs];
    const monthlyETAHours = allETAs.reduce((acc, eta) => acc + eta.totalHours, 0);
    const monthlyETA = totalClosedTickets > 0 ? monthlyETAHours / totalClosedTickets : 0;

    // Prepare the response data with only the required details
    const response = {
      totalTickets,
      totalClosedTickets,
      categoryCounts,
      cctvETAs,  // CCTV ETA details
      averageCctvETA,  // Average ETA for CCTV
      accessControlETAs, // Access Control ETA details
      averageAccessControlETA, // Average ETA for Access Control
      fireAlarmETAs, // Fire Alarm ETA details
      averageFireAlarmETA, // Average ETA for Fire Alarm System
      othersETAs, // Others ETA details
      othersETACount: othersETAs.length, // Count of "Others" ETAs
      averageOthersETA, // Average ETA for Others
      monthlyETA, // Overall Monthly ETA
      dateRange: { startDate, endDate } // Include the selected date range in the response
    };

    // Send the response
    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while fetching the ticket details." });
  }
});




  // Routes for Companies
  app.get("/companies", async (req, res) => {
    try {
      const companies = await Company.find();
      res.json(companies);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  //mk 

  //Search company by it's name
  app.get("/companies/:name", async (req, res) => {
  const companyName = req.params.name; // Retrieve company name from the URL parameter
  try {
    const company = await Company.findOne({ name: companyName }); // Find the company by name
    if (!company) {
      return res.status(404).json({ message: "Company not found" }); // If no company is found
    }
    res.json(company); // Return company details
  } catch (err) {
    res.status(500).send(err.message); // Handle any errors
  }
});

  // Route to fetch operators based on companyName
app.get("/operators/:companyName", async (req, res) => {
  const { companyName } = req.params;  // Get companyName from URL parameter
  
  try {
    // Find all operators where the companyName matches the given companyName
    const operators = await Operator.find({ companyName: companyName });

    if (operators.length === 0) {
      return res.status(404).json({ message: "No operators found for this company." });
    }

    // Return operator IDs and names
    const operatorDetails = operators.map(operator => ({
      id: operator._id,
      name: operator.operatorName,
    }));

    return res.json(operatorDetails);  // Respond with the list of operators' IDs and names
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);  // Handle server errors
  }
});

app.get("/company/:companyName/checks", async (req, res) => {
  const { companyName } = req.params;  // Get companyName from URL parameter

  try {
    // Find the company by name
    const company = await Company.findOne({ name: companyName });

    if (!company) {
      return res.status(404).json({ message: "No company found with this name." });
    }

    // Format the healthCheck and ppmCheck data to send back in the response
    const healthCheckData = {
      frequency: company.healthCheck.frequency,
      files: formatPdfData(company.healthCheck.pdf, company.healthCheck.frequency), // Format PDF data
    };

    const ppmCheckData = {
      frequency: company.ppmCheck.frequency,
      files: formatPdfData(company.ppmCheck.pdf, company.ppmCheck.frequency), // Format PDF data
    };

    // Return the data in the response
    return res.json({
      maintenanceStartDate: company.maintenanceStartDate,
      maintenanceEndDate: company.maintenanceEndDate,
      healthCheck: healthCheckData,
      ppmCheck: ppmCheckData,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });  // Handle server errors
  }
});



app.get("/companies/:id", async (req, res) => {
    try {
      const company = await Company.findById(req.params.id);
      if (!company) return res.status(404).send("Company not ");
      res.json(company);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.put("/companies/:id", async (req, res) => {
    try {
      const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!company) return res.status(404).send("Company not found");
      res.json(company);
    } catch (err) {
      res.status(400).send(err.message);
    }
  });

  app.delete("/companies/:id", async (req, res) => {
    try {
      const company = await Company.findByIdAndDelete(req.params.id);
      if (!company) return res.status(404).send("Company not found");
      res.json({ message: "Company deleted" });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Routes for Issue Categories
  app.get("/issue-categories", async (req, res) => {
    try {
      const categories = await IssueCategory.find(); // Fetch all issue categories
      res.json(categories); // Send the categories as JSON response
    } catch (err) {
      res.status(500).send(err.message); // Handle errors
    }
  });

  app.post("/issue-categories", async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required." });
    }

    try {
      const category = new IssueCategory({ name });
      const savedCategory = await category.save();
      res.status(201).json(savedCategory);
    } catch (err) {
      res.status(400).send(err.message);
    }
  });

  app.get("/issue-categories/:id", async (req, res) => {
    try {
      const category = await IssueCategory.findById(req.params.id);
      if (!category) return res.status(404).send("Issue Category not found");
      res.json(category);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.put("/issue-categories/:id", async (req, res) => {
    try {
      const category = await IssueCategory.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
      if (!category) return res.status(404).send("Issue Category not found");
      res.json(category);
    } catch (err) {
      res.status(400).send(err.message);
    }
  });

  app.delete("/issue-categories/:id", async (req, res) => {
    try {
      const category = await IssueCategory.findByIdAndDelete(req.params.id);
      if (!category) return res.status(404).send("Issue Category not found");
      res.json({ message: "Issue Category deleted" });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Routes for Operators
  app.get("/operators", async (req, res) => {
    try {
      const operators = await Operator.find();
      res.json(operators);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  // API endpoint to get all operator names and email IDs by company name
// Create the API endpoint to get operators by company name
app.get("/operators/by-company/:companyName", async (req, res) => {
  try {
    // Extract company name from the URL parameter
    const { companyName } = req.params;

    // Find the company by name
    const company = await Company.findOne({ name: companyName });

    if (!company) {
      return res.status(404).json({ message: `Company named ${companyName} not found.` });
    }

    // Find all operators belonging to this company
    const operators = await Operator.find({ companyName: companyName });

    if (operators.length === 0) {
      return res.status(404).json({ message: `No operators found for the company ${companyName}.` });
    }

    // Return operator details: name and email
    const operatorDetails = operators.map(operator => ({
      operatorName: operator.operatorName,
      email: operator.email,
    }));

    res.status(200).json({ operatorDetails });
  } catch (err) {
    res.status(500).json({ message: `Error retrieving operators: ${err.message}` });
  }
});

  app.post("/operators", async (req, res) => {
    const { title, operatorName, email, companyName } = req.body;

    if (!title || !operatorName || !email || !companyName) {
      return res.status(400).json({
        error: "Title, operatorName, email, and companyName are required.",
      });
    }

    try {
      const operator = new Operator(req.body);
      const savedOperator = await operator.save();
      res.status(201).json(savedOperator);
    } catch (err) {
      res.status(400).send(err.message);
    }
  });

  app.get("/operators/:id", async (req, res) => {
    try {
      const operator = await Operator.findById(req.params.id);
      if (!operator) return res.status(404).send("Operator not found");
      res.json(operator);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.put("/operators/:id", async (req, res) => {
    try {
      const operator = await Operator.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!operator) return res.status(404).send("Operator not found");
      res.json(operator);
    } catch (err) {
      res.status(400).send(err.message);
    }
  });

  app.delete("/operators/:id", async (req, res) => {
    try {
      const operator = await Operator.findByIdAndDelete(req.params.id);
      if (!operator) return res.status(404).send("Operator not found");
      res.json({ message: "Operator deleted" });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  //Route to add operator manager
  // Add manager endpoint
  app.post("/operators/mobile/:mobile/managers", async (req, res) => {
    const { mobile } = req.params;
    const { name, email, designation, contactNumber } = req.body; // Add contactNumber

    // Validate input
    if (!name || !email || !designation || !contactNumber) { // Validate contactNumber
      return res.status(400).json({
        error: "Name, email, designation, and contact number are required.",
      });
    }

    try {
      // Find the operator by mobile number
      const operator = await Operator.findOne({ mobile });
      if (!operator) {
        return res.status(404).json({ error: "No operator found with this mobile number." });
      }

      // Check if the operator already has 5 managers
      if (operator.managers && operator.managers.length >= 5) {
        return res.status(400).json({ error: "Cannot add more than 5 managers." });
      }

      // Add the manager
      const newManager = { name, email, designation, contactNumber }; // Include contactNumber
      if (!operator.managers) {
        operator.managers = []; // Initialize if it doesn't exist
      }
      operator.managers.push(newManager);
      
      // Save the operator with the new manager
      const updatedOperator = await operator.save();
      res.status(201).json(updatedOperator);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  //Get manager email user based

  app.get("/operators/mobile/:mobile", async (req, res) => {
    const { mobile } = req.params;

    try {
      // Find the operator by mobile number
      const operator = await Operator.findOne({ mobile }).populate('managers'); // Assuming managers are referenced

      if (!operator) {
        return res.status(404).json({ error: "No operator found with this mobile number." });
      }

      // Respond with the operator details
      res.status(200).json(operator);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  ///Delte manager
  app.delete("/operators/mobile/:mobile/managers/:managerMobile", async (req, res) => {
    const { mobile } = req.params; // Operator's mobile number
    const { managerMobile } = req.params; // Manager's mobile number

    try {
      // Find the operator by mobile number
      const operator = await Operator.findOne({ mobile });
      if (!operator) {
        return res.status(404).json({ error: "No operator found with this mobile number." });
      }

      // Filter out the manager with the specified mobile number
      const initialLength = operator.managers.length;
      operator.managers = operator.managers.filter(manager => manager.contactNumber !== managerMobile);

      // Check if a manager was deleted
      if (operator.managers.length === initialLength) {
        return res.status(404).json({ error: "Manager not found." });
      }

      // Save the updated operator
      const updatedOperator = await operator.save();
      res.status(200).json(updatedOperator);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  //edit manager deatils
  app.put("/operators/mobile/:mobile/managers/:managerMobile", async (req, res) => {
    const { mobile } = req.params; // Operator's mobile number
    const { managerMobile } = req.params; // Manager's mobile number
    const { name, email, contactNumber, designation } = req.body; // New manager details from the request body

    try {
      // Find the operator by mobile number
      const operator = await Operator.findOne({ mobile });
      if (!operator) {
        return res.status(404).json({ error: "No operator found with this mobile number." });
      }

      // Find the manager by mobile number
      const managerIndex = operator.managers.findIndex(manager => manager.contactNumber === managerMobile);
      if (managerIndex === -1) {
        return res.status(404).json({ error: "Manager not found with this mobile number." });
      }

      // Update manager details
      operator.managers[managerIndex] = {
        ...operator.managers[managerIndex], // Keep the old fields
        name: name || operator.managers[managerIndex].name,
        email: email || operator.managers[managerIndex].email,
        contactNumber: contactNumber || operator.managers[managerIndex].contactNumber,
        designation: designation || operator.managers[managerIndex].designation
      };

      // Save the updated operator
      const updatedOperator = await operator.save();
      res.status(200).json(updatedOperator);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });




  // Route to get an operator by mobile number with selected fields
  app.get("/operators/mobile/:mobile", async (req, res) => {
    try {
      // Find operator by mobile number and select only specific fields
      const operator = await Operator.findOne({
        mobile: req.params.mobile,
      }).select("operatorName email companyName mobile");

      if (!operator) return res.status(404).send("Operator not found");
      res.json(operator);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Routes for Engineers
  app.get("/engineers", async (req, res) => {
    try {
      const engineers = await Engineer.find();
      res.json(engineers);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.post("/engineers", async (req, res) => {
    const { title, name, email } = req.body;

    if (!title || !name || !email) {
      return res
        .status(400)
        .json({ error: "Title, name, and email are required." });
    }

    try {
      const engineer = new Engineer(req.body);
      const savedEngineer = await engineer.save();
      res.status(201).json(savedEngineer);
    } catch (err) {
      res.status(400).send(err.message);
    }
  });
  app.get("/engineers/names-and-mobile", async (req, res) => {
    try {
      const engineers = await Engineer.find({}, "name mobile"); // Only fetch name and mobile
      res.json(engineers);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  app.get("/engineers/:id", async (req, res) => {
    try {
      const engineer = await Engineer.findById(req.params.id);
      if (!engineer) return res.status(404).send("Engineer not found");
      res.json(engineer);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.put("/engineers/:id", async (req, res) => {
    try {
      const engineer = await Engineer.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!engineer) return res.status(404).send("Engineer not found");
      res.json(engineer);
    } catch (err) {
      res.status(400).send(err.message);
    }
  });

  app.delete("/engineers/:id", async (req, res) => {
    try {
      const engineer = await Engineer.findByIdAndDelete(req.params.id);
      if (!engineer) return res.status(404).send("Engineer not found");
      res.json({ message: "Engineer deleted" });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Route to handle ticket submissions
  app.post("/submit-ticket", upload.single("image"), async (req, res) => {
    const {
      name,
      companyName,
      contactNumber,
      issueCategory,
      description,
      email,
      date,
      time,
      ticketNumber,
      managerEmails, // Extract managerEmails from request body
    } = req.body;

    const image = req.file ? req.file.path : null;

    // Parse managerEmails if it's an array
    const parsedManagerEmails = Array.isArray(managerEmails)
      ? managerEmails.map(({ email, name, designation }) => ({
          email,
          name,
          designation,
        }))
      : [];

    try {
      const newTicket = new Ticket({
        name,
        contactNumber,
        email,
        companyName,
        issueCategory,
        description,
        image,
        date,
        time,
        ticketId: ticketNumber,
        managerEmails: parsedManagerEmails, // Include managerEmails in the ticket
      });

      const savedTicket = await newTicket.save();

      res.status(201).json({
        message: "Ticket submitted successfully",
        ticket: savedTicket, // This will now include manager emails
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error submitting ticket", error: error.message });
    }
  });

  // Route to create a new ticket
  app.post("/tickets", async (req, res) => {
    const {
      name,
      contactNumber,
      email,
      companyName,
      issueCategory,
      description,
      ticketId,
      date,
      time,
    } = req.body;

    try {
      const newTicket = new Ticket({
        name,
        contactNumber,
        email,
        companyName,
        issueCategory,
        description,
        ticketId,
        date,
        time,
      });

      const savedTicket = await newTicket.save();
      res.status(201).json({
        message: "Ticket created successfully",
        ticket: savedTicket,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating ticket", error: error.message });
    }
  });

  // Route to send OTP
  app.post("/send-otp", async (req, res) => {
    const { mobile_no, otp } = req.body;

    if (!mobile_no || !otp) {
      return res.status(400).send("Mobile number and OTP are required");
    }

    try {
      // Check if there is an operator with the provided mobile number
      const operator = await Operator.findOne({ mobile: mobile_no });

      if (operator) {
        // Mobile number exists in the Operator collection, proceed with sending OTP
        const response = await axios.get(
          `${process.env.SOLUTIONS_INFINI_API_URL}`,
          {
            params: {
              api_key: process.env.SOLUTIONS_INFINI_API_KEY,
              method: "dial.click2call",
              caller: mobile_no,
              receiver: "ivr:250142",
              format: "json",
              meta: JSON.stringify({ OTP: otp }),
            },
          }
        );
        res.send(response.data);
      } else {
        // Mobile number does not exist in the Operator collection
        res.status(400).send("No account associated with this number");
      }
    } catch (error) {
      console.error("Error sending OTP:", error.message);
      res.status(500).send("Error sending OTP");
    }
  });

  // Route to get the ticket summary
  app.get("/ticket-summary", async (req, res) => {
    try {
      // Retrieve tickets with only the needed fields: ticketId, issueCategory, date
      const tickets = await Ticket.find({}, "ticketId issueCategory date")
        .populate("issueCategory", "name")
        .exec();

      // Map tickets to the desired format
      const ticketSummary = tickets.map((ticket) => ({
        ticketNo: ticket.ticketId,
        issueCategory: ticket.issueCategory ? ticket.issueCategory.name : "N/A",
        createdDate: ticket.date,
      }));

      res.json(ticketSummary);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  // Route to get the count of open tickets
  app.get("/ticket-count", async (req, res) => {
    try {
      const openTicketsCount = await Ticket.countDocuments({
        /* Your criteria for open tickets */
      });
      res.json({ openTickets: openTicketsCount });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Route to get operator details by mobile number
  app.get("/operators/details/:mobileNumber", async (req, res) => {
    try {
      const { mobileNumber } = req.params;
      const operator = await Operator.findOne({ mobile: mobileNumber });

      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }

      res.json(operator);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  // Route to update operator details excluding company name
  app.put("/operators/update/:mobileNumber", async (req, res) => {
    const { mobileNumber } = req.params;
    const { title, operatorName, email, contractType, managerName } = req.body;

    try {
      // Find the operator by mobile number
      const operator = await Operator.findOne({ mobile: mobileNumber });

      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }

      // Update only the fields that can be changed
      operator.title = title !== undefined ? title : operator.title;
      operator.operatorName =
        operatorName !== undefined ? operatorName : operator.operatorName;
      operator.email = email !== undefined ? email : operator.email;
      operator.contractType =
        contractType !== undefined ? contractType : operator.contractType;
      operator.managerName =
        managerName !== undefined ? managerName : operator.managerName;

      // Save the updated operator details
      const updatedOperator = await operator.save();

      res.json(updatedOperator);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  // Route to get tickets by user's mobile number
  app.get("/tickets/mobile/:mobileNumber", async (req, res) => {
  const { mobileNumber } = req.params;

  try {
    // Find the operator by mobile number
    const operator = await Operator.findOne({ mobile: mobileNumber });

    if (!operator) {
      return res.status(404).json({ message: "Operator not found" });
    }

    // Fetch tickets associated with the operator that are either 'Open' or 'In-Progress'
    const tickets = await Ticket.find({
      contactNumber: operator.mobile,
      status: { $in: ["Open", "In-Progress"] }, // Filter for 'Open' or 'In-Progress' statuses
    })
      .populate("issueCategory", "name") // Populate issue category
      .exec();

    // Map to extract only the required fields, including 'status' and 'time'
    const simplifiedTickets = tickets.map((ticket) => ({
      ticketNo: ticket.ticketId, // Use ticketId as ticket number
      issueCategory: ticket.issueCategory ? ticket.issueCategory.name : "N/A", // Get issue category name
      createdDate: ticket.date, // Use date as created date
      issueDescription: ticket.description || "N/A", // Add issue description
      time: ticket.time || "N/A", // Add time
      status: ticket.status, // Add status field
    }));

    res.json(simplifiedTickets);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


  app.get("/tickets/mobile/:mobileNumber/closed", async (req, res) => {
    const { mobileNumber } = req.params;

    try {
      // Find the operator by mobile number
      const operator = await Operator.findOne({ mobile: mobileNumber });

      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }

      // Fetch tickets associated with the operator that are closed
      const tickets = await Ticket.find({
        contactNumber: operator.mobile,
        status: "Closed", // Only fetch tickets with status 'Closed'
      })
        .populate("issueCategory", "name") // Populate issue category
        .exec();

      // Map to extract only the required fields
      const simplifiedTickets = tickets.map((ticket) => ({
        ticketNo: ticket.ticketId, // Use ticketId as ticket number
        issueCategory: ticket.issueCategory ? ticket.issueCategory.name : "N/A", // Get issue category name
        createdDate: ticket.date, // Use date as created date
        issueDescription: ticket.description || "N/A", // Add issue description
        time: ticket.time || "N/A", // Add time
      }));

      res.json(simplifiedTickets);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Route to get the count of open tickets by mobile number
  app.get("/open-ticket-count", async (req, res) => {
    const mobileNumber = req.query.mobile; // Get mobile number from query params
    if (!mobileNumber) {
      return res.status(400).send("Mobile number is required");
    }

    try {
      const openTicketsCount = await Ticket.countDocuments({
        mobile: mobileNumber, // Assuming your Ticket schema has a mobile field
        status: "open", // Filter by status if necessary
      });
      res.json({ openTickets: openTicketsCount });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  // Route to get the count of tickets by mobile number
  app.get("/tickets/count/:mobileNumber", async (req, res) => {
    const { mobileNumber } = req.params;

    try {
      // Count tickets associated with the provided mobile number
      const ticketCount = await Ticket.countDocuments({
        contactNumber: mobileNumber,
      });

      res.json({ mobileNumber, ticketCount });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  // Route to get all tickets with selected details
  app.get("/tickets", async (req, res) => {
    try {
      // Fetch all tickets and populate the issueCategory field
      const tickets = await Ticket.find()
        .populate("issueCategory", "name") // Get issue category name
        .exec();

      // Map tickets to the desired format
      const ticketDetails = tickets.map((ticket) => ({
        ticketNo: ticket.ticketId, // Ticket ID
        name: ticket.name, // Name of the ticket owner
        companyName: ticket.companyName, // Company name
        issueCategory: ticket.issueCategory ? ticket.issueCategory.name : "N/A", // Issue category name
        date: ticket.date, // Date of ticket creation
      }));

      res.json(ticketDetails);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  // Route to get ticket details by ticket ID
  app.get("/ticket-details/:ticketId", async (req, res) => {
    const { ticketId } = req.params;

    try {
      // Fetch the ticket by ID, populate issueCategory and engineer (if available)
      const ticket = await Ticket.findOne({ ticketId })
        .populate("issueCategory", "name")
        .populate("engineerId", "name")  // Assuming engineerId is a reference to an Engineer schema
        .select(
          "name contactNumber email companyName issueCategory description ticketId resolution preventiveAction warrantyCategory status date time engineerId closeDate closeTime eta" // Include eta
        );

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Function to format the date (without time)
      const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      };

      // Use the time field directly from the database if it's available
      const { date, time, engineerId, closeDate, eta } = ticket;

      // Prepare the ticket details response
      const ticketDetails = {
        ticketId: ticket.ticketId,
        name: ticket.name,
        contactNumber: ticket.contactNumber,
        email: ticket.email,
        companyName: ticket.companyName,
        issueCategory: ticket.issueCategory ? ticket.issueCategory.name : "N/A",
        issueDescription: ticket.description,
        resolution: ticket.resolution,
        preventiveAction: ticket.preventiveAction,
        warrantyCategory: ticket.warrantyCategory,
        status: ticket.status,
        date: formatDate(date),  // Format date as "DD-MMM-YYYY"
        time: time || "N/A",      // Use the 'time' field if available, otherwise "N/A"
        engineerName: engineerId ? engineerId.name : "N/A", // Fetch engineer name
        closeDate: closeDate ? formatDate(closeDate) : "N/A",  // Format the closeDate if it exists
        eta: eta ? {
          totalHours: eta.totalHours || "N/A",
          totalDays: eta.totalDays || "N/A",
          exceeds24Hours: eta.exceeds24Hours !== undefined ? eta.exceeds24Hours : "N/A"
        } : "N/A"  // If eta exists, return the data, otherwise return "N/A"
      };

      res.json(ticketDetails);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });




  //NEWLY ADDED ALL DETAILS
  app.get("/ticket-details-with-all-fields/:ticketId", async (req, res) => {
    const { ticketId } = req.params;

    try {
      // Fetch the ticket by ID and populate any necessary fields
      const ticket = await Ticket.findOne({ ticketId })
        .populate("issueCategory", "name")  // Assuming 'issueCategory' is a reference and you want the 'name' field
        .exec();

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Return all ticket details directly from the database (no custom formatting)
      res.json(ticket); // This will return all fields of the ticket document as stored in the database
    } catch (err) {
      console.error("Error:", err.message);
      res.status(500).send(err.message);
    }
  });



  // Route to close a ticket
  app.put("/tickets/close/:ticketId", async (req, res) => {
    const { ticketId } = req.params;
    const { closeDate, closeTime, createdDate, createdTime, resolution, preventiveAction, warrantyCategory, engineerName } = req.body;

    const formattedCloseDate = moment(closeDate, "YYYY-MM-DD").format("YYYY-MM-DD");
    const formattedCloseTime = moment(closeTime, "HH:mm").format("HH:mm");

    try {
      const ticket = await Ticket.findOne({ ticketId: ticketId });
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });

      // Validate and prepare the created date-time
      const createdDateTimeString = `${createdDate.split("T")[0]}T${createdTime}:00.000Z`;
      const createdDateTime = new Date(createdDateTimeString);

      if (isNaN(createdDateTime.getTime())) {
        return res.status(400).json({ message: "Invalid created date or time" });
      }

      // Find the engineer by name (this assumes you have an Engineer collection)
      const engineer = await Engineer.findOne({ name: engineerName });
      if (!engineer) {
        return res.status(404).json({ message: "Engineer not found" });
      }

      // Set the ETA fields (you can adjust this logic to use some other calculation if needed)
      const eta = {
        totalHours: 0, // Default value
        totalDays: 0,  // Default value
        exceeds24Hours: false,  // Default to false
      };

      console.log("Keeping ETA as is:", eta);

      // Prepare the update object, including the new fields if provided
      const update = {
        status: "Closed",
        closeDate: formattedCloseDate,
        closeTime: formattedCloseTime,
        "eta.totalHours": eta.totalHours,
        "eta.totalDays": eta.totalDays,
        "eta.exceeds24Hours": eta.exceeds24Hours,
        resolution: resolution || ticket.resolution,  // If no new resolution, retain old one
        preventiveAction: preventiveAction || ticket.preventiveAction,  // If no new preventiveAction, retain old one
        warrantyCategory: warrantyCategory || ticket.warrantyCategory,  // If no new warrantyCategory, retain old one
        engineerId: engineer._id,  // Store the engineer's _id instead of the name
        engineerName: engineer.name,  // Add engineer's name if you want to store it too
      };

      // Update the ticket with the new values
      await Ticket.updateOne({ ticketId: ticketId }, { $set: update });

      // Fetch the updated ticket after the changes
      const ticketAfterUpdate = await Ticket.findOne({ ticketId: ticketId });
      console.log("Ticket after update:", ticketAfterUpdate);

      // Return the updated ticket as a response
      res.json({
        message: "Ticket marked as closed successfully",
        ticket: ticketAfterUpdate,
      });
    } catch (err) {
      console.error("Error updating ticket:", err);
      res.status(500).send(err.message);
    }
  });
  //Route to in-progress 
  app.put("/tickets/in-progress/:ticketId", async (req, res) => {
  const { ticketId } = req.params;
  const { engineerName } = req.body;  // We only need the engineerName to update when status is In-Progress

  try {
    const ticket = await Ticket.findOne({ ticketId: ticketId });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Check if engineerName is provided in the request
    if (!engineerName) {
      return res.status(400).json({ message: "Engineer name is required" });
    }

    // Find the engineer by name (assuming you have an Engineer collection)
    const engineer = await Engineer.findOne({ name: engineerName });
    if (!engineer) {
      return res.status(404).json({ message: "Engineer not found" });
    }

    // Prepare the update object with status as "In-Progress" and engineer name
    const update = {
      status: "In-Progress",          // Set the status to "In-Progress"
      engineerName: engineer.name,    // Set the engineer's name
      engineerId: engineer._id,       // Store engineer's _id for reference
    };

    // Update the ticket with the new status and engineer name
    await Ticket.updateOne({ ticketId: ticketId }, { $set: update });

    // Fetch the updated ticket after the changes
    const updatedTicket = await Ticket.findOne({ ticketId: ticketId });

    // Return the updated ticket as a response
    res.json({
      message: "Ticket status set to 'In-Progress' and engineer updated successfully",
      ticket: updatedTicket,
    });
  } catch (err) {
    console.error("Error updating ticket:", err);
    res.status(500).send(err.message);
  }
});

  // Route to get all open tickets
app.get("/tickets/open", async (req, res) => {
  try {
    // Fetch all tickets where status is either 'Open' or 'In-Progress'
    const openInProgressTickets = await Ticket.find({ status: { $in: ["Open", "In-Progress"] } })
      .populate("issueCategory", "name") // Optionally populate the issue category
      .exec();

    // Map to extract only the required fields, including 'status' and 'time'
    const ticketDetails = openInProgressTickets.map((ticket) => ({
      ticketNo: ticket.ticketId,
      name: ticket.name,
      companyName: ticket.companyName,
      issueCategory: ticket.issueCategory ? ticket.issueCategory.name : "N/A",
      date: ticket.date,
      description: ticket.description,
      time: ticket.time, // Adding the 'time' field to the response
      status: ticket.status, // Adding the 'status' field to the response
    }));

    res.json(ticketDetails);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


  // Endpoint to get closed tickets
  app.get("/tickets/closed", async (req, res) => {
    try {
      // Fetch all tickets where status is 'Closed'
      const closedTickets = await Ticket.find({ status: "Closed" })
        .populate("issueCategory", "name") // Optionally populate the issue category
        .exec();

      // Map to extract only the required fields
      const ticketDetails = closedTickets.map((ticket) => ({
        ticketNo: ticket.ticketId,
        name: ticket.name,
        companyName: ticket.companyName,
        issueCategory: ticket.issueCategory ? ticket.issueCategory.name : "N/A",
        date: ticket.date,
        description: ticket.description,
      }));

      res.json(ticketDetails);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });


  ///ALLL WHATSAPP MESSAGE APIS

  // New route to send WhatsApp message dynamically create ticket
  app.post("/send-whatsapp-message", async (req, res) => {
    const { to, name, ticketId } = req.body; // Accept to, name, and ticketId from the request body

    try {
      // Debugging step: Log the parameters
      console.log("Parameters received:", { name, ticketId });

      // Check if parameters are defined
      if (!name || !ticketId) {
        return res.status(400).json({
          message: "Missing required parameters (name or ticketId)",
        });
      }

      // Add the predefined phone number (9560005265) to the list of recipients
      const predefinedNumber = "+919560005265"; // Predefined phone number

      // Combine the dynamic 'to' number and the predefined number into a comma-separated string
      const recipients = to ? `${to},${predefinedNumber}` : predefinedNumber; 

      // Create form data
      const formData = new FormData();
      formData.append("type", "mediatemplate"); // Message type
      formData.append("template_name", "deskassureticketcreate"); // Template name
      formData.append("channel", "whatsapp"); // Channel type
      formData.append("from", process.env.SENDER_NUMBER || "+919810866265"); // Sender number (can be from environment variable)

      // Format template parameters correctly (Comma-separated values inside quotes)
      const params = `"${name}","${ticketId}"`; // Parameters as a comma-separated string
      console.log("Params sent to Kaleyra:", params); // Debug the formatted params
      formData.append("params", params); // Send parameters as a comma-separated string

      // Optional: Adding media (file upload)
      const imagePath = path.join(__dirname, "open.jpg"); // Path to the media file
      formData.append("media", fs.createReadStream(imagePath)); // Add media to request

      // Add the comma-separated phone numbers to the "to" field
      formData.append("to", recipients); 

      // Send request using axios to Kaleyra API
      const response = await axios.post(
        "https://api.in.kaleyra.io/v1/HXIN1751096165IN/messages", // Kaleyra API endpoint
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            "api-key": process.env.KALEYRA_API_KEY || "A17d7d416a4abf01de27c9dc4107272ec", // Your API key
          },
        }
      );

      // Debugging step: Log the response from Kaleyra
      console.log(`Message sent to recipients: ${recipients}`, response.data);

      // Return success response after sending to all recipients
      res.status(200).json({
        message: "Message sent successfully to all recipients.",
        data: "Message sent to both dynamic and predefined numbers",
      });
    } catch (error) {
      // Handle error
      console.error("Error sending message:", error.response ? error.response.data : error.message);
      res.status(500).json({
        message: "Failed to send message",
        error: error.response ? error.response.data : error.message,
      });
    }
  });
  //IN-Progress API
  app.post("/send-whatsapp-inprogress", async (req, res) => {
    const { to, sal, name, ticketId, engineerName, engineerMobile } = req.body; // Accept parameters from the request body

    try {
      // Debugging step: Log the parameters
      console.log("Parameters received:", { sal, name, ticketId, engineerName, engineerMobile });

      // Check if parameters are defined
      if (!sal || !name || !ticketId || !engineerName || !engineerMobile) {
        return res.status(400).json({
          message: "Missing required parameters (sal, name, ticketId, engineerName, engineerMobile)",
        });
      }

      // Predefined phone number
      const predefinedNumber = "+919560005265"; // Predefined phone number
      
      // Combine the dynamic 'to' number, the predefined number, and the engineer's mobile number into a comma-separated string
      const recipients = [to, predefinedNumber].join(',');

      // Create form data
      const formData = new FormData();
      formData.append("to", recipients); // Use the combined recipients string
      formData.append("type", "mediatemplate"); // Message type
      formData.append("template_name", "foxnetinprogress"); // Template name
      formData.append("channel", "whatsapp"); // Channel type
      formData.append("from", process.env.SENDER_NUMBER || "+919810866265"); // Sender number (can be from environment variable)

      // Format template parameters correctly (Comma-separated values inside quotes)
      const params = `"${sal}","${name}","${ticketId}","${engineerName}","${engineerMobile}"`; 
      console.log("Params sent to Kaleyra:", params); // Debug the formatted params
      formData.append("params", params); // Send parameters as a comma-separated string

      // Optionally add a sample image from a local file (if needed)
      const imagePath = path.join(__dirname, "in_progress.jpeg"); // Assuming you have a local file named '2.png'
      formData.append("media", fs.createReadStream(imagePath)); // Add media to request

      // Send request using axios
      const response = await axios.post(
        "https://api.in.kaleyra.io/v1/HXIN1751096165IN/messages", // Kaleyra API endpoint
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            "api-key": process.env.KALEYRA_API_KEY || "A17d7d416a4abf01de27c9dc4107272ec", // Your API key
          },
        }
      );

      // Handle success
      console.log("Message sent:", response.data);
      res.status(200).json({
        message: "Message sent successfully",
        data: response.data,
      });
    } catch (error) {
      // Handle error
      console.error("Error sending message:", error.response ? error.response.data : error.message);
      res.status(500).json({
        message: "Failed to send message",
        error: error.response ? error.response.data : error.message,
      });
    }
  });

  //Closed whatsapp API
  app.post("/send-whatsapp-closed", async (req, res) => {
    const { to, sal, name, ticketId, engineerName, eta } = req.body; // Accept parameters from the request body

    try {
      // Debugging step: Log the parameters
      console.log("Parameters received:", { sal, name, ticketId, engineerName, eta });

      // Check if parameters are defined
      if (!sal || !name || !ticketId || !engineerName || !eta) {
        return res.status(400).json({
          message: "Missing required parameters (sal, name, ticketId, engineerName, eta)",
        });
      }

      // Predefined phone number
      const predefinedNumber = "+919560005265"; // Predefined phone number

      // Combine the dynamic 'to' number and the predefined number into a comma-separated string
      const recipients = [to, predefinedNumber].join(',');

      // Create form data
      const formData = new FormData();
      formData.append("to", recipients); // Use the combined recipients string
      formData.append("type", "mediatemplate"); // Message type
      formData.append("template_name", "deskassureclosticke"); // Template name for closed ticket
      formData.append("channel", "whatsapp"); // Channel type
      formData.append("from", process.env.SENDER_NUMBER || "+919810866265"); // Sender number (can be from environment variable)

      // Ensure parameters are in the correct order based on the template:
      // {{$1}} => sal (e.g., "Mr.")
      // {{$2}} => ticketId (e.g., "FS202411062409")
      // {{$3}} => engineerName (e.g., "Mark Taylor")
      // {{$4}} => eta (e.g., "2024-11-06 10:00 AM")
      // {{$5}} => name (e.g., "John Doe")

      const params = `"${sal}","${ticketId}","${engineerName}","${eta}","${name}"`; // Correct order of parameters
      console.log("Params sent to Kaleyra:", params); // Debug the formatted params
      formData.append("params", params); // Send parameters as a comma-separated string

      // Optional: Add media (image or file) if needed
      const imagePath = path.join(__dirname, "close.jpeg"); // Optional: replace with your actual media file
      formData.append("media", fs.createReadStream(imagePath)); // Add media to request

      // Send request using axios
      const response = await axios.post(
        "https://api.in.kaleyra.io/v1/HXIN1751096165IN/messages", // Kaleyra API endpoint
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            "api-key": process.env.KALEYRA_API_KEY || "A17d7d416a4abf01de27c9dc4107272ec", // Your API key
          },
        }
      );

      // Handle success
      console.log("Message sent:", response.data);
      res.status(200).json({
        message: "Closed ticket message sent successfully",
        data: response.data,
      });
    } catch (error) {
      // Handle error
      console.error("Error sending message:", error.response ? error.response.data : error.message);
      res.status(500).json({
        message: "Failed to send message",
        error: error.response ? error.response.data : error.message,
      });
    }
  });

  //assign engineer
  app.post("/send-whatsapp-assign-engineer", async (req, res) => {
    const { to, engineerName, ticketId, companyName, operatorName, operatorMobile } = req.body; // Accept parameters from the request body

    try {
      // Debugging step: Log the parameters
      console.log("Parameters received:", { engineerName, ticketId, companyName, operatorName, operatorMobile });

      // Check if parameters are defined
      if (!engineerName || !ticketId || !companyName || !operatorName || !operatorMobile) {
        return res.status(400).json({
          message: "Missing required parameters (engineerName, ticketId, companyName, operatorName, operatorMobile)",
        });
      }

      // Predefined phone number (you can adjust as needed)
      const predefinedNumber = "+919084663307"; // Predefined phone number

      // Combine the dynamic 'to' number and the predefined number into a comma-separated string
      const recipients = [to, predefinedNumber].join(',');

      // Create form data for the request
      const formData = new FormData();
      formData.append("to", recipients); // Use the combined recipients string
      formData.append("type", "mediatemplate"); // Message type
      formData.append("template_name", "assignngineer"); // Template name for the "assign engineer" message
      formData.append("channel", "whatsapp"); // Channel type
      formData.append("from", process.env.SENDER_NUMBER || "+919810866265"); // Sender number (can be from environment variable)

      // Ensure parameters are in the correct order based on the template:
      // {{$1}} => Engineer Name
      // {{$2}} => Ticket Number
      // {{$3}} => Company Name
      // {{$4}} => Operator Name
      // {{$5}} => Operator Mobile Number

      const params = `"${engineerName}","${ticketId}","${companyName}","${operatorName}","${operatorMobile}"`; // Correct order of parameters
      console.log("Params sent to Kaleyra:", params); // Debug the formatted params
      formData.append("params", params); // Send parameters as a comma-separated string

      // Optional: Add media (image or file) if needed
      const imagePath = path.join(__dirname, "4.jpeg"); // Optional: replace with your actual media file
      formData.append("media", fs.createReadStream(imagePath)); // Add media to request

      // Send request using axios to Kaleyra API
      const response = await axios.post(
        "https://api.in.kaleyra.io/v1/HXIN1751096165IN/messages", // Kaleyra API endpoint
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            "api-key": process.env.KALEYRA_API_KEY || "A17d7d416a4abf01de27c9dc4107272ec", // Your API key
          },
        }
      );

      // Handle success
      console.log("Message sent:", response.data);
      res.status(200).json({
        message: "Assign engineer message sent successfully",
        data: response.data,
      });
    } catch (error) {
      // Handle error
      console.error("Error sending message:", error.response ? error.response.data : error.message);
      res.status(500).json({
        message: "Failed to send message",
        error: error.response ? error.response.data : error.message,
      });
    }
  });


  // API to get initials based on mobile number
  app.get("/operators/initials/:mobile", async (req, res) => {
    const mobile = req.params.mobile;

    try {
      // Find the operator by mobile number
      const operator = await Operator.findOne({ mobile: mobile });

      // Check if operator exists
      if (!operator) {
        return res.status(404).json({ error: "Operator not found" });
      }

      // Split the operator name into first and last name
      const names = operator.operatorName.split(" ");
      const firstName = names[0];
      const lastName = names[names.length - 1]; // Handle last name

      // Extract the first letters
      const initials =
        firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();

      // Return the initials
      res.json({ initials });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Route to get the first two letters of the first and last names based on mobile number
  app.get("/operators/initials-two/:mobile", async (req, res) => {
    try {
      const { mobile } = req.params;

      // Find the operator by mobile number
      const operator = await Operator.findOne({ mobile });

      if (!operator) {
        return res.status(404).json({ error: "Operator not found" });
      }

      // Extract the first two letters of the first and last name
      const firstNameInitials = operator.operatorName
        .split(" ")
        .map((name) => name.slice(0, 2).toUpperCase())
        .join("");

      res.json({ initials: firstNameInitials });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Configure API key authorization
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey =  process.env.BREVO_API_KEY;; // Replace with your actual API key

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  // Email sending route
  app.post("/send-email", async (req, res) => {
    const {
      recipientEmail,
      recipientName,
      ticketId,
      issueCategory,
      issueDescription,
      managerEmails, // New field for manager emails
    } = req.body;

    // Validate request body
    if (
      !recipientEmail ||
      !recipientName ||
      !ticketId ||
      !issueCategory ||
      !issueDescription
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Log parameters for debugging
    console.log("Parameters sent:", {
      FIRSTNAME: recipientName,
      TICKET_ID: ticketId,
      ISSUE_CATEGORY: issueCategory,
      ISSUE_DESCRIPTION: issueDescription,
    });

    const emailData = {
      sender: { email: "support@foxnetglobal.com", name: "Vyomika from Foxnet" },
      to: [{ email: recipientEmail, name: recipientName }],
      cc: managerEmails.map((email) => ({ email })), // Add managers to CC
      templateId: 139, // Your template ID
      params: {
        "contact.FIRSTNAME": recipientName,
        TICKET_ID: ticketId,
        ISSUE_CATEGORY: issueCategory,
        ISSUE_DESCRIPTION: issueDescription,
      },
    };

    try {
      const response = await apiInstance.sendTransacEmail(emailData);
      return res.status(200).json({ messageId: response.messageId });
    } catch (error) {
      console.error(
        "Error sending email:",
        error.response ? error.response.body : error.message
      );
      return res.status(500).json({
        error: "Failed to send email",
        details: error.response ? error.response.body : error.message,
      });
    }
  });

  // Route to extract operator name by mobile number
  app.get("/api/operators/name/:mobile", async (req, res) => {
    const { mobile } = req.params;

    try {
      // Find operator by mobile number
      const operator = await Operator.findOne({ mobile });

      if (!operator) {
        return res.status(404).json({ error: "Operator not found" });
      }

      // Return the operator name
      res.json({ operatorName: operator.operatorName });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  // Function to determine salutation
  const SENDER_NUMBER = "+919810866265";
  const KALEYRA_API_KEY = "A17d7d416a4abf01de27c9dc4107272ec";
  const getSalutation = (name) => {
    const nameParts = name.split(" ");
    const firstName = nameParts[0];
    const isFemale = firstName.endsWith("a") || firstName.endsWith("e"); // Basic heuristic
    return isFemale ? "Mrs." : "Mr.";
  };
  //API TO SENT MESSAGE ON CLOSE TICKET
  app.post("/send-close-whatsapp-message", async (req, res) => {
    const { to, name, ticketId, engineerName, eta } = req.body;

    try {
      const salutation = getSalutation(name);

      const formData = new FormData();
      formData.append("to", to);
      formData.append("type", "mediatemplate");
      formData.append("template_name", "deskassureclosticke");
      formData.append("channel", "whatsapp");
      formData.append("from", SENDER_NUMBER);

      const params = `${salutation},${ticketId},${engineerName},${eta},${name}`;

      console.log("Params being sent:", params);
      formData.append("params", params);

      const imagePath = path.join(__dirname, "3.png");
      formData.append("media", fs.createReadStream(imagePath));

      const response = await axios.post(
        "https://api.in.kaleyra.io/v1/HXIN1751096165IN/messages",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            "api-key": KALEYRA_API_KEY,
          },
        }
      );

      console.log("Message sent:", response.data);
      res.status(200).json({
        message: "Message sent successfully",
        data: response.data,
      });
    } catch (error) {
      console.error(
        "Error sending message:",
        error.response ? error.response.data : error.message
      );
      res.status(500).json({
        message: "Failed to send message",
        error: error.response ? error.response.data : error.message,
      });
    }
  });
  //Inporgress
  app.post("/send-inprogress-whatsapp-message", async (req, res) => {
    const { to, name, ticketId, engineerName, engineerMobile } = req.body;

    // Log the received parameters for debugging
    console.log("Received parameters:", {
      to,
      name,
      ticketId,
      engineerName,
      engineerMobile,
    });

    // Check for missing parameters
    if (!to || !name || !ticketId || !engineerName || !engineerMobile) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      const salutation = getSalutation(name); // Ensure this function is defined correctly

      const formData = new FormData();
      formData.append("to", to);
      formData.append("type", "mediatemplate");
      formData.append("template_name", "foxnetinprogress"); // Ensure this template name is correct
      formData.append("channel", "whatsapp");
      formData.append("from", SENDER_NUMBER); // Ensure SENDER_NUMBER is defined

      // Constructing parameters for the message
      const params = `${salutation},${ticketId},${engineerName},${eta},${name}`;

      console.log("Params being sent:", params);
      formData.append("params", params);

      // Assuming the image path is valid and the file exists
      const imagePath = path.join(__dirname, "2.png");
      formData.append("media", fs.createReadStream(imagePath));

      const response = await axios.post(
        "https://api.in.kaleyra.io/v1/HXIN1751096165IN/messages",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            "api-key":
              process.env.KALEYRA_API_KEY || "A17d7d416a4abf01de27c9dc4107272ec", // Use environment variable for API key
          },
        }
      );

      console.log("Message sent:", response.data);
      res.status(200).json({
        message: "Message sent successfully",
        data: response.data,
      });
    } catch (error) {
      console.error(
        "Error sending message:",
        error.response ? error.response.data : error.message
      );
      res.status(500).json({
        message: "Failed to send message",
        error: error.response ? error.response.data : error.message,
      });
    }
  });
  // API to calculate ETA
  // API to calculate ETA for an existing ticket
  app.post("/tickets/calculate-eta/:ticketId", async (req, res) => {
    const { ticketId } = req.params;
    const { date, time } = req.body; // Expects date and time in the provided format

    try {
      // Combine created date and created time into a full date object
      const createdDateTime = moment(`${date}T${time}`, "YYYY-MM-DDTHH:mm").toDate();
      console.log(`Parsed createdDateTime: ${createdDateTime}`);
      

      // Validate if createdDateTime is a valid date
      if (isNaN(createdDateTime.getTime())) {
        return res.status(400).json({ message: "Invalid date or time format provided." });
      }

      // Find the ticket using ticketId
      const ticket = await Ticket.findOne({ ticketId: ticketId });

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Get current date and time
      const currentTime = new Date();
      
      // Validate if currentTime is a valid date
      if (isNaN(currentTime.getTime())) {
        return res.status(500).json({ message: "Invalid current time on server." });
      }

      // Calculate the time difference between createdDateTime and currentTime
      const differenceInMilliseconds = currentTime - createdDateTime;
      if (isNaN(differenceInMilliseconds)) {
        return res.status(500).json({ message: "Error calculating time difference." });
      }

      // Calculate total hours and days
      const totalHours = Math.floor(differenceInMilliseconds / (1000 * 60 * 60)); // Convert milliseconds to hours
      const totalDays = Math.floor(totalHours / 24); // Convert hours to days

      if (isNaN(totalHours) || isNaN(totalDays)) {
        return res.status(500).json({ message: "Error calculating ETA. Invalid values for hours or days." });
      }

      const eta = {
        totalHours: totalHours,
        totalDays: totalDays,
        exceeds24Hours: totalHours > 24,
      };

      console.log(`Calculated ETA: ${JSON.stringify(eta)}`);

      // Update the ticket with the new ETA
      ticket.eta = eta;
      await ticket.save();

      res.json({
        message: "ETA calculated and updated successfully",
        eta,
      });
    } catch (err) {
      console.error("Error:", err.message);
      res.status(500).send(err.message);
    }
  });
  //GET ETA NEW
  app.get("/tickets/get-eta/:ticketId", async (req, res) => {
    const { ticketId } = req.params; // Extract ticketId from the URL parameters

    try {
      // Find the ticket using ticketId
      const ticket = await Ticket.findOne({ ticketId: ticketId });

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Check if the ticket has ETA information
      if (!ticket.eta) {
        return res.status(404).json({ message: "ETA not calculated for this ticket" });
      }

      // Return the ETA information in the response
      return res.json({
        message: "ETA retrieved successfully",
        eta: ticket.eta, // This will return the `eta` object from the ticket
      });
    } catch (err) {
      console.error("Error:", err.message);
      res.status(500).send(err.message); // Send internal server error if something goes wrong
    }
  });

  //API to get ETA DATA
  // API to get ETA data for all tickets
  // API to get all tickets with only totalHours and totalDays in ETA
  app.get("/tickets/eta", async (req, res) => {
    try {
      const tickets = await Ticket.find({}, "ticketId eta"); // Only retrieve ticketId and eta

      if (!tickets.length) {
        return res.status(404).json({ message: "No tickets found" });
      }

      // Map tickets to include only required ETA fields
      const response = tickets.map((ticket) => ({
        ticketId: ticket.ticketId,
        totalHours: ticket.eta.totalHours,
        totalDays: ticket.eta.totalDays,
      }));

      res.json({
        message: "ETA data retrieved successfully",
        tickets: response,
      });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  //ETA by mobile number
  app.get("/tickets/eta-by-mobile/:mobileNumber", async (req, res) => {
    const { mobileNumber } = req.params;

    try {
      // Find tickets by mobile number
      const tickets = await Ticket.find(
        { contactNumber: mobileNumber },
        "ticketId eta"
      );

      if (!tickets.length) {
        return res
          .status(404)
          .json({ message: "No tickets found for this mobile number." });
      }

      // Map tickets to include only required ETA fields
      const response = tickets.map((ticket) => ({
        ticketId: ticket.ticketId,
        totalHours: ticket.eta.totalHours,
        totalDays: ticket.eta.totalDays,
      }));

      res.json({
        message: "ETA data retrieved successfully",
        tickets: response,
      });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Route to get current date/time and operator's ticket creation date/time
  app.get("/currentETA/:mobileNumber", async (req, res) => {
    const { mobileNumber } = req.params;

    try {
      // Find the operator by mobile number
      const operator = await Operator.findOne({ mobile: mobileNumber });

      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }

      // Fetch only open tickets associated with the operator
      const tickets = await Ticket.find({
        contactNumber: operator.mobile,
        status: "Open", // Filter for tickets that are marked as 'Open'
      })
        .select("date time") // Select only date and time fields
        .exec();

      // Get current date and time
      const currentDateTime = new Date();
      const currentDateISO = currentDateTime.toISOString();
      const currentTime = currentDateTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // Prepare response
      const response = {
        currentDateTime: currentDateISO, // Current date/time in ISO format
        currentTime, // Current time in "HH:mm" format
        tickets: tickets.map((ticket) => {
          const createdDateTime = new Date(ticket.date);
          const createdTime = ticket.time; // Expecting the created time in 24-hour format (e.g., "12:47")

          // Parse the created time (assuming it's a string like "12:47")
          const [createdHours, createdMinutes] = createdTime
            .split(":")
            .map(Number);
          const createdFullDateTime = new Date(createdDateTime);
          createdFullDateTime.setHours(createdHours, createdMinutes);

          // Calculate time difference
          const timeDiff = Math.abs(currentDateTime - createdFullDateTime);

          // Calculate days, hours, minutes, seconds
          const totalSeconds = Math.floor(timeDiff / 1000);
          const days = Math.floor(totalSeconds / 86400);
          const hours = Math.floor((totalSeconds % 86400) / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;

          return {
            createdDate: createdDateTime.toISOString(), // Use ISO format for createdDate
            createdTime, // Use the created time in 24-hour format
            timeDifference: {
              days,
              hours,
              minutes,
              seconds,
            },
          };
        }),
      };

      res.json(response);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Function to generate a 6-digit OTP
  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000); // Generate a random number between 100000 and 999999
  }

  // API to send OTP via WhatsApp with image using a media template
  app.post("/send-auth-whatsapp-message", async (req, res) => {
    const { to } = req.body; // Only 'to' is needed now

    // Log the received parameters for debugging
    console.log("Received parameters:", { to });

    // Check for missing 'to' field
    if (!to) {
      return res.status(400).json({ message: "Missing required field: to" });
    }

    try {
      // Log the mobile number being checked
      console.log("Checking operator with mobile number (without prefix):", to);

      // Check if there is an operator with the provided mobile number
      const operator = await Operator.findOne({ mobile: to }); // Check without +91

      if (!operator) {
        console.log("No account associated with this number:", to); // Log if no account is found
        return res
          .status(400)
          .json({ message: "No account associated with this number" });
      }

      const otp = generateOTP(); // Generate the OTP

      // Add the +91 prefix to the mobile number for sending OTP
      const formattedNumber = `+91${to}`;

      const formData = new FormData();
      formData.append("to", formattedNumber); // Recipient's phone number with country code
      formData.append("type", "mediatemplate"); // Type of the message (media template)
      formData.append("template_name", "logincode"); // Template name used for sending OTP
      formData.append("channel", "whatsapp"); // Channel type
      formData.append("from", "+919810866265"); // Sender number

      // Add OTP as the parameter for the template
      const params = otp; // Single param for OTP
      console.log("Params being sent:", params); // Logging the parameters
      formData.append("params", params); // Add params to the request

      // Add image file to the form data
      const imagePath = path.join(__dirname, "/4.jpeg"); // Adjust the image path
      formData.append("media", fs.createReadStream(imagePath)); // Add the image file to the request

      const response = await axios.post(
        "https://api.in.kaleyra.io/v1/HXIN1751096165IN/messages",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            "api-key":
              process.env.KALEYRA_API_KEY || "A17d7d416a4abf01de27c9dc4107272ec", // Use environment variable for API key
          },
        }
      );

      console.log("Message sent:", response.data); // Log the response from the API
      res.status(200).json({
        message: "Message sent successfully",
        data: response.data,
        otp: otp, // Optionally send back the OTP for debugging (consider removing in production)
      });
    } catch (error) {
      console.error(
        "Error sending message:",
        error.response ? error.response.data : error.message
      );
      res.status(500).json({
        message: "Failed to send message",
        error: error.response ? error.response.data : error.message,
      });
    }
  });

  //Api for bar chart

  app.get("/tickets/mobile/:mobileNumber/chart-count", async (req, res) => {
    const { mobileNumber } = req.params;

    try {
      const operator = await Operator.findOne({ mobile: mobileNumber });

      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }

      const tickets = await Ticket.find({
        contactNumber: operator.mobile,
      }).exec();

      const ticketCountsByMonth = {};

      tickets.forEach((ticket) => {
        const createdDate = new Date(ticket.date);
        const monthKey = createdDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });

        // Initialize the month entry if it doesn't exist
        if (!ticketCountsByMonth[monthKey]) {
          ticketCountsByMonth[monthKey] = {
            open: 0,
            closed: 0,
          };
        }

        // Increment total open count
        ticketCountsByMonth[monthKey].open++;

        // Increment closed count based on ticket status
        if (ticket.status === "Closed") {
          ticketCountsByMonth[monthKey].closed++;
        }
      });

      const result = Object.entries(ticketCountsByMonth).map(
        ([month, counts]) => ({
          month,
          openCount: counts.open,
          closedCount: counts.closed,
        })
      );

      res.json({ chartCount: result });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });



  //close count
  app.get("/tickets/mobile/:mobileNumber/closed-count", async (req, res) => {
    const { mobileNumber } = req.params;

    try {
      // Find the operator by mobile number
      const operator = await Operator.findOne({ mobile: mobileNumber });

      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }

      // Fetch all closed tickets for the operator
      const tickets = await Ticket.find({
        contactNumber: operator.mobile,
        status: "Closed",
      }).exec();

      console.log("Fetched tickets:", tickets); // Log fetched tickets

      // Group closed tickets by the close date month
      const closedCountsByMonth = {};

      tickets.forEach((ticket) => {
        // Check if closeDate exists
        const closeDateStr = ticket.closeDate; // Directly access closeDate
        console.log("Processing closeDate:", closeDateStr); // Log closeDate being processed

        // Ensure the close date is in the expected format
        if (closeDateStr) {
          const [month, day, year] = closeDateStr.split("/");
          if (month && day && year) {
            // Create a valid date format (YYYY-MM-DD)
            const closeDate = new Date(`${year}-${month}-${day}`);
            console.log("Parsed closeDate:", closeDate); // Log the parsed closeDate

            // Check if the date is valid
            if (!isNaN(closeDate)) {
              const monthKey = closeDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              });

              // Initialize count if it doesn't exist
              if (!closedCountsByMonth[monthKey]) {
                closedCountsByMonth[monthKey] = 0;
              }

              // Increment count for the respective month
              closedCountsByMonth[monthKey]++;
            } else {
              console.error(
                `Invalid date for ticket ${ticket.ticketId}: ${closeDateStr}`
              );
            }
          } else {
            console.warn(
              `Close date format is invalid for ticket ${ticket.ticketId}`
            );
          }
        } else {
          console.warn(`Missing closeDate for ticket ${ticket.ticketId}`);
        }
      });

      // Convert the object to an array for response
      const result = Object.entries(closedCountsByMonth).map(
        ([month, count]) => ({
          month,
          count,
        })
      );

      console.log("Closed counts by month:", result); // Log the final counts

      // Return the result with a "closedCount" key
      res.json({ closedCount: result });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  const categoryMap = {
    "66e2b65234e356c0c323293b": "Network Issue",
    "66e2b9f1adc4b6e1e521bd70": "Software Bug",
    "66e7f35af439981c2b850b87": "Nothing Issue",
    // Add more mappings as needed
  };

  app.get("/tickets/mobile/:mobileNumber/category-count", async (req, res) => {
    const { mobileNumber } = req.params;

    try {
      const operator = await Operator.findOne({ mobile: mobileNumber });

      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }

      const tickets = await Ticket.find({
        contactNumber: operator.mobile,
      }).exec();

      // Log ticket data to check structure
      console.log("Fetched tickets:", tickets);

      // Define the predefined categories and their IDs
      const predefinedCategoryIds = [
        //For local host
        '67346d9243432902f964ef0e', // Access Control
        '67346daa43432902f964ef12', // CCTV
        '67346dc643432902f964ef18', // Fire Alarm System
        '67346de843432902f964ef20', // PA System
        //For server 
        // '67287a468d078f6a1fce74c0', // Access Control
        // '67287a528d078f6a1fce74c4', // CCTV
        // '67287a638d078f6a1fce74ca', // Fire Alarm System
        // '67287a7e8d078f6a1fce74d2', // PA System
      ];

      // Fetch all issue categories from the IssueCategory collection
      const issueCategories = await IssueCategory.find().exec();

      // Map category IDs to their names
      const categoryMap = issueCategories.reduce((map, category) => {
        map[category._id.toString()] = category.name;
        return map;
      }, {});

      const categoryCounts = {};

      // Iterate through the tickets and count categories by their ID
      tickets.forEach((ticket) => {
        let categoryId = ticket.issueCategory; // Assuming issueCategory is stored as an ObjectId (not a string)
        
        if (!categoryId) return;

        // Convert categoryId to string for comparison
        categoryId = categoryId.toString();

        console.log("Processing issueCategory ID:", categoryId);

        if (predefinedCategoryIds.includes(categoryId)) {
          // It's one of the predefined categories, use its name
          const categoryName = categoryMap[categoryId];
          
          if (!categoryCounts[categoryName]) {
            categoryCounts[categoryName] = 0;
          }
          categoryCounts[categoryName]++;
        } else {
          // If it's not a predefined category, add to 'Other'
          if (!categoryCounts['Other']) {
            categoryCounts['Other'] = 0;
          }
          categoryCounts['Other']++;
        }
      });

      // Prepare the result as an array
      const result = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
      }));

      console.log("Category counts:", result);

      // Return the result as JSON response
      res.json({ categoryCount: result });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });


  app.get("/tickets/category/:categoryName/mobile/:mobileNumber/closed", async (req, res) => {
    const { categoryName, mobileNumber } = req.params;

    try {
      // Find the operator by mobile number
      const operator = await Operator.findOne({ mobile: mobileNumber });

      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }

      // Find the issue category by name
      const issueCategory = await IssueCategory.findOne({ name: categoryName });

      if (!issueCategory) {
        return res.status(404).json({ message: "Issue category not found" });
      }

      // Fetch tickets associated with the operator and the given category that are closed
      const tickets = await Ticket.find({
        contactNumber: operator.mobile,
        status: "Closed", // Only fetch tickets with status 'Closed'
        issueCategory: issueCategory._id, // Match tickets with the selected issue category
      })
        .populate("issueCategory", "name") // Populate issue category
        .exec();

      // Map to extract only the required fields
      const simplifiedTickets = tickets.map((ticket) => ({
        ticketNo: ticket.ticketId, // Use ticketId as ticket number
        issueCategory: ticket.issueCategory ? ticket.issueCategory.name : "N/A", // Get issue category name
        createdDate: ticket.date, // Use date as created date
        issueDescription: ticket.description || "N/A", // Add issue description
        time: ticket.time || "N/A", // Add time
      }));

      res.json(simplifiedTickets);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
