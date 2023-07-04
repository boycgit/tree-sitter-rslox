# tree-sitter-rslox

适配 [Lox programming language](http://craftinginterpreters.com/) 的语法高亮解析器

## Local setup

先安装 `tree-sitter-cli`:

```bash
cargo install tree-sitter-cli
```

通过以下命令生成 bindings:

```bash
tree-sitter generate
```
> 更改语法后，只需再次运行 `tree-sitter generate` 即可

运行测试:

```bash
tree-sitter test
```

## 生成 wasm

如果想要生成 wasm，执行：
```
npm run build:wasm
```
> 注：打包成 wasm 需要依赖 emscripten 或者 docker 环境

查看效果：
```
npm install
node main.js
```

## 参考
- [tree-sitter-lox](https://github.com/ajeetdsouza/tree-sitter-lox/tree/main)