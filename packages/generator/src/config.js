/* @flow */
import path from 'path';
import merge from 'lodash.merge';
import fs from 'fs';
import pkgDir from 'pkg-dir';

const rootPath = pkgDir.sync('.') || '.';

let cacheConfig = null;

/**
 * Parse `.graphqlrc` config file and retrieve its contents
 * @param filePath {string} The path of the config file
 * @returns {*}
 */
const parseConfigFile = (filePath: string) => {
  const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const directories = Object.keys(config.directories).reduce((data, directory) => {
    if (directory === DIRECTORY_TYPE.SOURCE) {
      return {
        ...data,
        [directory]: `${rootPath}/${config.directories[directory]}`,
        [DIRECTORY_TYPE.SRC]: config.directories.source,
      };
    }

    return {
      ...data,
      [directory]: `${config.directories.source}/${config.directories.module}/${config.directories[directory]}`,
    };
  }, {});

  return {
    ...config,
    directories: {
      ...config.directories,
      ...directories,
    },
  };
};

export const DIRECTORY_TYPE = {
  SOURCE: 'source',
  SRC: 'src',
  MODULE: 'module',
  CONNECTION: 'connection',
  LOADER: 'loader',
  MODEL: 'model',
  MUTATION: 'mutation',
  MUTATION_TEST: 'mutation_test',
  TYPE: 'type',
  TYPE_TEST: 'type_test',
};

type DirectoryType = $Values<typeof DIRECTORY_TYPE>;
type Directories = {
  source: string,
  module: string,
  connection: string,
  loader: string,
  model: string,
  mutation: string,
  mutation_test: string,
  type: string,
  type_test: string,
  interface: string,
};

type Files = {
  schema: string,
};

type Config = {
  directories: Directories,
  files: Files,
}
/**
 * Get the `.graphqlrc` config file
 * @returns {object} The content of the config
 */
export const getCreateGraphQLConfig = (): Config => {
  // if (cacheConfig) return cacheConfig;

  // Use default config
  const defaultFilePath = path.resolve(`${__dirname}/graphqlrc.json`);

  const config = parseConfigFile(defaultFilePath);

  try {
    // Check if there is a `.graphqlrc` file in the root path
    const customConfig = parseConfigFile(`${rootPath}/.graphqlrc`);

    merge(config, customConfig);

    cacheConfig = config;

    // If it does, extend default config with it, so if the custom config has a missing line
    // it won't throw errors
    return config;
  } catch (err) {
    cacheConfig = config;
    // Return the default config if the custom doesn't exist
    return config;
  }
};

/**
 * Get a directory from the configuration file
 * @param directory {string} The name of the directory, e.g. 'source'/'mutation'
 * @returns {string} The directory path
 */
export const getConfigDir = (directory: DirectoryType) => getCreateGraphQLConfig().directories[directory];
