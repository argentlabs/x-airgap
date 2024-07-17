const TEXT_TO_FELT_MAX_LEN = 31;

function isASCII(str) {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(str);
}

/**
 * Test if string is a Cairo short string (string has less or equal 31 characters)
 */
function isShortString(str) {
  return str.length <= TEXT_TO_FELT_MAX_LEN;
}

/**
 * Convert an ASCII string to a hexadecimal string.
 * @param str short string (ASCII string, 31 characters max)
 * @returns format: hex-string; 248 bits max
 * @example
 * ```typescript
 * const myEncodedString = encodeShortString("uri/pict/t38.jpg");
 * // return hex string (ex."0x7572692f706963742f7433382e6a7067")
 * ```
 */
function encodeShortString(str) {
  if (!isASCII(str)) throw new Error(`${str} is not an ASCII string`);
  if (!isShortString(str)) throw new Error(`${str} is too long`);
  return addHexPrefix(
    str.replace(/./g, char => char.charCodeAt(0).toString(16))
  );
}

/**
 * Remove hex prefix '0x' from hex-string
 * @param hex hex-string
 * @returns format: base16-string
 */
function removeHexPrefix(hex) {
  return hex.replace(/^0x/i, "");
}

/**
 * Add hex prefix '0x' to base16-string
 * @param hex base16-string
 * @returns format: hex-string
 */
function addHexPrefix(hex) {
  return `0x${removeHexPrefix(hex)}`;
}

window.encodeShortString = encodeShortString;
window.addHexPrefix = addHexPrefix;
window.removeHexPrefix = removeHexPrefix;
