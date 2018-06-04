/* @flow */
import path from 'path';

export const getModulePath = (source: string, moduleName: string) => {
  return path.join(source, moduleName);
};

export const getTestPath = (source: string) => {
  return path.join(source, '__tests__');
};

export const getMutationPath = (source: string) => {
  return path.join(source, 'mutation');
};
