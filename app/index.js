import clock from "clock";
import { vibration } from "haptics";
import * as document from "document";
import { preferences } from "user-settings";

function zeroPad(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

const State = {
    WORK: 0,
    SHORT_BREAK: 1,
    LONG_BREAK: 2
}

const WORK_TIME = .25; // 25 minutes
const SHORT_BREAK = 1; // 5 minutes
const LONG_BREAK = 1 //15 minutes;
const STATE_TIMES = [WORK_TIME, SHORT_BREAK, LONG_BREAK];
const STATE_COLORS = ["#B74949", "#38858A", "#397097"];

let sessionCount = 0;
let timeMissing = WORK_TIME;
let currentState = State.WORK;
let paused = true;

// Get const elements from document
const countdown = document.getElementById("countdown");
const countdown_text = countdown.getElementById("time-left");
const countdown_progress = countdown.getElementById("progress-bar");
const countdown_progress_middle = countdown.getElementById("progress-bar-middle");
const startButton = document.getElementById("startButton");


// Update the clock every minute
clock.granularity = "seconds";
changeState(currentState);

function setStateColor(state) {
    const color = STATE_COLORS[state];
    console.log("Current state color:", color);
    countdown_progress.style.fill = color;
    countdown_progress_middle.style.fill = color;
}

function changeState(state) {
    timeMissing = STATE_TIMES[state] * 60;
    paused = true;
    setStateColor(state);
}

function startNextState() {
    switch (currentState) {
        case State.WORK:
            vibration.start("alert");
            sessionCount++;
            if (sessionCount % 4 === 0) {
                currentState = State.LONG_BREAK;
            } else {
                currentState = State.SHORT_BREAK;
            }
            break;
        case State.SHORT_BREAK:
        case State.LONG_BREAK:
            currentState = State.WORK;
            vibration.start("confirmation");
            break;
    }
    changeState(currentState);
}

// Update the <text> element every tick with the current time
clock.ontick = (evt) => {
    paused = false;
    if (!paused) {
        timeMissing -= 1;
        if (timeMissing <= 0) {
            startNextState();
        }
    }

    const minutes = Math.floor(timeMissing / 60);
    const seconds = zeroPad(timeMissing % 60);
    countdown_text.text = `${minutes}:${seconds}`;

    const sweep_angle = 360 * (1 - timeMissing / (STATE_TIMES[currentState] * 60));
    countdown_progress.sweepAngle = sweep_angle;
}