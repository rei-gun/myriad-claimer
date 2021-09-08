import csv from 'csv-parser';
import fs from 'fs';
import {gunUser} from "../../index";

export async function GetFbPosts(pageName, pubKey, res) {
  const results = [];
  const {exec} = require("child_process")
  await exec("facebook-scraper --pages 3 "+pageName, (error: { message: any; }, stdout: string | string[], stderr: any) => {
      fs.createReadStream("./"+pageName+'_posts.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
      results.forEach(post => {
        // console.log("POST TEXT", pubKey, post.text)
        if (post.text.includes(pubKey)) {
          gunUser.get('facebook_claims').put({[pageName]:pubKey});
          gunUser.get('facebook_claims').put({[pubKey]:pageName});
          return res.send(true);
        }
      })
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
