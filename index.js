#!/usr/bin/env node

var _ = require('lodash');
var childProcess = require('child_process')
var fuzzy = require('fuzzy');

currentBranch()
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

function parseCommits(str){
// console.log(str)
	var re = /commit +([^\n]*)\nAuthor: +([^\n]*)\nDate: +([^\n]*?)\n/;
	var arr = str.split(re);
	arr.shift();

	var commits = [];

	while(arr.length >= 4){
		commits.push(new Commit({
			description: arr.pop(),
			date: +new Date(arr.pop()),
			author: arr.pop(),
			id: arr.pop()
		}));
	}

	return commits.reverse();
}

function modifyCommits(commits){

	// return commits[1].setDate();
console.log('settingDates')
	return _.reduce(commits, function(promise, commit){
		if(!promise){return commit.setDate();}
		return promise.then(function(){
			return commit.setDate();
		});
	}, undefined)

	.catch(function(){
		console.log('failed to set date')
	})

	return a;
	// return commits;
}

function exec(query, options){
	options = options || {
		maxBuffer: 100 * 1024 * 1024
	};

	return new Promise(function(res, rej){
		childProcess.exec(query, options, function(err, stdout, stderr){
			if(err){return rej(err)}
			return res(chomp(stdout));
		});
	});
}

function chomp(string){
	return string.replace(/[\n\r]+$/, '');
}



function Commit(options){
	_.extend(this, options);
	this.title = this.getTitle();
}

Commit.prototype = {
	getTitle: function(){
		return /\s*([^\s]*)/.exec(this.description)[1];
	},
	setDate: function(){
		var id = this.id;

		var query = `git filter-branch -f --env-filter \
			'
			if test "$GIT_COMMIT" = "${id}"
			then
				export GIT_AUTHOR_DATE="Mon, 9 Dec 2013 12:40:00 +0000"
				export GIT_COMMITTER_DATE="Mon, 9 Dec 2013 12:40:00 +0000"
			fi' && rm -fr "$(git rev-parse --git-dir)/refs/original/"`;
		console.log(query)

		return exec(query)
			.catch(function(err){
				console.log('err',err)
			})
			.then(function(res){
				console.log('succ', res)
			})
	}
}


