'use strict';
var GitHubApi = require('node-github');
var Octokat = require('octokat');


var octo = new Octokat();

var github = new GitHubApi({
    version: '3.0.0',
    debug: true,
    protocol: 'https',
    host: 'api.github.com',
    pathPrefix: '/api/v3',
    timeout: 5000,
    headers: {
        'user-agent': 'My-Cool-GitHub-App'
    }
});

github.repos.getContent = github.repos.getForks;

//First we need to know how many forks we have,
//since we will have to paginage.
github.repos.getForks({
    user: 'mozillascience',
    repo: 'studyGroup',
    page: 0,
    per_page: 2
    // per_page: 100
}, function(err, res) {
    if(err) return console.error('Error', err);
    console.log('Total forks', res.length);
    var forks = [];
    res.map(function(fork){
        forks.push({
            user: fork.owner.login,
            repo: fork.name,
            path: '_posts',
            ref: 'gh-pages',
            full_name: fork.full_name
        });
    });

    forks.map(function(fork){
        var repo = octo.repos(fork.user, fork.repo);
        repo.contents('_posts').fetch().then(function(contents) {        // `.fetch` is used for getting JSON

            contents.map(function(file){
                console.log(file.path);
                repo.contents(file.path).read().then(function(contents){
                    console.log(contents)
                });
            });
        });
    });

    // console.log(JSON.stringify(res, null, 4));
    console.log(JSON.stringify(forks, null, 4));
}, function(){
    console.log('HERE')
});
