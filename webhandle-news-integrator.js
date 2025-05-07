const webhandle = require('webhandle')
const path = require('path')
const express = require('express');

const newsDreck = require('./handles/news-dreck')
const newsTypesDreck = require('./handles/news-types-dreck')

const NewsService = require('./services/news-service')
const createPagePrerun = require('./services/page-prerun-listener')

/**
 * 
 * @param {*} dbName 
 * @param {object} options 
 * @param {string} options.templateDir
 * @param {object} options.newsDreckOptions
 * @param {object} options.newsTypesDreckOptions
 * @param {function} options.fetchAuthor An async function which takes one argument, the id of the author,
 * and returns an array of authors. If no id is passed, all authors are returned. Each author must have
 * a `name` and `id` attribute.
 */
let integrate = function(dbName, options) {
	options = options || {}
	if(!options.newsDreckOptions) {
		options.newsDreckOptions = {}
	}
	if(!options.newsTypesDreckOptions) {
		options.newsTypesDreckOptions = {}
	}
	if('templateDir' in options == false) {
		options.templateDir = 'node_modules/@dankolz/webhandle-news/views'
	}

	if(!webhandle.dbs[dbName].collections.news) {
		webhandle.dbs[dbName].collections.news = webhandle.dbs[dbName].db.collection('news')
	}
	if(!webhandle.dbs[dbName].collections.newstypes) {
		webhandle.dbs[dbName].collections.newstypes = webhandle.dbs[dbName].db.collection('newstypes')
	}
	
	let newsService = webhandle.services.news = webhandle.services.newsService = new NewsService({
		serviceName: 'newsService',
		collections: {
			default: webhandle.dbs[dbName].collections['news'],
			'news': webhandle.dbs[dbName].collections['news'],
			'newstypes': webhandle.dbs[dbName].collections['newstypes']
		}
		, fetchAuthor: options.fetchAuthor
	})
	

	if(!webhandle.drecks) {
		webhandle.drecks = {}
	}

	let news = new newsDreck(Object.assign({
		mongoCollection: webhandle.dbs[dbName].collections.news,
		newsService: newsService
		, fetchAuthor: options.fetchAuthor
	}, options.newsDreckOptions))
	webhandle.drecks.news = news
	let newsRouter = news.addToRouter(express.Router())

	let newsTypes = new newsTypesDreck(Object.assign({
		mongoCollection: webhandle.dbs[dbName].collections.newstypes,
		newsService: newsService
	}, options.newsTypesDreckOptions))
	webhandle.drecks.newsTypes = newsTypes
	let typesRouter = newsTypes.addToRouter(express.Router())

	let combinedRouter = express.Router()
	combinedRouter.use('/news-items', newsRouter)
	combinedRouter.use('/news-types', typesRouter)

	let securednewsRouter = require('webhandle-users/utils/allow-group')(
		['administrators'],
		combinedRouter
	)
	webhandle.routers.primary.use(securednewsRouter)
	
	webhandle.routers.primary.get('/news/:slug', (req, res, next) => {
		webhandle.dbs[dbName].collections.news.find({}).toArray(async (err, result) => {
			if(err) {
				log.error(err)
			}
			else if(result){
				for(let item of result) {
					let slug = item.slug || createSlug(item.title)
					if(slug == req.params.slug || item._id.toString() == req.params.slug) {
						
						let {newsTypes, newsTypesByDBId} = await newsService.resolveAdditionalInformation([item])
						res.locals.newsItem = item
						if(!res.locals.page) {
							res.locals.page = {}
						}
						res.locals.page.title = item.title
						res.locals.newsTitle = item.title
						res.locals.newsTypes = newsTypes
						newsTypes.sort((one, two) => {
							let o = (one.name || '').toLowerCase()
							let t = (two.name || '').toLowerCase()
							return o.localeCompare(t)
						})
						

						res.locals.newsTypeByDBId = newsTypesByDBId
						
						if(item.contentPage) {
							req.url = '/' + item.contentPage
						}
						else {
							req.url = '/news-item-page'
						}
						next()
						return
					}
				}
				next()
			}
		})
	})

	
	if(options.templateDir) {
		webhandle.addTemplateDir(path.join(webhandle.projectRoot, options.templateDir))
	}

	webhandle.pageServer.preRun.push(createPagePrerun(options))
	
}

module.exports = integrate
