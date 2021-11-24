import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Twilio } from 'twilio';


// import './agent.css';


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

            registerTaskRouterCallbacks();
    })


    const worker = new Twilio.TaskRouter.worker(token);

    function registerTaskRouterCallbacks() {
        worker.on('ready', function(worker) {
           console.log(worker.sid);
        });
    }



    return(
        <div className="content">
            <section className="agent-activity offline">
                <p className="activity">Offline</p>
                <button className="change-activity" data-next-activity="Idle">Go Available</button>
            </section>
            <section className="agent-activity idle">
                <p className="activity"><span>Available</span></p>
                <button className="change-activity" data-next-activity="Offline">Go Offline</button>
            </section>
            <section className="agent-activity reserved">
                <p className="activity">Reserved</p>
            </section>
            <section className="agent-activity busy">
                <p className="activity">Busy</p>
            </section>
            <section className="agent-activity wrapup">
                <p className="activity">Wrap-Up</p>
                <button className="change-activity" data-next-activity="Idle">Go Available</button>
                <button className="change-activity" data-next-activity="Offline">Go Offline</button>
            </section>
            <section className="log">
                <textarea id="log" readOnly={true}></textarea>
            </section>
        </div>
    )
};