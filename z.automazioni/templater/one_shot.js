const impl = require("../one_shot");

module.exports = async function one_shot(...args) {
    return impl(...args);
};
