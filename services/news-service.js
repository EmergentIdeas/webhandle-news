const addCallbackToPromise = require('dreck/add-callback-to-promise')
const filog = require('filter-log')
const _ = require('underscore')

/**
 * options: {
 * 	products: a mongo collection object which stores the information
 * }
 * 
 */

function createFetch(collectionName) {
	return function(query, callback) {
		query = query || {}
		let p = new Promise((resolve, reject) => {
			this[collectionName].find(query).toArray((err, result) => {
				if(err) {
					this.log.error(err)
					return reject(err)
				}
				if(result && this.postFetchesProcessor) {
					this.postFetchesProcessor(result, collectionName).then((processed) => {
						resolve(processed)
					})
				}
				else {
					resolve(result)
				}
			})
		})
		return addCallbackToPromise(p, callback)
	}
	
}

function createIdFetch(fetchFunction) {
	return function(id, callback) {
		return fetchFunction.apply(this, this.createIdQuery(id), callback)
	}
}

function createSave(collectionName) {
	return function(focus, callback) {
		let p = new Promise((resolve, reject) => {
			this[collectionName].save(focus, (err, result) => {
				if(!err) {
					return resolve(result)
				}
				this.log.error(err)
				return reject(err)
			})
		})		
		return addCallbackToPromise(p, callback)
	}
}

class NewsService {
	
	constructor(options) {
		_.extend(this, {
			log: filog('NewsService:')
		}, options)
		
		
		this.fetchNewsItems = createFetch('news')
		this.fetchNewsItemsById = createIdFetch(this.fetchNewsItems)
		this.saveNewsItem = createSave('news')
		
		this.fetchNewsTypes = createFetch('newstypes')
		this.fetchNewsTypeById = createIdFetch(this.fetchNewsTypes)
		this.saveNewsType = createSave('newstypes')

	}

	createIdQuery(id) {
		if(Array.isArray(id)) {
			let ids = id.map(item => {
				return {
					id: Buffer.from(item, "hex"),
					_bsontype: "ObjectID"
				}
			})
			return {_id: {$in: ids}}
		}
		else {
			return {
				id: Buffer.from(id, "hex"),
				_bsontype: "ObjectID"
			}
		}
	}
	
	postFetchesProcessor(result, collectionName) {
		return new Promise((resolve, reject) => {
			resolve(result)
		})
	}
}

module.exports = NewsService
