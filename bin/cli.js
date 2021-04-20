const inquirer = require('inquirer');
const meow = require('meow');
const path = require('path');
const chalk = require('chalk');
const isGitClean = require('is-git-clean');
const boxen = require('boxen')

const packageJson = require('../package.json')

const converterDirectory = path.join(__dirname, '../', 'converters');


//检查是否git存在
function checkGitStatus(force) {
  let clean = false;
  try {
    clean = isGitClean.sync(process.cwd());
  } catch (err) {
    if (err && err.stderr && err.stderr.indexOf('Not a git repository') >= 0) {
      clean = true;
    }
  }

  if (!clean) {
    if (force) {
      console.log(chalk.yellowBright(`WARNING: Forcily continuing.`));
    } else {
      console.log(chalk.yellow('\nBefore we continue, please stash or commit your git changes.'));
      console.log('\nYou may use the --force flag to override this safety check.\n');
      process.exit(1);
    }
  }
}

const CONVERTERS_INQUIRER_CHOICES = [
  //添加git commit标准
  {
    name: 'commit-spec:  Add git commit specification for gitlab or github commit log.',
    value: 'commit-spec'
  },
  // 添加editorconfig 文件
  {
    name: 'editorconfig: Add .editorconfig file for Editor configuration. ',
    value: 'editorconfig'
  },
  //添加gitlabCI/CD集成
  {
    name: 'gitlab-ci:    Add gitlab ci for cloud MICE template.',
    value: 'gitlab-ci'
  }
];

function runConverter({ converter, input, flags }) {
  const converterPath = path.join(converterDirectory, `${converter}/run.js`);
  const handler = require(converterPath);
  if(handler) {
    handler({ input: input, flags: flags });
  }
}

function run() {
  console.log(
    boxen(chalk.blueBright('=== MI APPSTORE UTILS ==='), { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'blue' }),
  )
  const cli = meow(
    {
      description: 'MI commition for git commit specification.',
      help: `
  Usage
	  $ npx ${packageJson.name} <converter> <...options>

	  converter     One of the choices from under.

		  ${CONVERTERS_INQUIRER_CHOICES.map(x => '- ' + x.name).join('\n    ')}

  Options

	  --force       Bypass Git safety checks and forcity run commition cli.
    --help        help.
	`
    }, {
    boolean: ['force', 'help'],
    string: ['_'],
    alias: {
      h: 'help'
    }
  });

  checkGitStatus(cli.flags.force);

  if (cli.input[0] &&
    !CONVERTERS_INQUIRER_CHOICES.find(x => x.value === cli.input[0])
  ) {
    console.error('Invalid converter choice, Pick one of:');
    console.error(CONVERTERS_INQUIRER_CHOICES.map(x => '- ' + x.value).join('\n'));
    process.exit(1);
  }

  inquirer.prompt([
    {
      type: 'list',
      name: 'converter',
      message: 'Which converter would you like to apply?',
      when: !cli.input[0],
      pageSize: CONVERTERS_INQUIRER_CHOICES.length,
      choices: CONVERTERS_INQUIRER_CHOICES
    }
  ]).then(answers => {
    const { converter } = answers;
    const selectedConverter = cli.input[0] || converter;

    return runConverter({
      converter: selectedConverter,
      input: cli.input,
      flags: cli.flags
    })
  })
}


module.exports = {
  run: run
}
