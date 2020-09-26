
var UploadableImage = require('ei-pic-browser/uploadable-image')

$('.news-form input[type=text].picture-input-field').each(function() {
        new UploadableImage(this)
})
