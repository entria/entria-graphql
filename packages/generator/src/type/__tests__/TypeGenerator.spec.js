import helper from 'yeoman-test';
import assert from 'yeoman-assert';
import path from 'path';

import {
  getFileContent,
  copyFixturesToModules,
} from '../../../test/helpers';

import { getConfigDir } from '../../config';
import { getModulePath, getTestPath } from '../../paths';
import { uppercaseFirstLetter } from '../../ejsHelpers';

const typeGenerator = path.join(__dirname, '..');

it('generate a type', async () => {
  const moduleName = 'example';
  const name = uppercaseFirstLetter(moduleName);

  const folder = await helper.run(typeGenerator)
    .withArguments(name)
    .toPromise();

  const destinationDir = getConfigDir('type');

  const modulePath = getModulePath(destinationDir, moduleName);
  const testPath = getTestPath(modulePath);

  const typeFilepath = path.join(modulePath, `${name}Type.js`);
  const typeTestFilepath = path.join(testPath, `${name}Type.spec.js`);

  assert.file([
    typeFilepath,
    typeTestFilepath,
  ]);

  const files = {
    type: getFileContent(path.join(folder, typeFilepath)),
    typeTest: getFileContent(path.join(folder, typeTestFilepath)),
  };

  expect(files).toMatchSnapshot();
});

it('generate a type with schema', async () => {
  const moduleName = 'post';
  const name = uppercaseFirstLetter(moduleName);

  const folder = await helper.run(typeGenerator)
    .inTmpDir(dir => copyFixturesToModules(dir, moduleName))
    .withArguments('Post Post')
    .toPromise();

  const destinationDir = getConfigDir('type');

  const modulePath = getModulePath(destinationDir, moduleName);
  const testPath = getTestPath(modulePath);

  const typeFilepath = path.join(modulePath, `${name}Type.js`);
  const typeTestFilepath = path.join(testPath, `${name}Type.spec.js`);

  assert.file([
    typeFilepath,
    typeTestFilepath,
  ]);

  const files = {
    type: getFileContent(path.join(folder, typeFilepath)),
    typeTest: getFileContent(path.join(folder, typeTestFilepath)),
  };

  expect(files).toMatchSnapshot();
});

it('generate a type with schema and without timestamps', async () => {
  const moduleName = 'user';
  const name = uppercaseFirstLetter(moduleName);

  const folder = await helper.run(typeGenerator)
    .inTmpDir(dir => copyFixturesToModules(dir, moduleName))
    .withArguments('User User')
    .toPromise();

  const destinationDir = getConfigDir('type');

  const modulePath = getModulePath(destinationDir, moduleName);
  const testPath = getTestPath(modulePath);

  const typeFilepath = path.join(modulePath, `${name}Type.js`);
  const typeTestFilepath = path.join(testPath, `${name}Type.spec.js`);

  assert.file([
    typeFilepath,
    typeTestFilepath,
  ]);

  const files = {
    type: getFileContent(path.join(folder, typeFilepath)),
    typeTest: getFileContent(path.join(folder, typeTestFilepath)),
  };

  expect(files).toMatchSnapshot();
});
