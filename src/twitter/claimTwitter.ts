import {gun} from "../../index"

export async function findPubKeyTweet(username: string, pubKey: string, res) {
  const gunUser = gun.user();
  if (!res.headersSent && await gunUser.get('twitter_claims').get(username) || await gunUser.get('twitter_claims').get(pubKey)) return res.send(false)
  
  const {exec} = require("child_process")
  exec("twint -u "+username+" --limit 20 -s "+pubKey, (error: { message: any; }, stdout: string | string[], stderr: any) => {
      if (error) {
          console.log(`error: ${error.message}`);
          if (!res.headersSent) res.send(false)
      }
      else if (stderr) {
          console.log(`stderr: ${stderr}`);
          if (!res.headersSent) res.send(false)
      }
      else {
        console.log(`stdout: ${stdout}`);
        
        if (!res.headersSent && stdout.includes(pubKey)) {
          gunUser.get('twitter_claims').put({[username]:pubKey});
          gunUser.get('twitter_claims').put({[pubKey]:username});
          return res.send(true);
        } 
        if (!res.headersSent) return res.send(false);
      }
  });
}