const webhandle = require('webhandle')
const commingle = require('commingle')
const usersSetup = require('webhandle-users/integrate-with-webhandle')
const path = require('path')
const express = require('express');

const createSlug = require('./tools/create-slug')

const newsDreck = require('./handles/news-dreck')
const newsTypesDreck = require('./handles/news-types-dreck')



let integrate = function(dbName) {
	if(!webhandle.dbs[dbName].collections.news) {
		webhandle.dbs[dbName].collections.news = webhandle.dbs[dbName].db.collection('news')
	}
	if(!webhandle.dbs[dbName].collections.newstypes) {
		webhandle.dbs[dbName].collections.newstypes = webhandle.dbs[dbName].db.collection('newstypes')
	}
	
	let news = new newsDreck({
		mongoCollection: webhandle.dbs[dbName].collections.news,
	})
	let newsRouter = news.addToRouter(express.Router())

	let newsTypes = new newsTypesDreck({
		mongoCollection: webhandle.dbs[dbName].collections.newstypes,
	})
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
		webhandle.dbs[dbName].collections.news.find({}).toArray((err, result) => {
			if(err) {
				log.error(err)
			}
			else if(result){
				for(let item of result) {
					let slug = item.slug || createSlug(item.title)
					if(slug == req.params.slug) {
						res.locals.newsItem = item
						if(!res.locals.page) {
							res.locals.page = {}
						}
						res.locals.page.title = item.title
						res.locals.newsTitle = item.title

						req.url = '/news-item-page'
						next()
						return
					}
				}
				next()
			}
		})
	})

	
	webhandle.addTemplateDir(path.join(webhandle.projectRoot, 'node_modules/@dankolz/webhandle-news/views'))

	webhandle.pageServer.preRun.push((req, res, next) => {
		let pageName = req.path
		if(!pageName || pageName == '/') {
			pageName = 'index'
		}

		let filterNews
		if(pageName == 'index') {
			filterNews = item => {
				return item.highlighted == 'yes'
			}
		}

		if(res.locals.page.news) {
			webhandle.dbs[dbName].collections.news.find({}).toArray((err, result) => {
				if(err) {
					log.error(err)
				}
				else if(result){
					result = result.sort((one, two) => {
						try {
							
							return new Date(one.pubDate) < new Date(two.pubDate)
						}
						catch(e) {
							return 0
						}
						
					})
					res.locals.webhandlenews = {
						items: result
					}

					if(filterNews) {
						res.locals.webhandlenews.items = res.locals.webhandlenews.items.filter(filterNews)
					}

					res.locals.webhandlenews.items.forEach(item => {
						if(!item.slug) {
							item.slug = createSlug(item.title)
						}
					})
				}
				next()
			})
		}
		else {
			next()
		}
	})
	
}

module.exports = integrate
