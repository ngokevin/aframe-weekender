const fs = require('fs');
const req = require('superagent-promise')(require('superagent'), Promise);
const Scraper = require('scrape-twitter');
const streamToPromise = require('stream-to-promise');

const queries = [
  'aframevr',
  'supermediumvr'
];
let tweets = [];

function scrape (count, fromDate, toDate) {
  // Use scrape-twitter.
  count = count || 200;

  console.log(`Fetching ${count} Tweets from ${fromDate} to ${toDate}.`);

  if (fromDate && toDate) {
    fromDate = new Date(fromDate).getTime();
    toDate = new Date(toDate).getTime();
  }

  Promise.all(
    queries.map(query => fetchTweets(query, count, fromDate, toDate))
  ).then(finish);

  function finish () {
    // Sort and write.
    tweets = tweets.sort(tweet => tweet.favoriteCount)
    console.log(`Writing ${tweets.length} tweets.`);
    fs.writeFileSync('./assets/tweets.json', JSON.stringify(tweets));
  }
}
module.exports.scrape = scrape;

function fetchTweets (query, count, fromDate, toDate) {
  return new Promise(resolve => {
    const stream = new Scraper.TweetStream(query, 'latest', {count: count});
    streamToPromise(stream).then(tweetStream => {
      console.log(`${tweetStream.length} ${query} tweets fetched.`);

      // Filter and process.
      const promises = tweetStream
        .filter(tweet => !tweet.isRetweet && !tweet.isReplyTo)
        .filter(tweet => {
          // Filter date range.
          if (!fromDate || !toDate) { return true; }
          const tweetTime = new Date(tweet.time);
          return tweetTime >= fromDate && tweetTime <= toDate;
        })
        .map(processTweet);
      Promise.all(promises).then(resolve);
    });
  });
}

/**
 * Gather some extra Tweet data.
 */
function processTweet (tweet) {
  if (tweets.filter(_tweet => _tweet.id === tweet.id).length) {
    return Promise.resolve();
  }

  tweet.url = `https://twitter.com/${tweet.screenName}/status/${tweet.id}`;
  return new Promise(resolve => {
    getEmbed(tweet.url).then(embed => {
      tweet.embed = embed;
      tweets.push(tweet);
      console.log(`Processed ${tweet.url}`);
      resolve();
    }).catch(resolve);
  });
}

/**
 * Get Twitter embed.
 */
function getEmbed (tweetUrl) {
  return req
    .get(`https://publish.twitter.com/oembed?url=${tweetUrl}`)
    .then(res => {
      return res.body.html.replace(/<script.*<\/script>/, '');
    }).catch(err => {
      throw new Error(`Could not get Twitter embed: ${tweetUrl}.`);
    });
}

require('make-runnable');
