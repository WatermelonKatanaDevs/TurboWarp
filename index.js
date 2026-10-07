const { Host } = require("./cdo-host/index");
const { playerpage, sandbox } = require("./cdo-host/player");
const { customExport } = require("./cdo-expo/index");
const { checkAuth } = require("../Middleware/auth");
const link = /(?<=(applab|gamelab)\/)[\w-]+|^[\w-]+$/;
const shared = ["/turbowarp", "/xhr", "/media", "/speech", "/datablock_storage"];
function projectid(req) {
  let id = String(req.query.u || "").match(link);
  return id === null ? null : id[0];
}
class Turbo {
  constructor(app, dir) {
    if (!app || typeof app.use !== "function") { throw new Error("App not initalized") }
    app.use(shared, (req, res, next) => {
      res.vary("Origin");
      if (req.headers.origin !== "null") {
        return next();
      }
      res.set({
        "Access-Control-Allow-Origin": "null",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, X-Requested-With, X-CSRF-Token",
      });
      if (req.method === "OPTIONS") {
        return res.status(204).end();
      }
      next();
    });
    app.use("/turbowarp", dir);
    new Host(app);
    app.get("/turbowarp", (req, res) => {
      let id = projectid(req);
      if (id === null) {
        return res.status(400).send("invalid project link");
      }
      res.status(200).send(playerpage(id));
    });
    app.get("/turbowarp/play", checkAuth, async (req, res) => {
      let id = projectid(req);
      if (id === null) {
        return res.status(400).send("invalid project link");
      }
      try {
        let page = await customExport(id);
        const userid = res.locals.userToken ? "accountUser:" + res.locals.userToken.id : null;
        if (userid) {
          const serializedUserId = JSON.stringify(userid).replace(/</g, "\\u003c");
          const hostScript = `<script>window.__turbowarpServerUserId=${serializedUserId};</script>\n`;
          page = page.replace(
            '<script src="/turbowarp/sandbox.js"></script>',
            hostScript + '<script src="/turbowarp/sandbox.js"></script>'
          );
        }
        res.set("Content-Security-Policy", `sandbox ${sandbox}`).status(200).send(page);
      } catch (err) {
        console.log(err);
        res.status(404).send("unable to export project");
      }
    });
  }
}
module.exports = {
  Turbo
}
