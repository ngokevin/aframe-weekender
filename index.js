const fs = require('fs');
const req = require('superagent-promise')(require('superagent'), Promise);
const Scraper = require('scrape-twitter');
const streamToPromise = require('stream-to-promise');

let tweets = [];

function scrape (count, fromDate, toDate) {
  // Use scrape-twitter.
  const stream = new Scraper.TweetStream('aframevr', 'latest', {count: count || 200});

  if (fromDate && toDate) {
    fromDate = new Date(fromDate).getTime();
    toDate = new Date(toDate).getTime();
  }

  streamToPromise(stream).then(tweetStream => {
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
    Promise.all(promises).then(finish);
  });

  function finish () {
    // Sort and write.
    tweets = tweets.sort(tweet => tweet.favoriteCount)
    fs.writeFileSync('tweets.json', JSON.stringify(tweets));
  }
}
module.exports.scrape = scrape;

/**
 * Gather some extra Tweet data.
 */
function processTweet (tweet) {
  tweet.url = `https://twitter.com/${tweet.screenName}/status/${tweet.id}`;
  return new Promise(resolve => {
    getEmbed(tweet.url).then(embed => {
      tweet.embed = embed;
      tweets.push(tweet);
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
