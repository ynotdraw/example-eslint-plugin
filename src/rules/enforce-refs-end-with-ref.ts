// Written following https://typescript-eslint.io/developers/custom-rules
// as a template.
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `url-to-your-rules/${name}.ts`,
);

export const enforceRefsEndWithRef = createRule({
  name: 'enforce-refs-end-with-ref',
  meta: {
    docs: {
      description:
        'Ensures React references end with "Ref" in their variable declarations.',
      recommended: 'recommended',
    },
    type: 'suggestion',
    messages: {
      addRefSuffix: 'Prefer reference variable declarations end with "Ref".',
    },
    schema: [],
    fixable: 'code',
  },
  defaultOptions: [],
  create: (context) => {
    return {
      VariableDeclarator(node) {
        if (
          node.init &&
          node.init.type === AST_NODE_TYPES.CallExpression &&
          node.init.callee &&
          node.init.callee.type === AST_NODE_TYPES.Identifier &&
          node.init.callee.name === 'useRef' &&
          node.id.type === AST_NODE_TYPES.Identifier &&
          node.id.name &&
          !node.id.name.endsWith('Ref')
        ) {
          context.report({
            node,
            messageId: 'addRefSuffix',
            fix: function (fixer) {
              if (node.id.type !== AST_NODE_TYPES.Identifier) {
                return null;
              }

              return fixer.replaceText(node.id, `${node.id.name}Ref`);
            },
          });
        }
      },
    };
  },
});
