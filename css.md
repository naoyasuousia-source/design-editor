# カスタムCSS完全廃止

- 現在、出力HTMLにAI用の<!-- CUSTOM_CSS_START --><!-- CUSTOM_CSS_END -->エリアを設けているが、これを完全に廃止する。

## やること
- 出力HTML挿入用コードの編集
    - <!-- CUSTOM_CSS_START --><!-- CUSTOM_CSS_END -->エリアを削除する
    - AIへのカスタムCSSについての説明をすべて削除

- カスタムCSS反映ロジックの削除
    - <!-- CUSTOM_CSS_START --><!-- CUSTOM_CSS_END -->エリアの変更を検知して反映するロジックを完全に削除する。
    **<!-- DESIGN_START --><!-- DESIGN_END -->エリア<!-- USER_REQUIREMENT_START --><!-- USER_REQUIREMENT_END -->エリアの変更のみを反映するロジックにする。**

## 注意
- rules.mdに従うこと。
- カスタムCSS以外の機能を絶対に損なわないようにすること。