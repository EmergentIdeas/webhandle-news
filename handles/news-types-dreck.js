const Dreck = require('dreck')
let wh = global.webhandle
const moment = require('moment')

const addCallbackToPromise = require('dreck/add-callback-to-promise')

class NewsTypesDreck extends Dreck {
	constructor(options) {
		super(options)
		
		
		this.templatePrefix = '/news-types/'
		
		let self = this
		
		this.injectors.push((req, focus, next) => {
			

				next()
			}
		)

	}
	
	createTitle(focus) {
		return 'Create News Type'
	}
	
	editTitle(focus) {
		return 'Edit News Type'
	}
	
	listTitle(items) {
		return 'List News Types'
	}
	
	showTitle(items) {
		return 'View News Type'
	}
	
	sort(req, res, focus, callback) {
		let p = new Promise((resolve, reject) => {
			if(focus && Array.isArray(focus)) {
				focus = focus.sort((one, two) => {
					try {
						if(!one.name || !two.name) {
							return 0
						}
						if (one.name < two.name) {
							return -1
						}
						if (one.name > two.name) {
							return 1
						}
					}
					catch(e) {}
					return 0
				})
			}
			resolve(focus)
		})		
		return addCallbackToPromise(p, callback)
	}
}


module.exports = NewsTypesDreck