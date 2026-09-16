import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const componentFiles = [
	'uni_modules/uview-ultra/components/up-row-notice/up-row-notice.vue',
	'uni_modules/uview-ultra/components/up-row-notice/up-row-notice.uvue'
]
const keepsSpacesAndNeverWraps = /^pre(?:\s+!important)?$/

// 该边界用例会把空格切到第二个 text 节点的首部。
const text = 'ABCDEFGHIJKLMNOPQRST WXYZ'
const chunks = []
for (let i = 0; i < text.length; i += 20) {
	chunks.push(text.slice(i, i + 20))
}
assert.deepEqual(chunks, ['ABCDEFGHIJKLMNOPQRST', ' WXYZ'])
assert.equal(chunks.join(''), text)
assert.ok(chunks.some(chunk => /^\s/.test(chunk)))

for (const relativePath of componentFiles) {
	const source = readFileSync(resolve(repoRoot, relativePath), 'utf8')
	assert.match(source, /len\s*=\s*20/, `${relativePath}: should keep 20-character chunking`)
	assert.match(source, /<text[\s\S]*v-for="\(item, index\) in innerText"/, `${relativePath}: should render each chunk in a text node`)

	const inlineWhiteSpace = source.match(/whiteSpace(?:['"]\])?\s*=\s*['"]([^'"]+)/)?.[1]
	assert.match(
		inlineWhiteSpace ?? '',
		keepsSpacesAndNeverWraps,
		`${relativePath}: inline text style must preserve edge spaces without wrapping`
	)

	const cssWhiteSpace = source.match(/white-space:\s*([^;\n]+)/)?.[1]?.trim()
	assert.match(
		cssWhiteSpace ?? '',
		keepsSpacesAndNeverWraps,
		`${relativePath}: scrolling container must preserve edge spaces without wrapping`
	)
}

console.log('row notice space assertions passed')
