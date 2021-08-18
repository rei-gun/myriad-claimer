import marked from "marked";
import express from "express";
require('gun/axe');
require('gun/sea');

const TerminalRenderer = require('marked-terminal');
const Gun = require('gun');
console.log("derp")
const SEA = Gun.SEA;
console.log("herp")
// import Gun from 'gun'

import { findPubKeyTweet } from './src/twitter/scrapeTwitter';

const port = process.env.PORT || 5000; 
marked.setOptions({
  renderer: new TerminalRenderer()
})

const app = express();
console.log(marked('# Starting Gunpoint API !'))
const gun = Gun({ 
  web: app.listen(port, () => { console.log(marked('**Gunpoint is running at http://localhost:' + port + '**')) }),
  peers: ["http://host.docker.internal:8765/gun"]
});
initGun()
//Init Gun
async function initGun() {
  let gunUser = gun.user()
  let appGunPubKey = "TBD"
  if (gunUser.is) {
    console.log('You are logged in');
    appGunPubKey = gunUser.is.pub;
  } else {
    console.log('You are NOT logged in');
    appGunPubKey = gun.user().create("myriad-scraper6", "supahScr3tPwd", (cb: any) => {
      console.log("create user cb", cb);
      if (cb.ok === 0) {
        return cb.pub
      }
      //login if create failed
      gun.user().auth("myriad-scraper6", "supahScr3tPwd", async (cb: any) => {
        // console.log("auth user cb", cb);
        gunUser = gun.user()
        if (!gunUser.is) {
          console.log("LOGGED INTO GUN FAILED")
          return;
        }
        console.log("current user:", gunUser.is)
        initHTTPserver()
        // gunUser.get('twitter_claims').on((value: any, key: any, _msg: any, _ev: any)=> {
        //   console.log("Listening to twitter_claims", value)
        // })
        await gunUser.get('twitter_claims').put({"12345":"FE's twitter username"});
        // await gunUser.get('twitter_claims').set("herpaderp");
        console.log("saved twitter usernames", gunUser.get('twitter_claims').get("12345").val())
        
        return cb.get;
      })
    })
  }


  //Encrypt data for sharing
  // var pair = await SEA.pair();
  // console.log("mySEApair", pair)
  // await gun.user().auth(pair, (u: any) => {
  //   console.log("auth with pair callback", u)
  // })
  // var enc = await SEA.encrypt('hello self', pair);
  // var data = await SEA.sign(enc, pair);
  // console.log(data);
  // var msg = await SEA.verify(data, pair.pub);
  // var dec = await SEA.decrypt(msg, pair);
  // var proof = await SEA.work(dec, pair);
  // var check = await SEA.work('hello self', pair);

  // console.log(dec);
  // console.log(proof === check);
}
function initHTTPserver() {
  app.use(Gun.serve)
  app.use(express.json())
  
  app.get('/', (_,res) => res.send('TypeScript Express + GunDB Server'));
  
  app.get("/twitter/claim", (req, res) => {
    let username = req.query.username;
    let pubKey = req.query.pubKey!.toString();
    if (typeof username != "string") {res.send("BAD")}
    
    let found = findPubKeyTweet(req.query.username, req.query.pubKey)
    if (!found) return res.send("PubKey not found");
  
    res.send(found);
  })
}
