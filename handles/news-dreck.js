const Dreck = require('dreck')
let webhandle = require('webhandle')
const path = require('path')
const fs = require('fs')
const _ = require('underscore')
const simplePropertyInjector = require('dreck/binders/simple-property-injector')
const createSlug = require('../tools/create-slug')

const addCallbackToPromise = require('add-callback-to-promise')

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
					},
					(req, focus, next) => {
						if(!focus.slug) {
							focus.slug = createSlug(focus.title)
						}
						if(req.files && req.files.length > 0) {
							let fileName = req.files[0].originalname
							webhandle.sinks.project.write('/public/docs/' + fileName, req.files[0].buffer, () => {
								
							})
							focus.link = '/docs/' + fileName
						}
						next()
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

	newGET(req, res, next) {
		webhandle.services.newsService.fetchNewsTypes({}, (err, results) => {
			res.locals.newsTypes = results
			
			let p
			if(webhandle.services.pageEditor.getPageFiles) {
				p = webhandle.services.pageEditor.getPageFiles()
			}
			else {
				p = Promise.resolve([])
			}
			
			p.then(pages => {
				res.locals.allPages = pages.map(file => {
					let parts = file.split('.')
					parts.pop()
					return parts.join('.')
				}).map(file => {
					return file.substring(1)
				})

				return super.newGET(req, res, next)
			})
			.catch(err => {
				return super.newGET(req, res, next)
			})
		})
	}
	
	editGET(req, res, next) {
		webhandle.services.newsService.fetchNewsTypes({}, (err, results) => {
			res.locals.newsTypes = results
			
			let p
			if(webhandle.services.pageEditor.getPageFiles) {
				p = webhandle.services.pageEditor.getPageFiles()
			}
			else {
				p = Promise.resolve([])
			}
			
			p.then(pages => {
				res.locals.allPages = pages.map(file => {
					let parts = file.split('.')
					parts.pop()
					return parts.join('.')
				}).map(file => {
					return file.substring(1)
				})

				return super.editGET(req, res, next)
			})
			.catch(err => {
				return super.edtiGET(req, res, next)
			})
		})
	}
	
	sort(req, res, focus, callback) {
		let p = new Promise((resolve, reject) => {
			if(Array.isArray(focus)) {
				focus = focus.sort((one, two) => {
					try {
						return new Date(one.pubDate) < new Date(two.pubDate) ? 1 : -1
					}
					catch(e) {
						return 0
					}
				})
			}
			resolve(focus)
		})		
		return addCallbackToPromise(p, callback)
	}
	

}

module.exports = NewsDreck



