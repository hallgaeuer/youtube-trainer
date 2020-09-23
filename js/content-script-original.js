var options = {
	name: 'YouTubeTrainer'
};

var state = {
	youTubeTrainer: null
};

var localization = {
	loop: 'Loop',
	loopActive: 'Loop active',
	loopStart: 'Loop start',
	loopEnd: 'Loop end',
	loopSetStart: 'Set to now',
	loopSetEnd: 'Set to now',

	playbackRate: 'Playback rate',
	playbackRateValue: 'Value'
};

var Logger = {
	log: function() {
		// Always prepend the app name in the logging for easier identifying
		// "arguments" is not an array and must be converted to one first
		var args = Array.prototype.slice.call(arguments);
		args.unshift(options.name + ':');

		console.log(...args);
	}
};

var YouTubeTrainer = function () {
	this.logger = Logger;
	this.options = options;
	this.localization = localization;

	this.elements = {
		video: document.querySelector('video.html5-main-video'),

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

	this.init();
};

YouTubeTrainer.prototype.init = function () {
	this.buildControls();
	this.registerVideoEventListeners();
	this.registerControlEventListeners();

	this.refreshPlaybackRateInput();
	this.refreshLoopControlInputs();
};

YouTubeTrainer.prototype.refreshPlaybackRateInput = function () {
	this.elements.playbackRateInput.value = this.elements.video.playbackRate;
};

YouTubeTrainer.prototype.refreshLoopControlInputs = function () {
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

YouTubeTrainer.prototype.getTimePercentage = function(time) {
	return 100 / this.elements.video.duration * time;
};

YouTubeTrainer.prototype.parseFloatInput = function(value) {
	// Allow comma notations for user facing inputs
	if (typeof value === 'string' || value instanceof String) {
		value = value.replace(',', '.', value);
		value = parseFloat(value);
	}

	return value;
};

YouTubeTrainer.prototype.setLoopStart = function (time) {
	this.logger.log('setLoopStart called with value', time);

	time = this.parseFloatInput(time);

	if (isNaN(time)) {
		return;
	}

	this.logger.log('setLoopStart: Setting loop start to', time);
	this.loop.start = time;
	this.refreshLoopControlInputs();
};

YouTubeTrainer.prototype.setLoopEnd = function (time) {
	this.logger.log('setLoopEnd called with value', time);

	time = this.parseFloatInput(time);

	if (isNaN(time)) {
		return;
	}

	this.logger.log('setLoopEnd: Setting loop end to', time);
	this.loop.end = time;
	this.refreshLoopControlInputs();
};

YouTubeTrainer.prototype.setPlaybackRate = function(rate) {
	this.logger.log('setPlaybackRate called with value', rate);

	rate = this.parseFloatInput(rate);

	if (!rate || isNaN(rate)) {
		return;
	}

	this.logger.log('setPlaybackRate: Setting playback rate to', rate);
	this.elements.video.playbackRate = rate;
};

YouTubeTrainer.prototype.toggleLoop = function () {
	var onClass = 'ytt-control-panel__loop-switch--on';
	var offClass = 'ytt-control-panel__loop-switch--off';

	this.loop.active = !this.loop.active;

	this.refreshLoopControlInputs();
};

YouTubeTrainer.prototype.loopHandler = function () {
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

YouTubeTrainer.prototype.registerVideoEventListeners = function () {
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

YouTubeTrainer.prototype.registerControlEventListeners = function () {
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
		// Just prevent the form from submitting into nothingness when someone presses inter in a input
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
};

YouTubeTrainer.prototype.buildInputGroup = function(type, name, className, label) {
	var group = document.createElement('div');
	group.classList.add('ytt-form-group');

	if (className) {
		group.classList.add(className + '-form-group');
	}

	var labelElement;

	if (label) {
		labelElement = document.createElement('label');
		labelElement.htmlFor = className;
		labelElement.innerText = label;

		group.appendChild(labelElement);
	}

	var input = document.createElement('input');
	input.type = type;
	input.name = name;
	input.classList.add(className);
	input.id = className;

	group.appendChild(input);

	return group;
};

YouTubeTrainer.prototype.onYouTubePageChange = function () {
};

YouTubeTrainer.prototype.buildControls = function () {
	var beforeElement = document.getElementById('info-contents');

	// ------------------------------------------------------
	// Base
	// ------------------------------------------------------
	var controlPanel = document.createElement('div');
	controlPanel.classList.add('ytt-control-panel');

	var controlPanelForm = document.createElement('form');
	controlPanelForm.name = 'ytt-control-panel__form';
	controlPanelForm.classList.add('ytt-control-panel__form');

	controlPanel.appendChild(controlPanelForm);

	// ------------------------------------------------------
	// Loop
	// ------------------------------------------------------
	var loopControls = document.createElement('div');
	loopControls.classList.add('ytt-control-panel__loop-controls');
	loopControls.classList.add('ytt-control-panel__section');
	loopControls.classList.add('ytt-loop-controls');

	controlPanelForm.appendChild(loopControls);

	var loopControlsHeader = document.createElement('div');
	loopControlsHeader.classList.add('ytt-control-panel__section-header');
	loopControlsHeader.innerText = this.localization.loop;

	loopControls.appendChild(loopControlsHeader);

	var loopSwitchInputGroup = this.buildInputGroup(
		'checkbox',
		'loop_active',
		'ytt-loop-controls__active-input',
		this.localization.loopActive
	);

	loopControls.appendChild(loopSwitchInputGroup);

	var loopStartInputGroup = this.buildInputGroup(
		'text',
		'loop_start',
		'ytt-loop-controls__start-input',
		this.localization.loopStart
	);

	loopControls.appendChild(loopStartInputGroup);

	var loopSetStartLink = document.createElement('a');
	loopSetStartLink.innerText = this.localization.loopSetStart;
	loopSetStartLink.classList.add('ytt-loop-controls__set-start');
	loopSetStartLink.setAttribute('href', 'javascript: void(0);');

	loopStartInputGroup.appendChild(loopSetStartLink);

	var loopEndInputGroup = this.buildInputGroup(
		'text',
		'loop_end',
		'ytt-loop-controls__end-input',
		this.localization.loopEnd
	);

	loopControls.appendChild(loopEndInputGroup);

	var loopSetEndLink = document.createElement('a');
	loopSetEndLink.innerText = this.localization.loopSetEnd;
	loopSetEndLink.classList.add('ytt-loop-controls__set-end');
	loopSetEndLink.setAttribute('href', 'javascript: void(0);');

	loopEndInputGroup.appendChild(loopSetEndLink);

	var loopBar = document.createElement('div');
	loopBar.classList.add('ytt-loop-bar');

	var youtubeProgressBarList = document.querySelector('.ytp-progress-list');
	youtubeProgressBarList.appendChild(loopBar);

	// ------------------------------------------------------
	// Playback rate
	// ------------------------------------------------------
	var playbackRateControls = document.createElement('div');
	playbackRateControls.classList.add('ytt-control-panel__playback-rate-controls');
	playbackRateControls.classList.add('ytt-control-panel__section');
	playbackRateControls.classList.add('ytt-playback-rate-controls');

	controlPanelForm.appendChild(playbackRateControls);

	var playbackRateHeader = document.createElement('div');
	playbackRateHeader.classList.add('ytt-control-panel__section-header');
	playbackRateHeader.innerText = this.localization.playbackRate;

	playbackRateControls.appendChild(playbackRateHeader);

	var playbackRateInputGroup = this.buildInputGroup(
		'text',
		'playback_rate',
		'ytt-playback-rate-controls__playback-rate',
		this.localization.playbackRateValue
	);

	playbackRateControls.appendChild(playbackRateInputGroup);

	// ------------------------------------------------------
	// Final assembling and setting of important elements to this
	// ------------------------------------------------------
	beforeElement.parentNode.insertBefore(controlPanel, beforeElement);

	this.elements.controlPanel = controlPanel;
	this.elements.controlPanelForm = controlPanelForm;
	this.elements.loopSwitch = this.elements.controlPanelForm.elements['loop_active'];
	this.elements.loopStartInput = this.elements.controlPanelForm.elements['loop_start'];
	this.elements.loopEndInput = this.elements.controlPanelForm.elements['loop_end'];
	this.elements.loopSetStartLink = loopSetStartLink;
	this.elements.loopSetEndLink = loopSetEndLink;
	this.elements.loopBar = loopBar;
	this.elements.playbackRateInput = this.elements.controlPanelForm.elements['playback_rate'];
};

window.addEventListener("yt-navigate-finish", function () {
	if (state.youTubeTrainer) {
		state.youTubeTrainer.onYouTubePageChange();
	}
	else {
		state.youTubeTrainer = new YouTubeTrainer();
	}
});