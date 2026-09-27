const fetch = require('cross-fetch');
const dns = require('dns');
const net = require('net');
const http = require('http');
const https = require('https');
const { Database } = require("./database");
const speech = require('./speech');
let initalized = false;

const blocked = new net.BlockList();
for (const [address, prefix, type] of [
  ["0.0.0.0", 8, "ipv4"], ["10.0.0.0", 8, "ipv4"], ["100.64.0.0", 10, "ipv4"], ["127.0.0.0", 8, "ipv4"],
  ["169.254.0.0", 16, "ipv4"], ["172.16.0.0", 12, "ipv4"], ["192.0.0.0", 24, "ipv4"], ["192.168.0.0", 16, "ipv4"],
  ["198.18.0.0", 15, "ipv4"], ["224.0.0.0", 3, "ipv4"], ["::", 127, "ipv6"], ["64:ff9b::", 96, "ipv6"], ["fc00::", 7, "ipv6"], ["fe80::", 10, "ipv6"], ["ff00::", 8, "ipv6"],
]) {
  blocked.addSubnet(address, prefix, type);
}
const headers = { "Content-Security-Policy": "sandbox", "X-Content-Type-Options": "nosniff" };
const retries = 3;
const redirects = 5;

function isblocked(address) {
  return blocked.check(address, net.isIPv6(address) ? "ipv6" : "ipv4");
}

function safelookup(hostname, options, callback) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) {
      return callback(err);
    }
    if (addresses.length === 0 || addresses.some(entry => isblocked(entry.address))) {
      return callback(new Error(`blocked address for ${hostname}`));
    }
    if (options.all) {
      return callback(null, addresses);
    }
    callback(null, addresses[0].address, addresses[0].family);
  });
}

const agents = {
  "http:": new http.Agent({ lookup: safelookup }),
  "https:": new https.Agent({ lookup: safelookup }),
};

function target(url) {
  const parsed = new URL(url);
  if (!Object.hasOwn(agents, parsed.protocol)) {
    throw 400;
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && isblocked(host)) {
    throw 403;
  }
  return parsed.href;
}

async function recall(url) {
  for (let attempt = 0, hops = 0; ;) {
    const response = await fetch(target(url), { redirect: "manual", agent: parsed => agents[parsed.protocol], timeout: 1e4 });
    const location = response.headers.get("Location");
    if (response.status > 299 && response.status < 400 && location) {
      response.body.resume();
      if (++hops > redirects) {
        throw 508;
      }
      url = new URL(location, url).href;
    } else if (response.status === 429 && ++attempt <= retries) {
      response.body.resume();
      await new Promise(resolve => setTimeout(resolve, 2e3));
    } else if (response.status < 206) {
      return response;
    } else {
      response.body.resume();
      throw 400;
    }
  }
}

function fail(res, err) {
  res.status(Number.isInteger(err) ? err : 400).end();
}

class Host {
  constructor(app) {
    if (initalized) {
      return;
    }
    initalized = true;
    // Applabs patch for local use
    app.get("/xhr", async (req, res) => {
      try {
        const response = await recall(req.query.u);
        const data = await response.text();
        res.set(headers).type(response.headers.get("Content-Type") || "text/plain").status(200).send(data);
      } catch (err) {
        fail(res, err);
      }
    })
    // Works for audio video or images
    app.get("/media", async (req, res) => {
      try {
        const response = await recall(req.query.u);
        const type = response.headers.get("Content-Type") || "";
        if (!type.startsWith("image") && !type.startsWith("audio")) {
          response.body.resume();
          throw 415;
        }
        res.set(headers).type(type);
        response.body.on("error", () => res.destroy()).pipe(res);
      } catch (err) {
        fail(res, err);
      }
    })
    // TTS Standin for Azure
    app.get("/speech", async (req, res) => {
      try {
        const stream = await speech.talkStream(req.query.text, req.query.voice);
        res.type("audio/mpeg");
        stream.on("error", () => res.destroy()).pipe(res);
      } catch (err) {
        console.log(err);
        fail(res, 400);
      }
    })
    new Database(app);
  }
}

module.exports = {
  Host
}
