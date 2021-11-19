require('dotenv').config();
const express = require('express');
const app = express();
const { urlencoded } = require('body-parser');
const urlEncoded = require('body-parser').urlencoded;

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const workspaceSid = process.env.WORKSPACE_SID;
const workflowSid = process.env.WORKFLOW_SID;

app.use(urlEncoded({ extended: false }));

app.get('/', (req, res) => {
    res.send('Hello from the server');
});

app.post('/assignment_callback', (req, res) => {
    res.send({
        status: 200,
        message: {}
    })
})

app.get('/assignment_callback', (req, res) => {
    res.send({
        status: 200,
        message: {}
    });
})

// app.post('/create_task', (req, res) => {
//     res.send({
//         message: "I like it here!"
//     })
// })

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
            res.send(task.sid)
        });
})

app.listen(8001, () => {
    console.log("Now listening on port 8001!");
})