/**
 * Convert string to number or bigint based on size
 */
const parseIntAsNumberOrBigInt = x => {
  if (!LosslessJSON.isInteger(x)) return parseFloat(x);
  const v = parseInt(x, 10);
  return Number.isSafeInteger(v) ? v : BigInt(x);
};

/**
 * Convert JSON string to JSON object
 *
 * NOTE: the String() wrapping is used so the behavior conforms to JSON.parse()
 * which can accept simple data types but is not represented in the default typing
 * @param x JSON string
 */
const parse = x =>
  LosslessJSON.parse(String(x), undefined, parseIntAsNumberOrBigInt);

/**
 * Convert JSON string to JSON object with all numbers as bigint
 * @param x JSON string
 */
const parseAlwaysAsBig = x =>
  LosslessJSON.parse(String(x), undefined, LosslessJSON.parseNumberAndBigInt);

/**
 * Convert JSON object to JSON string
 *
 * NOTE: the not-null assertion is used so the return type conforms to JSON.stringify()
 * which can also return undefined but is not represented in the default typing
 * @returns JSON string
 */
const stringify = (value, replacer, space, numberStringifiers) =>
  LosslessJSON.stringify(value, replacer, space, numberStringifiers);

window.json = {
  parse,
  parseAlwaysAsBig,
  stringify
};
