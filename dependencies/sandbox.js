(function () {
  const inframe = window.parent !== window;
  const serverUserId = typeof window.__turbowarpServerUserId === "string"
    ? window.__turbowarpServerUserId
    : null;
  try {
    delete window.__turbowarpServerUserId;
  } catch (err) {}

  function createstorage(persist) {
    const items = new Map();
    const send = (op, key, value) => {
      if (persist && inframe) {
        parent.postMessage({ turbowarp: "storage", op, key, value }, "*");
      }
    };
    const api = {
      getItem: (key) => (items.has(String(key)) ? items.get(String(key)) : null),
      setItem: (key, value) => {
        key = String(key);
        value = String(value);
        items.set(key, value);
        send("set", key, value);
      },
      removeItem: (key) => {
        key = String(key);
        items.delete(key);
        send("remove", key);
      },
      clear: () => {
        items.clear();
        send("clear");
      },
      key: (index) => [...items.keys()][index] ?? null,
      get length() {
        return items.size;
      },
    };
    const storage = new Proxy(api, {
      get: (target, key) => (typeof key === "symbol" || key in target ? Reflect.get(target, key) : target.getItem(key) ?? undefined),
      set: (target, key, value) => (target.setItem(key, value), true),
      deleteProperty: (target, key) => (target.removeItem(key), true),
      has: (target, key) => key in target || items.has(String(key)),
      ownKeys: () => [...items.keys()],
      getOwnPropertyDescriptor: (target, key) => (items.has(String(key)) ? { value: items.get(String(key)), enumerable: true, configurable: true, writable: true } : undefined),
    });
    return { storage, items };
  }

  const local = createstorage(true);
  const session = createstorage(false);
  const jar = new Map();

  Object.defineProperty(window, "localStorage", { value: local.storage, configurable: true });
  Object.defineProperty(window, "sessionStorage", { value: session.storage, configurable: true });
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => [...jar].map(([name, value]) => name + "=" + value).join("; "),
    set: (value) => {
      const parts = String(value).split(";");
      const index = parts[0].indexOf("=");
      const name = index < 0 ? "" : parts[0].slice(0, index).trim();
      const expired = parts.slice(1).some((part) => /^\s*(max-age=\s*(0|-)|expires=.*1970)/i.test(part));
      if (expired) {
        jar.delete(name);
      } else {
        jar.set(name, parts[0].slice(index + 1).trim());
      }
    },
  });

  // let wkuserdata = { loggedIn: false };
  // window.getwkuserdata = function () {
  //   return wkuserdata === "disallowed" ? "User disallowed sharing user data" : wkuserdata;
  // };

  window.turbowarphost = new Promise((resolve) => {
    if (!inframe) {
      return resolve(serverUserId ? { userid: serverUserId } : {});
    }
    const timer = setTimeout(() => resolve(serverUserId ? { userid: serverUserId } : {}), 1e4);
    window.addEventListener("message", function listen(event) {
      const data = event.data;
      if (event.source !== parent || !data || data.turbowarp !== "init") {
        return;
      }
      window.removeEventListener("message", listen);
      clearTimeout(timer);
      // if (typeof data.wkuser !== "undefined") {
      //   wkuserdata = data.wkuser;
      // }
      if (data.storage && typeof data.storage === "object") {
        for (const key of Object.keys(data.storage)) {
          local.items.set(key, String(data.storage[key]));
        }
      }
      // The host's authenticated account ID must win over a previously-created
      // localUser ID. Also remove a stale account ID after logout.
      if (typeof data.userid === "string" && data.userid) {
        local.items.set("userId", data.userid);
      } else if (local.items.get("userId")?.startsWith("accountUser:")) {
        local.items.delete("userId");
      }
      resolve(data);
    });
    parent.postMessage({ turbowarp: "ready", title: document.title }, "*");
  });
})();
