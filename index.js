#!/usr/bin/env node

var _ = require('lodash');
var childProcess = require('child_process')
var fuzzy = require('fuzzy');


// getBranches()
// 	.then(getMatch)
// 	.then(checkout)
// 	.then(console.log.bind(null, 'checked out:'))
// 	.catch(console.log.bind(null, 'error:'));

currentBranch()
	.then(unpushedLog)
	.then(parseLog)
	.then(console.log);


// function getBranches(){
// 	return new Promise(function(res, rej){
// 		exec('git branch -a', {maxBuffer: 10 * 1024 * 1024}, function(err, stdout, stderr){
// 			if(err){return rej(err);}

// 			var branches = stdout.replace(/ /g, '').replace(/\*/g, '').split('\n');
// 			branches = branches.filter(function(branch){
// 				return branch.indexOf('->') === -1;
// 			});
// 			branches.pop();
// 			return res(branches);
// 		});
// 	});
// }

// function getMatch(branches){
// 	var result = fuzzy.filter(process.argv[2], branches)[0];
// 	if(!result){
// 		throw 'no match'
// 	}
// 	return result.string;
// }


// function checkout(branch){
// 	return exec(`git checkout ${branch}`);
// }

function currentBranch(){
	return exec('git name-rev --name-only HEAD');
}

function unpushedLog(branch){
	return exec(`git log origin/${branch}..HEAD`);
}

function parseLog(str){

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

	commits[0].setDate()
	// _.reduce(commits, function(memo, commit){
	// 	if(!memo){return commit.setDate()}
	// 	memo.then(function(){
	// 		return commit.setDate();
	// 	})
	// }, null);

	return commits.reverse();
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
	_.extend(this, options)
}
Commit.prototype = {
	setDate: function(){
		var id = this.id;

		var query = `git filter-branch --env-filter \
		    'if [ $GIT_COMMIT = ${id} ]
		     then
		         export GIT_COMMITTER_DATE="Sat May 19 01:01:01 2007 -0700"
		     fi'`;

		return exec(query)
		.catch(function(err){
			console.log('err',err)
		})
		.then(function(res){
			console.log('succ', res)
		})
	}
}


