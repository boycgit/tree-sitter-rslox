const Parser = require('web-tree-sitter');

(async () => {
  await Parser.init();
  const parser = new Parser();
  const Lang = await Parser.Language.load('tree-sitter-rslox.wasm');
  parser.setLanguage(Lang);
  const tree = parser.parse('amazing tree parser');
  console.log(tree.rootNode.toString());
})();