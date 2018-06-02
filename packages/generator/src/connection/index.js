// @flow
import Generator from 'yeoman-generator';
import path from 'path';
import { getConfigDir } from '../config';
import { uppercaseFirstLetter } from '../ejsHelpers';
import { getModulePath } from '../paths';

class ConnectionGenerator extends Generator {
  constructor(args, options) {
    super(args, options);

    this.argument('name', {
      type: String,
      required: true,
    });

    this.destinationDir = getConfigDir('connection');
  }

  generateConnection() {
    const name = uppercaseFirstLetter(this.options.name);

    const templatePath = this.templatePath('Connection.js.template');

    const moduleName = this.options.name.toLowerCase();
    const modulePath = getModulePath(this.destinationDir, moduleName);

    const destinationPath = this.destinationPath(
      path.join(modulePath, `${name}Connection.js`),
    );

    const templateVars = {
      name,
    };

    this.fs.copyTpl(templatePath, destinationPath, templateVars);
  }

  end() {
    this.log('🔥 Connection created!');
  }
}

module.exports = ConnectionGenerator;
