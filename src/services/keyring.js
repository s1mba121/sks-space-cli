// src/services/keyring.js

const keytar = require("keytar");
const SERVICE = "space_connect";

exports.storePassword = (username, password) =>
  keytar.setPassword(SERVICE, username, password);

exports.getPassword = (username) =>
  keytar.getPassword(SERVICE, username);

exports.deletePassword = (username) =>
  keytar.deletePassword(SERVICE, username).catch(() => {});
