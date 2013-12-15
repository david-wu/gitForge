#!/usr/bin/env node

var childProcess = require('child_process')
var fuzzy = require('fuzzy');


// getBranches()
// 	.then(getMatch)
// 	.then(checkout)
// 	.then(console.log.bind(null, 'checked out:'))
// 	.catch(console.log.bind(null, 'error:'));

currentBranch()
	.then(unpushed)
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


function checkout(branch){
	return exec(`git checkout ${branch}`);
}

function currentBranch(){
	return exec('git name-rev --name-only HEAD');
}

function unpushed(branch){
	return exec(`git log origin/${branch}..HEAD`);
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

// git filter-branch --env-filter \
//     'if [ $GIT_COMMIT = 119f9ecf58069b265ab22f1f97d2b648faf932e0 ]
//      then
//          export GIT_AUTHOR_DATE="Fri Jan 2 21:38:53 2009 -0800"
//          export GIT_COMMITTER_DATE="Sat May 19 01:01:01 2007 -0700"
//      fi'