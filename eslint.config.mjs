import next from 'eslint-config-next'

/** @type {import('eslint').Linter.Config} */
export default {
  ...next,
  ignores: ['node_modules', 'dist', '.next'],
}
