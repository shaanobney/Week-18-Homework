var path = require('path');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var exphbs = require('express-handlebars');
var hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    addOne: function(value, options){
      return parseInt(value) + 1;
    }
  }
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var ObjectId = require('mongojs').ObjectID;

// DATABASE
mongoose.connect('mongodb://localhost/scraper');
var db = mongoose.connection;

db.on('error', function(err) {
  console.log('Database Error:', err);
});

// MODELS FOR DATA
var ScrapedData = require('./nytScrapeModel');

// ON START BEGIN SCRAP
var options = {
  url: 'http://www.nytimes.com/pages/world/index.html',
};

request(options, function(error, response, html) {

  var $ = cheerio.load(html);
  $('div.story').each(function(i, element) {
    var $p = $(this).children('p.summary');
    var synopsis = $p.text();
    var $h = $(this).children('h3');
    var title = $(element).find('h3').find('a').text();
    var $div = $(this).children('div.thumbnail');
    var articleURL = $div.children('a').attr('href');
    var imgURL = $(element).find('div.thumbnail').find('a').find('img').attr("src");

    var scrapedData = new ScrapedData({
      title: title,
      imgURL: imgURL,
      synopsis: synopsis,
      articleURL: articleURL
    });
    console.log(scrapedData);
    // SAVE SCRAPED
    scrapedData.save(function(err) {
      if (err) {
      }
    });
  });
});

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static('public'));

// ROUTE
app.get('/', function(req, res) {
  ScrapedData
    .findOne()
    .exec(function(err,data) {
      if (err) return console.error(err);
      // RENDER SCRAPED DATA
      res.render('index', {
        title: data.title,
        imgURL: data.imgURL,
        synopsis: data.synopsis,
        _id: data._id,
        articleURL: data.articleURL,
        comments: data.comments
      });
    })
});

// GET SCRAPED STORIES
app.get('/next/:id', function(req, res) {
  ScrapedData
    .find({
      _id: {$gt: req.params.id}
    })
    .sort({_id: 1 })
    .limit(1)
    .exec(function(err,data) {
      if (err) return console.error(err);
      res.json(data);
    })
});

// GET PREVIOUS STORIES FROM DB
app.get('/prev/:id', function(req, res) {
  ScrapedData
    .find({
      _id: {$lt: req.params.id}
    })
    .sort({_id: -1 })
    .limit(1)
    .exec(function(err,data) {
      if (err) return console.error(err);
      res.json(data);
    })
});

// POST COMMENTS TO DB
app.post('/comment/:id', function(req, res) {
  ScrapedData.findByIdAndUpdate(
    req.params.id,
    {$push: {
      comments: {
        text: req.body.comment
      }
    }},
    {upsert: true, new: true},
    function(err, data) {
      if (err) return console.error(err);
      res.json(data.comments);
    }
  );
});

// REMOVE FROM DB
app.post('/remove/:id', function(req, res) {
  ScrapedData.findByIdAndUpdate(
    req.params.id,
    {$pull: {
      comments: {
        _id: req.body.id
      }
    }},
    {new: true},
    function(err, data) {
      if (err) return console.error(err);
      res.json(data.comments);
    }
  );
});

app.listen(3000, function() {
  console.log('App running on port 3000!');
});
