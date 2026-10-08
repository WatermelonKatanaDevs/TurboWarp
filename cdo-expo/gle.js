return `var p5Inst = new p5(null, 'sketch');
  let __userCodeLoaded = false;
  let __userSetup = null;
  let __userPreload = null;
  let __setupReadyResolve;
  let __setupCalled = false;
  const __setupReady = new Promise(resolve => { __setupReadyResolve = resolve; });

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

  function loadUserCode() {
    if (__userCodeLoaded) return;
    __userCodeLoaded = true;

    let script = document.createElement("script");
    script.text = ${inline(json.source)};
    document.body.appendChild(script);

    __userSetup = typeof window.setup === "function" && window.setup !== window.__gamelabSetupBridge
      ? window.setup
      : null;
    __userPreload = typeof window.preload === "function" && window.preload !== __gamelabPreload
      ? window.preload
      : null;

    if (__userSetup) {
      window.setup = window.__gamelabSetupBridge;
      __setupReadyResolve(__userSetup);
    }
  }

  function wrappedExportedCode(stage) {
    loadUserCode();

    if (stage === 'preload') {
      if (__userPreload) {
        __userPreload();
      }
      return;
    }

    if (stage === 'setup') {
      return window.__gamelabSetupBridge();
    }
  }

  window.wrappedExportedCode = wrappedExportedCode;

  turbowarphost.then(d => {
    if(d.userid) {
      return d.userid;
    } else {
      if(localStorage.userId?.startsWith("accountUser:")) {delete localStorage.userId}
      return getUserId();
    }
  }).then(id => {
      localStorage.userId = id;
      window.wrappedExportedCode('preload');
      try { window.draw = draw; } catch (e) {}
  }).catch(err => {
      throw new Error(err);
  });
  }

  window.__gamelabSetupBridge = function () {
    if (__setupCalled) return;
    __setupCalled = true;

    if (__userSetup) {
      return __userSetup();
    }

    return __setupReady.then(setup => setup());
  };

  window.setup = window.__gamelabSetupBridge;
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
        ${code}
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