// @flow
import fs from 'fs';
import path from 'path';

/**
 * Get the content of a file
 * @param path {string} The path of the file
 * @returns {string} The content of the file
 */
export const getFileContent = (pathname: string) => fs.readFileSync(pathname, 'utf8');

/**
 * Get a fixture path
 * @param name {string} Name of the file of the fixture
 * @returns {string} The path of the fixture
 */
export const getFixturePath = (name: string) => path.join(__dirname, `../fixtures/${name}.js`);
