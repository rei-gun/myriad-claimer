import {gun} from "../../index"

export async function findPubKeyTweet(username: string, pubKey: string, res) {
  const gunUser = gun.user();
  if (await gunUser.get('twitter_claims').get(username) || await gunUser.get('twitter_claims').get(pubKey)) res.send(false)
  
  const {exec} = require("child_process")
  exec("twint -u "+username+" --limit 20 -s "+pubKey, (error: { message: any; }, stdout: string | string[], stderr: any) => {
      if (error) {
          console.log(`error: ${error.message}`);
          res.send(false)
      }
      else if (stderr) {
          console.log(`stderr: ${stderr}`);
          res.send(false)
      }
      else {
        console.log(`stdout: ${stdout}`);
        gunUser.get('twitter_claims').put({[username]:pubKey});
        gunUser.get('twitter_claims').put({[pubKey]:username});
        stdout.includes(pubKey) ? res.send(true) : res.send(false)
      }
  });
}