import Generator from 'yeoman-generator';
import pluralize from 'pluralize';
import {
  getRelativeConfigDir,
} from '../utils';

import { getConfigDir } from '../config';
import { camelCaseText, uppercaseFirstLetter } from '../ejsHelpers';

class AddGenerator extends Generator {
  constructor(args, options) {
    super(args, options);

    this.argument('name', {
      type: String,
      required: true,
    });

    // TODO read schema.json

    this.destinationDir = getConfigDir('add');
  }

  _getConfigDirectories() {
    return getRelativeConfigDir('loader', ['model', 'connection']);
  }

  generateList() {
    // const schema = this.options.model ?
    //   getMongooseModelSchema(this.options.model, true)
    //   : null;

    const name = uppercaseFirstLetter(this.options.name);

    // const templatePath = schema ?
    //   this.templatePath('LoaderWithSchema.js.template')
    //   : this.templatePath('Loader.js.template');
    //
    // const directories = this._getConfigDirectories();

    const pluralName = pluralize(this.options.name);

    const templateVars = {
      name,
      rawName: this.options.name,
      camelCaseName: camelCaseText(name),
      pluralName,
      pluralCamelCaseName: camelCaseText(pluralName),
    };

    const filename = `${name}Form.js`;

    this.fs.copyTpl(
      this.templatePath('Form.js.template'), `${this.destinationDir}/${filename}`, templateVars,
    );
  }

  end() {
    this.log('🔥 Form created!');
  }
}

module.exports = AddGenerator;
