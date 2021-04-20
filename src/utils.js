const path = require('path');
const execa = require('execa');
const chalk = require('chalk')
const findNodeModules = require('find-node-modules');

function getNearestNodeModulesDirectory() {
	const nodeModulesDirectories = findNodeModules({ relative: false });
	if (nodeModulesDirectories && nodeModulesDirectories.length > 0) {
		return nodeModulesDirectories[0];
	} else {
		console.error(`Error: Could not locate node_modules in your project's root directory. Did you forget to npm init or npm install?`)
	}
}


function getNearestProjectRootDirectory () {
  return path.join(getNearestNodeModulesDirectory(), '/../');
}

function executeCommand(command, cliConfig) {
	const result = execa.commandSync(command, cliConfig);
  if (result.error) {
    throw result.error;
  }
}

const main = {
	info: chalk.blue('ℹ'),
	success: chalk.green('✔'),
	warning: chalk.yellow('⚠'),
	error: chalk.red('✖')
};

const fallback = {
	info: chalk.blue('i'),
	success: chalk.green('√'),
	warning: chalk.yellow('‼'),
	error: chalk.red('×')
};

const logSymbols = isUnicodeSupported() ? main : fallback;

function isUnicodeSupported() {
	if (process.platform !== 'win32') {
		return true;
	}

	return Boolean(process.env.CI) ||
		Boolean(process.env.WT_SESSION) || // Windows Terminal
		process.env.TERM_PROGRAM === 'vscode' ||
		process.env.TERM === 'xterm-256color' ||
		process.env.TERM === 'alacritty';
}


module.exports = {
	getNearestNodeModulesDirectory: getNearestNodeModulesDirectory,
	getNearestProjectRootDirectory: getNearestProjectRootDirectory,
	executeCommand: executeCommand,
  logSymbols: logSymbols
}
