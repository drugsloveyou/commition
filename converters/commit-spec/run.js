const fs = require('fs');
const path = require('path');
const detectIndent = require('detect-indent');
const execa = require('execa');
const utils = require('../../src/utils.js')
const _ = require('lodash');
const chalk = require('chalk');

const cliConfig = {
  stdio: 'inherit',
  stripEof: false
};

module.exports = function ({ input, flags }) {
  const projectRootDir = utils.getNearestProjectRootDirectory();
  const projectNodeModuleDir =  utils.getNearestNodeModulesDirectory();
  const isYarn = fs.existsSync(path.join(projectRootDir, 'yarn.lock'));
  const args = {};
  if (isYarn) {
    args.yarn = '--yarn';
    args.install = 'yarn add';
    args.dev = '--dev';
    args.exact = '--exact';
  } else {
    args.yarn = '';
    args.install = 'npm install';
    args.dev = '--save-dev';
    args.exact = '--save-exact';
  };
  // package.json相关
  const packageJsonPath = path.join(projectRootDir, 'package.json');
  const packageJsonString = fs.readFileSync(packageJsonPath, 'utf-8');
  const indent = detectIndent(packageJsonString).indent || '  ';
  const packageJsonContent = JSON.parse(packageJsonString);
  const isHusky4 = packageJsonContent.husky; //是否配置了husku4，如果没有就安装最新版本的husky
  const packages = ['commitizen', 'cz-conventional-changelog', 'conventional-changelog'];
  const isInstalledHuskyPackage = (packageJsonContent.devDependencies && packageJsonContent.devDependencies.husky || packageJsonContent.dependencies && packageJsonContent.dependencies.husky)
  if (!isHusky4 && !isInstalledHuskyPackage) {
    packages.push('husky')
  }
  const hasInstalledCommitlint = fs.existsSync(path.join(projectNodeModuleDir, '@commitlint'));
  if(!hasInstalledCommitlint) {
    packages.push('@commitlint/cli');
    packages.push('@commitlint/config-conventional');
  }

  // note: 安装commitizen
  {
    utils.executeCommand(
      `${args.install} ${args.dev} ${packages.join(' ')}`,
      cliConfig
    );

    console.log(utils.logSymbols.success, chalk.magentaBright('installed dependencies package.'));
  }
  {
    // note: 初始化
    utils.executeCommand(
      `commitizen init cz-conventional-changelog ${args.yarn} ${args.dev} ${args.exact} ${flags.force ? '--force' : ''}`,
      {...cliConfig, shell: '/bin/bash', cwd:  process.cwd()}
    );
    console.log(utils.logSymbols.success, chalk.magentaBright('installed git commit log flow configuration.'));
  }
  // note: 配置changelog相关命令
  {
    const packageJsonString = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJsonContent = JSON.parse(packageJsonString);
    const changelogAdaterConfig = { scripts: { 'changelog': 'conventional-changelog -p angular -i CHANGELOG.md -s' } }

    if (!packageJsonContent.scripts) {
      packageJsonContent.scripts = {};
    }
    if (packageJsonContent.scripts.changelog && !flags.force) {
      console.log(chalk.yellowBright('WARNING: The changelog script has already exists, it will be covered.'))
    }
    const newPackageJsonContent = _.merge(packageJsonContent, changelogAdaterConfig);

    fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJsonContent, null, indent) + '\n');

    console.log(utils.logSymbols.success, chalk.magentaBright('installed [changelog] script.'));
  }

  // note: commitlint
  {
    const commitLintConfig = { extends: ["@commitlint/config-conventional"] };
    const commitlintConfigPath = path.join(projectRootDir, 'commitlint.config.js');
    const hasConfigCommitLint = fs.existsSync(commitlintConfigPath);
    if (!hasConfigCommitLint) {
      fs.writeFileSync(commitlintConfigPath, `module.exports = ${JSON.stringify(commitLintConfig, null, indent)};\n`);
    } else {
      const config = require(commitlintConfigPath);
      fs.writeFileSync(commitlintConfigPath, `module.exports = ${JSON.stringify(_.merge(config, commitLintConfig), null, indent)};\n`);
    }
    console.log(utils.logSymbols.success, chalk.magentaBright('installed commitlint.config.js file.'));
  }

  // note: 判断与安装husky
  {
    const packageJsonString = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJsonContent = JSON.parse(packageJsonString);
    const huskyAdaterConfig = {
      husky: {
        hooks: {
          "prepare-commit-msg": "exec < /dev/tty && git cz --hook || true",
          "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
        }
      }
    };
    if (isHusky4) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(_.merge(packageJsonContent, huskyAdaterConfig), null, indent) + '\n');
    } else {

      const huskyConfigPath = path.join(projectRootDir, '.husky');
      if(!fs.existsSync(huskyConfigPath)) {
        utils.executeCommand(`npx husky-init`, {...cliConfig, shell: '/bin/bash'});
        fs.unlinkSync(path.join(huskyConfigPath, 'pre-commit'));
      }
      if(!fs.existsSync(path.join(huskyConfigPath, 'commit-msg'))) {
        utils.executeCommand(`npx husky add .husky/commit-msg 'npx --no-install commitlint --edit $1'`, {...cliConfig, shell: '/bin/bash'});
      } else {
        console.log(chalk.yellowBright(`.husky/commit-msg file has already exists. If you want to change it, add '${huskyAdaterConfig.husky.hooks['commit-msg']}'`))
      }

      if(!fs.existsSync(path.join(huskyConfigPath, 'prepare-commit-msg'))) {
        utils.executeCommand(`npx husky add .husky/prepare-commit-msg '${huskyAdaterConfig.husky.hooks['prepare-commit-msg']}'`, {...cliConfig,shell: '/bin/bash'});
      } else {
        console.log(chalk.yellowBright(`.husky/prepare-commit-msg file has already exists. If you want to change it, add '${huskyAdaterConfig.husky.hooks['prepare-commit-msg']}'`))
      }
    }

    console.log(utils.logSymbols.success, chalk.magentaBright('installed husky hooks.'));
  }
}
