import csv from 'csv-parser';
import fs from 'fs';
import {gunUser} from "../../index";

export async function GetFbPosts(pageName, pubKey, res) {
  const facebookNode = await gunUser.get("facebook_claims");
  if (facebookNode && facebookNode[pubKey]) return res.send("This Facebook page has already been claimed");

  const results = [];
  const {exec} = require("child_process")
  await exec("facebook-scraper --pages 3 "+pageName, async (error: { message: any; }, stdout: string | string[], stderr: any) => {
      fs.createReadStream("./"+pageName+"_posts.csv")
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        results.forEach(post => {
          if (post.text.includes(pubKey)) {
            gunUser.get('facebook_claims').put({[pageName]:pubKey});
            gunUser.get('facebook_claims').put({[pubKey]:pageName});
            if (!res.headersSent) return res.send(true);
          }
        })
        fs.unlink("./"+pageName+"_posts.csv", (err) => {
          if (err) console.log(err);
          console.log('file deleted successfully');
        });  
        if (!res.headersSent) return res.send(false)

      });
      if (error) {
          console.log(`error: ${error.message}`);
          return false
      }
      else if (stderr) {
          console.log(`stderr: ${stderr}`);
          return false
      }
      else {
        console.log(`stdout: ${stdout}`);
      }
  });
}
