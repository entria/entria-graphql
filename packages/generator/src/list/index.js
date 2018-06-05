// @flow
import Generator from 'yeoman-generator';
import pluralize from 'pluralize';
import { getConfigDir } from '../config';
import { uppercaseFirstLetter } from '../ejsHelpers';

class ListGenerator extends Generator {
  constructor(args, options) {
    super(args, options);

    this.argument('name', {
      type: String,
      required: true,
    });

    // TODO read schema.json

    this.destinationDir = getConfigDir('list');
  }

  generateList() {
    const name = uppercaseFirstLetter(this.options.name);

    const templatePath = this.templatePath('List.js.template');

    const pluralName = pluralize(this.options.name);

    const destinationPath = this.destinationPath(`${this.destinationDir}/${name}List.js`);

    const templateVars = {
      name,
      pluralName,
    };

    this.fs.copyTpl(templatePath, destinationPath, templateVars);
  }

  end() {
    this.log('🔥 List created!');
  }
}

module.exports = ListGenerator;
