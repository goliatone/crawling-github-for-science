'use strict';
var GitHubApi = require('node-github');
var Octokat = require('octokat');
var matter = require('gray-matter');
var mkdirp = require('mkdirp');
var Bluebird = require('bluebird');

//We should authenticate to prevent API rate limits
var octo = new Octokat({
    token: process.env.NODE_GITHUB_TOKEN
});



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

github.authenticate({
    type: 'oauth',
    token: process.env.NODE_GITHUB_TOKEN
});

//First we need to know how many forks we have,
//since we will have to paginage.
github.repos.getForks({
    user: 'mozillascience',
    repo: 'studyGroup',
    page: 0,
    per_page: 50
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
        var filepath = require('path').resolve('./data/'+ fork.user);
        mkdirp.sync(filepath);
        repo.contents('_posts').fetch().then(function(contents) {        // `.fetch` is used for getting JSON

            var promises = [];
            contents.map(function(file){
                console.log(file.path);
                //use bluebird spread
                promises.push(repo.contents(file.path).read());
            });

            var file = [];
            Bluebird.all(promises).then(function(files){
                files.map(function(contents){
                    file.push(matter(contents).data);
                    // { title: 'Data Carpentry Genomics Workshop',
                     // text: 'The focus of this workshop will be on working with genomics data and data management and analysis for genomics research.',
                     // location: 'B18 Staff Conference Room',
                     // link: 'https://github.com/smcclatchy/studyGroup/issues/6',
                     // date: 2016-04-14T00:00:00.000Z,
                     // startTime: '09:00',
                     // endTime: '17:00' }
                });
                require('fs').writeFileSync(filepath + '/data.json', JSON.stringify(file, null, 4), 'utf-8');
            });
        });
    });

    // console.log(JSON.stringify(forks, null, 4));
});
