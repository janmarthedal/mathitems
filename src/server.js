import express from 'express';
import fs from 'fs';
import consolidate from 'consolidate';
import handlebars from 'handlebars';
import EditItemBox from './edit-item-box';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

var app = express(),
    base_dir = __dirname + '/..';

['header', 'footer'].forEach(function (name) {
    var content = fs.readFileSync(base_dir + '/views/' + name + '.html', 'utf8');
    handlebars.registerPartial(name, handlebars.compile(content));
});

app.engine('html', consolidate.handlebars);
app.set('view engine', 'html');
app.set('views', base_dir + '/views');
app.use('/static', express.static(base_dir + '/static'));

app.get('/', function(req, res){
  res.render('index', {
      title: 'Test title',
      editItemBox: ReactDOMServer.renderToString(<EditItemBox />)
  });
});

app.listen(3000);
console.log('Express server listening on port 3000');
