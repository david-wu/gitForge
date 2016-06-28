#!/usr/bin/env node

var _ = require('lodash');
var childProcess = require('child_process')
var fuzzy = require('fuzzy');
var dateFormat = require('dateformat');

ensureCleanTree()
	.then(currentBranch)
	.then(unpushedCommits)
	.then(parseCommits)
	.then(modifyCommits)
	.then(console.log)
	.catch(console.log);


function currentBranch(){
	return exec('git name-rev --name-only HEAD');
}

function unpushedCommits(branch){
	return exec(`git log origin/${branch}..HEAD`);
}

function ensureCleanTree(){
	return exec('git status -s')
		.then(function(res){
			if(res){
				throw 'You have unstaged changes! stash or commit first';
			}
		})
}

function parseCommits(str){
	var re = /commit +([^\n]*)\nAuthor: +([^\n]*)\nDate: +([^\n]*?)\n/;
	var arr = str.split(re);
	arr.shift();

	var commits = [];

	while(arr.length >= 4){
		commits.push(new Commit({
			description: arr.pop(),
			date: new Date(arr.pop()),
			author: arr.pop(),
			id: arr.pop()
		}));
	}

	return commits.reverse();
}

function modifyCommits(commits){

	var startDate = _.first(commits).date;
	var endDate = _.last(commits).date;


	var dates = _.map(commits, function(commit){
		var randomHour = 21 + _.random(0,4);
		var randomMinute = _.random(0,60);
		// time between 9pm and 2am

		var d = new Date(+commit.date);
		d.setHours(randomHour);
		d.setMinutes(randomMinute);
		return d;
	});


	dates = _.sortBy(dates, function(date){
		return -date;
	})

	return _.reduce(commits, function(promise, commit, i){
		var targetDate = +dates[i];

		if(!promise){return commit.setDate(targetDate);}
		return promise.then(function(){
			console.log(`rebasing: ${i}/${commits.length}`);
			return commit.setDate(targetDate);
		});
	}, undefined);
}



function Commit(options){
	_.extend(this, options);
	this.title = this.getTitle();
}

Commit.prototype = {
	getTitle: function(){
		return /\s*([^\s]*)/.exec(this.description)[1];
	},
	setDate: function(timestamp){
		var id = this.id;
		var dateStr = dateFormat(new Date(timestamp), 'ddd, d mmm yyyy HH:MM:ss o');

		var query = `git filter-branch -f --env-filter \
			'
			if test "$GIT_COMMIT" = "${id}"
			then
				export GIT_AUTHOR_DATE="${dateStr}"
				export GIT_COMMITTER_DATE="${dateStr}"
			fi' && rm -fr "$(git rev-parse --git-dir)/refs/original/"`;

		return exec(query)
			.then(function(res){
				console.log('rebasing')
				// console.log('succ', res)
			})
	}
}

function exec(query, options){
	options = options || {
		maxBuffer: 100 * 1024 * 1024
	};

	return new Promise(function(res, rej){
		childProcess.exec(query, options, function(err, stdout, stderr){
			if(err){return rej(err);}
			return res(chomp(stdout));
		});
	});
}

function chomp(string){
	return string.replace(/[\n\r]+$/, '');
}

