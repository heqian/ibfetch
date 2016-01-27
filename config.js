"use strict";

module.exports = {
	ib: {
		host: "127.0.0.1",	// the IP address of machine running IB Trader Workstation (TWS) or IB Gateway (IBG) 
		clientId: 200,		// any number
		port: 7496			// port number, 7496 (default for TWS) or 4002 (default for IBG)
	},
	what: "MIDPOINT",		// "TRADES", "BID", "ASK", "MIDPOINT"
	size: "1 min"			// bar size of each entry in the .CSV file
	// "1 sec", "5 secs", "15 secs", "30 secs", "1 min", "2 mins", "3 mins", "5 mins", "15 mins", "30 mins", "1 hour", "1 day"
};
