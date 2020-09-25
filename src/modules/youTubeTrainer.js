import logger from "./logger"
import settings from "./settings"
import template from "./template"
import * as Tone from 'tone'

class YouTubeTrainer {
    constructor() {
        this.created = false;

        this.elements = {
            video: null,
    
            controlPanel: null,
            controlPanelForm: null,
    
            loopSwitch: null,
            loopStartInput: null,
            loopEndInput: null,
            loopSetStartLink: null,
            loopSetEndLink: null,
            loopBar: null,
    
            playbackRateInput: null
        };
    
        this.loop = {
            active: false,
            start: 0,
            end: null
        };

        this.pitchShift = {
            node: null,
            interval: 0
        };
    }
    
    create() {
        let video = document.querySelector('video.html5-main-video');

        if (video) {
            this.elements.video = video;
        }
        else {
            logger.log('No video element found, aborting create()');

            return;
        }

        this.created = true;

        this.buildControls();
        this.registerVideoEventListeners();

        this.connectAudioNodes();
    };

    connectAudioNodes() {
        var context = new AudioContext(),
            audioSource = context.createMediaElementSource(this.elements.video);

        Tone.setContext(context);

        this.pitchShift.node = new Tone.PitchShift(0);
        this.pitchShift.node.wet.value = 0; // When no pitch shifting is active it should not be mixed into the original signal, since the pitchShift node would still processes and degrades the signal

        Tone.connect(audioSource, this.pitchShift.node);
        Tone.connect(this.pitchShift.node, context.destination);
    }

    refreshPlaybackRateInput() {
        this.elements.playbackRateInput.value = this.elements.video.playbackRate;
    };

    refreshPitchShiftIntervalInput() {
        this.elements.pitchShiftIntervalInput.value = this.pitchShift.interval;
    }

    refreshLoopControlInputs() {
        var onClass = 'ytt-loop-controls__loop-switch--on';
        var offClass = 'ytt-loop-controls__loop-switch--off';

        if (this.loop.active) {
            this.elements.loopSwitch.classList.remove(offClass);
            this.elements.loopSwitch.classList.add(onClass);
        }
        else {
            this.elements.loopSwitch.classList.remove(onClass);
            this.elements.loopSwitch.classList.add(offClass);
        }

        this.elements.loopStartInput.value = this.loop.start;
        this.elements.loopEndInput.value = this.loop.end;

        // Calculate the position of loopBar overlaying the regular video progress bar
        this.elements.loopBar.style.left = this.getTimePercentage(this.loop.start) + '%';

        if (this.loop.end < this.loop.start) {
            this.elements.loopBar.style.width = '0';
        }
        else {
            this.elements.loopBar.style.width = (this.getTimePercentage(this.loop.end) - this.getTimePercentage(this.loop.start)) + '%';
        }
    };

    getTimePercentage(time) {
        return 100 / this.elements.video.duration * time;
    };

    parseFloatInput(value) {
        // Allow comma notations for user facing inputs
        if (typeof value === 'string' || value instanceof String) {
            value = value.replace(',', '.', value);
            value = parseFloat(value);
        }

        return value;
    };

    setLoopStart(time) {
        logger.log('setLoopStart called with value', time);

        time = this.parseFloatInput(time);

        if (isNaN(time)) {
            return;
        }

        logger.log('setLoopStart: Setting loop start to', time);
        this.loop.start = time;
        this.refreshLoopControlInputs();
    };

    setLoopEnd(time) {
        logger.log('setLoopEnd called with value', time);

        time = this.parseFloatInput(time);

        if (isNaN(time)) {
            return;
        }

        logger.log('setLoopEnd: Setting loop end to', time);
        this.loop.end = time;
        this.refreshLoopControlInputs();
    };

    setPlaybackRate(rate) {
        logger.log('setPlaybackRate called with value', rate);

        rate = this.parseFloatInput(rate);

        if (!rate || isNaN(rate)) {
            return;
        }

        logger.log('setPlaybackRate: Setting playback rate to', rate);
        this.elements.video.playbackRate = rate;
    };

    setPitchShiftInterval(interval) {
        logger.log('setPitchShiftInterval called with value', interval);

        interval = this.parseFloatInput(interval);

        if (isNaN(interval)) {
            return;
        }

        this.pitchShift.node.pitch = interval;

         // When no pitch shifting is active it should not be mixed into the original signal, since the pitchShift node would still processes and degrades the signal
        if (interval) {
            this.pitchShift.node.wet.value = 1;
        }
        else {
            this.pitchShift.node.wet.value = 0;
        }
    }

    toggleLoop() {
        var onClass = 'ytt-control-panel__loop-switch--on';
        var offClass = 'ytt-control-panel__loop-switch--off';

        this.loop.active = !this.loop.active;

        this.refreshLoopControlInputs();
    };

    loopHandler() {
        // Exit conditions
        if (
            !this.loop.active
            ||
            this.loop.start === null
            ||
            this.loop.end === null
            ||
            this.elements.video.currentTime < this.loop.end
        ) {
            return;
        }

        this.elements.video.currentTime = this.loop.start;

        // fastSeek only exists in Firefox
        //this.elements.video.fastSeek(this.loop.start);
    };

    registerVideoEventListeners() {
        var self = this;

        // self.elements.video.addEventListener('play', function () {
        // 	self.logger.log('Play started');
        // });
        //
        // self.elements.video.addEventListener('pause', function () {
        // 	self.logger.log('Play paused');
        // });
        //
        // self.elements.video.addEventListener('ended', function () {
        // 	self.logger.log('Play ended');
        // });

        self.elements.video.addEventListener('ratechange', function () {
            self.refreshPlaybackRateInput();
        });

        self.elements.video.addEventListener('timeupdate', function () {
            self.loopHandler();
        });
    };

    registerControlEventListeners() {
        var self = this;

        self.elements.loopSwitch.addEventListener('click', function () {
            self.toggleLoop();
        });

        self.elements.playbackRateInput.addEventListener('change', function (e) {
            self.setPlaybackRate(e.target.value);
        });

        self.elements.loopStartInput.addEventListener('change', function (e) {
            self.setLoopStart(e.target.value);
        });

        self.elements.loopEndInput.addEventListener('change', function (e) {
            self.setLoopEnd(e.target.value);
        });

        self.elements.controlPanelForm.addEventListener('submit', function (e) {
            // Just prevent the form from submitting into nothingness when someone presses enter in a input
            // At the same time this enter press will trigger the "change" event for the respective input, so nothing else has to be done here
            e.preventDefault();
        });

        self.elements.loopSetStartLink.addEventListener('click', function (e) {
            e.preventDefault();

            self.setLoopStart(self.elements.video.currentTime);
        });

        self.elements.loopSetEndLink.addEventListener('click', function (e) {
            e.preventDefault();

            self.setLoopEnd(self.elements.video.currentTime);
        });

        self.elements.pitchShiftIntervalInput.addEventListener('change', function (e) {
            self.setPitchShiftInterval(e.target.value);
        });
    };

    onYouTubePageChange() {
    };

    buildControls() {
        const self = this;

        const url = chrome.runtime.getURL('html/controls.html');
        logger.log('Fetching controls from', url);

        fetch(url)
            .then(function(response) {
                return response.text();
            })
            .then(function(html) {
                html = template(html);

                const div = document.createElement('div');
                div.innerHTML = html;

                const beforeElement = document.getElementById('info-contents');
                beforeElement.parentNode.insertBefore(div, beforeElement);

                self.elements.controlPanel = document.getElementById('ytt-control-panel');
                self.elements.controlPanelForm = document.getElementById('ytt-control-panel__form');
                self.elements.loopSwitch = document.getElementById('ytt-loop-controls__active-input');
                self.elements.loopStartInput = document.getElementById('ytt-loop-controls__start-input');
                self.elements.loopEndInput = document.getElementById('ytt-loop-controls__end-input');
                self.elements.loopSetStartLink = document.getElementById('ytt-loop-controls__set-start');
                self.elements.loopSetEndLink = document.getElementById('ytt-loop-controls__set-end');
                self.elements.playbackRateInput = document.getElementById('ytt-playback-rate-controls__playback-rate');
                self.elements.pitchShiftIntervalInput = document.getElementById('ytt-pitch-controls__pitch_shift_interval');

                self.elements.loopBar = self.createLoopBar();

                self.registerControlEventListeners();
                self.refreshPlaybackRateInput();
                self.refreshLoopControlInputs();
                self.refreshPitchShiftIntervalInput();
            });
    }

    createLoopBar() {
        var loopBar = document.createElement('div');
        loopBar.classList.add('ytt-loop-bar');

        var youtubeProgressBarList = document.querySelector('.ytp-progress-list');
        youtubeProgressBarList.appendChild(loopBar);

        return loopBar;
    }
}

export default new YouTubeTrainer();