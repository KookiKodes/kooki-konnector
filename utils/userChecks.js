const _ = require("lodash");

const getFieldNameCheck = _.curry((check, info) =>
  check(info.field, info.message).not().isEmpty()
);
const getFieldEmailCheck = _.curry((check, info) =>
  check(info.field, info.message).isEmail()
);
const getFieldPwordCheck = _.curry((check, info) =>
  check(info.field, info.message).isLength({ min: 6 })
);

const handleField = (check) =>
  _.cond([
    [_.matches({ field: "name" }), getFieldNameCheck(check)],
    [_.matches({ field: "email" }), getFieldEmailCheck(check)],
    [_.matches({ field: "password" }), getFieldPwordCheck(check)],
  ]);

exports.getChecks = (check, fields) => _.map(fields, handleField(check));
