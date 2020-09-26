const Dreck = require('dreck')
let webhandle = require('webhandle')
const path = require('path')
const fs = require('fs')
const _ = require('underscore')
const simplePropertyInjector = require('dreck/binders/simple-property-injector')


class NewsDreck extends Dreck {
	constructor(options) {
		super(options)
		let curDreck = this
		_.extend(this, 
			{
				templatePrefix: 'news/',
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
		)
	}
	
	createTitle(focus) {
		return 'Create News Item'
	}
	
	editTitle(focus) {
		return 'Edit News Item'
	}
	
	listTitle(items) {
		return 'List News Items'
	}

}

module.exports = NewsDreck



