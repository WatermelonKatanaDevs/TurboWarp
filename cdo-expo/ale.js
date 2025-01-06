const fs = require("fs");
const request = require('./requests');
const startPath = "https://studio.code.org";
let projectPath = "./";

async function exportProject(dirname, id) {
  return new Promise(async (resolve, reject) => {
    projectPath = dirname || projectPath;
    id = id || fs.readFileSync(`${projectPath}/index.html`, "utf-8").match(/(?<=applab\/).*(?=\/export_config)/)[0];
    fs.cpSync("./applab", projectPath, { recursive: true })
    let source = await request.send(`${startPath}/v3/sources/${id}/main.json`, 'json');
    await getCode(source);
    await getHTML(source.html, id);
    resolve(true);
  })
}

async function getCode(json) {
  let libraries = ``;
  json.libraries = json.libraries || [];
  json.libraries.forEach((library) => {
    let lib = library.name;
    let src = library.source;
    let funcs = library.functions.join("|");
    let pattern = new RegExp(`(?<!\\(\\s*|(?<!\\/\\/.*|\\/\\*[^\\*\\/]*|["'][^'"]*)function\\s+[\\S]+\\s*\\(\\)\\s*{[^}]+)function\\s+(${funcs})\\s*(?=\\()`, "g");
    src = src.replace(pattern, `var $1 = this.$1 = function`);
    libraries += `var ${lib} = window[${JSON.stringify(lib)}] || {};
(function ${lib}() {\n${src}\nreturn(this)\n}).bind(${lib})();\n`;
  });
  await addFile("/code.js", Buffer.from(`Object.defineProperties(Object.prototype,{apply:{value:function(fn,args){if(typeof this==="object"&&"length"in this){return Function.prototype.apply.call(this,fn,args)}},enumerable:false,configurable:true,writable:true},concat:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.concat.apply(this,arguments)}return[]},enumerable:false,configurable:true,writable:true},every:{value:function(cb,_this){if(typeof this==="object"&&"length"in this){return Array.prototype.every.call(this,cb,_this)}return false},enumerable:false,configurable:true,writable:true},indexOf:{value:function(search,fromIndex){if(typeof this==="object"&&"length"in this){return Array.prototype.indexOf.call(this,search,fromIndex)}return -1},enumerable:false,configurable:true,writable:true},filter:{value:function(cb,_this){if(typeof this==="object"&&"length"in this){return Array.prototype.filter.call(this,cb,_this)}return[]},enumerable:false,configurable:true,writable:true},forEach:{value:function(cb,_this){if(typeof this==="object"&&"length"in this){return Array.prototype.forEach.call(this,cb,_this)}},enumerable:false,configurable:true,writable:true},join:{value:function(separator){if(typeof this==="object"&&"length"in this){return Array.prototype.join.call(this,separator)}return ""},enumerable:false,configurable:true,writable:true},lastIndexOf:{value:function(search,fromIndex){if(typeof this==="object"&&"length"in this){return Array.prototype.lastIndexOf.call(this,search,fromIndex)}return -1},enumerable:false,configurable:true,writable:true},map:{value:function(cb,_this){if(typeof this==="object"&&"length"in this){const mapped=[];for(let i in this){mapped.push(cb.call(_this,this[i],Number(i)))}return mapped}},enumerable:false,configurable:true,writable:true},push:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.push.apply(this,arguments)}return 0},enumerable:false,configurable:true,writable:true},pop:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.pop.apply(this)}return undefined},enumerable:false,configurable:true,writable:true},reduce:{value:function(cb,startValue){if(typeof this==="object"&&"length"in this){return Array.prototype.reduce.call(this,cb,startValue)}throw new TypeError("Cannot call reduce on a non-array object")},enumerable:false,configurable:true,writable:true},some:{value:function(cb,_this){if(typeof this==="object"&&"length"in this){return Array.prototype.some.call(this,cb,_this)}return false},enumerable:false,configurable:true,writable:true},shift:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.shift.call(this)}return undefined},enumerable:false,configurable:true,writable:true},splice:{value:function(start,amount,...items){if(typeof this==="object"&&"length"in this){return Array.prototype.splice.call(this,start,amount,...items)}return[]},enumerable:false,configurable:true,writable:true},unshift:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.unshift.apply(this,arguments)}return 0},enumerable:false,configurable:true,writable:true},reverse:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.reverse.call(this)}return this},enumerable:false,configurable:true,writable:true},slice:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.slice.apply(this,arguments)}},enumerable:false,configurable:true,writable:true},sort:{value:function(cb){if(typeof this==="object"&&"length"in this){return Array.prototype.sort.call(this,cb)}return this},enumerable:false,configurable:true,writable:true}});` + libraries + json.source));
}

async function getHTML(html, id) {
  const dependency = "applab";
  html = html.replace(/["'](\/v3\/assets\/[^'"]+)['"]/g, startPath + "$1");
  html = `<html>
  <head>
    <title>${(await request.send(`${startPath}/v3/channels/${id}`, "json")).name}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="preload" href="${dependency}/fa-brands-400.woff2" as="font">
    <link rel="preload" href="${dependency}/fa-solid-900.woff2" as="font">
    <link rel="preload" href="${dependency}/fa-regular-400.woff2" as="font">
    <link rel="preload" href="${dependency}/fa-v4compatibility.woff2" as="font">
    <script src="https://code.jquery.com/jquery-1.12.1.min.js"></script>
    <script>
      window.EXPORT_OPTIONS = {channel: "${id}", useDatablockStorage: true};
      function setExportConfig(config) { window.EXPORT_OPTIONS = Object.assign(config, EXPORT_OPTIONS)}
    </script>
    <script src="https://studio.code.org/projects/applab/${id}/export_config?script_call=setExportConfig"></script>
    <script>
    window.inject = function() {
      ;(function(){const id="${id}";const api=function(t,r,n){let x=new XMLHttpRequest(),v;x.onreadystatechange=function(){if(this.readyState===4){if(x.status>199&&x.status<400){r=typeof x.response==="string"?JSON.parse(x.response):x.response;v=r===null?void 0:r}else{throw x.status}}};x.onerror=function(){throw x};if(r.toUpperCase()==="GET"){x.open("GET","/datablock_storage/"+id+"/"+t+"?"+new URLSearchParams(n),false);x.send()}else{x.open(r,"/datablock_storage/"+id+"/"+t,false);x.setRequestHeader("Content-Type","application/json");x.setRequestHeader("X-Requested-With","XMLHttpRequest");x.setRequestHeader("X-CSRF-Token",localStorage.userId);x.withCredentials=true;x.send(JSON.stringify(n))}return v};const handleSuccess=function(v){typeof this==="function"&&this(v)};const handleError=function(e){(typeof this==="function"?this:console.warn)(e)};Object.defineProperties(window,{setKeyValueSync:{value:function(k,v,c,e){t=handleSuccess.bind(c);r=handleError.bind(e);try{if(typeof k!=="string"){throw "invalid param: key unreachable"}t(api("set_key_value","POST",{key:k,value:JSON.stringify(v)}))}catch(e){r(e)}},writable:false},getKeyValueSync:{value:function(k,c,e){t=handleSuccess.bind(c);r=handleError.bind(e);try{if(typeof k!=="string"){throw "invalid param: key unreachable"}t(api("get_key_value","GET",{key:k}))}catch(e){r(e)}},writable:false},getColumn:{value:function(t,c,y,n){x=handleSuccess.bind(y);z=handleError.bind(n);try{if(typeof t!=="string"||typeof c!=="string"){throw "invalad param(s): table or column is not a string"}let column=api("get_column","GET",{table_name:t,column_name:c});if(column===void 0){throw "table or column has not been added to the dataset"}return x(column),column}catch(e){z(e)}},writable:false},createRecordSync:{value:function(t,r,y,n){x=handleSuccess.bind(y);z=handleError.bind(n);try{if(typeof t!=="string"||typeof r!=="object"||r===null){throw "invalid param(s): table <string> or record <object> is an invalid type"}x(api("create_record","POST",{table_name:t,record_json:JSON.stringify(r)}))}catch(e){z(e)}},writable:false},readRecordsSync:{value:function(t,y,n){x=handleSuccess.bind(y);z=handleError.bind(n);try{if(typeof t!=="string"){throw "invalid param: table <string> is invalid"}x(api("read_records","GET",{table_name:t,is_shared_table:false}))}catch(e){z(e)}},writtable:false},updateRecordSync:{value:function(t,r,y,n){x=handleSuccess.bind(y);z=handleError.bind(n);try{if(typeof t!=="string"||typeof r!=="object"||r===null){throw "invalid param(s): table <string>, record <object>"}if(typeof r.id!=="number"&&r.id>-1&&r.id<Infinity){throw "invalid record entry id"}x(api("update_record","PUT",{table_name:t,record_id:r.id,record_json:JSON.stringify(r)}))}catch(e){z(e)}},writable:false},deleteRecordSync:{value:function(t,r,y,n){x=handleSuccess.bind(y);z=handleError.bind(n);try{if(typeof t!=="string"||typeof r!=="object"||r===null){throw "invalid param(s): table <string>, record <object>"}if(typeof r.id!=="number"&&r.id>-1&&r.id<Infinity){throw "invalid record entry id"}x(api("delete_record","DELETE",{table_name:t,record_id:r.id}))}catch(e){z(e)}},writable:false},startWebRequestSync:{value:function(u,c,e){let x=new XMLHttpRequest(),y=handleSuccess.bind(c),z=handleError.bind(e);x.onreadystatechange=function(){if(this.readyState===4){if(x.status>199&&x.status<400){y(x.response)}else{y("Request Responded With: "+x.status+" , Is not a safe range")}}};x.onerror=function(){z(x)};x.open("GET","/xhr?u="+u,true);x.send()}}})})();
      let iframe = document.createElement("iframe");
      iframe.addEventListener("load",()=>{
      iframe.addEventListener = function (element, event, callback) {return document.body.addEventListener(element, event, callback)};
      for(var global in window.Global){iframe.contentWindow[global]=window[global]};
      ;(function() {
        return fetch("/api/auth/check").then(r => {
              if (r.status === 200) {
                  return r.json();
              } else {
                  return {auth: false};
              }
          }).then(d => {
              if(d.user !== undefined) {
                  return "accountUser:" + d.user.id;
              } else {
                  return getUserId();
              }
          }).then(id => {
              if(localStorage.userId === undefined || id.startsWith("accountUser:")) {
                localStorage.userId = id;
              }
              let script = iframe.contentDocument.createElement("script");
              script.src = "./code.js"
              iframe.contentDocument.head.appendChild(script);
              let element = document.getElementById("divApplab");
              let width = "320px";
              let height = "450px";
              let scaling = "scale(" + (Math.min(window.innerWidth, window.innerHeight) / 450) + ")";
              if(element.style.width === width && element.style.height === height) {
                element.style["transform"] = scaling;
              }
              element.style["transform-origin"] = "top left";
              const observer = new MutationObserver((mutations, observe) => {
                for(let mutation of mutations) {
                  let targetStyle = mutation.target.style;
                  if(mutation.attributeName === "style") {
                    if((targetStyle.width !== width || targetStyle.height !== height) && targetStyle.transform !== "") {
                      targetStyle.transform = "";
                    } else if (((targetStyle.width === width && targetStyle.height === height) || targetStyle.position === "relative") && targetStyle.transform === "") {
                      targetStyle.width = width;
                      targetStyle.height = height;
                      targetStyle.transform = scaling; 
                    }
                  }
                }
              });
              observer.observe(element, {attributes: true});
          })
          .catch(err => {
              throw new Error(err);
          })
      })();
});
document.head.appendChild(iframe);
      }
    </script>
    <script src="${dependency}/applab-api.js"></script>
    <script src="https://www.google.com/jsapi"></script>
    <link rel="stylesheet" href="${dependency}/CSS/applab.css">
    <link rel="stylesheet" href="${dependency}/CSS/style.css">
    <link rel="stylesheet" media="all" href="${dependency}/CSS/fonts.css">
  </head>
  <body>
  <div id="divApplab" class="appModern running" tabindex="1" style="position: absolute; top: 0px; left: 0px; width: 320px; height: 450px; display: block;">${html.match(/<div class="screen".*/g)[0]
    }
  </body>
  </html>`
  await addFile("/index.html", Buffer.from(html))
}

async function addFile(name, data) {
  return new Promise((resolve, reject) => {
    let file = fs.createWriteStream(projectPath + name);
    file.write(data);
    file.on("finish", () => {
      resolve(true)
    })
    file.on("error", () => {
      reject("file could not be completed")
    })
    file.end();
  })
}

module.exports = {
  exportProject
}