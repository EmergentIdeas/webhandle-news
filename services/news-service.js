const addCallbackToPromise = require('dreck/add-callback-to-promise')
const filog = require('filter-log')
const _ = require('underscore')
const createSlug = require('../tools/create-slug')

const MongodbDataService = require('@dankolz/mongodb-data-service')

/**
 * @typedef {object} NewsType
 * @property {string} name
 * @property {string} slug
 */



/**
 * Access to news and news types
 */
class NewsService extends MongodbDataService {
	
	constructor(options) {
		super(options)
	}

	async fetchNewsItems(query, callback) {
		return this._fetchByQuery(this.collections.news, query, callback)
	}
	async fetchNewsItemsById(id, callback) {
		return this._fetchById(this.collections.news, id, callback)
	}
	async saveNewsItems(focus, callback) {
		return this._save(this.collections.news, focus, callback) 
	}
	async fetchNewsTypes(query, callback) {
		return this._fetchByQuery(this.collections.newstypes, query, callback)
	}
	async fetchNewsTypesById(id, callback) {
		return this._fetchById(this.collections.newstypes, id, callback)
	}
	async saveNewsType(focus, callback) {
		return this._save(this.collections.newstypes, focus, callback) 
	}
	async fetchArticlesByType(slug) {
		let types = await this.fetchNewsTypes({slug: slug})
		if(types.length > 0) {
			let ids = types.map(type => {
				return type._id.toString()
			})
			let newsItems = await this.fetchNewsItems({
				tag: ids[0]
			})
			return newsItems
		}
		else {
			return []
		}
	}

	isPublished(item) {
		return !item.pubStatus || item.pubStatus !== 'draft'
	}

	allowOnlyPublishedItems(items) {
		return items.filter(item => this.isPublished(item))
	}
	
	sortNewsByDate(newsItems) {
		return newsItems.sort((one, two) => {
			try {
				return new Date(one.pubDate) < new Date(two.pubDate) ? 1 : -1
			}
			catch(e) {
				return 0
			}
		})
	}
	
	async postFetchesProcessor(result, collectionName) {
		return new Promise((resolve, reject) => {
			if(collectionName == 'news') {
				result.forEach(item => {
					if(!item.slug) {
						item.slug = createSlug(item.title)
					}
				})
			}
			resolve(result)
		})
	}

}
module.exports = NewsService
