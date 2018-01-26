### Running

1. Start `ganache-cli` and leave it running
2. run `truffle test`

### Errors

Old versions of solidity and ethereumjs-testrpc can cause various errors. To update to the latest:

1. `npm uninstall -g ethereumjs-testrpc`
2. `npm install -g ganache-cli`
3. `npm update -g solc`
4. cd to your truffle install `cd /usr/lib/node_modules/truffle`
5. `rm -rf node_modules/solc`
6. `npm install`

Note that `truffle version` still reports the incorrect version of solc eventhough it has been updated.

### Tip

Excessive use of `sudo` is a security risk. For single user systems this is okay:

1. `cd /usr/lib`
2. `sudo chown -R $(whoami) node_modules/`

For multi-user systems, consider using a `node_modules` located in your home directory.

Now you should be able to run the Errors section as is, without `sudo`
