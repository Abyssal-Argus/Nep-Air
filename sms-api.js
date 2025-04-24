require('dotenv').config();
 const express = require('express');
 const cors = require('cors');
 const twilio = require('twilio');
 
 const app = express();
 app.use(cors());
 app.use(express.json());
 
 const client = twilio(
   process.env.TWILIO_ACCOUNT_SID,
   process.env.TWILIO_AUTH_TOKEN
 );
 
 app.post('/send-sms', async (req, res) => {
   try {
     const { toPhone, message } = req.body;
     
     const result = await client.messages.create({
       body: message,
       from: process.env.TWILIO_PHONE_NUMBER,
       to: toPhone
     });
 
     res.json({ success: true, sid: result.sid });
   } catch (error) {
     console.error('Twilio error:', error);
     res.status(500).json({ success: false, error: error.message });
   }
 });
 
 const PORT = process.env.PORT || 5001;
 app.listen(PORT, () => console.log(`SMS API running on port ${PORT}`));