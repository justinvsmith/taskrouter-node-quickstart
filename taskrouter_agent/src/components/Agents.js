import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { workersUrl } from 'twilio/lib/jwt/taskrouter/util';


const { Twilio } = require('twilio-taskrouter');
const { Worker } = require('twilio-taskrouter');

export default function Agents() {
    const config = { headers: { 'Content-Type': 'application/json' }}
    const [token, setToken] = useState('');

    useEffect(() => {
        axios.get('http://5baa-67-180-148-26.ngrok.io/agents?worker_sid=WK5736b39cfba8035d12198f52b4386973', config)
            .then(response => {
                setToken(response.data.policy);
            })
            .catch(function (error) {
                console.log(error.toJSON());
            })
    })


    const worker = new Worker(token);
    
    function registerTaskRouterCallbacks() {
        worker.on('ready', function(worker) {
            agentActivityChanged(worker.activityName);
            logger("Successfully registered as: " + worker.friendlyName)
            logger("Current activity is: " + worker.activityName);
        });

        worker.on('activity.update', function(worker) {
            agentActivityChanged(worker.activityName);
            logger("Worker activity changed to: " + worker.activityName);
        });

        worker.on("reservation.created", function(reservation) {
            logger("-----");
            logger("You have been reserved to handle a call!");
            logger("Call from: " + reservation.task.attributes.from);
            logger("Selected language: " + reservation.task.attributes.selected_language);
            logger("-----");
        });

        worker.on("reservation.accepted", function(reservation) {
            logger("Reservation " + reservation.sid + " accepted!");
        });

        worker.on("reservation.rejected", function(reservation) {
            logger("Reservation " + reservation.sid + " rejected!");
        });

        worker.on("reservation.timeout", function(reservation) {
            logger("Reservation " + reservation.sid + " timed out!");
        });

        worker.on("reservation.canceled", function(reservation) {
            logger("Reservation " + reservation.sid + " canceled!");
        });
    }

    /* Hook up the agent Activity buttons to TaskRouter.js */

    function bindAgentActivityButtons() {
        // Fetch the full list of available Activities from TaskRouter. Store each
        // ActivitySid against the matching Friendly Name
        var activitySids = {};
        worker.activities.fetch(function(error, activityList) {
            var activities = activityList.data;
            var i = activities.length;
            while (i--) {
                activitySids[activities[i].friendlyName] = activities[i].sid;
            }
        });

        /* For each button of class 'change-activity' in our Agent UI, look up the
         ActivitySid corresponding to the Friendly Name in the button’s next-activity
         data attribute. Use Worker.js to transition the agent to that ActivitySid
         when the button is clicked.*/
        var elements = document.getElementsByClassName('change-activity');
        var i = elements.length;
        while (i--) {
            elements[i].onclick = function() {
                var nextActivity = this.dataset.nextActivity;
                var nextActivitySid = activitySids[nextActivity];
                worker.update({"ActivitySid":nextActivitySid});
            }
        }
    }

    /* Update the UI to reflect a change in Activity */

    function agentActivityChanged(activity) {
        hideAgentActivities();
        showAgentActivity(activity);
    }

    function hideAgentActivities() {
        var elements = document.getElementsByClassName('agent-activity');
        var i = elements.length;
        while (i--) {
            elements[i].style.display = 'none';
        }
    }

    function showAgentActivity(activity) {
        activity = activity.toLowerCase();
        var elements = document.getElementsByClassName(('agent-activity ' + activity));
        elements.item(0).style.display = 'block';
    }

    /* Other stuff */

    function logger(message) {
        var log = document.getElementById('log');
        log.value += "\n> " + message;
        log.scrollTop = log.scrollHeight;
    }

    window.onload = function() {
        // Initialize TaskRouter.js on page load using window.workerToken -
        // a Twilio Capability token that was set from rendering the template with agents endpoint
        logger("Initializing...");
        window.worker = new Worker(token);

        registerTaskRouterCallbacks();
        bindAgentActivityButtons();
    };

    return(
        <div>
            <p id="log">Hello World!</p>
        </div>
    )
};