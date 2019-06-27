let platform = require('platform');
let git = require("nodegit");
let clone = git.Clone.clone;
// let iosDeploy = require("ios-deploy)
let iosDevice = require('node-ios-device');
let Fiber = require('fibers');
let async = require('async')
// let sys = require('sys')
let exec = require('child_process').exec;
let readline = require('readline');
let fs = require("fs");
let simpleThreads = require('simple-threads');
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

let gitDir = ""
let isAndroid = false;
// let privateRepo = true;
simpleThreads.maxChildren = 4;

async function getAppFromGit(usr, passwd, repo, userURL, privateRepo, ifDir) {

    let gitURL = "github.com"
    let tmpDir = "";
    if (!ifDir) {
        // tmpDir = "\\"
        // if (getPlaform() === "OSX"  || getPlaform() === "UNIX") {
        tmpDir = "/tmp/";
        gitDir = tmpDir + repo;
        // } else {
        // tmpDir = "\\";
        // }
    } else {
        gitDir = ifDir.trim();
        if (gitDir.substring(-2, -1) !== "/") {
            gitDir = gitDir + "/"
        }
    }
    wait(50);

    // if (repo.substring(0, 1) !== "/") {  //usr friendlyness
    //     repo = "/" + repo
    // }
    // if (repo.substring(-2 - 1) !== "/") {
    //     repo = repo + "/"
    // }
    let cloneOptions = {};
    cloneOptions.fetchOpts = {
        callbacks: {
            credentials: () => git.Cred.userpassPlaintextNew(usr, passwd),
            // credentials: function() {
            // console.log('help im stuck in an infinite loop');
            // return git.Cred.userpassPlaintextNew(usr, passwd);
            // },
            // transferProgress: (info) => console.log(info),
            transferProgress: function (info) {
                return console.log(info);
            },
            certificateCheck: function () {
                // github will fail cert check on some OSX machines
                // this overrides that check
                return 1;
            }

        }
    };
    // let getMostRecentCommit = function(repository) {
    //     return repository.getBranchCommit('master');
    // };
    // let getCommitMessage = function(commit) {
    //     return commit.message();
    // };
    if (userURL.substring(0, 1).trim() !== "/") { //usr friendlyness
        userURL = "/" + userURL
    }
    if (userURL.substring(-2, -1).trim() !== "/") {
        userURL = userURL + "/"
    }

    let https = "https://" + gitURL + userURL.trim() + repo.trim() + ".git"
    wait(250);
    console.log("Git will be stored in: " + gitDir);
    console.log("Git URL: " + https);

    if (!fs.existsSync(gitDir)) {
        if (privateRepo) {

            clone(https, gitDir, cloneOptions)
                .then(function (repo) {
                    console.log("Repo ${" + repo + "} cloned.");

                    // repo.close()
                    // repo.abort;
                    return repo.getBranchCommit("master");
                }).then(function (commit) {
                console.log("commit.message " + commit.message());
                return commit.message();
            }).done(function () {
                console.log("Done!");
                //process.exit(0)
                listSchemes(gitDir);
                return gitDir;

            });
        } else {
            // let ssh = "ssh://git@" + gitURL + userURL.trim() + repo.trim() + ".git"
            clone(https, gitDir)
                .then(function (repo) {
                    console.log("Repo ${" + repo + "} cloned.");
                    return gitDir;
                }).done(function () {
                console.log("Done!");
                listSchemes(gitDir);
            });
            return gitDir;

        }
    } else {
        if (privateRepo) {
            git.Repository.open(gitDir)
                .then(function (repo) {
                    repository = repo;

                    return repository.fetchAll({
                        callbacks: {
                            credentials: () => git.Cred.userpassPlaintextNew(usr, passwd),
                            transferProgress: (info) => console.log(info),
                            certificateCheck: function () {
                                return 0;
                            }
                        }
                    });
                })
                // Now that we're finished fetching, go ahead and merge our local branch
                // with the new one
                .then(function () {
                    return repository.mergeBranches("master", "origin/master");
                }).then(function () {
                return repository.getBranchCommit("master");
            }).then(function (commit) {
                console.log("commit.message " + commit.message());
                return commit.message();
            }).done(function () {
                console.log("Done!");
                listSchemes(gitDir);
                // return gitDir;
            });

        } else {
            //TODO CREATE NON PRIVATE PULL
        }
    }

}

function listSchemes(dir) {
    let schemes = {schemes: []};
    //-A10 should be plenty of schemes for grep
    // -project *.xcodeproj
    const proj = true;
    let wop = "";
    let grepNum = 10;
    if (proj) { //easy switch
        wop = "-project *.xcodeproj";
        grepNum = 10;
    } else {
        wop = "-workspace *.xcworkspace";
        grepNum = 30;
    }
    wait(50);
    const child = exec("cd " + dir + " && xcodebuild -list " + wop + " | grep -A" + grepNum + " \"Schemes:\"", function (error, stdout, stderr) {
        console.log('stdout', stdout);
        if (!error) {
            console.log('Please wait while we load the schemes into an array...');
            wait(100);
            let counter = 0;
            for (let i = 2; i <= grepNum; i++) { // you start at 2 becasue Schemes is the first thing in grep
                wait(100);
                const child1 = exec("cd " + dir + " && xcodebuild -list "+ wop +" | grep -A" + grepNum + " \"Schemes:\" | sed -n '" + i + "p'", function (error, stdout, stderr) {
                    wait(100);
                    const str = String(stdout.toString()).trim(); //.replace(/\s/g, ''); // remove white space
                    wait(100);
                    if (!error) {
                        wait(100);
                        if (str) {
                            wait(100);
                            console.log("Scheme #: " + counter + " Name: " + str);
                            schemes['schemes'].push(str);
                            counter++;
                            // schemes.push(String(stdout.toString()));
                        }
                    } else {
                        console.log('exec error: ' + error);
                    }
                     wait(500);
                    if ((i === grepNum) || i > grepNum) { //something funky happens with >= it execs to early
                        wait(500);
                        console.log("List schemes", schemes);
                        wait(50);
                        pickScheme(dir, schemes);
                    }

                });

            }
        }
        if (error) {
            console.log('exec error: ' + error);
        }
    });
}

function pickScheme(rootDir, schemes) {
    console.log("Pick schemes", schemes);
    rl.question('The iOS schemes are: (pick the number position of the scheme) ', function (answer) { //\n
        // let reg = new RegExp('^\\d+$');
        // let reg = new RegExp('^[0-9]+$');
        const reg = /\d+/g;
        if (answer.match(reg)) {
            const pos = parseInt(answer);
            const buildScheme = schemes['schemes'][pos];
            console.log("You picked # " + pos + " Name: " + buildScheme);
            rl.question('Is this correct? Y/N ' + buildScheme, function (answer) {
                if (/y(?:es)?|Y/i.test(answer)) {
                    prepCompileriOS(rootDir, buildScheme);
                } else {
                    rl.question('Would you like to continue? Y/N ', function (answer) {
                        if (/y(?:es)?|Y/i.test(answer)) {
                            listSchemes(rootDir);
                        } else {
                            process.exit(0)
                            rl.close();
                        }
                    });
                }
            })
        } else {
            console.log("You didn't put in a number (Int)!");
            rl.question('Would you like to retry? Y/N ', function (answer) {
                if (/y(?:es)?|Y/i.test(answer)) {
                    listSchemes(rootDir);
                } else {
                    process.exit(0)
                    rl.close();
                }
            });
        }
    })

}

function prepCompileriOS(gitDir, scheme) {
    if (gitDir.substring(-2, -1).trim() !== "/") {
        gitDir = gitDir + "/"
    }
    const podfile = gitDir + "Podfile"
    const pods = gitDir + "Pods"
    wait(50);
    console.log("You're using the Scheme: " + scheme);
    console.log("Your workspace is dir: " + gitDir);
    rl.question('Is this correct? Y/N ', function (answ) {
        if (/y(?:es)?|Y/i.test(answ)) {
            console.log("Checking for Cocoapods...");
            if (fs.existsSync(podfile)) {
                if (fs.existsSync(pods)) {
                    console.log("Didn't Pods dir so need to install pods");
                    console.log("Pods installing...");
                    const child2 = exec("cd " + gitDir + " && pod install", function (error, stdout, stderr) {
                        console.log('stdout ', stdout);
                        if (!error) {
                            rl.question('Should we disable the nessasery certs and provisions: Y/N ', function (answ) {
                                if (/y(?:es)?|Y/i.test(answ)) {
                                    console.log("Disabling certs and provisions");
                                    compileiOS(gitDir, scheme, true);
                                } else {
                                    console.log("Guess not");
                                    compileiOS(gitDir, scheme, false);
                                }
                            })
                        } else {
                            console.log('exec error: ' + error);
                            rl.close();
                        }
                    });
                } else {
                    console.log("Found Pods dir so no need to install pods");
                    rl.question('Should we disable the nessasery certs and provisions: Y/N ', function (answ) {
                        if (/y(?:es)?|Y/i.test(answ)) {
                            console.log("Disabling certs and provisions");
                            compileiOS(gitDir, scheme, true);
                        } else {
                            console.log("Guess not");
                            compileiOS(gitDir, scheme, false);
                        }
                    })
                }
            } else {
                console.log("It doesn't look like you're using cocoapods");
                rl.question('Is this correct? Y/N ', function (answer) {
                    if (/y(?:es)?|Y/i.test(answer)) {
                        //TODO ADD OTHER OPTIONS
                    } else {
                        console.log("Please check that the Podfile exist");
                        rl.close();
                        process.exit(0)

                    }
                });
            }
        } else {
            console.log("Ok");
            rl.question('Would you like to reenter this info? Y/N ', function (answer) {
                if (/y(?:es)?|Y/i.test(answer)) {
                    listSchemes(gitDir);
                } else {
                    rl.close();
                    process.exit(0)
                }
            })
        }
    })
}

function compileiOS(gitDir, schemeTmp, getCerts) {
    const scheme = String(schemeTmp.toString()).replace(/\s/g, '\\ ');
    let auto = "-parallelizeTargets -jobs 16  -showBuildTimingSummary "; //-allowProvisioningUpdate
    let args = "";
    if (getCerts) {
        auto = auto + "  ";
        args = "CODE_SIGN_IDENTITY=\"\" CODE_SIGNING_REQUIRED=\"NO\" CODE_SIGN_ENTITLEMENTS=\"\" CODE_SIGNING_ALLOWED=\"NO\""
    } else {
        auto = auto + " ";
        args = ""
    }
    console.log("Compiler...starting");
    wait(250);
    console.log("compiler...starting");
    console.log("Compiling...in dir " + gitDir);
    const child3 = exec("cd " + gitDir + " && xcodebuild " + auto + " " + args + " -scheme " + scheme + " build", function (error, stdout, stderr) {
        console.log('stdout', stdout);
        if (!error) {
            console.log("deployer...starting");
            const appProduct = scheme + ".app"
            console.log("appProduct... " + appProduct);
            console.log("deploying app: " + appProduct);
            deploy(false, rootDir, appProduct);
            rl.close();
            return appProduct;
        }

        if (error) {
            console.log('exec error: ' + error);
        }
        // if (stderr !== null) {
        //     console.log('stderr error: ' + stderr);
        // }
    });
}

function deploy(isAndroid, dir, productName) {
    console.log("deploying app: " + appProduct);
    let deviceUid = ""
    console.log("isAndroid " + isAndroid);
    console.log("dir " + dir);
    console.log("productName " + productName);
    if (isAndroid) {
        //TODO BUILD ANDROID DEBUG AND DEPLOYMENT
    } else {
        iosDevice.devices(function (err, devices) {
            if (err) {
                console.error('Error!', err);
            } else {
                console.log('Connected devices:');
                console.log(devices);
                deviceUid = devices[0].udid;
            }
        });
        iosDevice.trackDevices()
            .on('devices', function (devices) {
                console.log('Connected devices:');
                console.log(devices);
              deviceUid = devices[0].udid;
            })
            .on('error', function (err) {
                console.error('Error!', err);
            });

// install an iOS app
        iosDevice.installApp(deviceUid, dir + productName + '.app', function (err) {
            if (err) {
                console.error('Error!', err);
            } else {
                console.log('Success!');
            }
        });

    }
}

async function getGit(dir) {
    let usr = "";
    let passwd = "";
    let repo = "";
    let usrURL = "";
    let privateRepo = false;
    let buildScheme = "";
    rl.question('Is this a private git Repo  ', async function (answer) {
        privateRepo = getBoolean(answer);
        wait(50);
        if (privateRepo) {
            rl.question('Git Username ', async function (answer) {
                usr = answer;
                rl.question('Git Passwd ', async function (answer) {
                    passwd = answer;
                    // rl.close();
                    rl.question('Git usr/company git URL (e.g. StudiosoLLC) ', async function (answer) {
                        usrURL = answer;
                                // rl.close();
                                rl.question('Git repo (e.g. StudiosoServer) ', async function (answer) {
                                    repo = answer;
                                    console.log('The git Info is:: usr: ' + usr + " repo: " + repo + " company/usr URL: " + usrURL);
                                    rl.question('Is this correct? Y/N ', async function (answer) {
                                        if (/y(?:es)?|Y/i.test(answer)) {
                                            if (dir) {
                                                const rootDir = await getAppFromGit(usr, passwd, repo, usrURL, privateRepo, dir);
                                            } else {
                                                const rootDir = await getAppFromGit(usr, passwd, repo, usrURL, privateRepo, null);
                                            }
                                            console.log("done with Method 1");
                                        } else {
                                            rl.question('Would you like to reenter this info? Y/N ', function (answer) {
                                                if (/y(?:es)?|Y/i.test(answer)) {
                                                    exe();
                                                } else {
                                                    rl.close();
                                                    process.exit(0)
                                                }
                                            })
                                        }
                                    })
                                })

                    })
                })

            })
        } else {
            rl.question('Git usr/company git URL (e.g. StudiosoLLC) ', async function (answer) {
                usrURL = answer;
                rl.question('Git repo (e.g. StudiosoServer) ', async function (answer) {
                    repo = answer;
                    // rl.close();
                    console.log('The git Info is:: usr: ' + usr + " repo: " + repo + " company/usr URL: " + usrURL);
                    rl.question('Is this correct? Y/N ', async function (answer) {
                        const y = "Y" || "y";
                        if (/y(?:es)?|Y/i.test(answer)) {
                            if (dir) {
                                const rootDir = await getAppFromGit(usr, passwd, repo, usrURL, privateRepo, dir);
                            } else {
                                const rootDir = await getAppFromGit(usr, passwd, repo, usrURL, privateRepo, null);
                            }
                        } else {
                            rl.question('Would you like to reenter this info ', function (answer) {
                                if (/y(?:es)?|Y/i.test(answer)) {
                                    exe();
                                } else {
                                    rl.close();
                                    process.exit(0)
                                }
                            })
                        }
                    })
                })
            })
        }
    })


    // rl.question('iOS or Android', function(answer){
    //     usrURL = answer;
    //     rl.close();
    // })


}

async function exe() {
    console.log("Do you have it pre-downloaded or do you want to download it via git");
    console.log("Note: if you download it from github you will need to get the proper certs and provisons")
    rl.question('Git Y/N ', function(answer) {
        if (/y(?:es)?|Y/i.test(answer)) {
            let rootDir = getGit(null);
        } else {
            rl.question("Pre-downloaded dir ", function (answer) {
                let rootDir = getGit(answer);
            })
        }
    })
}
function getBoolean(value) {
    switch (value) {
        case true:
        case "true":
        case "True":
        case 1:
        case "1":
        case "on":
        case "yes":
        case "y":
        case "Y":
        case "Yes":
            return true;
        default:
            return false;
    }
}

async function getPlaform() {
    let os = "";
    let osString = platform.os.toString();
    if (osString.match("Windows")) {
        os = "Windows";
        return os;
    } else if (osString.match("OS X") || osString.match("Mac")) {
        os = "OSX";
        return os;
    } else {
        os = "UNIX";
        return os;
    }
}

function wait(ms) {
    const start = new Date().getTime();
    let end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }

}

exe();
