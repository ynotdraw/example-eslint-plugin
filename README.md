# Example ESLint Plugin

This is an example repository for setting up a custom ESLint plugin so that you can write ESLint rules to help drive consistency in your repos. This README includes a step-by-step walkthrough - I hope it is helpful! If you find any issues or areas of improvement, feel free to submit a PR.

> [!NOTE]
> All of the code here is built from existing documentation. I've found that hooking _everything_ together is where existing documentation falls short. Mostly due to combining multiple tools. This is my attempt at providing a nice reference for folks!

## Decisions

This repository has a few opinions on how this package is constructed. I chose the following technologies:

- TypeScript
- Prettier
- ESLint
- TypeScript ESLint packages
- Vitest

## Setup your repository / package

The first step in this process is to setup a repository or new package. If you're already in a monorepo setup, your setup may be "add a new package" rather than setting up a new repository altogether. Either way, these steps will still generally apply.

I have a personal, private template I use on my GitHub account that scaffolds the `package.json` for me when working in OSS, but you can copy the first commit and modify it to your needs!

[Setup commit](https://github.com/ynotdraw/example-eslint-plugin/commit/a4bf4092ba083158af4ad09c830171ab988ad25a)

## Add Prettier

I'm a big fan of enforcing consistency everywhere, so we add Prettier for formatting. I'm a simple man, I like Prettier's defaults. Except for [`single quotes`](https://prettier.io/docs/en/options.html#quotes). I'm definitely team `single quotes`.

[Adding prettier](https://github.com/ynotdraw/example-eslint-plugin/commit/bef63202c1b5cf34e95614f05da2429ba68e8a67)

## Add ESLint

> Yo dawg, I heard you like ESLint rules for your ESLint rules, so we put ESLint rules in your ESLint rules plugin.

Yup! I also like linting my rules for consistency too. Let's add it!

[Adding ESLint](https://github.com/ynotdraw/example-eslint-plugin/commit/7558f9d2ce94d6178b34d2fa1cec3a83db7f9bbc)

## Add a `tsconfig.json`

We'll be using `tsc` to create a `dist/` so that we can generate a build and publish these bad boys. I think using `tsc` is the most convenient because we're already writing our rules with TypeScript.

[Adding tsconfig.json](https://github.com/ynotdraw/example-eslint-plugin/commit/8ba165b162887b8a89a5d14e724f5091a6a82c37)

## Setup `src/`

Let's go ahead and setup our `src/` directory. I personally follow this pattern as it's used in a lot of other ESLint libraries. You can configure it however you'd like!

[Setting up the structure](https://github.com/ynotdraw/example-eslint-plugin/commit/b65929fdf953d14146743ac04e2e121839a5a12b)

## ASTExplorer

ESLint rules navigate the abstract syntax tree. A great way to explore the abstract syntax tree of a file is to use [astexplorer.net](https://astexplorer.net). The right-hand pane gives you everything you need to begin writing custom ESLint rules. You dig into different nodes and write code that traverses these nodes, evaluating the contents.

As always, I highly recommend getting a foundational understanding of how this works. It'll make you a better developer. But if you find yourself struggling, this is where I'd recommend going to the good ol' world wide web.

> [!TIP]
> A ChatGPT prompt such as "Write me an ESLint rule that \_\_\_" is normally a good enough starting point for it. A lot of times it isn't 100% correct, but it gets in the right ballpark. With your previous knowledge exploring the ASTExplorer, you should be able to make sense of things and find a path forward!

## Writing our first rule

Let's say we have the following code. We want to enforce that all `ref`s in React end with "Ref" in their variable declaration so that it's clear via the variable name alone that this is a ref.

```jsx
import React, { useRef } from 'react';

export function InputComponent() {
  const myInput = useRef(); // This should trigger the ESLint error
  const myInputRef = useRef(); // This should not trigger the ESLint error

  return <input ref={myInputRef} />;
}
```

### Boilerplate setup

Let's start out with some boilerplate. This all comes from https://typescript-eslint.io/developers/custom-rules. I'll go into more detail below on setting up rules, but we'll start by creating a file under `src/rules/enforce-refs-end-with-ref.ts`.

Yup, I'm using TypeScript. You can use JavaScript if you'd like. I prefer to write things in TypeScript though! The autocomplete is really nice.

```ts
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `url-to-your-rules/${name}.ts`,
);

export const enforceRefsEndWithRef = createRule({
  // Give our rule a name
  name: 'enforce-refs-end-with-ref',
  // Define all of the information for our rule
  meta: {
    docs: {
      // Give a nice description of what your rule enforces
      description:
        'Ensures React references end with "Ref" in their variable declarations.',
      recommended: 'recommended',
    },
    // You could make this a 'problem', up to you!
    type: 'suggestion',
    // This is the message that will be displayed to users when they run
    // `eslint .` and get an error
    messages: {
      addRefSuffix: 'Prefer reference variable declarations end with "Ref".',
    },
    schema: [],
    // If your code does not have an autofix, you can remove this line
    fixable: 'code',
  },
  defaultOptions: [],
  // This is where we will write our rule
  create: (context) => {
    return {};
  },
});
```

### AST Exploring

Now let's head on over to the ASTExplorer. Go ahead and copy/paste the following code into it.

```jsx
import React, { useRef } from 'react';

export function InputComponent() {
  const myInput = useRef(); // This should trigger the ESLint error
  const myInputRef = useRef(); // This should not trigger the ESLint error

  return <input ref={myInputRef} />;
}
```

You should see the following.

![The Variable Declaration from ASTExplorer](https://github.com/ynotdraw/example-eslint-plugin/blob/main/.github/variable.png?raw=true)

We know we are wanting to target a variable declaration, so it should be no surprise there's a `VariableDeclaration` from ASTExplorer. Let's start there! The samples from here on out will be around the `create` function for simplicity.

```ts
create: (context) => {
  return {
    VariableDeclarator(node) {
      // We'll do something in here
    },
  };
};
```

There are actually two variable declarators listed here - one for each `useRef`. We'll be focusing on the first one. Let's dive in more to see how we get to the variable declaration name.

![Expanding the Variable Declaration in ASTExplorer](https://github.com/ynotdraw/example-eslint-plugin/blob/main/.github/double.png?raw=true)

If you expand our first variable declaration (`const myInput = useRef();`), you'll notice there's a `declarations` array. Oh no! We now have another variable declaration inside of this declarations array. Don't worry folks! When we write our ESLint rules, the node types are recursive, so you only need to tell the function to target `VariableDeclarator` and it'll do the rest for you.

Now we need to deal with two other nodes as shown in the image above: `id` and `init`.

- `id` is `myInput`
- `init` is `useRef()`

We'll focus on `init` first. Go ahead and expand it.

![Expanding the Variable Declaration in ASTExplorer](https://github.com/ynotdraw/example-eslint-plugin/blob/main/.github/call-expression.png?raw=true)

Let's first verify the `init` is `useRef`. Otherwise, we have no need to continue running code to evaluate our rule.

```ts
create: (context) => {
  return {
    VariableDeclarator(node) {
      if (
        node.init &&
        node.init.type === 'CallExpression' &&
        node.init.callee &&
        node.init.callee.type === 'Identifier' &&
        node.init.callee.name === 'useRef' &&
      ) {
        // If we are here, we know we are in a variable declaration
        // that calls `useRef`
      }
    },
  };
};
```

So now we can be sure we are looking at a variable declaration that is calling `useRef`. Now we can check if our variable ends with "Ref" in the name. Let's take a look at `id` now.

![Exploring the Identifier in ASTExplorer](https://github.com/ynotdraw/example-eslint-plugin/blob/main/.github/id.png?raw=true)

This one is a bit easier to parse through! The Identifier `name` is how we get to the name of our variable, so we can combine all of above to come up with the following.

```ts
create: (context) => {
  return {
    VariableDeclarator(node) {
      if (
        // From before
        node.init &&
        node.init.type === 'CallExpression'
        node.init.callee &&
        node.init.callee.type === 'Identifier' &&
        node.init.callee.name === 'useRef' &&
        // Now checking our variable declaration
        // to see if it ends with "Ref"
        node.id.type === 'Identifier' &&
        node.id.name &&
        !node.id.name.endsWith('Ref')
      ) {
        // If we are here, we should be confident in the following:
        //
        // - The user is calling `useRef()` from React
        // - The user has a variable declaration
        // - That declaration *does not* end with "Ref"
      }
    },
  };
};
```

We now have everything we need to throw a linting error if we encounter this problem! Let's focus on writing that.

The `context` object contains a `report` method. The report method is how we tell ESLint there is an error. As we'll see in a moment, `report` also exposes a `fix` function, allow you to write code to auto-fix code to fit the pattern you'd like. Let's update our code snippet to complain to the user when their ref declaration doesn't end with "Ref".

```ts
create: (context) => {
  return {
    VariableDeclarator(node) {
      if (
        // From before
        node.init &&
        node.init.type === 'CallExpression' &&
        node.init.callee &&
        node.init.callee.type === 'Identifier' &&
        node.init.callee.name === 'useRef' &&
        // Now checking our variable declaration
        // to see if it ends with "Ref"
        node.id.type === 'Identifier' &&
        node.id.name &&
        !node.id.name.endsWith('Ref')
      ) {
        context.report({
          node,
          messageId: 'addRefSuffix',
        });
      }
    },
  };
};
```

When the user would run `eslint .`, the user would get the `addRefSuffix` message now.

```bash
oss/example/test-component.ts
  12:15  error  Prefer reference variable declarations end with "Ref".  example-eslint-plugin/enforce-refs-end-with-ref

✖ 1 problem (1 error, 0 warnings)
```

### Writing an autofix

Now let's write an autofix. I really love adding ESLint rules that can autofix code for me. As mentioned above, `context.report` allows you to provide a `fix` function that will run when a user calls `eslint . --fix`. Let's get one added!

![Showing the Identifier name pointing to "myInput"](https://github.com/ynotdraw/example-eslint-plugin/blob/main/.github/id-name.png?raw=true)

This one is pretty straight forward, since we know what node we want to update and how to update the text - we have access to `node.id.name`!

We'll focus on the `context.report` function itself for simplicity.

```ts
context.report({
  node,
  messageId: 'addRefSuffix',
  fix: function (fixer) {
    // `replaceText` takes two arguments
    //
    // 1. The "node" ID to update
    // 2. The text to replace with
    return fixer.replaceText(node.id, `${node.id.name}Ref`);
  },
});
```

And that's it! Our lint rule is now complete with a great autofix.

### The completed rule

I ended up making this more TypeScript friendly and using the `AST_NODE_TYPES` for folks using TypeScript. But the end result can be found at https://github.com/ynotdraw/example-eslint-plugin/blob/main/src/rules/enforce-refs-end-with-ref.ts

## Add to our index file

We'll want to go ahead and add our new rule to our `src/rules/index.ts` file. This way our rules are all in the single object that ESLint likes.

```ts
import { enforceRefsEndWithRef } from './enforce-refs-end-with-ref.js';

const rules = {
  'enforce-refs-end-with-ref': enforceRefsEndWithRef,
};

export default rules;
```

## Testing

If you're using only JavaScript, you can use Node's built-in [test runner](https://nodejs.org/api/test.html). I ended up using vitest due to familiarity with it already and since I'm using TypeScript. It doesn't require me to compile to JavaScript, I can simply point it to my test files and it just works. That's nice.

Adding tests is really important to ensure your rules are doing what you expect them to. Especially if you have `fix` functions defined.

Here's a brief example of some tests for the rule created above.

```ts
// /enforce-refs-end-with-ref.test.ts
import { RuleTester } from '@typescript-eslint/rule-tester';
import { enforceRefsEndWithRef } from './enforce-refs-end-with-ref.js';

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
});

ruleTester.run('enforce-refs-end-with-ref', enforceRefsEndWithRef, {
  valid: [
    {
      code: 'const myInputRef = useRef();',
    },
  ],
  invalid: [
    {
      code: 'const myInput = useRef();',
      output: 'const myInputRef = useRef();',
      errors: [{ messageId: 'addRefSuffix' }],
    },
  ],
});
```

## Building and publishing

As mentioned above, I use `tsc` to generate a `dist/` directory. That directory is then the directory that is published to `npm` due to `files` in our `package.json`.

After we run `pnpm build`, we can then publish our package to `npm`. You don't necessarily _have_ to publish either. All you really need is a build if you're writing in TypeScript. For example, if you're in a monorepo and don't want to publish your ESLint plugin but use it internally, you can forget about this step!

The only thing to keep in mind is that if your packages rely on this ESLint plugin, the plugin will need to be built first, before the other packages are linted against. Otherwise you may get errors in CI!

## Consume the plugin in an application

Add your dependency to whichever packages will be consuming your rules. If it is published to `npm` or another registry, it should look something like the following.

```json
"devDependencies": {
  "ynotdraw-example-eslint-plugin": "1.0.0",
}
```

If you are **not** publishing, and are going the monorepo route mentioned above, it may look something like this.

```json
"devDependencies": {
  "ynotdraw-example-eslint-plugin": "*",
}
```

Now go to your existing package's ESLint configuration and import our rules at the top of the file.

```js
// eslint.config.js
import coolRules from 'ynotdraw-example-eslint-plugin';
```

Add it to your [`plugins` in your ESLint config.](https://eslint.org/docs/latest/use/configure/plugins#configure-plugins)

```js
// eslint.config.js
plugins: {
  // ..other plugins above
  'ynotdraw-example-eslint-plugin': coolRules,
},
```

Add whichever rules you'd like to [enforce under `rules`.](https://eslint.org/docs/latest/use/configure/plugins#use-plugin-rules)

```js
// eslint.config.js
rules: {
  // ..other plugins above
  'ynotdraw-example-eslint-plugin/enforce-refs-end-with-ref': 'error',
}
```

## That's it!

That should cover starting an ESLint plugin from scratch and getting it added to existing projects. Did I miss anything? Let me know! 👋
