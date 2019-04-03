"use strict";

require("colors");
var util = require("util");
var path = require("path");
var fs = require("fs");
var ib = require("ib");
var moment = require("moment");
var config = require("./config.js");

var CSV_HEADER = "date,symbol,what,open,high,low,close,volume\n";

var requestId = 0;
var endDate = moment();
var timestamps = [];
var timer;
var history = [];

var ticker;
var SIZE_TABLE = {
	"1 sec": "1800 S",
	"5 secs": "7200 S",
	"15 secs": "14400 S",
	"30 secs": "28800 S",
	"1 min": "1 D",
	"2 mins": "2 D",
	"3 mins": "1 W",
	"5 mins": "1 W",
	"15 mins": "2 W",
	"30 mins": "1 M",
	"1 hour": "1 M",
	"1 day": "1 Y"
};

function usage() {
	console.error("Usage: ".yellow + "node %s ".green + "[combo|forex|future|option|stock] [symbol] [<args>]".red, path.basename(__filename));
}

var ibMonitor = new ib({
	clientId: config.ib.clientId,
	host: config.ib.host,
	port: config.ib.port
}).on("error", function(err) {
	console.error("[%s][Monitor][Error] %s".red, new Date().toString(), err.message);
	if (err.message.indexOf("Historical data request pacing violation") > -1) {
		console.log("[WAIT] Will wait 10 minutes until %s before resuming.".yellow, new Date(new Date().getTime() + 10 * 60 * 1000).toString());
		timestamps = [];
		clearTimeout(timer);
		timer = setTimeout(requestHistory, 10 * 60 * 1000);
	} else if (err.message.indexOf("Unknown incoming") > -1) {
		clearTimeout(timer);
		timer = setTimeout(requestHistory, shouldWaitTime());
	} else if (err.message.indexOf("HMDS query returned no data") > -1) {
		next();
	}
}).on("connected", function() {
	console.log("[%s][Monitor][Connected]".green, new Date().toString());
	timer = setTimeout(requestHistory, 3 * 1000);
	fs.writeFileSync(util.format("%s_%s.csv", ticker.symbol, ticker.secType), CSV_HEADER, { flag: "w" });
}).on("disconnected", function() {
	console.log("[%s][Monitor][Disconnected]".green, new Date().toString());
}).on("server", function(version, connectionTime) {
	console.log("[%s][Monitor][Server] version: %s, connectionTime: %s".green, new Date().toString(), version, connectionTime);
}).on("historicalData", function(reqId, date, open, high, low, close, volume, barCount, WAP, hasGaps) {
	// Save history to database
	if (!isNaN(date)) {
		var bar = {
			date: new Date(parseInt(date) * 1000),
			open: open,
			high: high,
			low: low,
			close: close,
			volume: volume,
			barCount: barCount,
			WAP: WAP,
			hasGaps: hasGaps
		};

		history.push(bar);
	} else {
		if (date) {
			if (date.indexOf("finished") === 0) {
				console.log("[PROGRESS: FINIHSED] ".green + date);

				// Write data to CSV file
				history = history.reverse();
				for (var i = 0; i < history.length; i++) {
					var entry = history[i];
					var line = util.format("%s,%s,%s,%s,%s,%s,%s,%s\n", entry.date, ticker.symbol, config.what, entry.open, entry.high, entry.low, entry.close, entry.volume);
					fs.writeFileSync(util.format("%s_%s.csv", ticker.symbol, ticker.secType), line, { flag: "a" });
				}
				history = [];

				// Next round
				next();
			} else {
				console.log("[UNKNOWN DATE] ".red + date);
			}
		}
	}

});

function next() {
	var step = SIZE_TABLE[config.size].split(" ");
	var number = parseInt(step[0]);
	var unit = step[1];
	switch (unit) {
		case "S":
			unit = "seconds";
			break;
		case "D":
			unit = "days";
			break;
		case "W":
			unit = "weeks";
			break;
		case "M":
			unit = "months";
			break;
		case "Y":
			unit = "years";
			break;
		default:
			unit = "seconds";
	}
	endDate.subtract(number, unit);
	timer = setTimeout(requestHistory, shouldWaitTime());
}

function requestHistory() {
	console.log("[PROGRESS: REQUESTED] ".yellow + endDate.format("YYYYMMDD HH:mm:ss"));
	requestId++;
	ibMonitor.reqHistoricalData(requestId, ticker, endDate.format("YYYYMMDD HH:mm:ss"), SIZE_TABLE[config.size], config.size, config.what, 0, 2);
	timestamps.push(new Date());
}

function shouldWaitTime() { // milliseconds
	var waitTimeA;
	var waitTimeB;
	var now = new Date();

	// Violation: Making six or more historical data requests for the same Contract, Exchange and Tick Type within two seconds.
	if (timestamps.length >= 3) {
		if (now.getTime() - timestamps[timestamps.length - 3].getTime() > 2000) {
			waitTimeA = 0;
		} else {
			waitTimeA = timestamps[timestamps.length - 3].getTime() + 2000 - now.getTime();
		}
	} else {
		waitTimeA = 0;
	}

	// Violation: Do not make more than 60 historical data requests in any ten-minute period.
	if (timestamps.length >= 59) {
		if (now.getTime() - timestamps[timestamps.length - 59].getTime() > 10 * 60 * 1000) {
			waitTimeB = 0;
		} else {
			waitTimeB = timestamps[timestamps.length - 59].getTime() + 10 * 60 * 1000 - now.getTime();
		}
		while (timestamps.length > 59) timestamps.shift();
	} else {
		waitTimeB = 0;
	}

	var waitTime = waitTimeB > waitTimeA ? waitTimeB : waitTimeA;
	if (waitTime > 0) {
		console.log("[WAIT] Need to wait %d seconds until %s".yellow, (waitTime / 1000).toFixed(3), new Date(now.getTime() + waitTime).toString());
	}
	return waitTime;
}

if (process.argv.length < 3) {
	usage();
} else {
	switch (process.argv[2]) {
		case "combo":
			if (process.argv.length >= 4) {
				ticker = ib.contract.combo(process.argv[3]);
				ibMonitor.connect();
			} else {
				console.error("Usage: ".yellow + "combo ".green + "[symbol]");
			}
			break;
		case "forex":
			if (process.argv.length >= 4) {
				ticker = ib.contract.forex(process.argv[3]);
				ibMonitor.connect();
			} else {
				console.error("Usage: ".yellow + "forex ".green + "[symbol]");
			}
			break;
		case "future":
			if (process.argv.length >= 5) {
				ticker = ib.contract.future(process.argv[3], process.argv[4]);
				ibMonitor.connect();
			} else {
				console.error("Usage: ".yellow + "future ".green + "[symbol] [expiry <YYYYMM>]");
			}
			break;
		case "option":
			if (process.argv.length >= 7) {
				ticker = ib.contract.option(
					process.argv[3].toUpperCase(),	// symbol
					process.argv[4],				// expiry
					parseFloat(process.argv[5]),	// strike
					process.argv[6].toUpperCase()	// right
				);
				ibMonitor.connect();
			} else {
				console.error("Usage: ".yellow + "option ".green + "[symbol] [expiry <YYYYMM>] [strike] [right <CALL|PUT|C|P>]");
			}
			break;
		case "stock":
			if (process.argv.length >= 4) {
				ticker = ib.contract.stock(process.argv[3]);
				ibMonitor.connect();
			} else {
				console.error("Usage: ".yellow + "stock ".green + "[symbol]");
			}
			break;
		default:
			usage();
	}
}
