const { inline } = require("../cdo-expo/format");

const sandbox = "allow-scripts allow-popups allow-forms allow-pointer-lock allow-modals allow-downloads";

function playerpage(id) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>TurboWarp</title>
    <style>
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
      iframe { display: block; width: 100%; height: 100%; border: 0; }
    </style>
  </head>
  <body>
    <iframe id="player" sandbox="${sandbox}" allow="autoplay; fullscreen; gamepad; clipboard-write; accelerometer; gyroscope"></iframe>
    <script>
      (function () {
        const frame = document.getElementById("player");
        const prefix = "turbowarp:" + ${inline(id)} + ":";
        let ready = false;
        function load() {
          const snapshot = {};
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key.startsWith(prefix)) {
                snapshot[key.slice(prefix.length)] = localStorage.getItem(key);
              }
            }
          } catch (err) {}
          return snapshot;
        }
        function write(data) {
          try {
            if (data.op === "set") {
              localStorage.setItem(prefix + String(data.key), String(data.value));
            } else if (data.op === "remove") {
              localStorage.removeItem(prefix + String(data.key));
            } else if (data.op === "clear") {
              Object.keys(load()).forEach((key) => localStorage.removeItem(prefix + key));
            }
          } catch (err) {}
        }
        window.addEventListener("message", (event) => {
          const data = event.data;
          if (event.source !== frame.contentWindow || !data || typeof data !== "object") {
            return;
          }
          if (data.turbowarp === "ready" && !ready) {
            ready = true;
            if (typeof data.title === "string" && data.title) {
              document.title = data.title;
            }
            fetch("/api/auth/check")
              .then((r) => (r.ok ? r.json() : {}))
              .catch(() => ({}))
              .then((d) => {
                const userid = d.user && (d.user.id || d.user._id)
                  ? "accountUser:" + (d.user.id || d.user._id)
                  : null;
                const storage = load();
                // Make the authenticated account ID authoritative before the exported
                // project can call getUserId() or inspect localStorage.userId.
                if (userid) {
                  storage.userId = userid;
                } else if (typeof storage.userId === "string" && storage.userId.startsWith("accountUser:")) {
                  delete storage.userId;
                }
                // const abs = (u) => (typeof u === "string" && u.charAt(0) === "/" ? location.origin + u : u);
                // let wkuser;
                // if (!d.user) {
                //   wkuser = { loggedIn: false };
                // } else if (d.user.allowuserdata) {
                //   wkuser = { loggedIn: true, name: d.user.username, avatar: abs(d.user.avatar), banner: abs(d.user.banner), role: d.user.role };
                // } else {
                //   wkuser = "disallowed";
                // }
                // frame.contentWindow.postMessage({ turbowarp: "init", userid, wkuser, storage }, "*");
                frame.contentWindow.postMessage({ turbowarp: "init", userid, storage }, "*");
              });
          } else if (data.turbowarp === "storage" && ready) {
            write(data);
          }
        });
        frame.src = "/turbowarp/play" + location.search;
      })();
    </script>
  </body>
</html>`;
}

module.exports = { playerpage, sandbox };
