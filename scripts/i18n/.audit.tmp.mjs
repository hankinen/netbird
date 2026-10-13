import fs from "node:fs"; import ts from "typescript"; import {execSync} from "node:child_process";
const files = execSync("git diff --name-only 0d0304d2 -- src").toString().trim().split("\n").filter(f=>/\.tsx?$/.test(f)&&fs.existsSync(f));
const SUS = /^(post|put|patch|del|track\w*|sendEvent|gtag|event|setItem|push|replace|includes|startsWith|endsWith|test|match|localeCompare|filter|find|some|every|indexOf|singularize|pluralize|captureEvent|hsq|reportEvent)$/;
for (const f of files) {
  const src = fs.readFileSync(f,"utf8"); const sf = ts.createSourceFile(f,src,99,true,4);
  const v = (n) => {
    if (ts.isCallExpression(n) && /^(t|i18nT)$/.test(n.expression.getText(sf))) {
      for (let p = n.parent; p && !ts.isFunctionLike(p) && !ts.isJsxElement(p) && !ts.isJsxSelfClosingElement(p); p = p.parent) {
        if (ts.isCallExpression(p)) { const c = p.expression; const nm = ts.isPropertyAccessExpression(c) ? c.name.text : c.getText(sf); if (SUS.test(nm)) { console.log(f+":"+(sf.getLineAndCharacterOfPosition(n.getStart()).line+1), nm, n.arguments[0].getText(sf)); break; } }
        if (ts.isBinaryExpression(p) && [34,35,36,37].includes(p.operatorToken.kind)) { console.log(f+":"+(sf.getLineAndCharacterOfPosition(n.getStart()).line+1), "COMPARE", n.arguments[0].getText(sf)); break; }
        if (ts.isPropertyAssignment(p) && /^(key|id|value|name|type)$/.test(p.name.getText(sf)) ) { console.log(f+":"+(sf.getLineAndCharacterOfPosition(n.getStart()).line+1), "PROP "+p.name.getText(sf), n.arguments[0].getText(sf)); break; }
        if (ts.isJsxAttribute(p) && /^(key|value|id|data-|name)/.test(p.name.getText(sf))) { console.log(f+":"+(sf.getLineAndCharacterOfPosition(n.getStart()).line+1), "ATTR "+p.name.getText(sf), n.arguments[0].getText(sf)); break; }
      }
    }
    ts.forEachChild(n, v);
  };
  v(sf);
}
// payload heuristic
for (const f of files) {
  const src = fs.readFileSync(f,"utf8"); const sf = ts.createSourceFile(f,src,99,true,4);
  const v = (n) => {
    if (ts.isObjectLiteralExpression(n)) {
      const names = n.properties.map(p=>p.name?.getText?.(sf)).filter(Boolean);
      if (names.some(x=>/^(enabled|groups|rules|address|peers|auto_groups|action|protocol|network_id|peer_groups|domains|ttl|records|metric|masquerade|expires_in|usage_limit|ephemeral|role|is_service_user|sources|destinations)$/.test(x)))
        for (const p of n.properties) if (ts.isPropertyAssignment(p) && /\b(t|i18nT)\(/.test(p.initializer.getText(sf))) console.log("PAYLOAD?", f+":"+(sf.getLineAndCharacterOfPosition(p.getStart()).line+1), p.getText(sf).slice(0,120));
    }
    ts.forEachChild(n, v);
  };
  v(sf);
}
