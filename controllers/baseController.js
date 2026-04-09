const { buildBaseResponse } = require('../services/baseService');

function getBaseRoute(req, res) {
  res.status(200).json(buildBaseResponse());
}

module.exports = {
  getBaseRoute,
};