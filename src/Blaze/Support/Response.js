var Constant = require("constant"),
  Exception = require("../Exception/Exception");
logger = require("../Logger").logger;

class APIResponse {
  constructor(statusCode, result, request) {
    this.statusCode = statusCode;
    if (statusCode == Constant.STATUS_CODE.SUCCESS) {
      result.message = result.message ? result.message : "Api Result";
      result ? (this.responseData = result) : Constant.EMPTY;
    } else {
      result ? (this.error = result) : Constant.EMPTY;
    }
    this.requestParams = request.body;
    this.time = new Date();
  }
}

function _sendResponse(response, result) {
  // send status code 200
  return response.send(result);
}

function error(response, error, request) {
  // if error doesn't has sc than it is an unhandled error,
  // log error, and throw intrnl server error
  if (!error.errorCode) {
    logger.error(error, "Unhandled error.");
    error = Exception.intrnlSrvrErr(error);
  }
  var result = new APIResponse(Constant.STATUS_CODE.ERROR, error, request);
  _sendResponse(response, result);
}

function handleError(error, request, response, next) {
  // unhandled error
  sendError(response, error, request);
}

function success(response, result, request) {
  var result = new APIResponse(Constant.STATUS_CODE.SUCCESS, result, request);
  _sendResponse(response, result);
}

// ========================== Export Module Start ==========================
module.exports = {
  error,
  handleError,
  success,
};
// ========================== Export Module End ============================
