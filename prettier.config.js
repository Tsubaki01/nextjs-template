/**
 * Prettier Configuration for Next.js 15 + TypeScript + TailwindCSS
 * @see https://prettier.io/docs/en/configuration.html
 */
module.exports = {
  // 1行の最大文字数
  printWidth: 100,

  // インデント幅
  tabWidth: 2,

  // タブの代わりにスペースを使用
  useTabs: false,

  // セミコロンを追加
  semi: true,

  // シングルクォートを使用
  singleQuote: true,

  // オブジェクトキーにクォートが必要な場合のみ追加
  quoteProps: 'as-needed',

  // JSXではダブルクォートを使用
  jsxSingleQuote: false,

  // 末尾のカンマ（ES5準拠）
  trailingComma: 'es5',

  // オブジェクトリテラルの括弧内にスペース
  bracketSpacing: true,

  // JSXの閉じ括弧を同じ行に配置しない
  bracketSameLine: false,

  // アロー関数の引数が1つの場合も括弧を使用
  arrowParens: 'always',

  // ファイル全体をフォーマット
  rangeStart: 0,
  rangeEnd: Infinity,

  // ファイル先頭のプラグマは不要
  requirePragma: false,

  // フォーマット後のプラグマを挿入しない
  insertPragma: false,

  // Markdownのテキストラップ
  proseWrap: 'preserve',

  // HTMLの空白の扱い
  htmlWhitespaceSensitivity: 'css',

  // 改行コード（LF）
  endOfLine: 'lf',

  // 埋め込み言語のフォーマット
  embeddedLanguageFormatting: 'auto',

  // HTMLの属性を1行1つにしない
  singleAttributePerLine: false,

  // Plugins
  plugins: ['prettier-plugin-tailwindcss'],
};
