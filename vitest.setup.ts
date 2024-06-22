// From following https://typescript-eslint.io/packages/rule-tester/#vitest
import * as vitest from 'vitest';

import { RuleTester } from '@typescript-eslint/rule-tester';

RuleTester.afterAll = vitest.afterAll;
