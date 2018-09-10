const fetch = require("node-fetch");
const fs = require("fs");
const { exec } = require("child_process");
const express = require("express");
const app = express();

app.set("port", process.env.PORT || 5000);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});
// TODO Sync all over

app.get("/", (req, res) => {
  const indexHTML = fs.readFileSync(__dirname + "/index.html", "utf-8");
  res.send(indexHTML);
});

app.get("/fork", (req, res) => {
  //cleanRepos();
  fork(1);
  //fork(2);
  //
  setTimeout(() => {
    res.json({ msg: "/getting forks" }); //TODO could i figure out when it's done?
  }, 4000);
  //TODO force call?
  //TODO redirect?
});
app.get("/list", (req, res) => {
  parse(res);
});
app.get("/solution/repos/:user/:kata", (req, res) => {
  //TODO show files directly
  console.log(req.params.user, req.params.kata);
});

function parse(res) {
  let data = [];
  const repos = fs.readdirSync("repos/"); //TODO if mac has been there, there's a .DS_Store file that makes it crash
  repos.forEach((repo, repoIndex) => {
    data.push({ name: repo });
    const katas = fs
      .readdirSync(`repos/${repo}`)
      .filter(r => r.startsWith("w"));
    data[repoIndex].katas = [];
    katas.forEach((kata, kataIndex) => {
      try {
        const files = fs.readdirSync(`repos/${repo}/${kata}/mysolution`);
        if (files.length > 1) {
          data[repoIndex].katas.push({
            kata: kata,
            fileCount: files.length
          });
          //console.log(data);
        }
      } catch(e){
        console.warn(e)
      }
      
    });
  });
  res.json(data);
}

function cleanRepos() {
  exec("rm -rf repos/", (err, stdout, stderr) => {
    console.log("cleaned up");
    exec("mkdir repos/", (err, stdout, stderr) => {
      //fork(1);
      //fork(2); //TODO figure out how to get number of pages
      //TODO can i figure out when im done?
    });
  });
}

function fork(page) {
  fetch(
    "https://api.github.com/repos/jofhatkea/js-kata-fall-2018/forks?per_page=100&page=" +
      page
  )
    .then(res => {
      console.log(res.headers);
      return res.json();
    })
    .then(json => {
      json.forEach(repo => {
        //console.log(repo)
        let s = repo.full_name;
        s = s.split("/");
        let name = "repos/" + s[0];
        if (fs.existsSync(name)) {
          //pull
          //console.log("pulling ", name);
          exec(`cd ${name} && git pull`, (err, stdout, stderr) => {
            if (err) {
              console.warn("couldn't pull " + name, err);
              return;
            }
            //console.log(`stdout: ${stdout}`);
            //console.log(`stderr: ${stderr}`);
          });
        } else {
          //clone
          //console.log("clonning ", name);
          exec(
            "git clone " + repo.clone_url + " " + name,
            (err, stdout, stderr) => {
              if (err) {
                console.warn("couldn't execute " + name, err);
                return;
              }
              //console.log(`stdout: ${stdout}`);
              //console.log(`stderr: ${stderr}`);
            }
          );
        }
      });
    });
}

app.listen(app.get("port"), () => {
  console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});
