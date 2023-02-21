const Dreck = require('dreck')
let wh = global.webhandle
const moment = require('moment')
const _ = require('underscore')
const simplePropertyInjector = require('dreck/binders/simple-property-injector')


const addCallbackToPromise = require('dreck/add-callback-to-promise')

class NewsTypesDreck extends Dreck {
	constructor(options) {
		super(options)
		
		
		let curDreck = this
		_.extend(this, 
			{
				templatePrefix: 'news-types/',
				locals: {
					pretemplate: 'app_pre',
					posttemplate: 'app_post'
				},
				injectors: [
					(req, focus, next) => {
						simplePropertyInjector(req, focus, curDreck.bannedInjectMembers, next)
					}
				]
			}
			, options
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