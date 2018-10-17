# Autogit Plugin - Rollback

A plugin for rolling back the history to that of the origin and discarding local changes.

This plugin is quite useful when developing other plugins or commands. You can test them, and if they don't work properly you can just roll back.

## Install

```sh
npm install --save autogit-plugin-rollback
```

## Usage

#### Options

This plugin uses the following options object:

```js
{
  remote: 'origin', // Resetting history up to the last commit present in this remote
  rollback: { // Things to roll back
    workingTree: true, // Discard all local changes
    history: true // Discard all new commits compared to the remote
  },
  force: false // Don't ask for confirmation
}
```

#### Configuration

Add this plugin to a command:

```js
const rollback = require ( 'autogit-plugin-rollback' );

module.exports = {
  commands: {
    'my-command': [
      rollback ({
        rollback: {
          workingTree: true
          history: false
        }
      })
    ]
  }
}
```

## License

MIT © Fabio Spampinato
