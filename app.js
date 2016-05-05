var express = require('express');
var bodyParser = require('body-parser');
var Trello = require('node-trello');
var trello = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
var ORG = process.env.TRELLO_ORG;

var app = express();
var port = process.env.PORT || 3000;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


function getBoards(username, cb) {
  var url = ORG ? '/1/organizations/' +ORG+ '/boards' : '/1/members/me/boards';
  trello.get(url, function(err, data) {
    if (err) {
      console.error(e.stack);
      throw new Error("Can not get Boards");
    }

    var text = "Here is list of " + (ORG ? "organize" : username) + "'s Boards:\n";
    data.forEach(function(item) {
      text += item.id + "\t" + item.name + "\n";
    })
    cb(text);
  });
}

function getLists(username, boardId, cb) {
  var url = '/1/boards/' + boardId + '/lists';
  trello.get(url, function(err, data) {
    if (err) {
      console.error(e.stack);
      throw new Error("Can not get Lists");
    }

    var text = "Here is " + boardId + "'s Lists:\n";
    data.forEach(function(item) {
      text += item.id + "\t" + item.name + "\n";
    })
    cb(text);
  }); 
}

function createCard(username, listId, name, desc, due, members, cb) {
  var url = '/1/cards';
  trello.post(url, {
    name: name,
    desc: desc,
    due: due,
    idList: listId,
    idMembers: members || []
  }, function(err, data) {
    if (err) {
      console.error(e.stack);
      throw new Error("Can not create card");
    }

    var text = username + " has created a card " + name + " in list " + listId;
    cb(text);
  }); 
}

function moveCard(username, listId, cardId, cb) {
  var url = '/1/cards/' + cardId + '/idList';  
  trell.put(url, {
    value: listId
  }, function(err, data) {
    if (err) {
      console.error(e.stack);
      throw new Error("Can not move card");
    }

    var text = username + " has moved card " + cardId + " to list " + listId;
    cb(text);
  })
}

var commandHash = {
  'board': getBoards,
  'list': getLists,
  'create': createCard,
  'move': moveCard,
}

app.post('/*', function(req, res, next) {
  console.log(req.body);
  var words = req.body.text.split(' ');
  var username = req.body.user_name;
  var listId = req.params[0];
  var command = req.body.command,
  text = req.body.text,
  user_name = req.body.user_name;

  var command = words.shift();
  words.unshift(user_name);
  if (typeof commandHash[command] === "function") {
    var fn = commandHash[command];
    words[fn.length - 1] = function(text) {
      res.send(text);
    };
    fn.apply(this, words);
  }
  
  
});

// test route
app.get('/', function (req, res) { res.status(200).send('We love slack, and we love trello, too!') });

// error handler
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(400).send('Error: ' + err.message);
});

app.listen(port, function () {
  console.log('Slack-Trello is running on port ' + port);
});
