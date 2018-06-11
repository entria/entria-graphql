import helper from 'yeoman-test';
import assert from 'yeoman-assert';
import path from 'path';

import {
  getFileContent,
} from '../../../test/helpers';

import { getConfigDir } from '../../config';

const formGenerator = path.join(__dirname, '..');

it('generate a form file', async () => {
  const folder = await helper.run(formGenerator)
    .withArguments('Example')
    .toPromise();

  const destinationDir = getConfigDir('add');

  assert.file([
    `${destinationDir}/ExampleForm.js`,
  ]);

  expect(getFileContent(`${folder}/${destinationDir}/ExampleForm.js`)).toMatchSnapshot();
});
