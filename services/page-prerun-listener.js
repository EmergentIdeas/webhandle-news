const webhandle = require('webhandle')
const makeCategoryFilter = require('./make-category-filter')

function createPagePrerun(options) {

	return async function pagePrerun(req, res, next) {
		let newsService = webhandle.services.newsService
		let pageName = req.path
		if (!pageName || pageName == '/') {
			pageName = 'index'
		}
		
		let needToLoadNews = false
		if (res.locals.page.news || res.locals.page.newsByTagSlug) {
			needToLoadNews = true

		}
		
		if(needToLoadNews) {
			let newsItems = await newsService.fetchNewsItems()

			newsItems = newsService.sortNewsByDate(newsItems)
			newsItems = newsService.allowOnlyPublishedItems(newsItems)
			let { newsTypes, newsTypesByDBId } = await newsService.resolveAdditionalInformation(newsItems)
			res.locals.webhandlenews = {
				items: newsItems
				, newsTypes: newsTypes
				, newsTypeByDBId: newsTypesByDBId
				, selectedItems: newsItems
			}

			let filters = {}
			

			// if the page wants news, and it's the index page, we'll load the hightlighted news articles
			if (pageName == 'index') {
				filters.highlighted = item => {
					return item.highlighted == 'yes'
				}
			}
			
			// If the `news` value is an array of strings, instead of something like a boolean, we need to
			// specially group news by those categories
			if (Array.isArray(res.locals.page.news)) {
				for (let category of res.locals.page.news) {
					
					if (options.filters && options.filters[category]) {
						// some sorts of category filters are passed via the options. They do something more
						// complicated than just looking at the tag value.
						filters[category] = options.filters[category]
					}
					else {
						if (category == 'all') {
							filters.all = item => true
						}
						else {
							filters[category] = makeCategoryFilter(category)
						}
					}
				}
			}
			
			// We've got filters set up. We just need to run through them and do the catorization now.
			for (let key of Object.keys(filters)) {
				res.locals.webhandlenews[key] = res.locals.webhandlenews.items.filter(filters[key])
			}
			

			if (res.locals.page.newsByTagSlug) {
				// Here we've had a general request to group news articles by their tag slugs
				let result = res.locals.newsByTagSlug = {}
				for(let news of newsItems) {
					if(news.resolvedTag && Array.isArray(news.resolvedTag)) {
						for(let tag of news.resolvedTag) {
							if(!result[tag.slug]) {
								result[tag.slug] = []
							}
							result[tag.slug].push(news)
						}
					}
				}
			}
			
			
			
			if(req.query.tag) {
				// We've had a request to make the select news items ONLY from a specific tag
				res.locals.webhandlenews.selectedItems = newsItems.filter(makeCategoryFilter(req.query.tag))
				res.locals.webhandlenews.selectedByTag = req.query.tag
			}
		}

		next()

	}

}

module.exports = createPagePrerun
