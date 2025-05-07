
function makeCategoryFilter(category) {
	if('highlighted' == category) {
		return  item => {
			return item.highligted == "yes"
		}
	}

	return  item => {
		if(item.tag == category) {
			return true
		}
		if(Array.isArray(item.tag)) {
			for(let tag of item.tag) {
				if(tag == category) {
					return true
				}
			}
		}
		if(item.resolvedTag && Array.isArray(item.tag)) {
			for(let resolvedTag of item.resolvedTag) {
				if(
					resolvedTag._id == category
					|| resolvedTag.id == category
					|| resolvedTag.slug == category
					|| resolvedTag.name == category
				) {
					return true
				}
			}
		}
		
		return false
	}
}

module.exports = makeCategoryFilter