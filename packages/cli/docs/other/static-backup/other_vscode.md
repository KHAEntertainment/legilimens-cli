⚠️

Important security changes to npm authentication take effect October 13, 2025. New token lifetime limits (90-day max) and TOTP 2FA restrictions become effective. Classic tokens will be revoked in November. Review changes and update your workflows now. [Learn more](https://gh.io/npm-token-changes).

×

This package has been deprecated

Author message:
`This package is deprecated in favor of @types/vscode and vscode-test. For more information please read: https://code.visualstudio.com/updates/v1_36#_splitting-vscode-package-into-typesvscode-and-vscodetest`

# vscode  ![TypeScript icon, indicating that this package has built-in type declarations](https://static-production.npmjs.com/255a118f56f5346b97e56325a1217a16.svg)

1.1.37 • Public • Published 6 years ago

- [Readme](https://www.npmjs.com/package/vscode?activeTab=readme)
- [Code Beta](https://www.npmjs.com/package/vscode?activeTab=code)
- [7 Dependencies](https://www.npmjs.com/package/vscode?activeTab=dependencies)
- [54 Dependents](https://www.npmjs.com/package/vscode?activeTab=dependents)
- [128 Versions](https://www.npmjs.com/package/vscode?activeTab=versions)

# vscode-extension-vscode

## ⚠️ Deprecated, use @types/vscode and vscode-test instead ⚠️

This is the source code for the NPM [`vscode` module](https://www.npmjs.com/package/vscode).

The funcionality of `vscode` module has been splitted into `@types/vscode` and `vscode-test`. They have fewer dependencies, allow greater flexibility in writing tests and will continue to receive updates. Although `vscode` will continue to work, we suggest that you migrate to `@types/vscode` and `vscode-test`. This package will only receive security updates.

[Release Notes](https://code.visualstudio.com/updates/v1_36#_splitting-vscode-package-into-typesvscode-and-vscodetest) \| [Migration Guide](https://code.visualstudio.com/api/working-with-extensions/testing-extension#migrating-from-vscode)

## Summary

~~The `vscode` NPM module provides VS Code extension authors tools to write extensions. It provides the `vscode.d.ts` node module (all accessible API for extensions) as well as commands for compiling and testing extensions.~~

~~For more information around extension authoring for VS Code, please see [http://code.visualstudio.com/docs/extensions/overview](http://code.visualstudio.com/docs/extensions/overview)~~

## Changes

**1.1.37** \| 2020-04-22

- Remove `request` and `url-parse` dependencies. [#154](https://github.com/microsoft/vscode-extension-vscode/issues/154).

## License

[MIT](https://github.com/Microsoft/vscode-extension-vscode/blob/HEAD/LICENSE)

## Readme

### Keywords

none

Viewing vscode version 1.1.37
