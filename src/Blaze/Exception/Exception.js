//========================== Load Internal Module =========================
var constants = require("../Support/constant");

// Load exceptions
class Exception {
  constructor(errorCode, message, errorStackTrace, userType) {
    this.errorCode = errorCode;
    this.responseMessage = message;
    // this.errorMessage = message;
    if (userType) this.userType = userType;
    if (errorStackTrace) {
      this.errors = errorStackTrace;
    }
  }

  static intrnlSrvrErr(err) {
    return new Exception(1, constants.MESSAGES.INTERNAL_SERVER_ERROR, err);
  }
  static unauthorizeAccess(err) {
    return new Exception(2, constants.MESSAGES.UNAUTHORIZED_ACCESS, err);
  }
  static alreadyRegistered(err) {
    return new Exception(3, constants.MESSAGES.EMAIL_ALREADY_EXIST, err);
  }
  static invalidEmail() {
    return new Exception(4, constants.MESSAGES.INVALID_EMAIL);
  }
  static getCustomErrorException(errMsg, error) {
    return new Exception(5, errMsg, error);
  }
  static userNotFound() {
    return new Exception(6, constants.MESSAGES.USER_NOT_REGISTERED);
  }
  static incorrectPass() {
    return new Exception(7, constants.MESSAGES.INCORRECT_PASS);
  }
}

//========================== Export Module   End ===========================
