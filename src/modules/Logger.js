import settings from './settings';

var logger = {
	log: function() {
		// Always prepend the app name in the logging for easier identifying
		// "arguments" is not an array and must be converted to one first
		var args = Array.prototype.slice.call(arguments);
		args.unshift(settings.name + ':');

		console.log(...args);
	}
};

export default logger;