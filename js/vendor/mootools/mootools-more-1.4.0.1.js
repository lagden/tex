// MooTools: the javascript framework.
// Load this file's selection again by visiting: http://mootools.net/more/1afac23178b3865e1aea291456399a7c 
// Or build this file again with packager using: packager build More/Number.Format More/Form.Validator More/Form.Validator.Inline More/Form.Validator.Extras More/Hash.Cookie More/Tips More/Locale.pt-BR.Date More/Locale.pt-BR.Form.Validator
/*
---

script: More.js

name: More

description: MooTools More

license: MIT-style license

authors:
  - Guillermo Rauch
  - Thomas Aylott
  - Scott Kyle
  - Arian Stolwijk
  - Tim Wienk
  - Christoph Pojer
  - Aaron Newton
  - Jacob Thornton

requires:
  - Core/MooTools

provides: [MooTools.More]

...
*/

MooTools.More = {
	'version': '1.4.0.1',
	'build': 'a4244edf2aa97ac8a196fc96082dd35af1abab87'
};


/*
---

script: Object.Extras.js

name: Object.Extras

description: Extra Object generics, like getFromPath which allows a path notation to child elements.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Object
  - /MooTools.More

provides: [Object.Extras]

...
*/

(function(){

var defined = function(value){
	return value != null;
};

var hasOwnProperty = Object.prototype.hasOwnProperty;

Object.extend({

	getFromPath: function(source, parts){
		if (typeof parts == 'string') parts = parts.split('.');
		for (var i = 0, l = parts.length; i < l; i++){
			if (hasOwnProperty.call(source, parts[i])) source = source[parts[i]];
			else return null;
		}
		return source;
	},

	cleanValues: function(object, method){
		method = method || defined;
		for (var key in object) if (!method(object[key])){
			delete object[key];
		}
		return object;
	},

	erase: function(object, key){
		if (hasOwnProperty.call(object, key)) delete object[key];
		return object;
	},

	run: function(object){
		var args = Array.slice(arguments, 1);
		for (var key in object) if (object[key].apply){
			object[key].apply(object, args);
		}
		return object;
	}

});

})();


/*
---

script: Locale.js

name: Locale

description: Provides methods for localization.

license: MIT-style license

authors:
  - Aaron Newton
  - Arian Stolwijk

requires:
  - Core/Events
  - /Object.Extras
  - /MooTools.More

provides: [Locale, Lang]

...
*/

(function(){

var current = null,
	locales = {},
	inherits = {};

var getSet = function(set){
	if (instanceOf(set, Locale.Set)) return set;
	else return locales[set];
};

var Locale = this.Locale = {

	define: function(locale, set, key, value){
		var name;
		if (instanceOf(locale, Locale.Set)){
			name = locale.name;
			if (name) locales[name] = locale;
		} else {
			name = locale;
			if (!locales[name]) locales[name] = new Locale.Set(name);
			locale = locales[name];
		}

		if (set) locale.define(set, key, value);

		

		if (!current) current = locale;

		return locale;
	},

	use: function(locale){
		locale = getSet(locale);

		if (locale){
			current = locale;

			this.fireEvent('change', locale);

			
		}

		return this;
	},

	getCurrent: function(){
		return current;
	},

	get: function(key, args){
		return (current) ? current.get(key, args) : '';
	},

	inherit: function(locale, inherits, set){
		locale = getSet(locale);

		if (locale) locale.inherit(inherits, set);
		return this;
	},

	list: function(){
		return Object.keys(locales);
	}

};

Object.append(Locale, new Events);

Locale.Set = new Class({

	sets: {},

	inherits: {
		locales: [],
		sets: {}
	},

	initialize: function(name){
		this.name = name || '';
	},

	define: function(set, key, value){
		var defineData = this.sets[set];
		if (!defineData) defineData = {};

		if (key){
			if (typeOf(key) == 'object') defineData = Object.merge(defineData, key);
			else defineData[key] = value;
		}
		this.sets[set] = defineData;

		return this;
	},

	get: function(key, args, _base){
		var value = Object.getFromPath(this.sets, key);
		if (value != null){
			var type = typeOf(value);
			if (type == 'function') value = value.apply(null, Array.from(args));
			else if (type == 'object') value = Object.clone(value);
			return value;
		}

		// get value of inherited locales
		var index = key.indexOf('.'),
			set = index < 0 ? key : key.substr(0, index),
			names = (this.inherits.sets[set] || []).combine(this.inherits.locales).include('en-US');
		if (!_base) _base = [];

		for (var i = 0, l = names.length; i < l; i++){
			if (_base.contains(names[i])) continue;
			_base.include(names[i]);

			var locale = locales[names[i]];
			if (!locale) continue;

			value = locale.get(key, args, _base);
			if (value != null) return value;
		}

		return '';
	},

	inherit: function(names, set){
		names = Array.from(names);

		if (set && !this.inherits.sets[set]) this.inherits.sets[set] = [];

		var l = names.length;
		while (l--) (set ? this.inherits.sets[set] : this.inherits.locales).unshift(names[l]);

		return this;
	}

});



})();


/*
---

name: Locale.en-US.Number

description: Number messages for US English.

license: MIT-style license

authors:
  - Arian Stolwijk

requires:
  - /Locale

provides: [Locale.en-US.Number]

...
*/

Locale.define('en-US', 'Number', {

	decimal: '.',
	group: ',',

/* 	Commented properties are the defaults for Number.format
	decimals: 0,
	precision: 0,
	scientific: null,

	prefix: null,
	suffic: null,

	// Negative/Currency/percentage will mixin Number
	negative: {
		prefix: '-'
	},*/

	currency: {
//		decimals: 2,
		prefix: '$ '
	}/*,

	percentage: {
		decimals: 2,
		suffix: '%'
	}*/

});




/*
---
name: Number.Format
description: Extends the Number Type object to include a number formatting method.
license: MIT-style license
authors: [Arian Stolwijk]
requires: [Core/Number, Locale.en-US.Number]
# Number.Extras is for compatibility
provides: [Number.Format, Number.Extras]
...
*/


Number.implement({

	format: function(options){
		// Thanks dojo and YUI for some inspiration
		var value = this;
		options = options ? Object.clone(options) : {};
		var getOption = function(key){
			if (options[key] != null) return options[key];
			return Locale.get('Number.' + key);
		};

		var negative = value < 0,
			decimal = getOption('decimal'),
			precision = getOption('precision'),
			group = getOption('group'),
			decimals = getOption('decimals');

		if (negative){
			var negativeLocale = getOption('negative') || {};
			if (negativeLocale.prefix == null && negativeLocale.suffix == null) negativeLocale.prefix = '-';
			['prefix', 'suffix'].each(function(key){
				if (negativeLocale[key]) options[key] = getOption(key) + negativeLocale[key];
			});

			value = -value;
		}

		var prefix = getOption('prefix'),
			suffix = getOption('suffix');

		if (decimals !== '' && decimals >= 0 && decimals <= 20) value = value.toFixed(decimals);
		if (precision >= 1 && precision <= 21) value = (+value).toPrecision(precision);

		value += '';
		var index;
		if (getOption('scientific') === false && value.indexOf('e') > -1){
			var match = value.split('e'),
				zeros = +match[1];
			value = match[0].replace('.', '');

			if (zeros < 0){
				zeros = -zeros - 1;
				index = match[0].indexOf('.');
				if (index > -1) zeros -= index - 1;
				while (zeros--) value = '0' + value;
				value = '0.' + value;
			} else {
				index = match[0].lastIndexOf('.');
				if (index > -1) zeros -= match[0].length - index - 1;
				while (zeros--) value += '0';
			}
		}

		if (decimal != '.') value = value.replace('.', decimal);

		if (group){
			index = value.lastIndexOf(decimal);
			index = (index > -1) ? index : value.length;
			var newOutput = value.substring(index),
				i = index;

			while (i--){
				if ((index - i - 1) % 3 == 0 && i != (index - 1)) newOutput = group + newOutput;
				newOutput = value.charAt(i) + newOutput;
			}

			value = newOutput;
		}

		if (prefix) value = prefix + value;
		if (suffix) value += suffix;

		return value;
	},

	formatCurrency: function(decimals){
		var locale = Locale.get('Number.currency') || {};
		if (locale.scientific == null) locale.scientific = false;
		locale.decimals = decimals != null ? decimals
			: (locale.decimals == null ? 2 : locale.decimals);

		return this.format(locale);
	},

	formatPercentage: function(decimals){
		var locale = Locale.get('Number.percentage') || {};
		if (locale.suffix == null) locale.suffix = '%';
		locale.decimals = decimals != null ? decimals
			: (locale.decimals == null ? 2 : locale.decimals);

		return this.format(locale);
	}

});


/*
---

script: Class.Binds.js

name: Class.Binds

description: Automagically binds specified methods in a class to the instance of the class.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Class
  - /MooTools.More

provides: [Class.Binds]

...
*/

Class.Mutators.Binds = function(binds){
	if (!this.prototype.initialize) this.implement('initialize', function(){});
	return Array.from(binds).concat(this.prototype.Binds || []);
};

Class.Mutators.initialize = function(initialize){
	return function(){
		Array.from(this.Binds).each(function(name){
			var original = this[name];
			if (original) this[name] = original.bind(this);
		}, this);
		return initialize.apply(this, arguments);
	};
};


/*
---

name: Locale.en-US.Date

description: Date messages for US English.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - /Locale

provides: [Locale.en-US.Date]

...
*/

Locale.define('en-US', 'Date', {

	months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	months_abbr: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	days_abbr: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

	// Culture's date order: MM/DD/YYYY
	dateOrder: ['month', 'date', 'year'],
	shortDate: '%m/%d/%Y',
	shortTime: '%I:%M%p',
	AM: 'AM',
	PM: 'PM',
	firstDayOfWeek: 0,

	// Date.Extras
	ordinal: function(dayOfMonth){
		// 1st, 2nd, 3rd, etc.
		return (dayOfMonth > 3 && dayOfMonth < 21) ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(dayOfMonth % 10, 4)];
	},

	lessThanMinuteAgo: 'less than a minute ago',
	minuteAgo: 'about a minute ago',
	minutesAgo: '{delta} minutes ago',
	hourAgo: 'about an hour ago',
	hoursAgo: 'about {delta} hours ago',
	dayAgo: '1 day ago',
	daysAgo: '{delta} days ago',
	weekAgo: '1 week ago',
	weeksAgo: '{delta} weeks ago',
	monthAgo: '1 month ago',
	monthsAgo: '{delta} months ago',
	yearAgo: '1 year ago',
	yearsAgo: '{delta} years ago',

	lessThanMinuteUntil: 'less than a minute from now',
	minuteUntil: 'about a minute from now',
	minutesUntil: '{delta} minutes from now',
	hourUntil: 'about an hour from now',
	hoursUntil: 'about {delta} hours from now',
	dayUntil: '1 day from now',
	daysUntil: '{delta} days from now',
	weekUntil: '1 week from now',
	weeksUntil: '{delta} weeks from now',
	monthUntil: '1 month from now',
	monthsUntil: '{delta} months from now',
	yearUntil: '1 year from now',
	yearsUntil: '{delta} years from now'

});


/*
---

script: Date.js

name: Date

description: Extends the Date native object to include methods useful in managing dates.

license: MIT-style license

authors:
  - Aaron Newton
  - Nicholas Barthelemy - https://svn.nbarthelemy.com/date-js/
  - Harald Kirshner - mail [at] digitarald.de; http://digitarald.de
  - Scott Kyle - scott [at] appden.com; http://appden.com

requires:
  - Core/Array
  - Core/String
  - Core/Number
  - MooTools.More
  - Locale
  - Locale.en-US.Date

provides: [Date]

...
*/

(function(){

var Date = this.Date;

var DateMethods = Date.Methods = {
	ms: 'Milliseconds',
	year: 'FullYear',
	min: 'Minutes',
	mo: 'Month',
	sec: 'Seconds',
	hr: 'Hours'
};

['Date', 'Day', 'FullYear', 'Hours', 'Milliseconds', 'Minutes', 'Month', 'Seconds', 'Time', 'TimezoneOffset',
	'Week', 'Timezone', 'GMTOffset', 'DayOfYear', 'LastMonth', 'LastDayOfMonth', 'UTCDate', 'UTCDay', 'UTCFullYear',
	'AMPM', 'Ordinal', 'UTCHours', 'UTCMilliseconds', 'UTCMinutes', 'UTCMonth', 'UTCSeconds', 'UTCMilliseconds'].each(function(method){
	Date.Methods[method.toLowerCase()] = method;
});

var pad = function(n, digits, string){
	if (digits == 1) return n;
	return n < Math.pow(10, digits - 1) ? (string || '0') + pad(n, digits - 1, string) : n;
};

Date.implement({

	set: function(prop, value){
		prop = prop.toLowerCase();
		var method = DateMethods[prop] && 'set' + DateMethods[prop];
		if (method && this[method]) this[method](value);
		return this;
	}.overloadSetter(),

	get: function(prop){
		prop = prop.toLowerCase();
		var method = DateMethods[prop] && 'get' + DateMethods[prop];
		if (method && this[method]) return this[method]();
		return null;
	}.overloadGetter(),

	clone: function(){
		return new Date(this.get('time'));
	},

	increment: function(interval, times){
		interval = interval || 'day';
		times = times != null ? times : 1;

		switch (interval){
			case 'year':
				return this.increment('month', times * 12);
			case 'month':
				var d = this.get('date');
				this.set('date', 1).set('mo', this.get('mo') + times);
				return this.set('date', d.min(this.get('lastdayofmonth')));
			case 'week':
				return this.increment('day', times * 7);
			case 'day':
				return this.set('date', this.get('date') + times);
		}

		if (!Date.units[interval]) throw new Error(interval + ' is not a supported interval');

		return this.set('time', this.get('time') + times * Date.units[interval]());
	},

	decrement: function(interval, times){
		return this.increment(interval, -1 * (times != null ? times : 1));
	},

	isLeapYear: function(){
		return Date.isLeapYear(this.get('year'));
	},

	clearTime: function(){
		return this.set({hr: 0, min: 0, sec: 0, ms: 0});
	},

	diff: function(date, resolution){
		if (typeOf(date) == 'string') date = Date.parse(date);

		return ((date - this) / Date.units[resolution || 'day'](3, 3)).round(); // non-leap year, 30-day month
	},

	getLastDayOfMonth: function(){
		return Date.daysInMonth(this.get('mo'), this.get('year'));
	},

	getDayOfYear: function(){
		return (Date.UTC(this.get('year'), this.get('mo'), this.get('date') + 1)
			- Date.UTC(this.get('year'), 0, 1)) / Date.units.day();
	},

	setDay: function(day, firstDayOfWeek){
		if (firstDayOfWeek == null){
			firstDayOfWeek = Date.getMsg('firstDayOfWeek');
			if (firstDayOfWeek === '') firstDayOfWeek = 1;
		}

		day = (7 + Date.parseDay(day, true) - firstDayOfWeek) % 7;
		var currentDay = (7 + this.get('day') - firstDayOfWeek) % 7;

		return this.increment('day', day - currentDay);
	},

	getWeek: function(firstDayOfWeek){
		if (firstDayOfWeek == null){
			firstDayOfWeek = Date.getMsg('firstDayOfWeek');
			if (firstDayOfWeek === '') firstDayOfWeek = 1;
		}

		var date = this,
			dayOfWeek = (7 + date.get('day') - firstDayOfWeek) % 7,
			dividend = 0,
			firstDayOfYear;

		if (firstDayOfWeek == 1){
			// ISO-8601, week belongs to year that has the most days of the week (i.e. has the thursday of the week)
			var month = date.get('month'),
				startOfWeek = date.get('date') - dayOfWeek;

			if (month == 11 && startOfWeek > 28) return 1; // Week 1 of next year

			if (month == 0 && startOfWeek < -2){
				// Use a date from last year to determine the week
				date = new Date(date).decrement('day', dayOfWeek);
				dayOfWeek = 0;
			}

			firstDayOfYear = new Date(date.get('year'), 0, 1).get('day') || 7;
			if (firstDayOfYear > 4) dividend = -7; // First week of the year is not week 1
		} else {
			// In other cultures the first week of the year is always week 1 and the last week always 53 or 54.
			// Days in the same week can have a different weeknumber if the week spreads across two years.
			firstDayOfYear = new Date(date.get('year'), 0, 1).get('day');
		}

		dividend += date.get('dayofyear');
		dividend += 6 - dayOfWeek; // Add days so we calculate the current date's week as a full week
		dividend += (7 + firstDayOfYear - firstDayOfWeek) % 7; // Make up for first week of the year not being a full week

		return (dividend / 7);
	},

	getOrdinal: function(day){
		return Date.getMsg('ordinal', day || this.get('date'));
	},

	getTimezone: function(){
		return this.toString()
			.replace(/^.*? ([A-Z]{3}).[0-9]{4}.*$/, '$1')
			.replace(/^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, '$1$2$3');
	},

	getGMTOffset: function(){
		var off = this.get('timezoneOffset');
		return ((off > 0) ? '-' : '+') + pad((off.abs() / 60).floor(), 2) + pad(off % 60, 2);
	},

	setAMPM: function(ampm){
		ampm = ampm.toUpperCase();
		var hr = this.get('hr');
		if (hr > 11 && ampm == 'AM') return this.decrement('hour', 12);
		else if (hr < 12 && ampm == 'PM') return this.increment('hour', 12);
		return this;
	},

	getAMPM: function(){
		return (this.get('hr') < 12) ? 'AM' : 'PM';
	},

	parse: function(str){
		this.set('time', Date.parse(str));
		return this;
	},

	isValid: function(date){
		if (!date) date = this;
		return typeOf(date) == 'date' && !isNaN(date.valueOf());
	},

	format: function(format){
		if (!this.isValid()) return 'invalid date';

		if (!format) format = '%x %X';
		if (typeof format == 'string') format = formats[format.toLowerCase()] || format;
		if (typeof format == 'function') return format(this);

		var d = this;
		return format.replace(/%([a-z%])/gi,
			function($0, $1){
				switch ($1){
					case 'a': return Date.getMsg('days_abbr')[d.get('day')];
					case 'A': return Date.getMsg('days')[d.get('day')];
					case 'b': return Date.getMsg('months_abbr')[d.get('month')];
					case 'B': return Date.getMsg('months')[d.get('month')];
					case 'c': return d.format('%a %b %d %H:%M:%S %Y');
					case 'd': return pad(d.get('date'), 2);
					case 'e': return pad(d.get('date'), 2, ' ');
					case 'H': return pad(d.get('hr'), 2);
					case 'I': return pad((d.get('hr') % 12) || 12, 2);
					case 'j': return pad(d.get('dayofyear'), 3);
					case 'k': return pad(d.get('hr'), 2, ' ');
					case 'l': return pad((d.get('hr') % 12) || 12, 2, ' ');
					case 'L': return pad(d.get('ms'), 3);
					case 'm': return pad((d.get('mo') + 1), 2);
					case 'M': return pad(d.get('min'), 2);
					case 'o': return d.get('ordinal');
					case 'p': return Date.getMsg(d.get('ampm'));
					case 's': return Math.round(d / 1000);
					case 'S': return pad(d.get('seconds'), 2);
					case 'T': return d.format('%H:%M:%S');
					case 'U': return pad(d.get('week'), 2);
					case 'w': return d.get('day');
					case 'x': return d.format(Date.getMsg('shortDate'));
					case 'X': return d.format(Date.getMsg('shortTime'));
					case 'y': return d.get('year').toString().substr(2);
					case 'Y': return d.get('year');
					case 'z': return d.get('GMTOffset');
					case 'Z': return d.get('Timezone');
				}
				return $1;
			}
		);
	},

	toISOString: function(){
		return this.format('iso8601');
	}

}).alias({
	toJSON: 'toISOString',
	compare: 'diff',
	strftime: 'format'
});

// The day and month abbreviations are standardized, so we cannot use simply %a and %b because they will get localized
var rfcDayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	rfcMonthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var formats = {
	db: '%Y-%m-%d %H:%M:%S',
	compact: '%Y%m%dT%H%M%S',
	'short': '%d %b %H:%M',
	'long': '%B %d, %Y %H:%M',
	rfc822: function(date){
		return rfcDayAbbr[date.get('day')] + date.format(', %d ') + rfcMonthAbbr[date.get('month')] + date.format(' %Y %H:%M:%S %Z');
	},
	rfc2822: function(date){
		return rfcDayAbbr[date.get('day')] + date.format(', %d ') + rfcMonthAbbr[date.get('month')] + date.format(' %Y %H:%M:%S %z');
	},
	iso8601: function(date){
		return (
			date.getUTCFullYear() + '-' +
			pad(date.getUTCMonth() + 1, 2) + '-' +
			pad(date.getUTCDate(), 2) + 'T' +
			pad(date.getUTCHours(), 2) + ':' +
			pad(date.getUTCMinutes(), 2) + ':' +
			pad(date.getUTCSeconds(), 2) + '.' +
			pad(date.getUTCMilliseconds(), 3) + 'Z'
		);
	}
};

var parsePatterns = [],
	nativeParse = Date.parse;

var parseWord = function(type, word, num){
	var ret = -1,
		translated = Date.getMsg(type + 's');
	switch (typeOf(word)){
		case 'object':
			ret = translated[word.get(type)];
			break;
		case 'number':
			ret = translated[word];
			if (!ret) throw new Error('Invalid ' + type + ' index: ' + word);
			break;
		case 'string':
			var match = translated.filter(function(name){
				return this.test(name);
			}, new RegExp('^' + word, 'i'));
			if (!match.length) throw new Error('Invalid ' + type + ' string');
			if (match.length > 1) throw new Error('Ambiguous ' + type);
			ret = match[0];
	}

	return (num) ? translated.indexOf(ret) : ret;
};

var startCentury = 1900,
	startYear = 70;

Date.extend({

	getMsg: function(key, args){
		return Locale.get('Date.' + key, args);
	},

	units: {
		ms: Function.from(1),
		second: Function.from(1000),
		minute: Function.from(60000),
		hour: Function.from(3600000),
		day: Function.from(86400000),
		week: Function.from(608400000),
		month: function(month, year){
			var d = new Date;
			return Date.daysInMonth(month != null ? month : d.get('mo'), year != null ? year : d.get('year')) * 86400000;
		},
		year: function(year){
			year = year || new Date().get('year');
			return Date.isLeapYear(year) ? 31622400000 : 31536000000;
		}
	},

	daysInMonth: function(month, year){
		return [31, Date.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
	},

	isLeapYear: function(year){
		return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
	},

	parse: function(from){
		var t = typeOf(from);
		if (t == 'number') return new Date(from);
		if (t != 'string') return from;
		from = from.clean();
		if (!from.length) return null;

		var parsed;
		parsePatterns.some(function(pattern){
			var bits = pattern.re.exec(from);
			return (bits) ? (parsed = pattern.handler(bits)) : false;
		});

		if (!(parsed && parsed.isValid())){
			parsed = new Date(nativeParse(from));
			if (!(parsed && parsed.isValid())) parsed = new Date(from.toInt());
		}
		return parsed;
	},

	parseDay: function(day, num){
		return parseWord('day', day, num);
	},

	parseMonth: function(month, num){
		return parseWord('month', month, num);
	},

	parseUTC: function(value){
		var localDate = new Date(value);
		var utcSeconds = Date.UTC(
			localDate.get('year'),
			localDate.get('mo'),
			localDate.get('date'),
			localDate.get('hr'),
			localDate.get('min'),
			localDate.get('sec'),
			localDate.get('ms')
		);
		return new Date(utcSeconds);
	},

	orderIndex: function(unit){
		return Date.getMsg('dateOrder').indexOf(unit) + 1;
	},

	defineFormat: function(name, format){
		formats[name] = format;
		return this;
	},

	

	defineParser: function(pattern){
		parsePatterns.push((pattern.re && pattern.handler) ? pattern : build(pattern));
		return this;
	},

	defineParsers: function(){
		Array.flatten(arguments).each(Date.defineParser);
		return this;
	},

	define2DigitYearStart: function(year){
		startYear = year % 100;
		startCentury = year - startYear;
		return this;
	}

}).extend({
	defineFormats: Date.defineFormat.overloadSetter()
});

var regexOf = function(type){
	return new RegExp('(?:' + Date.getMsg(type).map(function(name){
		return name.substr(0, 3);
	}).join('|') + ')[a-z]*');
};

var replacers = function(key){
	switch (key){
		case 'T':
			return '%H:%M:%S';
		case 'x': // iso8601 covers yyyy-mm-dd, so just check if month is first
			return ((Date.orderIndex('month') == 1) ? '%m[-./]%d' : '%d[-./]%m') + '([-./]%y)?';
		case 'X':
			return '%H([.:]%M)?([.:]%S([.:]%s)?)? ?%p? ?%z?';
	}
	return null;
};

var keys = {
	d: /[0-2]?[0-9]|3[01]/,
	H: /[01]?[0-9]|2[0-3]/,
	I: /0?[1-9]|1[0-2]/,
	M: /[0-5]?\d/,
	s: /\d+/,
	o: /[a-z]*/,
	p: /[ap]\.?m\.?/,
	y: /\d{2}|\d{4}/,
	Y: /\d{4}/,
	z: /Z|[+-]\d{2}(?::?\d{2})?/
};

keys.m = keys.I;
keys.S = keys.M;

var currentLanguage;

var recompile = function(language){
	currentLanguage = language;

	keys.a = keys.A = regexOf('days');
	keys.b = keys.B = regexOf('months');

	parsePatterns.each(function(pattern, i){
		if (pattern.format) parsePatterns[i] = build(pattern.format);
	});
};

var build = function(format){
	if (!currentLanguage) return {format: format};

	var parsed = [];
	var re = (format.source || format) // allow format to be regex
	 .replace(/%([a-z])/gi,
		function($0, $1){
			return replacers($1) || $0;
		}
	).replace(/\((?!\?)/g, '(?:') // make all groups non-capturing
	 .replace(/ (?!\?|\*)/g, ',? ') // be forgiving with spaces and commas
	 .replace(/%([a-z%])/gi,
		function($0, $1){
			var p = keys[$1];
			if (!p) return $1;
			parsed.push($1);
			return '(' + p.source + ')';
		}
	).replace(/\[a-z\]/gi, '[a-z\\u00c0-\\uffff;\&]'); // handle unicode words

	return {
		format: format,
		re: new RegExp('^' + re + '$', 'i'),
		handler: function(bits){
			bits = bits.slice(1).associate(parsed);
			var date = new Date().clearTime(),
				year = bits.y || bits.Y;

			if (year != null) handle.call(date, 'y', year); // need to start in the right year
			if ('d' in bits) handle.call(date, 'd', 1);
			if ('m' in bits || bits.b || bits.B) handle.call(date, 'm', 1);

			for (var key in bits) handle.call(date, key, bits[key]);
			return date;
		}
	};
};

var handle = function(key, value){
	if (!value) return this;

	switch (key){
		case 'a': case 'A': return this.set('day', Date.parseDay(value, true));
		case 'b': case 'B': return this.set('mo', Date.parseMonth(value, true));
		case 'd': return this.set('date', value);
		case 'H': case 'I': return this.set('hr', value);
		case 'm': return this.set('mo', value - 1);
		case 'M': return this.set('min', value);
		case 'p': return this.set('ampm', value.replace(/\./g, ''));
		case 'S': return this.set('sec', value);
		case 's': return this.set('ms', ('0.' + value) * 1000);
		case 'w': return this.set('day', value);
		case 'Y': return this.set('year', value);
		case 'y':
			value = +value;
			if (value < 100) value += startCentury + (value < startYear ? 100 : 0);
			return this.set('year', value);
		case 'z':
			if (value == 'Z') value = '+00';
			var offset = value.match(/([+-])(\d{2}):?(\d{2})?/);
			offset = (offset[1] + '1') * (offset[2] * 60 + (+offset[3] || 0)) + this.getTimezoneOffset();
			return this.set('time', this - offset * 60000);
	}

	return this;
};

Date.defineParsers(
	'%Y([-./]%m([-./]%d((T| )%X)?)?)?', // "1999-12-31", "1999-12-31 11:59pm", "1999-12-31 23:59:59", ISO8601
	'%Y%m%d(T%H(%M%S?)?)?', // "19991231", "19991231T1159", compact
	'%x( %X)?', // "12/31", "12.31.99", "12-31-1999", "12/31/2008 11:59 PM"
	'%d%o( %b( %Y)?)?( %X)?', // "31st", "31st December", "31 Dec 1999", "31 Dec 1999 11:59pm"
	'%b( %d%o)?( %Y)?( %X)?', // Same as above with month and day switched
	'%Y %b( %d%o( %X)?)?', // Same as above with year coming first
	'%o %b %d %X %z %Y', // "Thu Oct 22 08:11:23 +0000 2009"
	'%T', // %H:%M:%S
	'%H:%M( ?%p)?' // "11:05pm", "11:05 am" and "11:05"
);

Locale.addEvent('change', function(language){
	if (Locale.get('Date')) recompile(language);
}).fireEvent('change', Locale.getCurrent());

})();


/*
---

script: String.Extras.js

name: String.Extras

description: Extends the String native object to include methods useful in managing various kinds of strings (query strings, urls, html, etc).

license: MIT-style license

authors:
  - Aaron Newton
  - Guillermo Rauch
  - Christopher Pitt

requires:
  - Core/String
  - Core/Array
  - MooTools.More

provides: [String.Extras]

...
*/

(function(){

var special = {
	'a': /[àáâãäåăą]/g,
	'A': /[ÀÁÂÃÄÅĂĄ]/g,
	'c': /[ćčç]/g,
	'C': /[ĆČÇ]/g,
	'd': /[ďđ]/g,
	'D': /[ĎÐ]/g,
	'e': /[èéêëěę]/g,
	'E': /[ÈÉÊËĚĘ]/g,
	'g': /[ğ]/g,
	'G': /[Ğ]/g,
	'i': /[ìíîï]/g,
	'I': /[ÌÍÎÏ]/g,
	'l': /[ĺľł]/g,
	'L': /[ĹĽŁ]/g,
	'n': /[ñňń]/g,
	'N': /[ÑŇŃ]/g,
	'o': /[òóôõöøő]/g,
	'O': /[ÒÓÔÕÖØ]/g,
	'r': /[řŕ]/g,
	'R': /[ŘŔ]/g,
	's': /[ššş]/g,
	'S': /[ŠŞŚ]/g,
	't': /[ťţ]/g,
	'T': /[ŤŢ]/g,
	'ue': /[ü]/g,
	'UE': /[Ü]/g,
	'u': /[ùúûůµ]/g,
	'U': /[ÙÚÛŮ]/g,
	'y': /[ÿý]/g,
	'Y': /[ŸÝ]/g,
	'z': /[žźż]/g,
	'Z': /[ŽŹŻ]/g,
	'th': /[þ]/g,
	'TH': /[Þ]/g,
	'dh': /[ð]/g,
	'DH': /[Ð]/g,
	'ss': /[ß]/g,
	'oe': /[œ]/g,
	'OE': /[Œ]/g,
	'ae': /[æ]/g,
	'AE': /[Æ]/g
},

tidy = {
	' ': /[\xa0\u2002\u2003\u2009]/g,
	'*': /[\xb7]/g,
	'\'': /[\u2018\u2019]/g,
	'"': /[\u201c\u201d]/g,
	'...': /[\u2026]/g,
	'-': /[\u2013]/g,
//	'--': /[\u2014]/g,
	'&raquo;': /[\uFFFD]/g
};

var walk = function(string, replacements){
	var result = string, key;
	for (key in replacements) result = result.replace(replacements[key], key);
	return result;
};

var getRegexForTag = function(tag, contents){
	tag = tag || '';
	var regstr = contents ? "<" + tag + "(?!\\w)[^>]*>([\\s\\S]*?)<\/" + tag + "(?!\\w)>" : "<\/?" + tag + "([^>]+)?>",
		reg = new RegExp(regstr, "gi");
	return reg;
};

String.implement({

	standardize: function(){
		return walk(this, special);
	},

	repeat: function(times){
		return new Array(times + 1).join(this);
	},

	pad: function(length, str, direction){
		if (this.length >= length) return this;

		var pad = (str == null ? ' ' : '' + str)
			.repeat(length - this.length)
			.substr(0, length - this.length);

		if (!direction || direction == 'right') return this + pad;
		if (direction == 'left') return pad + this;

		return pad.substr(0, (pad.length / 2).floor()) + this + pad.substr(0, (pad.length / 2).ceil());
	},

	getTags: function(tag, contents){
		return this.match(getRegexForTag(tag, contents)) || [];
	},

	stripTags: function(tag, contents){
		return this.replace(getRegexForTag(tag, contents), '');
	},

	tidy: function(){
		return walk(this, tidy);
	},

	truncate: function(max, trail, atChar){
		var string = this;
		if (trail == null && arguments.length == 1) trail = '…';
		if (string.length > max){
			string = string.substring(0, max);
			if (atChar){
				var index = string.lastIndexOf(atChar);
				if (index != -1) string = string.substr(0, index);
			}
			if (trail) string += trail;
		}
		return string;
	}

});

})();


/*
---

script: Element.Forms.js

name: Element.Forms

description: Extends the Element native object to include methods useful in managing inputs.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Element
  - /String.Extras
  - /MooTools.More

provides: [Element.Forms]

...
*/

Element.implement({

	tidy: function(){
		this.set('value', this.get('value').tidy());
	},

	getTextInRange: function(start, end){
		return this.get('value').substring(start, end);
	},

	getSelectedText: function(){
		if (this.setSelectionRange) return this.getTextInRange(this.getSelectionStart(), this.getSelectionEnd());
		return document.selection.createRange().text;
	},

	getSelectedRange: function(){
		if (this.selectionStart != null){
			return {
				start: this.selectionStart,
				end: this.selectionEnd
			};
		}

		var pos = {
			start: 0,
			end: 0
		};
		var range = this.getDocument().selection.createRange();
		if (!range || range.parentElement() != this) return pos;
		var duplicate = range.duplicate();

		if (this.type == 'text'){
			pos.start = 0 - duplicate.moveStart('character', -100000);
			pos.end = pos.start + range.text.length;
		} else {
			var value = this.get('value');
			var offset = value.length;
			duplicate.moveToElementText(this);
			duplicate.setEndPoint('StartToEnd', range);
			if (duplicate.text.length) offset -= value.match(/[\n\r]*$/)[0].length;
			pos.end = offset - duplicate.text.length;
			duplicate.setEndPoint('StartToStart', range);
			pos.start = offset - duplicate.text.length;
		}
		return pos;
	},

	getSelectionStart: function(){
		return this.getSelectedRange().start;
	},

	getSelectionEnd: function(){
		return this.getSelectedRange().end;
	},

	setCaretPosition: function(pos){
		if (pos == 'end') pos = this.get('value').length;
		this.selectRange(pos, pos);
		return this;
	},

	getCaretPosition: function(){
		return this.getSelectedRange().start;
	},

	selectRange: function(start, end){
		if (this.setSelectionRange){
			this.focus();
			this.setSelectionRange(start, end);
		} else {
			var value = this.get('value');
			var diff = value.substr(start, end - start).replace(/\r/g, '').length;
			start = value.substr(0, start).replace(/\r/g, '').length;
			var range = this.createTextRange();
			range.collapse(true);
			range.moveEnd('character', start + diff);
			range.moveStart('character', start);
			range.select();
		}
		return this;
	},

	insertAtCursor: function(value, select){
		var pos = this.getSelectedRange();
		var text = this.get('value');
		this.set('value', text.substring(0, pos.start) + value + text.substring(pos.end, text.length));
		if (select !== false) this.selectRange(pos.start, pos.start + value.length);
		else this.setCaretPosition(pos.start + value.length);
		return this;
	},

	insertAroundCursor: function(options, select){
		options = Object.append({
			before: '',
			defaultMiddle: '',
			after: ''
		}, options);

		var value = this.getSelectedText() || options.defaultMiddle;
		var pos = this.getSelectedRange();
		var text = this.get('value');

		if (pos.start == pos.end){
			this.set('value', text.substring(0, pos.start) + options.before + value + options.after + text.substring(pos.end, text.length));
			this.selectRange(pos.start + options.before.length, pos.end + options.before.length + value.length);
		} else {
			var current = text.substring(pos.start, pos.end);
			this.set('value', text.substring(0, pos.start) + options.before + current + options.after + text.substring(pos.end, text.length));
			var selStart = pos.start + options.before.length;
			if (select !== false) this.selectRange(selStart, selStart + current.length);
			else this.setCaretPosition(selStart + text.length);
		}
		return this;
	}

});


/*
---

name: Locale.en-US.Form.Validator

description: Form Validator messages for English.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - /Locale

provides: [Locale.en-US.Form.Validator]

...
*/

Locale.define('en-US', 'FormValidator', {

	required: 'This field is required.',
	length: 'Please enter {length} characters (you entered {elLength} characters)',
	minLength: 'Please enter at least {minLength} characters (you entered {length} characters).',
	maxLength: 'Please enter no more than {maxLength} characters (you entered {length} characters).',
	integer: 'Please enter an integer in this field. Numbers with decimals (e.g. 1.25) are not permitted.',
	numeric: 'Please enter only numeric values in this field (i.e. "1" or "1.1" or "-1" or "-1.1").',
	digits: 'Please use numbers and punctuation only in this field (for example, a phone number with dashes or dots is permitted).',
	alpha: 'Please use only letters (a-z) within this field. No spaces or other characters are allowed.',
	alphanum: 'Please use only letters (a-z) or numbers (0-9) in this field. No spaces or other characters are allowed.',
	dateSuchAs: 'Please enter a valid date such as {date}',
	dateInFormatMDY: 'Please enter a valid date such as MM/DD/YYYY (i.e. "12/31/1999")',
	email: 'Please enter a valid email address. For example "fred@domain.com".',
	url: 'Please enter a valid URL such as http://www.example.com.',
	currencyDollar: 'Please enter a valid $ amount. For example $100.00 .',
	oneRequired: 'Please enter something for at least one of these inputs.',
	errorPrefix: 'Error: ',
	warningPrefix: 'Warning: ',

	// Form.Validator.Extras
	noSpace: 'There can be no spaces in this input.',
	reqChkByNode: 'No items are selected.',
	requiredChk: 'This field is required.',
	reqChkByName: 'Please select a {label}.',
	match: 'This field needs to match the {matchName} field',
	startDate: 'the start date',
	endDate: 'the end date',
	currendDate: 'the current date',
	afterDate: 'The date should be the same or after {label}.',
	beforeDate: 'The date should be the same or before {label}.',
	startMonth: 'Please select a start month',
	sameMonth: 'These two dates must be in the same month - you must change one or the other.',
	creditcard: 'The credit card number entered is invalid. Please check the number and try again. {length} digits entered.'

});


/*
---

script: Element.Shortcuts.js

name: Element.Shortcuts

description: Extends the Element native object to include some shortcut methods.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Element.Style
  - /MooTools.More

provides: [Element.Shortcuts]

...
*/

Element.implement({

	isDisplayed: function(){
		return this.getStyle('display') != 'none';
	},

	isVisible: function(){
		var w = this.offsetWidth,
			h = this.offsetHeight;
		return (w == 0 && h == 0) ? false : (w > 0 && h > 0) ? true : this.style.display != 'none';
	},

	toggle: function(){
		return this[this.isDisplayed() ? 'hide' : 'show']();
	},

	hide: function(){
		var d;
		try {
			//IE fails here if the element is not in the dom
			d = this.getStyle('display');
		} catch(e){}
		if (d == 'none') return this;
		return this.store('element:_originalDisplay', d || '').setStyle('display', 'none');
	},

	show: function(display){
		if (!display && this.isDisplayed()) return this;
		display = display || this.retrieve('element:_originalDisplay') || 'block';
		return this.setStyle('display', (display == 'none') ? 'block' : display);
	},

	swapClass: function(remove, add){
		return this.removeClass(remove).addClass(add);
	}

});

Document.implement({

	clearSelection: function(){
		if (window.getSelection){
			var selection = window.getSelection();
			if (selection && selection.removeAllRanges) selection.removeAllRanges();
		} else if (document.selection && document.selection.empty){
			try {
				//IE fails here if selected element is not in dom
				document.selection.empty();
			} catch(e){}
		}
	}

});


/*
---

script: Form.Validator.js

name: Form.Validator

description: A css-class based form validation system.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Options
  - Core/Events
  - Core/Slick.Finder
  - Core/Element.Event
  - Core/Element.Style
  - Core/JSON
  - /Locale
  - /Class.Binds
  - /Date
  - /Element.Forms
  - /Locale.en-US.Form.Validator
  - /Element.Shortcuts

provides: [Form.Validator, InputValidator, FormValidator.BaseValidators]

...
*/
if (!window.Form) window.Form = {};

var InputValidator = this.InputValidator = new Class({

	Implements: [Options],

	options: {
		errorMsg: 'Validation failed.',
		test: Function.from(true)
	},

	initialize: function(className, options){
		this.setOptions(options);
		this.className = className;
	},

	test: function(field, props){
		field = document.id(field);
		return (field) ? this.options.test(field, props || this.getProps(field)) : false;
	},

	getError: function(field, props){
		field = document.id(field);
		var err = this.options.errorMsg;
		if (typeOf(err) == 'function') err = err(field, props || this.getProps(field));
		return err;
	},

	getProps: function(field){
		field = document.id(field);
		return (field) ? field.get('validatorProps') : {};
	}

});

Element.Properties.validators = {

	get: function(){
		return (this.get('data-validators') || this.className).clean().split(' ');
	}

};

Element.Properties.validatorProps = {

	set: function(props){
		return this.eliminate('$moo:validatorProps').store('$moo:validatorProps', props);
	},

	get: function(props){
		if (props) this.set(props);
		if (this.retrieve('$moo:validatorProps')) return this.retrieve('$moo:validatorProps');
		if (this.getProperty('data-validator-properties') || this.getProperty('validatorProps')){
			try {
				this.store('$moo:validatorProps', JSON.decode(this.getProperty('validatorProps') || this.getProperty('data-validator-properties')));
			}catch(e){
				return {};
			}
		} else {
			var vals = this.get('validators').filter(function(cls){
				return cls.test(':');
			});
			if (!vals.length){
				this.store('$moo:validatorProps', {});
			} else {
				props = {};
				vals.each(function(cls){
					var split = cls.split(':');
					if (split[1]){
						try {
							props[split[0]] = JSON.decode(split[1]);
						} catch(e){}
					}
				});
				this.store('$moo:validatorProps', props);
			}
		}
		return this.retrieve('$moo:validatorProps');
	}

};

Form.Validator = new Class({

	Implements: [Options, Events],

	Binds: ['onSubmit'],

	options: {/*
		onFormValidate: function(isValid, form, event){},
		onElementValidate: function(isValid, field, className, warn){},
		onElementPass: function(field){},
		onElementFail: function(field, validatorsFailed){}, */
		fieldSelectors: 'input, select, textarea',
		ignoreHidden: true,
		ignoreDisabled: true,
		useTitles: false,
		evaluateOnSubmit: true,
		evaluateFieldsOnBlur: true,
		evaluateFieldsOnChange: true,
		serial: true,
		stopOnFailure: true,
		warningPrefix: function(){
			return Form.Validator.getMsg('warningPrefix') || 'Warning: ';
		},
		errorPrefix: function(){
			return Form.Validator.getMsg('errorPrefix') || 'Error: ';
		}
	},

	initialize: function(form, options){
		this.setOptions(options);
		this.element = document.id(form);
		this.element.store('validator', this);
		this.warningPrefix = Function.from(this.options.warningPrefix)();
		this.errorPrefix = Function.from(this.options.errorPrefix)();
		if (this.options.evaluateOnSubmit) this.element.addEvent('submit', this.onSubmit);
		if (this.options.evaluateFieldsOnBlur || this.options.evaluateFieldsOnChange) this.watchFields(this.getFields());
	},

	toElement: function(){
		return this.element;
	},

	getFields: function(){
		return (this.fields = this.element.getElements(this.options.fieldSelectors));
	},

	watchFields: function(fields){
		fields.each(function(el){
			if (this.options.evaluateFieldsOnBlur)
				el.addEvent('blur', this.validationMonitor.pass([el, false], this));
			if (this.options.evaluateFieldsOnChange)
				el.addEvent('change', this.validationMonitor.pass([el, true], this));
		}, this);
	},

	validationMonitor: function(){
		clearTimeout(this.timer);
		this.timer = this.validateField.delay(50, this, arguments);
	},

	onSubmit: function(event){
		if (this.validate(event)) this.reset();
	},

	reset: function(){
		this.getFields().each(this.resetField, this);
		return this;
	},

	validate: function(event){
		var result = this.getFields().map(function(field){
			return this.validateField(field, true);
		}, this).every(function(v){
			return v;
		});
		this.fireEvent('formValidate', [result, this.element, event]);
		if (this.options.stopOnFailure && !result && event) event.preventDefault();
		return result;
	},

	validateField: function(field, force){
		if (this.paused) return true;
		field = document.id(field);
		var passed = !field.hasClass('validation-failed');
		var failed, warned;
		if (this.options.serial && !force){
			failed = this.element.getElement('.validation-failed');
			warned = this.element.getElement('.warning');
		}
		if (field && (!failed || force || field.hasClass('validation-failed') || (failed && !this.options.serial))){
			var validationTypes = field.get('validators');
			var validators = validationTypes.some(function(cn){
				return this.getValidator(cn);
			}, this);
			var validatorsFailed = [];
			validationTypes.each(function(className){
				if (className && !this.test(className, field)) validatorsFailed.include(className);
			}, this);
			passed = validatorsFailed.length === 0;
			if (validators && !this.hasValidator(field, 'warnOnly')){
				if (passed){
					field.addClass('validation-passed').removeClass('validation-failed');
					this.fireEvent('elementPass', [field]);
				} else {
					field.addClass('validation-failed').removeClass('validation-passed');
					this.fireEvent('elementFail', [field, validatorsFailed]);
				}
			}
			if (!warned){
				var warnings = validationTypes.some(function(cn){
					if (cn.test('^warn'))
						return this.getValidator(cn.replace(/^warn-/,''));
					else return null;
				}, this);
				field.removeClass('warning');
				var warnResult = validationTypes.map(function(cn){
					if (cn.test('^warn'))
						return this.test(cn.replace(/^warn-/,''), field, true);
					else return null;
				}, this);
			}
		}
		return passed;
	},

	test: function(className, field, warn){
		field = document.id(field);
		if ((this.options.ignoreHidden && !field.isVisible()) || (this.options.ignoreDisabled && field.get('disabled'))) return true;
		var validator = this.getValidator(className);
		if (warn != null) warn = false;
		if (this.hasValidator(field, 'warnOnly')) warn = true;
		var isValid = this.hasValidator(field, 'ignoreValidation') || (validator ? validator.test(field) : true);
		if (validator && field.isVisible()) this.fireEvent('elementValidate', [isValid, field, className, warn]);
		if (warn) return true;
		return isValid;
	},

	hasValidator: function(field, value){
		return field.get('validators').contains(value);
	},

	resetField: function(field){
		field = document.id(field);
		if (field){
			field.get('validators').each(function(className){
				if (className.test('^warn-')) className = className.replace(/^warn-/, '');
				field.removeClass('validation-failed');
				field.removeClass('warning');
				field.removeClass('validation-passed');
			}, this);
		}
		return this;
	},

	stop: function(){
		this.paused = true;
		return this;
	},

	start: function(){
		this.paused = false;
		return this;
	},

	ignoreField: function(field, warn){
		field = document.id(field);
		if (field){
			this.enforceField(field);
			if (warn) field.addClass('warnOnly');
			else field.addClass('ignoreValidation');
		}
		return this;
	},

	enforceField: function(field){
		field = document.id(field);
		if (field) field.removeClass('warnOnly').removeClass('ignoreValidation');
		return this;
	}

});

Form.Validator.getMsg = function(key){
	return Locale.get('FormValidator.' + key);
};

Form.Validator.adders = {

	validators:{},

	add : function(className, options){
		this.validators[className] = new InputValidator(className, options);
		//if this is a class (this method is used by instances of Form.Validator and the Form.Validator namespace)
		//extend these validators into it
		//this allows validators to be global and/or per instance
		if (!this.initialize){
			this.implement({
				validators: this.validators
			});
		}
	},

	addAllThese : function(validators){
		Array.from(validators).each(function(validator){
			this.add(validator[0], validator[1]);
		}, this);
	},

	getValidator: function(className){
		return this.validators[className.split(':')[0]];
	}

};

Object.append(Form.Validator, Form.Validator.adders);

Form.Validator.implement(Form.Validator.adders);

Form.Validator.add('IsEmpty', {

	errorMsg: false,
	test: function(element){
		if (element.type == 'select-one' || element.type == 'select')
			return !(element.selectedIndex >= 0 && element.options[element.selectedIndex].value != '');
		else
			return ((element.get('value') == null) || (element.get('value').length == 0));
	}

});

Form.Validator.addAllThese([

	['required', {
		errorMsg: function(){
			return Form.Validator.getMsg('required');
		},
		test: function(element){
			return !Form.Validator.getValidator('IsEmpty').test(element);
		}
	}],

	['length', {
		errorMsg: function(element, props){
			if (typeOf(props.length) != 'null')
				return Form.Validator.getMsg('length').substitute({length: props.length, elLength: element.get('value').length});
			else return '';
		},
		test: function(element, props){
			if (typeOf(props.length) != 'null') return (element.get('value').length == props.length || element.get('value').length == 0);
			else return true;
		}
	}],	

	['minLength', {
		errorMsg: function(element, props){
			if (typeOf(props.minLength) != 'null')
				return Form.Validator.getMsg('minLength').substitute({minLength: props.minLength, length: element.get('value').length});
			else return '';
		},
		test: function(element, props){
			if (typeOf(props.minLength) != 'null') return (element.get('value').length >= (props.minLength || 0));
			else return true;
		}
	}],

	['maxLength', {
		errorMsg: function(element, props){
			//props is {maxLength:10}
			if (typeOf(props.maxLength) != 'null')
				return Form.Validator.getMsg('maxLength').substitute({maxLength: props.maxLength, length: element.get('value').length});
			else return '';
		},
		test: function(element, props){
			return element.get('value').length <= (props.maxLength || 10000);
		}
	}],

	['validate-integer', {
		errorMsg: Form.Validator.getMsg.pass('integer'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(-?[1-9]\d*|0)$/).test(element.get('value'));
		}
	}],

	['validate-numeric', {
		errorMsg: Form.Validator.getMsg.pass('numeric'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) ||
				(/^-?(?:0$0(?=\d*\.)|[1-9]|0)\d*(\.\d+)?$/).test(element.get('value'));
		}
	}],

	['validate-digits', {
		errorMsg: Form.Validator.getMsg.pass('digits'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^[\d() .:\-\+#]+$/.test(element.get('value')));
		}
	}],

	['validate-alpha', {
		errorMsg: Form.Validator.getMsg.pass('alpha'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^[a-zA-Z]+$/).test(element.get('value'));
		}
	}],

	['validate-alphanum', {
		errorMsg: Form.Validator.getMsg.pass('alphanum'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || !(/\W/).test(element.get('value'));
		}
	}],

	['validate-date', {
		errorMsg: function(element, props){
			if (Date.parse){
				var format = props.dateFormat || '%x';
				return Form.Validator.getMsg('dateSuchAs').substitute({date: new Date().format(format)});
			} else {
				return Form.Validator.getMsg('dateInFormatMDY');
			}
		},
		test: function(element, props){
			if (Form.Validator.getValidator('IsEmpty').test(element)) return true;
			var dateLocale = Locale.getCurrent().sets.Date,
				dateNouns = new RegExp([dateLocale.days, dateLocale.days_abbr, dateLocale.months, dateLocale.months_abbr].flatten().join('|'), 'i'),
				value = element.get('value'),
				wordsInValue = value.match(/[a-z]+/gi);

				if (wordsInValue && !wordsInValue.every(dateNouns.exec, dateNouns)) return false;

				var date = Date.parse(value),
					format = props.dateFormat || '%x',
					formatted = date.format(format);

				if (formatted != 'invalid date') element.set('value', formatted);
				return date.isValid();
		}
	}],

	['validate-email', {
		errorMsg: Form.Validator.getMsg.pass('email'),
		test: function(element){
			/*
			var chars = "[a-z0-9!#$%&'*+/=?^_`{|}~-]",
				local = '(?:' + chars + '\\.?){0,63}' + chars,

				label = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?',
				hostname = '(?:' + label + '\\.)*' + label;

				octet = '(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
				ipv4 = '\\[(?:' + octet + '\\.){3}' + octet + '\\]',

				domain = '(?:' + hostname + '|' + ipv4 + ')';

			var regex = new RegExp('^' + local + '@' + domain + '$', 'i');
			*/
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]\.?){0,63}[a-z0-9!#$%&'*+\/=?^_`{|}~-]@(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\])$/i).test(element.get('value'));
		}
	}],

	['validate-url', {
		errorMsg: Form.Validator.getMsg.pass('url'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(https?|ftp|rmtp|mms):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i).test(element.get('value'));
		}
	}],

	['validate-currency-dollar', {
		errorMsg: Form.Validator.getMsg.pass('currencyDollar'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^\$?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/).test(element.get('value'));
		}
	}],

	['validate-one-required', {
		errorMsg: Form.Validator.getMsg.pass('oneRequired'),
		test: function(element, props){
			var p = document.id(props['validate-one-required']) || element.getParent(props['validate-one-required']);
			return p.getElements('input').some(function(el){
				if (['checkbox', 'radio'].contains(el.get('type'))) return el.get('checked');
				return el.get('value');
			});
		}
	}]

]);

Element.Properties.validator = {

	set: function(options){
		this.get('validator').setOptions(options);
	},

	get: function(){
		var validator = this.retrieve('validator');
		if (!validator){
			validator = new Form.Validator(this);
			this.store('validator', validator);
		}
		return validator;
	}

};

Element.implement({

	validate: function(options){
		if (options) this.set('validator', options);
		return this.get('validator').validate();
	}

});







/*
---

script: Form.Validator.Inline.js

name: Form.Validator.Inline

description: Extends Form.Validator to add inline messages.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - /Form.Validator

provides: [Form.Validator.Inline]

...
*/

Form.Validator.Inline = new Class({

	Extends: Form.Validator,

	options: {
		showError: function(errorElement){
			if (errorElement.reveal) errorElement.reveal();
			else errorElement.setStyle('display', 'block');
		},
		hideError: function(errorElement){
			if (errorElement.dissolve) errorElement.dissolve();
			else errorElement.setStyle('display', 'none');
		},
		scrollToErrorsOnSubmit: true,
		scrollToErrorsOnBlur: false,
		scrollToErrorsOnChange: false,
		scrollFxOptions: {
			transition: 'quad:out',
			offset: {
				y: -20
			}
		}
	},

	initialize: function(form, options){
		this.parent(form, options);
		this.addEvent('onElementValidate', function(isValid, field, className, warn){
			var validator = this.getValidator(className);
			if (!isValid && validator.getError(field)){
				if (warn) field.addClass('warning');
				var advice = this.makeAdvice(className, field, validator.getError(field), warn);
				this.insertAdvice(advice, field);
				this.showAdvice(className, field);
			} else {
				this.hideAdvice(className, field);
			}
		});
	},

	makeAdvice: function(className, field, error, warn){
		var errorMsg = (warn) ? this.warningPrefix : this.errorPrefix;
			errorMsg += (this.options.useTitles) ? field.title || error:error;
		var cssClass = (warn) ? 'warning-advice' : 'validation-advice';
		var advice = this.getAdvice(className, field);
		if (advice){
			advice = advice.set('html', errorMsg);
		} else {
			advice = new Element('div', {
				html: errorMsg,
				styles: { display: 'none' },
				id: 'advice-' + className.split(':')[0] + '-' + this.getFieldId(field)
			}).addClass(cssClass);
		}
		field.store('$moo:advice-' + className, advice);
		return advice;
	},

	getFieldId : function(field){
		return field.id ? field.id : field.id = 'input_' + field.name;
	},

	showAdvice: function(className, field){
		var advice = this.getAdvice(className, field);
		if (
			advice &&
			!field.retrieve('$moo:' + this.getPropName(className)) &&
			(
				advice.getStyle('display') == 'none' ||
				advice.getStyle('visiblity') == 'hidden' ||
				advice.getStyle('opacity') == 0
			)
		){
			field.store('$moo:' + this.getPropName(className), true);
			this.options.showError(advice);
			this.fireEvent('showAdvice', [field, advice, className]);
		}
	},

	hideAdvice: function(className, field){
		var advice = this.getAdvice(className, field);
		if (advice && field.retrieve('$moo:' + this.getPropName(className))){
			field.store('$moo:' + this.getPropName(className), false);
			this.options.hideError(advice);
			this.fireEvent('hideAdvice', [field, advice, className]);
		}
	},

	getPropName: function(className){
		return 'advice' + className;
	},

	resetField: function(field){
		field = document.id(field);
		if (!field) return this;
		this.parent(field);
		field.get('validators').each(function(className){
			this.hideAdvice(className, field);
		}, this);
		return this;
	},

	getAllAdviceMessages: function(field, force){
		var advice = [];
		if (field.hasClass('ignoreValidation') && !force) return advice;
		var validators = field.get('validators').some(function(cn){
			var warner = cn.test('^warn-') || field.hasClass('warnOnly');
			if (warner) cn = cn.replace(/^warn-/, '');
			var validator = this.getValidator(cn);
			if (!validator) return;
			advice.push({
				message: validator.getError(field),
				warnOnly: warner,
				passed: validator.test(),
				validator: validator
			});
		}, this);
		return advice;
	},

	getAdvice: function(className, field){
		return field.retrieve('$moo:advice-' + className);
	},

	insertAdvice: function(advice, field){
		//Check for error position prop
		var props = field.get('validatorProps');
		//Build advice
		if (!props.msgPos || !document.id(props.msgPos)){
			if (field.type && field.type.toLowerCase() == 'radio') field.getParent().adopt(advice);
			else advice.inject(document.id(field), 'after');
		} else {
			document.id(props.msgPos).grab(advice);
		}
	},

	validateField: function(field, force, scroll){
		var result = this.parent(field, force);
		if (((this.options.scrollToErrorsOnSubmit && scroll == null) || scroll) && !result){
			var failed = document.id(this).getElement('.validation-failed');
			var par = document.id(this).getParent();
			while (par != document.body && par.getScrollSize().y == par.getSize().y){
				par = par.getParent();
			}
			var fx = par.retrieve('$moo:fvScroller');
			if (!fx && window.Fx && Fx.Scroll){
				fx = new Fx.Scroll(par, this.options.scrollFxOptions);
				par.store('$moo:fvScroller', fx);
			}
			if (failed){
				if (fx) fx.toElement(failed);
				else par.scrollTo(par.getScroll().x, failed.getPosition(par).y - 20);
			}
		}
		return result;
	},

	watchFields: function(fields){
		fields.each(function(el){
		if (this.options.evaluateFieldsOnBlur){
			el.addEvent('blur', this.validationMonitor.pass([el, false, this.options.scrollToErrorsOnBlur], this));
		}
		if (this.options.evaluateFieldsOnChange){
				el.addEvent('change', this.validationMonitor.pass([el, true, this.options.scrollToErrorsOnChange], this));
			}
		}, this);
	}

});


/*
---

script: Form.Validator.Extras.js

name: Form.Validator.Extras

description: Additional validators for the Form.Validator class.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - /Form.Validator

provides: [Form.Validator.Extras]

...
*/
Form.Validator.addAllThese([

	['validate-enforce-oncheck', {
		test: function(element, props){
			var fv = element.getParent('form').retrieve('validator');
			if (!fv) return true;
			(props.toEnforce || document.id(props.enforceChildrenOf).getElements('input, select, textarea')).map(function(item){
				if (element.checked){
					fv.enforceField(item);
				} else {
					fv.ignoreField(item);
					fv.resetField(item);
				}
			});
			return true;
		}
	}],

	['validate-ignore-oncheck', {
		test: function(element, props){
			var fv = element.getParent('form').retrieve('validator');
			if (!fv) return true;
			(props.toIgnore || document.id(props.ignoreChildrenOf).getElements('input, select, textarea')).each(function(item){
				if (element.checked){
					fv.ignoreField(item);
					fv.resetField(item);
				} else {
					fv.enforceField(item);
				}
			});
			return true;
		}
	}],

	['validate-nospace', {
		errorMsg: function(){
			return Form.Validator.getMsg('noSpace');
		},
		test: function(element, props){
			return !element.get('value').test(/\s/);
		}
	}],

	['validate-toggle-oncheck', {
		test: function(element, props){
			var fv = element.getParent('form').retrieve('validator');
			if (!fv) return true;
			var eleArr = props.toToggle || document.id(props.toToggleChildrenOf).getElements('input, select, textarea');
			if (!element.checked){
				eleArr.each(function(item){
					fv.ignoreField(item);
					fv.resetField(item);
				});
			} else {
				eleArr.each(function(item){
					fv.enforceField(item);
				});
			}
			return true;
		}
	}],

	['validate-reqchk-bynode', {
		errorMsg: function(){
			return Form.Validator.getMsg('reqChkByNode');
		},
		test: function(element, props){
			return (document.id(props.nodeId).getElements(props.selector || 'input[type=checkbox], input[type=radio]')).some(function(item){
				return item.checked;
			});
		}
	}],

	['validate-required-check', {
		errorMsg: function(element, props){
			return props.useTitle ? element.get('title') : Form.Validator.getMsg('requiredChk');
		},
		test: function(element, props){
			return !!element.checked;
		}
	}],

	['validate-reqchk-byname', {
		errorMsg: function(element, props){
			return Form.Validator.getMsg('reqChkByName').substitute({label: props.label || element.get('type')});
		},
		test: function(element, props){
			var grpName = props.groupName || element.get('name');
			var oneCheckedItem = $$(document.getElementsByName(grpName)).some(function(item, index){
				return item.checked;
			});
			var fv = element.getParent('form').retrieve('validator');
			if (oneCheckedItem && fv) fv.resetField(element);
			return oneCheckedItem;
		}
	}],

	['validate-match', {
		errorMsg: function(element, props){
			return Form.Validator.getMsg('match').substitute({matchName: props.matchName || document.id(props.matchInput).get('name')});
		},
		test: function(element, props){
			var eleVal = element.get('value');
			var matchVal = document.id(props.matchInput) && document.id(props.matchInput).get('value');
			return eleVal && matchVal ? eleVal == matchVal : true;
		}
	}],

	['validate-after-date', {
		errorMsg: function(element, props){
			return Form.Validator.getMsg('afterDate').substitute({
				label: props.afterLabel || (props.afterElement ? Form.Validator.getMsg('startDate') : Form.Validator.getMsg('currentDate'))
			});
		},
		test: function(element, props){
			var start = document.id(props.afterElement) ? Date.parse(document.id(props.afterElement).get('value')) : new Date();
			var end = Date.parse(element.get('value'));
			return end && start ? end >= start : true;
		}
	}],

	['validate-before-date', {
		errorMsg: function(element, props){
			return Form.Validator.getMsg('beforeDate').substitute({
				label: props.beforeLabel || (props.beforeElement ? Form.Validator.getMsg('endDate') : Form.Validator.getMsg('currentDate'))
			});
		},
		test: function(element, props){
			var start = Date.parse(element.get('value'));
			var end = document.id(props.beforeElement) ? Date.parse(document.id(props.beforeElement).get('value')) : new Date();
			return end && start ? end >= start : true;
		}
	}],

	['validate-custom-required', {
		errorMsg: function(){
			return Form.Validator.getMsg('required');
		},
		test: function(element, props){
			return element.get('value') != props.emptyValue;
		}
	}],

	['validate-same-month', {
		errorMsg: function(element, props){
			var startMo = document.id(props.sameMonthAs) && document.id(props.sameMonthAs).get('value');
			var eleVal = element.get('value');
			if (eleVal != '') return Form.Validator.getMsg(startMo ? 'sameMonth' : 'startMonth');
		},
		test: function(element, props){
			var d1 = Date.parse(element.get('value'));
			var d2 = Date.parse(document.id(props.sameMonthAs) && document.id(props.sameMonthAs).get('value'));
			return d1 && d2 ? d1.format('%B') == d2.format('%B') : true;
		}
	}],


	['validate-cc-num', {
		errorMsg: function(element){
			var ccNum = element.get('value').replace(/[^0-9]/g, '');
			return Form.Validator.getMsg('creditcard').substitute({length: ccNum.length});
		},
		test: function(element){
			// required is a different test
			if (Form.Validator.getValidator('IsEmpty').test(element)) return true;

			// Clean number value
			var ccNum = element.get('value');
			ccNum = ccNum.replace(/[^0-9]/g, '');

			var valid_type = false;

			if (ccNum.test(/^4[0-9]{12}([0-9]{3})?$/)) valid_type = 'Visa';
			else if (ccNum.test(/^5[1-5]([0-9]{14})$/)) valid_type = 'Master Card';
			else if (ccNum.test(/^3[47][0-9]{13}$/)) valid_type = 'American Express';
			else if (ccNum.test(/^6011[0-9]{12}$/)) valid_type = 'Discover';

			if (valid_type){
				var sum = 0;
				var cur = 0;

				for (var i=ccNum.length-1; i>=0; --i){
					cur = ccNum.charAt(i).toInt();
					if (cur == 0) continue;

					if ((ccNum.length-i) % 2 == 0) cur += cur;
					if (cur > 9){
						cur = cur.toString().charAt(0).toInt() + cur.toString().charAt(1).toInt();
					}

					sum += cur;
				}
				if ((sum % 10) == 0) return true;
			}

			var chunks = '';
			while (ccNum != ''){
				chunks += ' ' + ccNum.substr(0,4);
				ccNum = ccNum.substr(4);
			}

			element.getParent('form').retrieve('validator').ignoreField(element);
			element.set('value', chunks.clean());
			element.getParent('form').retrieve('validator').enforceField(element);
			return false;
		}
	}]


]);


/*
---

name: Hash

description: Contains Hash Prototypes. Provides a means for overcoming the JavaScript practical impossibility of extending native Objects.

license: MIT-style license.

requires:
  - Core/Object
  - /MooTools.More

provides: [Hash]

...
*/

(function(){

if (this.Hash) return;

var Hash = this.Hash = new Type('Hash', function(object){
	if (typeOf(object) == 'hash') object = Object.clone(object.getClean());
	for (var key in object) this[key] = object[key];
	return this;
});

this.$H = function(object){
	return new Hash(object);
};

Hash.implement({

	forEach: function(fn, bind){
		Object.forEach(this, fn, bind);
	},

	getClean: function(){
		var clean = {};
		for (var key in this){
			if (this.hasOwnProperty(key)) clean[key] = this[key];
		}
		return clean;
	},

	getLength: function(){
		var length = 0;
		for (var key in this){
			if (this.hasOwnProperty(key)) length++;
		}
		return length;
	}

});

Hash.alias('each', 'forEach');

Hash.implement({

	has: Object.prototype.hasOwnProperty,

	keyOf: function(value){
		return Object.keyOf(this, value);
	},

	hasValue: function(value){
		return Object.contains(this, value);
	},

	extend: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.set(this, key, value);
		}, this);
		return this;
	},

	combine: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.include(this, key, value);
		}, this);
		return this;
	},

	erase: function(key){
		if (this.hasOwnProperty(key)) delete this[key];
		return this;
	},

	get: function(key){
		return (this.hasOwnProperty(key)) ? this[key] : null;
	},

	set: function(key, value){
		if (!this[key] || this.hasOwnProperty(key)) this[key] = value;
		return this;
	},

	empty: function(){
		Hash.each(this, function(value, key){
			delete this[key];
		}, this);
		return this;
	},

	include: function(key, value){
		if (this[key] == undefined) this[key] = value;
		return this;
	},

	map: function(fn, bind){
		return new Hash(Object.map(this, fn, bind));
	},

	filter: function(fn, bind){
		return new Hash(Object.filter(this, fn, bind));
	},

	every: function(fn, bind){
		return Object.every(this, fn, bind);
	},

	some: function(fn, bind){
		return Object.some(this, fn, bind);
	},

	getKeys: function(){
		return Object.keys(this);
	},

	getValues: function(){
		return Object.values(this);
	},

	toQueryString: function(base){
		return Object.toQueryString(this, base);
	}

});

Hash.alias({indexOf: 'keyOf', contains: 'hasValue'});


})();



/*
---

script: Hash.Cookie.js

name: Hash.Cookie

description: Class for creating, reading, and deleting Cookies in JSON format.

license: MIT-style license

authors:
  - Valerio Proietti
  - Aaron Newton

requires:
  - Core/Cookie
  - Core/JSON
  - /MooTools.More
  - /Hash

provides: [Hash.Cookie]

...
*/

Hash.Cookie = new Class({

	Extends: Cookie,

	options: {
		autoSave: true
	},

	initialize: function(name, options){
		this.parent(name, options);
		this.load();
	},

	save: function(){
		var value = JSON.encode(this.hash);
		if (!value || value.length > 4096) return false; //cookie would be truncated!
		if (value == '{}') this.dispose();
		else this.write(value);
		return true;
	},

	load: function(){
		this.hash = new Hash(JSON.decode(this.read(), true));
		return this;
	}

});

Hash.each(Hash.prototype, function(method, name){
	if (typeof method == 'function') Hash.Cookie.implement(name, function(){
		var value = method.apply(this.hash, arguments);
		if (this.options.autoSave) this.save();
		return value;
	});
});


/*
---

script: Tips.js

name: Tips

description: Class for creating nice tips that follow the mouse cursor when hovering an element.

license: MIT-style license

authors:
  - Valerio Proietti
  - Christoph Pojer
  - Luis Merino

requires:
  - Core/Options
  - Core/Events
  - Core/Element.Event
  - Core/Element.Style
  - Core/Element.Dimensions
  - /MooTools.More

provides: [Tips]

...
*/

(function(){

var read = function(option, element){
	return (option) ? (typeOf(option) == 'function' ? option(element) : element.get(option)) : '';
};

this.Tips = new Class({

	Implements: [Events, Options],

	options: {/*
		id: null,
		onAttach: function(element){},
		onDetach: function(element){},
		onBound: function(coords){},*/
		onShow: function(){
			this.tip.setStyle('display', 'block');
		},
		onHide: function(){
			this.tip.setStyle('display', 'none');
		},
		title: 'title',
		text: function(element){
			return element.get('rel') || element.get('href');
		},
		showDelay: 100,
		hideDelay: 100,
		className: 'tip-wrap',
		offset: {x: 16, y: 16},
		windowPadding: {x:0, y:0},
		fixed: false,
		waiAria: true
	},

	initialize: function(){
		var params = Array.link(arguments, {
			options: Type.isObject,
			elements: function(obj){
				return obj != null;
			}
		});
		this.setOptions(params.options);
		if (params.elements) this.attach(params.elements);
		this.container = new Element('div', {'class': 'tip'});

		if (this.options.id){
			this.container.set('id', this.options.id);
			if (this.options.waiAria) this.attachWaiAria();
		}
	},

	toElement: function(){
		if (this.tip) return this.tip;

		this.tip = new Element('div', {
			'class': this.options.className,
			styles: {
				position: 'absolute',
				top: 0,
				left: 0
			}
		}).adopt(
			new Element('div', {'class': 'tip-top'}),
			this.container,
			new Element('div', {'class': 'tip-bottom'})
		);

		return this.tip;
	},

	attachWaiAria: function(){
		var id = this.options.id;
		this.container.set('role', 'tooltip');

		if (!this.waiAria){
			this.waiAria = {
				show: function(element){
					if (id) element.set('aria-describedby', id);
					this.container.set('aria-hidden', 'false');
				},
				hide: function(element){
					if (id) element.erase('aria-describedby');
					this.container.set('aria-hidden', 'true');
				}
			};
		}
		this.addEvents(this.waiAria);
	},

	detachWaiAria: function(){
		if (this.waiAria){
			this.container.erase('role');
			this.container.erase('aria-hidden');
			this.removeEvents(this.waiAria);
		}
	},

	attach: function(elements){
		$$(elements).each(function(element){
			var title = read(this.options.title, element),
				text = read(this.options.text, element);

			element.set('title', '').store('tip:native', title).retrieve('tip:title', title);
			element.retrieve('tip:text', text);
			this.fireEvent('attach', [element]);

			var events = ['enter', 'leave'];
			if (!this.options.fixed) events.push('move');

			events.each(function(value){
				var event = element.retrieve('tip:' + value);
				if (!event) event = function(event){
					this['element' + value.capitalize()].apply(this, [event, element]);
				}.bind(this);

				element.store('tip:' + value, event).addEvent('mouse' + value, event);
			}, this);
		}, this);

		return this;
	},

	detach: function(elements){
		$$(elements).each(function(element){
			['enter', 'leave', 'move'].each(function(value){
				element.removeEvent('mouse' + value, element.retrieve('tip:' + value)).eliminate('tip:' + value);
			});

			this.fireEvent('detach', [element]);

			if (this.options.title == 'title'){ // This is necessary to check if we can revert the title
				var original = element.retrieve('tip:native');
				if (original) element.set('title', original);
			}
		}, this);

		return this;
	},

	elementEnter: function(event, element){
		clearTimeout(this.timer);
		this.timer = (function(){
			this.container.empty();

			['title', 'text'].each(function(value){
				var content = element.retrieve('tip:' + value);
				var div = this['_' + value + 'Element'] = new Element('div', {
						'class': 'tip-' + value
					}).inject(this.container);
				if (content) this.fill(div, content);
			}, this);
			this.show(element);
			this.position((this.options.fixed) ? {page: element.getPosition()} : event);
		}).delay(this.options.showDelay, this);
	},

	elementLeave: function(event, element){
		clearTimeout(this.timer);
		this.timer = this.hide.delay(this.options.hideDelay, this, element);
		this.fireForParent(event, element);
	},

	setTitle: function(title){
		if (this._titleElement){
			this._titleElement.empty();
			this.fill(this._titleElement, title);
		}
		return this;
	},

	setText: function(text){
		if (this._textElement){
			this._textElement.empty();
			this.fill(this._textElement, text);
		}
		return this;
	},

	fireForParent: function(event, element){
		element = element.getParent();
		if (!element || element == document.body) return;
		if (element.retrieve('tip:enter')) element.fireEvent('mouseenter', event);
		else this.fireForParent(event, element);
	},

	elementMove: function(event, element){
		this.position(event);
	},

	position: function(event){
		if (!this.tip) document.id(this);

		var size = window.getSize(), scroll = window.getScroll(),
			tip = {x: this.tip.offsetWidth, y: this.tip.offsetHeight},
			props = {x: 'left', y: 'top'},
			bounds = {y: false, x2: false, y2: false, x: false},
			obj = {};

		for (var z in props){
			obj[props[z]] = event.page[z] + this.options.offset[z];
			if (obj[props[z]] < 0) bounds[z] = true;
			if ((obj[props[z]] + tip[z] - scroll[z]) > size[z] - this.options.windowPadding[z]){
				obj[props[z]] = event.page[z] - this.options.offset[z] - tip[z];
				bounds[z+'2'] = true;
			}
		}

		this.fireEvent('bound', bounds);
		this.tip.setStyles(obj);
	},

	fill: function(element, contents){
		if (typeof contents == 'string') element.set('html', contents);
		else element.adopt(contents);
	},

	show: function(element){
		if (!this.tip) document.id(this);
		if (!this.tip.getParent()) this.tip.inject(document.body);
		this.fireEvent('show', [this.tip, element]);
	},

	hide: function(element){
		if (!this.tip) document.id(this);
		this.fireEvent('hide', [this.tip, element]);
	}

});

})();


/*
---

name: Locale.pt-PT.Date

description: Date messages for Portuguese.

license: MIT-style license

authors:
  - Fabio Miranda Costa

requires:
  - /Locale

provides: [Locale.pt-PT.Date]

...
*/

Locale.define('pt-PT', 'Date', {

	months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
	months_abbr: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
	days: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
	days_abbr: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],

	// Culture's date order: DD-MM-YYYY
	dateOrder: ['date', 'month', 'year'],
	shortDate: '%d-%m-%Y',
	shortTime: '%H:%M',
	AM: 'AM',
	PM: 'PM',
	firstDayOfWeek: 1,

	// Date.Extras
	ordinal: 'º',

	lessThanMinuteAgo: 'há menos de um minuto',
	minuteAgo: 'há cerca de um minuto',
	minutesAgo: 'há {delta} minutos',
	hourAgo: 'há cerca de uma hora',
	hoursAgo: 'há cerca de {delta} horas',
	dayAgo: 'há um dia',
	daysAgo: 'há {delta} dias',
	weekAgo: 'há uma semana',
	weeksAgo: 'há {delta} semanas',
	monthAgo: 'há um mês',
	monthsAgo: 'há {delta} meses',
	yearAgo: 'há um ano',
	yearsAgo: 'há {delta} anos',

	lessThanMinuteUntil: 'em menos de um minuto',
	minuteUntil: 'em um minuto',
	minutesUntil: 'em {delta} minutos',
	hourUntil: 'em uma hora',
	hoursUntil: 'em {delta} horas',
	dayUntil: 'em um dia',
	daysUntil: 'em {delta} dias',
	weekUntil: 'em uma semana',
	weeksUntil: 'em {delta} semanas',
	monthUntil: 'em um mês',
	monthsUntil: 'em {delta} meses',
	yearUntil: 'em um ano',
	yearsUntil: 'em {delta} anos'

});


/*
---

name: Locale.pt-BR.Date

description: Date messages for Portuguese (Brazil).

license: MIT-style license

authors:
  - Fabio Miranda Costa

requires:
  - /Locale
  - /Locale.pt-PT.Date

provides: [Locale.pt-BR.Date]

...
*/

Locale.define('pt-BR', 'Date', {

	// Culture's date order: DD/MM/YYYY
	shortDate: '%d/%m/%Y'

}).inherit('pt-PT', 'Date');


/*
---

name: Locale.pt-BR.Form.Validator

description: Form Validator messages for Portuguese (Brazil).

license: MIT-style license

authors:
  - Fábio Miranda Costa

requires:
  - /Locale

provides: [Locale.pt-BR.Form.Validator]

...
*/

Locale.define('pt-BR', 'FormValidator', {

	required: 'Este campo é obrigatório.',
	minLength: 'Digite pelo menos {minLength} caracteres (tamanho atual: {length}).',
	maxLength: 'Não digite mais de {maxLength} caracteres (tamanho atual: {length}).',
	integer: 'Por favor digite apenas um número inteiro neste campo. Não são permitidos números decimais (por exemplo, 1,25).',
	numeric: 'Por favor digite apenas valores numéricos neste campo (por exemplo, "1" ou "1.1" ou "-1" ou "-1,1").',
	digits: 'Por favor use apenas números e pontuação neste campo (por exemplo, um número de telefone com traços ou pontos é permitido).',
	alpha: 'Por favor use somente letras (a-z). Espaço e outros caracteres não são permitidos.',
	alphanum: 'Use somente letras (a-z) ou números (0-9) neste campo. Espaço e outros caracteres não são permitidos.',
	dateSuchAs: 'Digite uma data válida, como {date}',
	dateInFormatMDY: 'Digite uma data válida, como DD/MM/YYYY (por exemplo, "31/12/1999")',
	email: 'Digite um endereço de email válido. Por exemplo "nome@dominio.com".',
	url: 'Digite uma URL válida. Exemplo: http://www.example.com.',
	currencyDollar: 'Digite um valor em dinheiro válido. Exemplo: R$100,00 .',
	oneRequired: 'Digite algo para pelo menos um desses campos.',
	errorPrefix: 'Erro: ',
	warningPrefix: 'Aviso: ',

	// Form.Validator.Extras
	noSpace: 'Não é possível digitar espaços neste campo.',
	reqChkByNode: 'Não foi selecionado nenhum item.',
	requiredChk: 'Este campo é obrigatório.',
	reqChkByName: 'Por favor digite um {label}.',
	match: 'Este campo deve ser igual ao campo {matchName}.',
	startDate: 'a data inicial',
	endDate: 'a data final',
	currendDate: 'a data atual',
	afterDate: 'A data deve ser igual ou posterior a {label}.',
	beforeDate: 'A data deve ser igual ou anterior a {label}.',
	startMonth: 'Por favor selecione uma data inicial.',
	sameMonth: 'Estas duas datas devem ter o mesmo mês - você deve modificar uma das duas.',
	creditcard: 'O número do cartão de crédito informado é inválido. Por favor verifique o valor e tente novamente. {length} números informados.'

});

