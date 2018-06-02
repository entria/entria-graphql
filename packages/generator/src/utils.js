// @flow
import path from 'path';
import fs from 'fs';
import { getCreateGraphQLConfig } from './config';
import { getSchemaDefinition } from './parser';

/**
 * Get the relative path directory between two directories specified on the config file
 * @param from {string} The calling directory of the script
 * @param to {[string]} The destination directories
 * @returns {string} The relative path, e.g. '../../src'
 */
export const getRelativeConfigDir = (from: string, to: string[]) => {
  const config = getCreateGraphQLConfig().directories;

  return to.reduce((directories, dir) => {
    const relativePath = path.posix.relative(config[from], config[dir]);

    return {
      ...directories,
      [dir]: relativePath === '' ? '.' : relativePath,
    };
  }, {});
};

/**
 * Get the Mongoose model schema code
 * @param modelPath {string} The path of the Mongoose model
 * @returns {string} The code of the Mongoose model
 */
const getModelCode = (modelPath: string) => fs.readFileSync(modelPath, 'utf8');

type MongooseModelSchemaOptions = {
  model: string,
  withTimestamps: boolean,
  ref: boolean,
}
export const getMongooseModelSchema = ({
  model,
  withTimestamps = false,
  ref = false,
}: MongooseModelSchemaOptions) => {
  const config = getCreateGraphQLConfig();

  const modelDir = config.directories.model;

  const modelPath = path.resolve(`${modelDir}/${model.toLowerCase()}/${model}Model.js`);

  const modelCode = getModelCode(modelPath);

  return getSchemaDefinition(modelCode, withTimestamps, ref);
};


