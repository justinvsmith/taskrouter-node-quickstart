require('dotenv').config();
const express = require('express');
const app = express();
var cors = require('cors');
const { urlencoded } = require('body-parser');
const urlEncoded = require('body-parser').urlencoded;



const VoiceResponse = require('twilio').twiml.VoiceResponse;
const taskrouter = require('twilio').jwt.taskrouter;
const ClientCapability = require('twilio/lib/jwt/ClientCapability');
const util = taskrouter.util;

const TaskRouterCapability = taskrouter.TaskRouterCapability;
const Policy = TaskRouterCapability.Policy;

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const workspaceSid = process.env.WORKSPACE_SID;
const workflowSid = process.env.WORKFLOW_SID;
const postWorkActivitySid = process.env.POST_WORK_ACTIVITY_SID;

const TASKROUTER_BASE_URL = 'https://taskrouter.twilio.com';
const version = 'v1';
const pug = require('pug');

app.set('view engine', 'pug');
app.set('views', './views');




app.use(cors(),urlEncoded({ extended: false }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index2.html');
    // res.send("Hello World!")
});

app.get('/assignment_callback', (req, res) => {
    res.status(200).json({"instruction" : "accept"})

})

app.post('/assignment_callback', (req, res) => {
res.status(200).json({
    "instruction" : "dequeue", 
    "post_work_activity_sid": postWorkActivitySid, 
    "status": 200});
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

function buildWorkspacePolicy(options) {
    options = options || {};
    let resources = options.resources || [];
    let urlComponents = [TASKROUTER_BASE_URL, version, 'Workspaces', workspaceSid]

    return new Policy({
        url: urlComponents.concat(resources).join('/'),
        method: options.method || 'GET',
        allow: true
    });
}

app.get('/agents', (req, res) => {
    let worker_sid = req.query.worker_sid;
    const worker_capability = new TaskRouterCapability({
        accountSid: accountSid,
        authToken: authToken,
        workspaceSid: workspaceSid,
        channelId: worker_sid
    });

    let eventBridgePolicies = util.defaultEventBridgePolicies(accountSid, worker_sid);

    let workerPolicies = util.defaultWorkerPolicies(version, workspaceSid, worker_sid);

    let workspacePolicies = [
        //Workspace fetch Policy
        buildWorkspacePolicy(),
        //Workspace subresources fetch Policy
        buildWorkspacePolicy({ resources: ['**'] }),
        //Workspace Activities Update Policy
        buildWorkspacePolicy({ resources: ['**'], method: 'POST' }),
        // //Workspace Activities Worker Reservations Policy
        buildWorkspacePolicy({ resources: ['Workers', worker_sid, 'Reservations', '**'], method: 'POST' }),
    ];

    eventBridgePolicies.concat(workerPolicies).concat(workspacePolicies).forEach(function (policy) {
        worker_capability.addPolicy(policy);
    });

    let token = worker_capability.toJwt();

    // res.status(200).json(token)
    
    res.status(200).render('agents.pug', {
        worker_token: token
    });    
})

app.listen(8001, () => {
    console.log("Now listening on port 8001!");
})