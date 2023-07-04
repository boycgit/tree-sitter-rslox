const Parser = require('web-tree-sitter');

(async () => {
  await Parser.init();
  const parser = new Parser();
  const Lang = await Parser.Language.load('tree-sitter-rslox.wasm');
  parser.setLanguage(Lang);
  const tree = parser.parse(`
  class Foo {
    init() {
      print "init";
      return;
      print "nope";
    }
  }

  var foo = Foo(); // out: init
  print foo.init(); // out: init
  `);
  console.log(tree.rootNode.toString());
})();