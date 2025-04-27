// twilioClient.js
const twilio = require('twilio');

const accountSid = 'ACaeeafaa0c9dd4f47344c9f34a69e109a'; // Your Account SID from Twilio Console
const authToken = 'ff957d96fc259f042a46c01d81445030'; // Your Auth Token from Twilio Console

const client = twilio(accountSid, authToken);

module.exports = client;