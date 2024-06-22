// Following the patterns described at  https://typescript-eslint.io/packages/rule-tester/#usage
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
      // "output" is the assertion for when the auto-fix runs.
      // We are essentially asserting our fix function works as expected!
      output: 'const myInputRef = useRef();',
      errors: [{ messageId: 'addRefSuffix' }],
    },
  ],
});
