#!/usr/bin/env node

var _ = require('lodash');
var childProcess = require('child_process')
var dateFormat = require('dateformat');

ensureCleanTree()
	.then(currentBranch)
	.then(unpushedCommits)
	.then(parseCommits)
	.then(modifyCommits)
	.then(function(){
		console.log('success!')
	})
	.catch(console.log);

function ensureCleanTree(){
	return exec('')
	return exec('git status -s')
		.then(function(res){
			if(res){throw 'You have unstaged changes! stash or commit them first';}
		});
}

function currentBranch(){
	return exec('git name-rev --name-only HEAD');
}

function unpushedCommits(branch){
	return exec(`git log origin/${branch}..HEAD`);
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
	if(!commits){throw 'no unpushed commits to modify';}

	var targetDates = commits
		.map(function(commit){
			return commit.afterHours();
		})
		.sort(function(a,b){
			return +b-a;
		});

	console.log('Setting commit times =>\n\t' + targetDates.join('\n\t'));

	return _.reduce(commits, function(promise, commit, i){
		var targetDate = +targetDates[i];
		return promise
			.then(function(){
				console.log(`rebasing: (${i+1}/${commits.length}) [${dateFormat(targetDate)}] ${commit.title}`);
				return commit.setDate(targetDate);
			});
	}, Promise.resolve());
}

function Commit(options){
	_.extend(this, options);
	this.title = this.getTitle();
}

Commit.prototype = {
	getTitle: function(){
		return /\s*([^\s]*)/.exec(this.description)[1];
	},
	afterHours: function(){
		var randomHour = 21 + _.random(0, 4);
		var randomMinute = _.random(0, 60);

		var d = new Date(+this.date);
		d.setHours(randomHour);
		d.setMinutes(randomMinute);
		return d;
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

		return exec(query);
	}
}

function exec(query, options){
	options = options || {
		maxBuffer: 512 * 1024 * 1024
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
