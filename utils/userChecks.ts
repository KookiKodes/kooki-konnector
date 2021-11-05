import _ from "lodash";
import type { ValidationChain } from "express-validator";

type Check = (
  fields: string | string[] | undefined,
  message?: any
) => ValidationChain;

const getNotEmptyCheck = _.curry((check: Check, info) =>
  check(info.field, info.message).not().isEmpty()
);
const getFieldEmailCheck = _.curry((check, info) =>
  check(info.field, info.message).isEmail()
);

const getMinLengthCheck = _.curry((check, info) =>
  check(info.field, info.message).isLength({ min: 6 })
);

const handleField = (check: Check) =>
  _.cond([
    [_.matches({ notEmpty: true }), getNotEmptyCheck(check)],
    [_.matches({ isEmail: true }), getFieldEmailCheck(check)],
    [_.matches({ minLength: true }), getMinLengthCheck(check)],
  ]);

export const buildChecks = (check, fields) => _.map(fields, handleField(check));
