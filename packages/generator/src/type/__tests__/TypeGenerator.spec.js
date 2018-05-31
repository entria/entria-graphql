import helper from 'yeoman-test';
import assert from 'yeoman-assert';
import path from 'path';
import fs from 'fs-extra';

import {
  getFileContent,
  getFixturePath,
} from '../../../test/helpers';

import { getConfigDir } from '../../config';

const typeGenerator = path.join(__dirname, '..');

it('generate a type', async () => {
  const folder = await helper.run(typeGenerator)
    .withArguments('Example')
    .toPromise();

  const destinationDir = getConfigDir('type');
  const destinationTestDir = getConfigDir('type_test');

  assert.file([
    `${destinationDir}/example/ExampleType.js`,
    `${destinationTestDir}/example/__tests__/ExampleType.spec.js`,
  ]);

  const files = {
    type: getFileContent(`${folder}/${destinationDir}/example/ExampleType.js`),
    typeTest: getFileContent(`${folder}/${destinationTestDir}/example/__tests__/ExampleType.spec.js`),
  };

  expect(files).toMatchSnapshot();
});

it('generate a type with schema', async () => {
  const folder = await helper.run(typeGenerator)
    .inTmpDir(dir =>
      fs.copySync(
        getFixturePath('Post'),
        path.join(dir, 'src/modules/post/PostModel.js'),
      ),
    )
    .withArguments('Post Post')
    .toPromise();

  const destinationDir = getConfigDir('type');
  const destinationTestDir = getConfigDir('type_test');

  assert.file([
    `${destinationDir}/post/PostType.js`,
    `${destinationTestDir}/post/__tests__/PostType.spec.js`,
  ]);

  const files = {
    type: getFileContent(`${folder}/${destinationDir}/post/PostType.js`),
    typeTest: getFileContent(`${folder}/${destinationTestDir}/post/__tests__/PostType.spec.js`),
  };

  expect(files).toMatchSnapshot();
});

it('generate a type with schema and without timestamps', async () => {
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

  assert.file([
    `${destinationDir}/user/UserType.js`,
    `${destinationTestDir}/user/__tests__/UserType.spec.js`,
  ]);

  const files = {
    type: getFileContent(`${folder}/${destinationDir}/user/UserType.js`),
    typeTest: getFileContent(`${folder}/${destinationTestDir}/user/__tests__/UserType.spec.js`),
  };

  expect(files).toMatchSnapshot();
});
