var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// SCRAPER SCHEMA
var ScrapedDataSchema = Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    imgURL: {
        type: String,
        required: false
    },
    synopsis: {
        type: String,
        required: true,
        trim: true
    },
    articleURL: {
        type: String,
        required: true
    },
    comments: [
        {
            text: {
                type: String
            }
        }
    ]
});

var ScrapedData = mongoose.model('ScrapedData', ScrapedDataSchema);
module.exports = ScrapedData;
