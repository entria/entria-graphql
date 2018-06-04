/* @flow */
import { uppercaseFirstLetter } from '../ejsHelpers';
import type { MongooseFieldDefinition } from './mongoose';

type GraphQLField = {
  name: string,
  description: string,
  required: boolean,
  originalType: string, // type from mongoose
  resolve: string, // resolver of this field
  resolveArgs?: string,
  type: string, // GraphQL Type
  flowType: string, // Flow Type
  graphqlType?: string, // graphql type name
  graphqlLoader?: string, // graphql loader name
}
export const parseFieldToGraphQL = (field: MongooseFieldDefinition, ref: boolean): GraphQLField => {
  const graphQLField = {
    name: field.name,
    description: field.description,
    required: !!field.required,
    originalType: field.type,
    resolve: `obj.${field.name}`
  };

  const name = uppercaseFirstLetter(field.name);
  const typeFileName = `${name}Type`;
  const loaderFileName = `${name}Loader`;

  let parsedChildField;
  let typeFileNameSingular;
  let loaderFileNameSingular;

  switch (field.type) {
    case 'Number':
      return {
        ...graphQLField,
        type: 'GraphQLInt',
        flowType: 'number'
      };
    case 'Boolean':
      return {
        ...graphQLField,
        type: 'GraphQLBoolean',
        flowType: 'boolean'
      };
    case 'Array':
      field.type = field.childType;

      parsedChildField = parseFieldToGraphQL(field, ref);
      parsedChildField.flowType = 'array';
      parsedChildField.type = [parsedChildField.type];

      if (field.childType === 'ObjectId' && ref) {
        typeFileNameSingular = `${field.ref}Type`;
        loaderFileNameSingular = `${field.ref}Loader`;

        parsedChildField = {
          ...parsedChildField,
          type: [typeFileNameSingular],
          resolve: `await ${loaderFileNameSingular}.load${name}ByIds(context, obj.${field.name})`,
          resolveArgs: 'async (obj, args, context)',
          graphqlType: typeFileNameSingular,
          graphqlLoader: loaderFileNameSingular
        };
      }

      return parsedChildField;
    case 'ObjectId':
      if (ref) {
        return {
          ...graphQLField,
          type: typeFileName,
          flowType: 'string',
          resolve: `await ${loaderFileName}.load(context, obj.${field.name})`,
          resolveArgs: 'async (obj, args, context)',
          graphqlType: typeFileName,
          graphqlLoader: loaderFileName
        };
      }

      return {
        ...graphQLField,
        type: 'GraphQLID',
        flowType: 'string'
      };
    case 'Date':
      return {
        ...graphQLField,
        type: 'GraphQLString',
        flowType: 'string',
        resolve: `obj.${field.name} ? obj.${field.name}.toISOString() : null`
      };
    default:
      return {
        ...graphQLField,
        type: 'GraphQLString',
        flowType: 'string'
      };
  }
};
