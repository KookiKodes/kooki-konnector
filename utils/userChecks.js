const _ = require("lodash");

const getNotEmptyCheck = _.curry((check, info) =>
  check(info.field, info.message).not().isEmpty()
);
const getFieldEmailCheck = _.curry((check, info) =>
  check(info.field, info.message).isEmail()
);

const getMinLengthCheck = _.curry((check, info) =>
  check(info.field, info.message).isLength({ min: 6 })
);

const handleField = (check) =>
  _.cond([
    [_.matches({ notEmpty: true }), getNotEmptyCheck(check)],
    [_.matches({ isEmail: true }), getFieldEmailCheck(check)],
    [_.matches({ minLength: true }), getMinLengthCheck(check)],
  ]);

exports.getChecks = (check, fields) => _.map(fields, handleField(check));
