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
		let types = await this.fetchNewsTypes({ slug: slug })
		if (types.length > 0) {
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
			catch (e) {
				return 0
			}
		})
	}

	async postFetchesProcessor(result, collectionName) {
		return new Promise((resolve, reject) => {
			if (collectionName == 'news') {
				result.forEach(item => {
					if (!item.slug) {
						item.slug = createSlug(item.title)
					}
				})
			}
			resolve(result)
		})
	}
	
	/**
	 * For each news item, it resolves the tags and authors to full objects
	 * with all the information.
	 * @param {array[object]} newsItems 
	 */
	async resolveAdditionalInformation(newsItems) {
		await this.resolveAuthors(newsItems)
		return await this.resolveNewsTypes(newsItems)
	}

	/**
	 * For each news item, it looks at the tag ids and loads the full tag
	 * information into the field `resolvedTag`.
	 * @param {array[object]} newsItems 
	 * @returns An object with the array of tags `newsTypes`, and a map of the tags
	 * by id `newsTypesByDBId`
	 */
	async resolveNewsTypes(newsItems) {
		let newsTypes = await this.fetchNewsTypes()
		let newsTypesByDBId = newsTypes.reduce((acc, type) => {
			acc[type._id] = type
			if (type.id) {
				acc[type.id] = type
			}
			return acc
		}, {})

		for (let news of newsItems) {
			if (news.tag && Array.isArray(news.tag)) {
				news.resolvedTag = news.tag.map(tag => {
					return newsTypesByDBId[tag] || tag
				})
			}
		}

		return { newsTypes, newsTypesByDBId }
	}
	/**
	 * For each news item, it looks at the authorId and loads the full author
	 * information into the field `author`.
	 * @param {array[object]} newsItems 
	 */
	async resolveAuthors(newsItems) {
		if (this.fetchAuthor) {
			let authors = await this.fetchAuthor()
			let authorsById = authors.reduce((acc, author) => {
				acc[author._id] = acc[author.id] = author
				return acc
			}, {})

			for (let news of newsItems) {
				if (news.authorId) {
					news.author = authorsById[news.authorId]
				}
			}
		}
	}

}
module.exports = NewsService
