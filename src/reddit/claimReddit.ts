import {gun} from "../../index"
import axios, {AxiosResponse} from "axios"

interface RedditResponse {
  kind: string,
  data: {
    children: [RedditPost],
  }
}

interface RedditPost {
  kind: string,
  data: {
    subreddit: string,
    selftext: string,
    title: string,
    author: string,
  }
}
export async function findPubKeyRedditProfile(username: string, pubKey: string, res) {
  username = username.toLowerCase();
  const gunUser = gun.user();
  if (await gunUser.get('reddit_claims').get(username) || await gunUser.get('reddit_claims').get(pubKey)) res.send(false)
  
  await axios.get("https://www.reddit.com/user/"+username+".json")
    .then((rresp: AxiosResponse<RedditResponse>) => {
      rresp.data.data.children.forEach((post: RedditPost) => {
        if (post.data.author.toLowerCase() === username &&
            post.data.subreddit.toLowerCase() === "u_"+username &&
            (post.data.title.includes(pubKey) || post.data.selftext.includes(pubKey))
          ) {
            res.send(true);
            gunUser.get('reddit_claims').put({[pubKey]: username});
            gunUser.get('twitter_claims').put({[username]: pubKey});
            return;
          }
      });
      if (!res.headersSent) return res.send(false)
    })
}