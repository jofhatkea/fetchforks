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
  cleanRepos();

  res.json({ msg: "/getting forks" });
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
  const repos = fs.readdirSync("repos/");
  repos.forEach((repo, repoIndex) => {
    data.push({ name: repo });
    const katas = fs
      .readdirSync(`repos/${repo}`)
      .filter(r => r.startsWith("w"));
    data[repoIndex].katas = [];
    katas.forEach((kata, kataIndex) => {
      const files = fs.readdirSync(`repos/${repo}/${kata}/mysolution`);
      if (files.length > 1) {
        data[repoIndex].katas.push({
          kata: kata,
          fileCount: files.length
        });
        //console.log(data);
      }
    });
  });
  res.json(data);
}

function cleanRepos() {
  exec("rm -rf repos/", (err, stdout, stderr) => {
    console.log("cleaned up");
    exec("mkdir repos/", (err, stdout, stderr) => {
      fork(1);
      fork(2); //TODO figure out how to get number of pages
    });
  });
}
//TODO could i do a pull once i have the repo? how do i know?
function fork(page) {
  fetch(
    "https://api.github.com/repos/jofhatkea/js-kata-fall-2018/forks?page=" +
      page
  )
    .then(res => res.json())
    .then(json => {
      json.forEach(repo => {
        //console.log(repo)
        let s = repo.full_name;
        s = s.split("/");
        let name = "repos/" + s[0];

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
      });
    });
}

app.listen(app.get("port"), () => {
  console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});
