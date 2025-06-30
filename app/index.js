import clock from "clock";
import { vibration } from "haptics";
import * as document from "document";
import { preferences } from "user-settings";
import { me as appbit } from "appbit";
import { display } from "display";

appbit.appTimeoutEnabled = false;

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

const SESSION_MAX = 4; // Maximum number of sessions before reset
const WORK_TIME = 25; // 25 minutes
const SHORT_BREAK = 5; // 5 minutes
const LONG_BREAK = 15; // 15 minutes
const STATE_TIMES = [WORK_TIME, SHORT_BREAK, LONG_BREAK];
const STATE_COLORS = ["#B74949", "#38858A", "#397097"];
const STATE_NAMES = ["Focus Time", "Short Break", "Long Break"];

let startTime = Date.now();
let sessionCount = 0;
let timeMissing = WORK_TIME;
let currentState = State.WORK;
let paused = true;
let timeoutId;

// Get const elements from document
const clockText = document.getElementById("clock");
const background = document.getElementById("background");
const countdown = document.getElementById("countdown");
const countdown_text = countdown.getElementById("time-left");
const countdown_progress = countdown.getElementById("progress-bar");
const pause_button = document.getElementById("pause-button");
const play_button = document.getElementById("play-button");
const skip_button = document.getElementById("skip-button");
const session_counter = document.getElementById("session-counter");
const session_counter_circles = session_counter.getElementsByClassName("fillable-circle");

positionSessionCounter();

function positionSessionCounter() {
    const circles = session_counter.getElementsByClassName("fillable-circle");
    const buffer = 10 * SESSION_MAX - 4;

    for (let i = 0; i < SESSION_MAX; i++) {
        circles[i].x = 20 * i - buffer;
        circles[i].style.visibility = "visible";
    }
}

function restartSessionCounterCircles() {
    for (let i = 0; i < SESSION_MAX; i++) {
        let inner_circle = session_counter_circles[i].getElementById("inner-circle");
        inner_circle.style.visibility = "hidden";
    }
}

function fillSessionCounterCircles(index) {
    let inner_circle = session_counter_circles[index].getElementById("inner-circle");
    inner_circle.style.visibility = "visible";
}

// Set initial state
pause_timer();

function setClockTime(date) {
    let hours = zeroPad(date.getHours());
    if (preferences.clockDisplay === "12h") {
        hours = (hours % 12) || 12; // Convert to 12-hour format
    }

    let minutes = zeroPad(date.getMinutes());
    clockText.text = `${hours}:${minutes}`;
}

// Update the clock every minute
clock.granularity = "seconds";
changeState(currentState);

function setStateColor(state) {
    const color = STATE_COLORS[state];
    background.style.fill = color;
}

function setStateName(state) {
    const current_state_text = document.getElementById("current-state");
    current_state_text.text = STATE_NAMES[state];
}

function changeState(state) {
    pause_timer();
    timeMissing = STATE_TIMES[state] * 60;
    startTime = Date.now();
    setStateColor(state);
    setStateName(state);
    updateCountdown();
}

function startNextState() {
    switch (currentState) {
        case State.WORK:
            fillSessionCounterCircles(sessionCount % SESSION_MAX);
            sessionCount++;
            if (sessionCount % SESSION_MAX === 0) {
                currentState = State.LONG_BREAK;
            } else {
                currentState = State.SHORT_BREAK;
            }
            break;
        case State.SHORT_BREAK:
        case State.LONG_BREAK:
            if (sessionCount % SESSION_MAX === 0) {
                restartSessionCounterCircles();
            }
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
    setClockTime(evt.date);
    if (!paused) {
        updateCountdown();
    }
};

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

function onTimeout() {
    display.poke();
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
    timeoutId = setTimeout(onTimeout, (timeMissing - 1) * 1000);
}