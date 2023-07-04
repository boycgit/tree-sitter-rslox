// This grammar has been adapted from
// https://craftinginterpreters.com/appendix-i.html#syntax-grammar.

// 优先级列表
const precTable = {
  call: 8, // 函数调用
  prefix: 7, // 一元前缀
  factor: 6, // 乘除
  term: 5, // 加减
  comparison: 4, // 比较
  equality: 3, // 等式
  logic_and: 2, // 逻辑与
  logic_or: 1, // 逻辑或
  assign: 0, // 赋值语句
};

// 逗号分隔列表
const commaSep = (rule) => seq(rule, repeat(seq(',', rule)));

module.exports = grammar({
  name: 'rslox', // 文件名
  extras: ($) => [/\s|\r?\n/, $.comment], // 可能出现在语言中任何位置的标记数组。这通常用于空白和注释
  rules: {
    // Program
    program: ($) => field('decl', repeat($.decl)),

    // 声明：类、函数、变量、语句
    decl: ($) => choice($.decl_class, $.decl_fun, $.decl_var, $.decl_stmt),

    // 类声明："class" IDENTIFIER ( "extends" IDENTIFIER )? "{" function* "}"
    decl_class: ($) =>
      seq(
        'class',
        field('name', $.identifier),
        optional(seq(field('extends', $.extends), field('base', $.identifier))),
        '{',
        field('method', repeat($.function)),
        '}'
      ),

    // 函数声明："fun" function
    decl_fun: ($) => seq('fun', field('function', $.function)),

    // 变量声明："var" IDENTIFIER ( "=" expression )? ";"
    decl_var: ($) =>
      seq(
        'var',
        field('name', $.identifier),
        optional(seq('=', field('value', $._expr))),
        ';'
      ),

    // Statements：块语句，表达式语句，for/if/while 语句, print 语句， return 语句
    decl_stmt: ($) =>
      choice(
        $.stmt_block,
        $.stmt_expr,
        $.stmt_for,
        $.stmt_if,
        $.stmt_print,
        $.stmt_return,
        $.stmt_while
      ),

    // 块语句："{" declaration* "}"
    stmt_block: ($) => seq('{', field('body', repeat($.decl)), '}'),

    // 表达式语句：expression ";"
    stmt_expr: ($) => seq(field('value', $._expr), ';'),

    // for 语句："for" for_paren statement
    stmt_for: ($) =>
      seq('for', field('paren', $.for_paren), field('body', $.decl_stmt)),

    // for 括号："(" ( varDecl | exprStmt | ";" ) expression? ";" expression? ")"
    for_paren: ($) =>
      seq(
        '(',
        choice(field('init', choice($.stmt_expr, $.decl_var)), ';'),
        optional(field('cond', $._expr)),
        ';',
        optional(field('incr', choice($._expr))),
        ')'
      ),

    // if 语句："if" "(" expression ")" statement ( "else" statement )?
    stmt_if: ($) =>
      prec.right(
        seq(
          'if',
          field('cond', $.grouping),
          field('then', $.decl_stmt),
          optional(seq('else', field('else', $.decl_stmt)))
        )
      ),
    // print 语句："print" expression ";"
    stmt_print: ($) => seq('print', field('value', $._expr), ';'),

    // return 语句："return" expression? ";"
    stmt_return: ($) => seq('return', optional(field('value', $._expr)), ';'),

    // while 语句："while" "(" expression ")" statement
    stmt_while: ($) =>
      seq('while', field('cond', $.grouping), field('body', $.decl_stmt)),

    // Expressions（非常重要）：调用表达式，中缀表达式，前缀表达式，原始表达式，字段表达式
    _expr: ($) =>
      choice(
        $.expr_call,
        $.expr_infix,
        $.expr_prefix,
        $.expr_primary,
        $.expr_field
      ),
    // 调用表达式：primary ( "(" arguments? ")" | "." IDENTIFIER )
    expr_call: ($) =>
      prec.left(
        precTable.call,
        seq(field('callee', $._expr), field('args', $.args))
      ),
    // 字段表达式：object "." IDENTIFIER
    expr_field: ($) =>
      prec.left(
        precTable.call,
        seq(field('object', $._expr), '.', field('field', $.identifier))
      ),

    // 中缀表达式： expression op expression
    expr_infix: ($) => {
      const table = [
        [prec.left, precTable.factor, choice('*', '/')],
        [prec.left, precTable.term, choice('+', '-')],
        [prec.left, precTable.comparison, choice('<', '<=', '>', '>=')],
        [prec.left, precTable.equality, choice('==', '!=')],
        [prec.left, precTable.logic_and, '&&'],
        [prec.left, precTable.logic_or, '||'],
        [prec.right, precTable.assign, '='],
      ];
      return choice(
        ...table.map(([precFn, precOp, op]) =>
          precFn(
            precOp,
            seq(field('lt', $._expr), field('op', op), field('rt', $._expr))
          )
        )
      );
    },

    // 前缀表达式：( "!" | "-" ) unary
    expr_prefix: ($) =>
      prec.right(
        precTable.prefix,
        seq(field('op', choice('-', '!')), field('rt', $._expr))
      ),

    // 原始表达式：布尔、nil, this, number, string, var, grouping, super
    expr_primary: ($) =>
      choice(
        $.bool,
        $.nil,
        $.this,
        $.number,
        $.string,
        $.var,
        $.grouping,
        $.super
      ),

    // Primary Expressions
    bool: ($) => choice('false', 'true'),
    nil: ($) => 'nil',
    this: ($) => 'this',
    number: ($) => /[0-9]+(\.[0-9]+)?/,
    string: ($) => /"[^"]*"/,
    var: ($) => field('name', $.identifier),
    grouping: ($) => seq('(', field('inner', $._expr), ')'),
    super: ($) => seq('super', '.', field('field', $.identifier)),

    // Utilities
    extends: ($) => 'extends',
    // 函数定义
    function: ($) =>
      seq(
        field('name', $.identifier),
        field('params', $.params),
        field('body', $.stmt_block)
      ),
    args: ($) => seq('(', optional(commaSep($._expr)), ')'), // 函数实参列表
    params: ($) => seq('(', optional(commaSep($.identifier)), ')'), // 函数形参列表
    comment: ($) => token(seq('//', /.*/)), // 注释
    // Currently, this regex allows keywords to show up as identifiers in
    // certain contexts; i.e. statements like `var nil = "foo";` are allowed.
    // This can be fixed once tree-sitter adds support for reserved words:
    // https://github.com/tree-sitter/tree-sitter/pull/1635
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/, // 变量名规范
  },
  word: ($) => $.identifier, // 所有变量名都作为 word
});
