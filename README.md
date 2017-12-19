# babel-plugin-transform-amd-to-commonjs

[![npm version](https://badge.fury.io/js/babel-plugin-transform-amd-to-commonjs.svg)](https://badge.fury.io/js/babel-plugin-transform-amd-to-commonjs)
[![Build Status](https://travis-ci.org/msrose/babel-plugin-transform-amd-to-commonjs.svg?branch=master)](https://travis-ci.org/msrose/babel-plugin-transform-amd-to-commonjs)
[![codecov](https://codecov.io/gh/msrose/babel-plugin-transform-amd-to-commonjs/branch/master/graph/badge.svg)](https://codecov.io/gh/msrose/babel-plugin-transform-amd-to-commonjs)
[![devDependencies Status](https://david-dm.org/msrose/babel-plugin-transform-amd-to-commonjs/dev-status.svg)](https://david-dm.org/msrose/babel-plugin-transform-amd-to-commonjs?type=dev)
[![Greenkeeper badge](https://badges.greenkeeper.io/msrose/babel-plugin-transform-amd-to-commonjs.svg)](https://greenkeeper.io/)

Babel plugin that transforms AMD to CommonJS.

## Usage

[Check out the example project](https://github.com/msrose/transform-amd-to-commonjs-example) that has Jest tests synchronously `require`ing AMD modules.

```
npm install --save-dev babel-plugin-transform-amd-to-commonjs
```

Add the transform to your .babelrc:

```
{
  "plugins": ["transform-amd-to-commonjs"]
}
```

## Examples

### Define

Input:

```javascript
define(['jquery', 'underscore', 'myModule'], function($, _) {
  // ...
  return {
    // ...
  };
});
```

Output:

```javascript
module.exports = function() {
  var $ = require('jquery');
  var _ = require('underscore');
  require('myModule');
  // ...
  return {
    // ...
  };
}();
```

### Require

Input:

```javascript
// Nested requires
require(['jquery', 'underscore', 'myModule'], function($, _) {
  // ...
  require(['anotherModule'], function(anotherModule) {
    // ...
  });
});
```

Output:

```javascript
(function() {
  var $ = require('jquery');
  var _ = require('underscore');
  require('myModule');
  // ...
  (function() {
    var anotherModule = require('anotherModule');
    // ...
  })();
})();
```

## Details

Only Node.js >= 6 is supported. For Node.js 4, please use version 0.2.2: `npm install --save-dev babel-plugin-transform-amd-to-common-js@0.2.2`.

AMD is interpreted as described and implemented by [RequireJS](http://requirejs.org/).

- Only **top-level** calls to a `define` function will be transformed.
- **All** calls to `require` where it is given an array of dependencies as its first argument will be transformed.
  - If you would like the option to only transform top-level require calls, please file an issue.
- Explicitly requiring `require`, `module`, and `exports` in an AMD module will not generate a call to require, but instead defer to the global require, module, and exports assumed to be in the CommonJS environment you are transforming to.
  - The same is true for the [simplified CommonJS wrapper](http://requirejs.org/docs/api.html#cjsmodule).
- The module name (optional first argument to `define`) is ignored, since the module ID in CommonJS is determined by the resolved filename.

## Caveats

### One module per file

Make sure that you have only one AMD module defined per file, otherwise you'll experience strange results once transformed to the CommonJS format.

### Listing module dependencies and callbacks inline

The following will not be transformed, since the plugin does not traverse the arguments to define or require:

```javascript
var deps = ['one', 'two'];
var factory = function(one, two) {
  one.doStuff();
  return two.doStuff();
};
define(deps, factory);
```

If you want to be able to define your modules as above, please submit an issue. Otherwise, please define your modules as:

```javascript
define(['one', 'two'], function(one, two) {
  one.doStuff();
  return two.doStuff();
});
```

### Injecting `require`, `module`, or `exports` as dependencies

It is strongly advised to simply use return statements to define your AMD module's exports. That being said, the plugin takes into account the cases where
you may have injected them as dependencies. Beware of the following gotchas when using this pattern:

- If you're injecting `module`, `exports`, and/or `require` as dependencies, they must be injected as string literals,
otherwise you'll end up with things like `require('module')`.

- If you inject `module` or `exports` as a dependency in your AMD module, the plugin assumes that you are using them to set the exports of your module.
Therefore, a return value of the IIFE that wraps your module will not be assigned to `module.exports`,

That means if you're using AMD in a funky way, some strange things can happen.
For example, you can require `exports`, set some values on it, but then override them with a return value (you really shouldn't do this though):

```javascript
define(['exports'], function(exports) {
  exports.stuff = 'hi';
  return {
    override: 'lol no stuff for you';
  };
});
// exported: { override: 'lol no stuff for you' };
```

This transforms to the following IIFE (with the return value not assigned to `module.exports` because you've injected `exports` as a dependency):

```javascript
(function() {
  exports.stuff = 'hi';
  return {
    override: 'lol no stuff for you';
  };
})();
// exported: { stuff: 'hi' }
```

In order to account for this possible error, it would have to be transformed to something disgusting like this instead:

```javascript
(function() {
  var returnValue = (function() {
    exports.stuff = 'hi';
    return {
      override: 'lol no stuff for you';
    };
  })();
  if(typeof returnValue !== 'undefined') {
    module.exports = returnValue;
  }
})();
```

Doing this transform for this specific case introduces relatively significant complexity into the code for almost no gain.
If you want this edge case to be accounted for, please submit an issue.
