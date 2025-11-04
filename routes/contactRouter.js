const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

// 🔐 Apna Gmail aur App Password


// ✅ Route: Send Query
router.post("/sendQuery", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.send("⚠️ Please fill all fields.");
  }

  // Gmail transporter setup
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "www.grademateofficial0@gmail.com",
      pass: "azar qoxo zlky kfgr",
    },
  });

  // Mail content
  const mailOptions = {
  from: email,
  to: "www.grademateofficial0@gmail.com",
  subject: `New Business Enquiry from ${name}`,
  text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
};


  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Message sent successfully!");
    res.send("<h2>✅ Thank you! Your message has been sent successfully.</h2>");
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.send("<h2>❌ Something went wrong. Please try again later.</h2>");
  }
});

module.exports = router;
