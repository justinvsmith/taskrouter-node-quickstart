require('dotenv').config();
const express = require('express');
const app = express();
const { urlencoded } = require('body-parser');
const urlEncoded = require('body-parser').urlencoded;

const VoiceResponse = require('twilio').twiml.VoiceResponse;

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const workspaceSid = process.env.WORKSPACE_SID;
const workflowSid = process.env.WORKFLOW_SID;
const twilioNumber = process.env.TWILIO_NUMBER;
const postWorkActivitySid = process.env.POST_WORK_ACTIVITY_SID;


app.use(urlEncoded({ extended: false }));

app.get('/', (req, res) => {
    res.send('Hello from the server');
});

app.get('/assignment_callback', (req, res) => {
    res.status(200).json({"instruction" : "accept"})

})

app.post('/assignment_callback', (req, res) => {
res.status(200).json({"instruction" : "dequeue", "post_work_activity_sid": "WAae59aa1372ca9762ef87e6eccaf0f1e0", "status": 200});
})

app.post('/create_task', function (req, res) {
    client.taskrouter.workspaces(workspaceSid)
        .tasks
        .create({
            attributes: JSON.stringify({
                selected_language: "es"
            }),
            workflowSid: workflowSid
        })
        .then(task => {
            res.status(200).json({"task" : task.sid});
        });
});

app.post('/accept_reservation', (req, res) => {
    let task_sid = req.query.task_sid;
    let reservation_sid = req.query.reservation_sid;
    client.taskrouter
        .workspaces(workspaceSid)
        .tasks(task_sid)
        .reservations(reservation_sid)
        .update({
            reservationStatus: "accepted",
        })
        .then(reservation => {
            res.status(200).json({"reservation" : reservation.sid});
        });
});

app.post('/incoming_call', (req, res) => {
    let twimlResponse = new VoiceResponse();
    let gather = twimlResponse.gather({
        numDigits: 1,
        action: '/enqueue',
        method: 'POST'
    });
    gather.say('Para Español oprime el uno.');
    gather.say('For English, please hold or press any key.');
    res.type('text/xml');
    res.send(twimlResponse.toString());
});

app.post('/enqueue', (req, res) => {
    var pressedKey = req.body.Digits;
    var twimlResponse = new VoiceResponse();
    var language = (pressedKey === '1') ? 'es' : 'en';
    var enqueue = twimlResponse.enqueue(
        {workflowSid: workflowSid}
    );
    enqueue.task({}, JSON.stringify({selected_language: language}));

    res.type('application/xml');
    res.send(twimlResponse.toString());
})

app.listen(8001, () => {
    console.log("Now listening on port 8001!");
})