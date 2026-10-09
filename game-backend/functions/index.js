const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { createApi } = require("./lib/api");

initializeApp();
const IP_SALT = defineSecret("IP_SALT"); // only salted hashes of IPs / device ids are stored

let handler = null;
exports.api = onRequest(
  {
    region: "us-central1",
    cors: ["https://miuunote.site", "https://www.miuunote.site", /^http:\/\/localhost:\d+$/],
    maxInstances: 10,
    memory: "256MiB",
    secrets: [IP_SALT],
  },
  (req, res) => {
    handler ??= createApi({ db: getFirestore(), salt: IP_SALT.value() });
    return handler(req, res);
  },
);
