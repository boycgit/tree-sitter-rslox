; Scopes
;-------

[
  (stmt_block)
  (function)
  (decl_fun)
] @local.scope

; Definitions
;------------


(params
  (identifier) @local.definition)

(decl_var
  name: (identifier) @local.definition)

; References
;------------

(identifier) @local.reference