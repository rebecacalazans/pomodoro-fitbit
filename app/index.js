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

const WORK_TIME = .2; // 25 minutes
const SHORT_BREAK = .2; // 5 minutes
const LONG_BREAK = .2; //15 minutes;
const STATE_TIMES = [WORK_TIME, SHORT_BREAK, LONG_BREAK];
const STATE_COLORS = ["#B74949", "#38858A", "#397097"];

let startTime = Date.now();
let sessionCount = 0;
let timeMissing = WORK_TIME;
let currentState = State.WORK;
let paused = true;
let timeoutId;

// Get const elements from document
const background = document.getElementById("background");
const countdown = document.getElementById("countdown");
const countdown_text = countdown.getElementById("time-left");
const countdown_progress = countdown.getElementById("progress-bar");
const pause_button = document.getElementById("pause-button");
const play_button = document.getElementById("play-button");
const skip_button = document.getElementById("skip-button");

// Set initial state
pause_timer();

// Update the clock every minute
clock.granularity = "seconds";
changeState(currentState);

function setStateColor(state) {
    const color = STATE_COLORS[state];
    background.style.fill = color;
}

function changeState(state) {
    pause_timer();
    timeMissing = STATE_TIMES[state] * 60;
    startTime = Date.now();
    setStateColor(state);
    updateCountdown();
}

function startNextState() {
    switch (currentState) {
        case State.WORK:
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
            break;
    }
    changeState(currentState);
}

function startAlerting() {
    vibration.start("alert");
    setTimeout(() => {
        vibration.stop();
    }, 6000);
}

function endInterval() {
    startAlerting();
    startNextState();
}

// Update the <text> element every tick with the current time
clock.ontick = (evt) => {
    if (!paused) {
        updateCountdown();
    }
}

function updateCountdown() {
    let elapsedTime = (Date.now() - startTime) / 1000;
    let time = Math.round(timeMissing - elapsedTime);

    if (time <= 0) {
        endInterval();
        return;
    }

    const minutes = Math.floor(time / 60);
    const seconds = zeroPad(time % 60);
    countdown_text.text = `${minutes}:${seconds}`;

    const sweep_angle = 360 * (1 - time / (STATE_TIMES[currentState] * 60));
    countdown_progress.sweepAngle = sweep_angle;
}

// Buttons handling
play_button.addEventListener("click", (evt) => {
    continue_timer();
});

pause_button.addEventListener("click", (evt) => {
    pause_timer();
});

skip_button.addEventListener("click", (evt) => {
    console.log("Skip button pressed");
    vibration.start("confirmation-max");
    startNextState();
});

function setPaused(value) {
    if (value) {
        pause_timer();
    } else {
        continue_timer();
    }
}

function pause_timer() {
    clearTimeout(timeoutId);
    paused = true;
    play_button.style.display = "inherit";
    pause_button.style.display = "none";
    let elapsedTime = (Date.now() - startTime) / 1000;
    timeMissing -= elapsedTime;
}

function continue_timer() {
    paused = false;
    pause_button.style.display = "inherit";
    play_button.style.display = "none";
    startTime = Date.now();
    timeoutId = setTimeout(endInterval, timeMissing * 1000);
}