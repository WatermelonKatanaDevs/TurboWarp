const fetch = require('cross-fetch');

async function send(url, type) {
  const response = await fetch(url, { timeout: 1e4 });
  if (response.status >= 206) {
    throw response.status;
  }
  return response[type]();
}

module.exports = { send };
