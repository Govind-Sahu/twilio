
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// 1. Send the IVR Call
function sendIVRCall(to, personalizedMessage) {
    twilioClient.calls.create({
        to: to,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: 'https://demo.twilio.com/welcome/voice/' + encodeURIComponent(personalizedMessage),
    }).then(call => console.log(`Call initiated with SID: ${call.sid}`))
      .catch(error => console.error(`Error initiating call: ${error.message}`));
}

// 2. IVR Response Handling
app.post('/ivr', (req, res) => {
    const message = req.query.message;
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say(message);

    twiml.gather({
        numDigits: 1,
        action: '/ivr-response',
        method: 'POST',
    }).say('Press 1 if you are interested in the opportunity.');

    twiml.redirect('/ivr');

    res.type('text/xml');
    res.send(twiml.toString());
});

// 3. Handle IVR Response
app.post('/ivr-response', (req, res) => {
    const digits = req.body.Digits;
    const to = req.body.From;

    const twiml = new twilio.twiml.VoiceResponse();

    if (digits == '1') {
        twiml.say('Thank you for your interest. A personalized interview link will be sent to you via SMS.');
        
        // Send personalized interview link via SMS
        twilioClient.messages.create({
            body: `Thank you for your interest! Please join your interview at: ${process.env.INTERVIEW_LINK}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        }).then(message => console.log(`Interview link sent via SMS with SID: ${message.sid}`))
          .catch(error => console.error(`Error sending SMS: ${error.message}`));
    } else {
        twiml.say('Thank you for your time. Goodbye.');
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

// 4. Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Example usage
// Replace 'recipient_phone_number' and 'personalizedMessage' with actual values
sendIVRCall('', 'Hello, this is a call regarding an exciting opportunity.');
