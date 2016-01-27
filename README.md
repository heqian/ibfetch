# ibfetch
A Node.js module for fetching historical data from Interactive Brokers.

## Requirements
* Node.js, [https://nodejs.org](https://nodejs.org)
* NPM, [https://www.npmjs.com](https://www.npmjs.com)

## Installation
```sh
git clone https://github.com/heqian/ibfetch.git
cd ibfetch/
npm install
```

## Usage
* `node index.js combo [symbol]`
* `node index.js forex [symbol]`
* `node index.js future [symbol] [expiry <YYYYMM>]`
* `node index.js option [symbol] [expiry <YYYYMM>] [strike] [right <CALL|PUT|C|P>]`
* `node index.js stock [symbol]`

## Examples
* `node index.js combo FIT`
* `node index.js forex EUR`
* `node index.js future FIT 201602`
* `node index.js option FIT 201601 20.0 CALL`
* `node index.js stock FIT`

## Step by Step
0. Launch IB Trader Workstation or IB Gateway;
0. Open terminal and enter the directory of ibfetch;
0. Execute any command demostrated in [Usage](#usage) section;
0. Press **Ctrl+C** when you think ibfetch has fetched enough data;
0. A file with name **[SYMBOL]_[SECURITY TYPE].csv** (e.g., "FIT_OPT.csv") will be generated.

## Advanced Configuration
Edit the config.js file
```js
{
	ib: {
		host: "127.0.0.1",	// the IP address of machine running IB Trader Workstation (TWS) or IB Gateway (IBG) 
		clientId: 200,		// any number
		port: 7496			// port number, 7496 (default for TWS) or 4002 (default for IBG)
	},
	what: "MIDPOINT",		// "TRADES", "BID", "ASK", "MIDPOINT"
	size: "1 min"			// "1 sec", "5 secs", "15 secs", "30 secs", "1 min", "2 mins", "3 mins", "5 mins", "15 mins", "30 mins", "1 hour", "1 day"
}
```
