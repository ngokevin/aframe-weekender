const fs = require('fs');

let tweets = [];
require('./assets/tweets').forEach(tweet => {
  if (tweets.filter(aTweet => aTweet.id === tweet.id).length) { return; }
  tweets.push(tweet);
});

fs.writeFileSync('./assets/tweets.json', JSON.stringify(tweets));
