/* @flow */
/**
 * Uppercase the first letter of a text
 * @param text {string}
 * @returns {string}
 */
export const uppercaseFirstLetter = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
/**
 * Camel cases text
 * @param text {string} Text to be camel-cased
 * @returns {string} Camel-cased text
 */
export const camelCaseText = (text: string) =>
  text.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) {
      return '';
    }

    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
