const modules = {
  gamelab: require("./gle"),
  applab: require("./ale"),
};
const requests = require("./requests");

async function customExport(project) {
  if (typeof project !== "string" || !/^[\w-]{1,64}$/.test(project)) {
    throw `invalid project id "${project}"`;
  }
  const channel = await requests.send(`https://studio.code.org/v3/channels/${project}`, "json");
  const type = channel.projectType;
  if (!Object.hasOwn(modules, type)) {
    throw `unsupported project type "${type}"`;
  }
  return modules[type].exportProject(project, channel);
}

module.exports = { customExport };
