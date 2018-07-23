## Install

#### With Yarn:
```sh
yarn global add @entria/create-graphql @entria/generator-graphql
```

#### With NPM:
```sh
npm i -g @entria/create-graphql @entria/generator-graphql
```

## Usage
You can create a brand new GraphQL project:
```sh
entria-graphql init GraphQLProject
```

And can generate single files for [Mutation](docs/Commands.md#--mutation--m), [Type](docs/Commands.md#--type--t) and [others](docs/Commands.md#generate--g):
```sh
entria-graphql generate --mutation Story
```
This generates a `StoryAddMutation` and `StoryEditMutation`

> See more usage examples in the [docs](docs)

## Contributing
If you want to contribute, see the [Contributing guidelines](CONTRIBUTING.md) before and feel free to send your contributions.

## Feedbacks

We love the feedbacks. It's help us to continue grow and improve. Give your feedbacks by open an [issue](https://github.com/graphql-community/create-graphql/issues/new). We will be glad to discuss your suggestions!

tks for @lucasbento

## License

MIT © [Entria](http://github.com/entria)
