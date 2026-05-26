const impl = require("../pg");

module.exports = async function pg(...args) {
    return impl(...args);
};
