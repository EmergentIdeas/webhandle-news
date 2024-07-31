const webhandle = require('webhandle')
const commingle = require('commingle')
const usersSetup = require('webhandle-users/integrate-with-webhandle')
const path = require('path')
const express = require('express');

const newsDreck = require('./handles/news-dreck')
const newsTypesDreck = require('./handles/news-types-dreck')

const NewsService = require('./services/news-service')


function makeCategoryFilter(category) {
	if('highlighted' == category) {
		return  item => {
			return item.highligted == "yes"
		}
	}

	return  item => {
		return item.tag == category
	}
}


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
	
	let newsService = webhandle.services.newsService = new NewsService({
		serviceName: 'newsService',
		collections: {
			default: webhandle.dbs[dbName].collections['news'],
			'news': webhandle.dbs[dbName].collections['news'],
			'newstypes': webhandle.dbs[dbName].collections['newstypes']
		}
	})
	


	async function resolveNewsTypes(newsItems) {
		let newsTypes = await newsService.fetchNewsTypes()
		let newsTypesByDBId = newsTypes.reduce((acc, type) => {
			acc[type._id] = type
			return acc
		}, {})
		
		for(let news of newsItems) {
			if(news.tag && Array.isArray(news.tag)) {
				news.resolvedTag = news.tag.map(tag => {
					return newsTypesByDBId[tag] || tag
				})
			}
		}
		
		return {newsTypes, newsTypesByDBId}
	}


	let news = new newsDreck(Object.assign({
		mongoCollection: webhandle.dbs[dbName].collections.news,
		newsService: newsService
	}, options.newsDreckOptions))
	let newsRouter = news.addToRouter(express.Router())

	let newsTypes = new newsTypesDreck(Object.assign({
		mongoCollection: webhandle.dbs[dbName].collections.newstypes,
		newsService: newsService
	}, options.newsTypesDreckOptions))
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
						
						let {newsTypes, newsTypesByDBId} = await resolveNewsTypes([item])
						res.locals.newsItem = item
						if(!res.locals.page) {
							res.locals.page = {}
						}
						res.locals.page.title = item.title
						res.locals.newsTitle = item.title
						res.locals.newsTypes = newsTypes
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

	webhandle.pageServer.preRun.push(async (req, res, next) => {
		let pageName = req.path
		if(!pageName || pageName == '/') {
			pageName = 'index'
		}


		if(res.locals.page.news) {
			let filters = {

			}
			if(Array.isArray(res.locals.page.news)) {
				for(let category of res.locals.page.news) {
					if(options.filters && options.filters[category]) {
						filters[category] = options.filters[category]
					}
					else {
						if(category == 'all') {
							filters.all = item => true
						}
						else {
							filters[category] = makeCategoryFilter(category)
						}
					}
				}
			}
			else {
				if(pageName == 'index') {
					filters.highlighted = item => {
						return item.highlighted == 'yes'
					}
				}
	
			}
			let newsItems = await newsService.fetchNewsItems()
			let {newsTypes, newsTypesByDBId} = await resolveNewsTypes(newsItems)
			
			newsItems = newsService.sortNewsByDate(newsItems)
			newsItems = newsService.allowOnlyPublishedItems(newsItems)
			res.locals.webhandlenews = {
				items: newsItems
				, newsTypes: newsTypes
				, newsTypeByDBId: newsTypesByDBId
			}

			for(let key of Object.keys(filters)) {
				res.locals.webhandlenews[key] = res.locals.webhandlenews.items.filter(filters[key])
			}
			next()

		}
		else if(res.locals.page.newsByTagSlug) {
			let slugs = res.locals.page.newsByTagSlug
			if(typeof slugs === 'string') {
				slugs = [slugs]
			}
			let result = res.locals.newsByTagSlug = {}
			let promises = []
			if(Array.isArray(slugs)) {
				for(const slug of slugs) {
					promises.push(newsService.fetchArticlesByType(slug).then(items => {
						result[slug] = {
							items: newsService.allowOnlyPublishedItems(newsService.sortNewsByDate(items))
						}
					}))
				}
				Promise.all(promises).then(() => {
					next()
				})
			}
		}
		else {
			next()
		}
	})
	
}

module.exports = integrate
