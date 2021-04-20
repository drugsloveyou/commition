## git commit log 标准

本commit log使用angular标准

- 在git commit自动运行commit标准流程
- 在git commit流程运行完成时添加commit校验
- 添加changelog命令用于生成changelog，生成后【执行yarn changelog 或者 npm run changelog】即可

#### 使用方式

目前只支持 commit-spec(commit log标准)
```
Usage
   $ npx commition <converter> <...options>

   converter     One of the choices from under.

    - commit-spec:  Add git commit specification for gitlab or github commit log.  [可使用]
    - editorconfig: Add .editorconfig file for Editor configuration.               [开发中]
    - gitlab-ci:    Add gitlab ci for cloud MICE template.                         [开发中]

  Options

   --force       Bypass Git safety checks and forcity run commition cli. 
   --help        help.
```

执行以下命令即可初始化

```bash
npx @mi/commition commit-spec
```


## 关联项目

- [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) – Generate a changelog from conventional commit history
- [commitlint](https://github.com/conventional-changelog/commitlint) - Lint commit messages
