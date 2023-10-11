const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const defaultPackageName = 'package.xml';
let packageName;

rl.question(`Name yout want to package (default: ${defaultPackageName}): `, (userPackageName) => {
  rl.question(`Since (date of first commit. E.g.: 2 weeks ago; Apr 24 2023): `, (sinceCommit) => {
    packageName = userPackageName || defaultPackageName;
  
    if (!packageName.endsWith('.xml')) {
      packageName += '.xml';
    }

    const shellScript = `
    #!/bin/bash
      {
        apex_classes=$(git diff --ignore-all-space --ignore-blank-lines --ignore-cr-at-eol $(git log --reverse --since="${sinceCommit}" | head -n 1 | cut -d " " -f 2) ^HEAD | grep .*\.cls$ | cut -d / -f 6 | cut -d " " -f 1 | sort | uniq | sed 's/^/\t\t\t/';);

        aura_bundle=$(git diff --ignore-all-space --ignore-blank-lines --ignore-cr-at-eol $(git log --reverse --since="${sinceCommit}" | head -n 1 | cut -d " " -f 2) ^HEAD | grep .*\.js$ | cut -d / -f 6 | cut -d " " -f 1 | sort | uniq | xargs | sed 's/^/\t\t\t/';);

        echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Package xmlns=\"http://soap.sforce.com/2006/04/metadata\">";

        if [ -n "apex_classes" ]; then
          echo "\t<types>\n$(git diff --ignore-all-space --ignore-blank-lines --ignore-cr-at-eol $(git log --reverse --since="${sinceCommit}" | head -n 1 | cut -d " " -f 2) ^HEAD | grep .*\.cls$ | cut -d / -f 6 | cut -d " " -f 1 | sort | uniq | awk '{print "\t\t<members>" $0 "</members>"}';)\n\t\t<name>ApexClass</name>\n\t</types>";
        fi
        
        if [ -n "aura_bundle" ]; then
            echo "\t<types>\n$(git diff --ignore-all-space --ignore-blank-lines --ignore-cr-at-eol $(git log --reverse --since="${sinceCommit}" | head -n 1 | cut -d " " -f 2) ^HEAD | grep .*\.js$ | cut -d / -f 6 | cut -d " " -f 1 | sort | uniq | xargs | tr ' ' '\n' | awk '{print "\t\t<members>" $0 "</members>"}';)\n\t\t<name>AuraDefinitionBundle</name>\n\t</types>";
        fi

        echo "\t<version>44.0</version>\n</Package>";
      } > ${packageName}
    `;


    exec(`git-bash.exe -c ${shellScript}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing the shell script: ${error}`);
        return;
      }
      console.log('Finished.');
      console.log(`\n${stdout}`);
    });

    rl.close();
  });
});
