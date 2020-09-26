
let allowed = 'abcdefghijklmnopqrstuvwxyz1234567890'

const createSlug = (text) => {
	if(!text) {
		return text
	}

	text = text.toLowerCase()
	
	let result = ''
	for(let c of text) {
		if(allowed.includes(c)) {
			result += c
		}
		else {
			result += '-'
		}
	}

	let reg = /(--+)/g
	result.replace(reg, '-')

	if(result.startsWith('-')) {
		result = result.substring(1)
	}
	if(result.endsWith('-')) {
		result = result.substring(0, result.length - 1)
	}
	return result
}

module.exports = createSlug