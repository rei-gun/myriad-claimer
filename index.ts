import marked from "marked";
import express from "express";
import { findPubKeyTweet } from "./src/twitter/claimTwitter"
import { findPubKeyRedditProfile } from "./src/reddit/claimReddit";
import { GetFbPosts } from "./src/facebook/facebookClaimer";
import { GunUser } from "./src/types";
import * as dotenv from "dotenv";
// require("gun/axe");
require("gun/sea");

const TerminalRenderer = require("marked-terminal");
const Gun = require("gun");
// const SEA = Gun.SEA;

dotenv.config();
const port = process.env.PORT; 
const app_host = process.env.APP_HOST;

marked.setOptions({
  renderer: new TerminalRenderer()
})
const app = express();
console.log(marked("Starting Myriad Claimer API!"));

export let gun;
export let gunUser: GunUser;
gunLogin()
initHTTPserver()
async function gunLogin() {
  gun = Gun({ 
    web: app.listen(parseInt(port), app_host, () => { console.log(marked("**Myriad Claimer's HTTP server running at "+app_host+" on port "+port+"**")) }),
    peers: [process.env.GUN_HOST],
    axe: false,
  });
  attachPeerConnectionListeners(gun);
  gunUser = gun.user();
  if (gunUser.is) {
    console.log("You are logged in");
  } else {
    console.log("You are NOT logged in");
    //login if create failed
    gun.user().auth(process.env.GUN_USER, process.env.GUN_PWD, async (cb: any) => {
      gunUser = gun.user()
      if (!gunUser.is) {
        console.log("GUN LOGIN FAILED")
        gun.user().create(process.env.GUN_USER, process.env.GUN_PWD, (cb: any) => {
          console.log("create user cb", cb);
          if (cb.ok === 0) {
            return cb.pub
          }
        })
      }
      console.log("current user:", gunUser.is)
      initHTTPserver()
      // console.log("saved twitter usernames", await gunUser.get("twitter_claims").get("rei__gun").once())
    })

  }
}

function attachPeerConnectionListeners(gun) {
  //cb triggered upon successful connection to peers
  gun.on("HI", (cb) => {
    console.log("Peer Connected", cb)
  })
  //cb triggered upon disconnection to a peer
  gun.on("BYE", (cb) => {
    console.log("Peer Disconnected", cb)
  })
}

function initHTTPserver() {
  app.use(Gun.serve)
  app.use(express.json())
  
  app.get('/', (_,res) => {
    const claimerGunPubKey = gunUser.is.pub;
    res.send("TypeScript Express + GunDB Server\n PubKey: "+claimerGunPubKey);
  });
  
  app.post("/twitter", (req, res) => {
    let username = req.body.username;
    let pubKey = req.body.pubKey;
    if (typeof username !== "string" || typeof pubKey !== "string" ) return res.send("BAD")
    
    findPubKeyTweet(username as string, pubKey as string, res)
  })
  app.get("/twitter", async (req, res) => {
    let pubKey = req.query.pubKey as string;
    let twitterNode = await gun.user(gunUser.is.pub).get("twitter_claims");
    if (!twitterNode || !twitterNode[pubKey]) return res.send("Sorry, you haven't claimed a twitter account");
    return res.send(twitterNode[pubKey]);
  })
  app.get("/twitter/all", async (_, res) => {
    return res.send(await gun.user(gunUser.is.pub).get("twitter_claims"));
  })

  app.post("/dummy", async (_, res) => {
    //Create test data on public node
    const now = Date.now().toString();
    gun.get("dummy").set(now);
    return res.send(now);
  })
  app.get("/dummy", async (_, res) => {
    return res.send(await gun.get("dummy"));
  })

  app.get("/reddit", (req, res) => {
    let username = req.query.username;
    let pubKey = req.query.pubKey;
    if (typeof username !== "string" || typeof pubKey !== "string" ) res.send("BAD")
    
    findPubKeyRedditProfile(username as string, pubKey as string, res)
  })

  app.post("/facebook", (req, res) => {
    let username = req.body.username;
    let pubKey = req.body.pubKey;
    if (typeof username !== "string" || typeof pubKey !== "string" ) res.send("BAD")
    
    GetFbPosts(username, pubKey, res)
  })
  app.get("/facebook", async (req, res) => {
    let pubKey = req.query.pubKey;
    if (typeof pubKey !== "string" ) res.send("BAD")
    const data = await gun.user(gunUser.is.pub).get("facebook_claims")
    return res.send(data);
  })
}
