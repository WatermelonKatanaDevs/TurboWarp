const request = require('./requests');
const { escapehtml, inline, wraplibraries } = require('./format');
const startPath = 'https://studio.code.org';

async function exportProject(id, channel) {
  const source = await request.send(`${startPath}/v3/sources/${id}/main.json`, 'json');
  return getHTML(id, channel.name, getCode(source, `${startPath}/v3/animations/${id}/`));
}

function getCode(json, animations) {
  let animationList = json.animations || { orderedKeys: [], propsByKey: {} };
  json.source = wraplibraries(json);
  animationList.orderedKeys.forEach((key) => {
    let animation = animationList.propsByKey[key];
    let url = animation.sourceUrl ? `${startPath}/${animation.sourceUrl}` : `${animations + key}.png`;
    animation.rootRelativePath = `/media?u=${encodeURIComponent(url)}`;
  })
  return `var p5Inst = new p5(null, 'sketch');
  window.preload = function () {
  p5Inst._startTime = Date.now(); p5Inst.frameCount = 0;
  initMobileControls(p5Inst);

  p5Inst._predefinedSpriteAnimations = {};
  p5Inst._pauseSpriteAnimationsByDefault = false;
  var animationListJSON = ${JSON.stringify(animationList)}
  var orderedKeys = animationListJSON.orderedKeys;
  orderedKeys.forEach(function (key) {
    var props = animationListJSON.propsByKey[key];
    var frameCount = props.frameCount;
    var image = loadImage(props.rootRelativePath, function () {
      var spriteSheet = loadSpriteSheet(
          image,
          props.frameSize.x,
          props.frameSize.y,
          frameCount
      );
      p5Inst._predefinedSpriteAnimations[props.name] = loadAnimation(spriteSheet);
      p5Inst._predefinedSpriteAnimations[props.name].looping = props.looping;
      p5Inst._predefinedSpriteAnimations[props.name].frameDelay = props.frameDelay;
    });
  });

  let __gamelabUserCodeLoaded = false;
  let __gamelabUserPreload = null;

  window.preload = function __gamelabPreload() {
  p5Inst._startTime = Date.now(); p5Inst.frameCount = 0;
  initMobileControls(p5Inst);

  p5Inst._predefinedSpriteAnimations = {};
  p5Inst._pauseSpriteAnimationsByDefault = false;
  var animationListJSON = ${JSON.stringify(animationList)}
  var orderedKeys = animationListJSON.orderedKeys;
  orderedKeys.forEach(function (key) {
    var props = animationListJSON.propsByKey[key];
    var frameCount = props.frameCount;
    var image = loadImage(props.rootRelativePath, function () {
      var spriteSheet = loadSpriteSheet(
          image,
          props.frameSize.x,
          props.frameSize.y,
          frameCount
      );
      p5Inst._predefinedSpriteAnimations[props.name] = loadAnimation(spriteSheet);
      p5Inst._predefinedSpriteAnimations[props.name].looping = props.looping;
      p5Inst._predefinedSpriteAnimations[props.name].frameDelay = props.frameDelay;
    });
  });

  function wrappedExportedCode(stage) {
    if (stage === 'preload') {
      if (setup !== window.setup) {
        window.setup = setup;
      } else {
        return;
      }
    }

  for (let entry of ["_fillSet", "_doFill", "_doStroke", "_strokeSet", "focused", "_targetFrameRate", "windowWidth", "windowHeight", "_curElement", "canvas", "width", "height", "_textLeading", "_textSize", "_textStyle", "_textAscent", "_textDescent", "imageData", "pixels", "pAccelerationX", "pAccelerationY", "pAccelerationZ", "pRotationX", "pRotationY", "pRotationZ", "rotationX", "rotationY", "rotationZ", "deviceOrientation", "turnAxis", "isKeyPressed", "keyIsPressed", "keyCode", "key", "_lastKeyCodeTyped", "mouseX", "mouseY", "winMouseX", "winMouseY", "_hasMouseInteracted", "pmouseX", "pmouseY", "pwinMouseX", "pwinMouseY", "mouseButton", "isMousePressed", "mouseIsPressed", "touches", "touchX", "touchY", "winTouchX", "winTouchY", "_hasTouchInteracted", "ptouchX", "ptouchY", "pwinTouchX", "pwinTouchY", "touchIsDown", "_textFont", "tex", "isTexture"]) {
    (function setRegistry(entry, tpoint) {
        Object.defineProperty(window, entry, {
            set: function (e) {
                if(p5Inst[entry + "_modify"] !== "_EXCEPTION_: _OVERWRITTEN_") {
                  setTimeout(() => {
                      if (p5Inst[entry] !== window[entry]) {
                          p5Inst[entry + "_modify"] = "_EXCEPTION_: _OVERWRITTEN_";
                      }
                  }, 1);
                }
                return tpoint = e;
            },
            get: function () {
                return tpoint;
            },
            enumerable: true,
            configurable: true
        })
    })(entry, p5Inst[entry])
  }
  Object.defineProperties(Object.prototype,{apply:{value:function(fn,args){if(typeof this==="object"&&"length"in this){return Function.prototype.apply.call(this,fn,args)}},enumerable:false,configurable:true,writable:true},concat:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.concat.apply(this,arguments)}return[]},enumerable:false,configurable:true,writable:true},every:{value:function(cb,_this){if(typeof this==="object"&&"length"in this){return Array.prototype.every.call(this,cb,_this)}return false},enumerable:false,configurable:true,writable:true},indexOf:{value:function(search,fromIndex){if(typeof this==="object"&&"length"in this){return Array.prototype.indexOf.call(this,search,fromIndex)}return -1},enumerable:false,configurable:true,writable:true},filter:{value:function(cb,_this){if(typeof this==="object"&&"length"in this){return Array.prototype.filter.call(this,cb,_this)}return[]},enumerable:false,configurable:true,writable:true},forEach:{value:function(cb,_this){if(typeof this==="object"&&"length"in this){return Array.prototype.forEach.call(this,cb,_this)}},enumerable:false,configurable:true,writable:true},join:{value:function(separator){if(typeof this==="object"&&"length"in this){return Array.prototype.join.call(this,separator)}return ""},enumerable:false,configurable:true,writable:true},lastIndexOf:{value:function(search,fromIndex){if(typeof this==="object"&&"length"in this){return Array.prototype.lastIndexOf.call(this,search,fromIndex)}return -1},enumerable:false,configurable:true,writable:true},map:{value:function(cb,_this){if(typeof this==="object"&&"length"in this){const mapped=[];for(let i in this){mapped.push(cb.call(_this,this[i],Number(i)))}return mapped}},enumerable:false,configurable:true,writable:true},push:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.push.apply(this,arguments)}return 0},enumerable:false,configurable:true,writable:true},pop:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.pop.apply(this)}return undefined},enumerable:false,configurable:true,writable:true},reduce:{value:function(cb,startValue){if(typeof this==="object"&&"length"in this){return Array.prototype.reduce.call(this,cb,startValue)}throw new TypeError("Cannot call reduce on a non-array object")},enumerable:false,configurable:true,writable:true},some:{value:function(cb,_this){if(typeof this==="object"&&"length"in this){return Array.prototype.some.call(this,cb,_this)}return false},enumerable:false,configurable:true,writable:true},shift:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.shift.call(this)}return undefined},enumerable:false,configurable:true,writable:true},splice:{value:function(start,amount,...items){if(typeof this==="object"&&"length"in this){return Array.prototype.splice.call(this,start,amount,...items)}return[]},enumerable:false,configurable:true,writable:true},unshift:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.unshift.apply(this,arguments)}return 0},enumerable:false,configurable:true,writable:true},reverse:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.reverse.call(this)}return this},enumerable:false,configurable:true,writable:true},slice:{value:function(){if(typeof this==="object"&&"length"in this){return Array.prototype.slice.apply(this,arguments)}},enumerable:false,configurable:true,writable:true},sort:{value:function(cb){if(typeof this==="object"&&"length"in this){return Array.prototype.sort.call(this,cb)}return this},enumerable:false,configurable:true,writable:true}});

    if (!__gamelabUserCodeLoaded) {
      __gamelabUserCodeLoaded = true;
      const userScript = document.createElement("script");
      userScript.text = ${inline(json.source)};
      (document.head || document.documentElement).appendChild(userScript);
      __gamelabUserPreload =
        typeof window.preload === "function" && window.preload !== __gamelabPreload
          ? window.preload
          : null;
    }

    if (__gamelabUserPreload) {
      const userPreload = __gamelabUserPreload;
      __gamelabUserPreload = null;
      return userPreload();
    }
  };

  window.__gamelabStart = function () {
    return turbowarphost.then(d => {
      if (d && d.userid) {
        localStorage.userId = d.userid;
      } else if (typeof localStorage.userId === "string" && localStorage.userId.startsWith("accountUser:")) {
        delete localStorage.userId;
      }
      p5Inst = new p5(null, 'sketch');
    });
  };

  window.__gamelabStart().catch(err => {
    console.error(err);
    throw err;
  });

  `
}

function getHTML(id, name, code) {
  const dependency = '/turbowarp/gamelab'
  return `<html>
  <head>
    <title>${escapehtml(name)}</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src="/turbowarp/sandbox.js"></script>
      <link href="${dependency}/gamelab.css" rel="stylesheet" type="text/css">
      <script src="${dependency}/p5.js"></script>
      <script src="${dependency}/p5.play.js"></script>
      <script>
        window._FCONFIG_ = { channel: "${id}", useDatablockStorage: true };
        function setExportConfig(config) { _FCONFIG_ = Object.assign(_FCONFIG_, config) }
      </script>
      <script src="https://studio.code.org/projects/gamelab/${id}/export_config?script_call=setExportConfig"></script>
      <script src="https://code.jquery.com/jquery-1.12.1.min.js"></script>
      <script src="${dependency}/gamelab-api.js"></script>
      <script>
        window.addEventListener("DOMContentLoaded", () => {
        _FCONFIG_.url = (function(){var url="https://studio.code.org/projects/gamelab/${id}";var params=location.search;if(params.startsWith("?u=")){params=params.slice(3)}var re=/[?&]([^&=]+)(?:[&=])([^&=]+)/gim;var m;while((m=re.exec(params))!=null){if(m.index===re.lastIndex){re.lastIndex+=1}url+=m[0]}return url})();
        _FCONFIG_.pathname = "projects/gamelab/${id}";
        // scaler
        const element = document.getElementById("sketch");
        function rescale() {
          element.style["transform"] = "scale(" + (Math.min(window.innerWidth, window.innerHeight) / 400) + ")";
        }
        rescale();
        window.onresize = rescale;
        element.style["transform-origin"] = "top left";
        turbowarphost.then(d => {
        if(d.userid) {
          return d.userid;
        } else {
          if(localStorage.userId?.startsWith("accountUser:")) {delete localStorage.userId}
          return getUserId();
        }
        }).then(id => {
            localStorage.userId = id;
            let script = document.createElement("script");
            script.text = ${inline(code)};
            document.body.appendChild(script);
        })
        .catch(err => {
            throw new Error(err);
        })
      })
  </script>
  <style>
    body.expo {
      background-color: black;
    }

    #sketch.expo.no-controls {
      top: 82px;
    }
  </style>
  </head>
  <body class="web"
  style="margin:0; overflow:hidden; user-select:none; -webkit-user-select:none; -webkit-touch-callout:none; position:fixed; top:0; left:0; width:400px; height:565px;">
  <div id="sketch" class="web" style="position:absolute;"></div>
  <div id="soft-buttons" style="display: none">
    <button id="leftButton" disabled className="arrow">
    </button>
    <button id="rightButton" disabled className="arrow">
    </button>
    <button id="upButton" disabled className="arrow">
    </button>
    <button id="downButton" disabled className="arrow">
    </button>
  </div>
  <div id="studio-dpad-container" style="display:none; position:absolute; width:400px; bottom:5px; height:157px; overflow-y:hidden; z-index: -1;">
  </div>
</body>
</html>`;
}

module.exports = {
  exportProject,
}