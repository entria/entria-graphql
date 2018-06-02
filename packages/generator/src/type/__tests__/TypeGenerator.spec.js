import helper from 'yeoman-test';
import assert from 'yeoman-assert';
import path from 'path';
import fs from 'fs-extra';

import {
  getFileContent,
  getFixturePath,
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
  const destinationTestDir = getConfigDir('type_test');

  const modulePath = getModulePath(destinationDir, moduleName);
  const testPath = getTestPath(modulePath);

  const typeFilepath = path.join(modulePath, `${name}Type.js`);
  const typeTestFilepath = path.join(testPath, `${name}Type.spec.js`);

  assert.file([
    typeFilepath,
    typeTestFilepath,
  ]);

  const files = {
    type: getFileContent(`${folder}/${destinationDir}/example/ExampleType.js`),
    typeTest: getFileContent(`${folder}/${destinationTestDir}/example/__tests__/ExampleType.spec.js`),
  };

  expect(files).toMatchSnapshot();
});

it('generate a type with schema', async () => {
  const moduleName = 'post';
  const name = uppercaseFirstLetter(moduleName);

  const folder = await helper.run(typeGenerator)
    .inTmpDir(dir =>
      fs.copySync(
        getFixturePath(name),
        path.join(dir, 'src/modules/post/PostModel.js'),
      ),
    )
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
    .inTmpDir(dir =>
      fs.copySync(
        getFixturePath('User'),
        path.join(dir, 'src/modules/user/UserModel.js'),
      ),
    )
    .withArguments('User User')
    .toPromise();

  const destinationDir = getConfigDir('type');
  const destinationTestDir = getConfigDir('type_test');

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
