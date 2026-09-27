const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escapehtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => entities[char]);
}

function inline(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function escaperegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wraplibraries(json) {
  let libraries = "";
  for (const library of json.libraries || []) {
    const lib = library.name;
    const funcs = (library.functions || []).map(escaperegex).join("|");
    let src = library.source || "";
    if (funcs) {
      const pattern = new RegExp(`(?<!\\(\\s*|(?<!\\/\\/.*|\\/\\*[^\\*\\/]*|["'][^'"]*)function\\s+[\\S]+\\s*\\(\\)\\s*{[^}]+)function\\s+(${funcs})\\s*(?=\\()`, "g");
      src = src.replace(pattern, "var $1 = this.$1 = function");
    }
    libraries += `var ${lib} = window[${JSON.stringify(lib)}] || {};
(function ${lib}() {\n${src}\nreturn(this)\n}).bind(${lib})();\n`;
  }
  return libraries + (json.source || "");
}

module.exports = { escapehtml, inline, wraplibraries };
