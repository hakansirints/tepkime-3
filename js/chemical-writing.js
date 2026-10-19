/* Conservative notation repair: known formulas and explicit charges only. */
(function(window){
  'use strict';
  var subs='₀₁₂₃₄₅₆₇₈₉',supers='⁰¹²³⁴⁵⁶⁷⁸⁹';
  function normalize(text){return String(text).replace(/[₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻−]/g,function(c){return subs.indexOf(c)>=0?String(subs.indexOf(c)):supers.indexOf(c)>=0?String(supers.indexOf(c)):c==='⁺'?'+':'-';});}
  function escape(text){return text.replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function labelHTML(label){return escape(label).replace(/[₀-₉]+/g,function(run){return '<sub>'+normalize(run)+'</sub>';}).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g,function(run){return '<sup>'+normalize(run)+'</sup>';});}
  function textIndex(root){
    var text='',nodes=[];
    function walk(node){if(node.nodeType===3){nodes.push({node:node,start:text.length,end:text.length+node.textContent.length});text+=node.textContent;}else if(node.nodeName==='BR')text+='\n';else Array.from(node.childNodes).forEach(walk);}
    walk(root);return {text:text,nodes:nodes};
  }
  function fixHTML(html,aliases){
    var root=document.createElement('div');root.innerHTML=html;
    var index=textIndex(root),text=normalize(index.text),lower=Object.create(null),changes=[];
    Object.keys(aliases).forEach(function(key){lower[key.toLowerCase()]=aliases[key];});
    // A formula may span existing sub/sup nodes. Keep prose and unknown tokens intact.
    var tokens=/\[?[A-Za-z][A-Za-z0-9]*(?:\([A-Za-z0-9]+\)[0-9]*)*\]?(?:\^?[0-9]*[+-][0-9]*)?/g,match;
    while((match=tokens.exec(text))){
      var token=match[0],start=match.index,end=start+token.length;
      if(start>0&&/\p{L}/u.test(text[start-1])||end<text.length&&/\p{L}/u.test(text[end]))continue;
      var key=token.replace(/\^/g,''),label=aliases[key],safeCase=/[0-9+\-\[\]()]/.test(token)||/[A-Z]/.test(token)||token.length>=3;
      if(!label&&safeCase)label=lower[key.toLowerCase()];
      // Common letter-O / zero confusion is repaired only if it resolves to a known formula.
      if(!label&&token.indexOf('0')>=0)label=aliases[token.replace(/0/g,'O')]||lower[token.replace(/0/g,'O').toLowerCase()];
      if(!label)continue;
      var first=index.nodes.find(function(item){return item.start<=start&&item.end>start;}),last=index.nodes.find(function(item){return item.start<end&&item.end>=end;});
      if(!first||!last)continue;
      var range=document.createRange();range.setStart(first.node,start-first.start);range.setEnd(last.node,end-last.start);
      var wrapper=first.node.parentElement.closest('sub,sup');
      if(wrapper&&root.contains(wrapper)&&wrapper.contains(last.node)&&wrapper.textContent===index.text.slice(start,end))range.selectNode(wrapper);else wrapper=null;
      var before=document.createElement('div');before.appendChild(range.cloneContents());var after=labelHTML(label);
      if(before.innerHTML!==after)changes.push({start:start,end:end,first:first,last:last,wrapper:wrapper,html:after,newLength:normalize(label).length});
    }
    for(var i=changes.length-1;i>=0;i--){var change=changes[i],range=document.createRange();if(change.wrapper)range.selectNode(change.wrapper);else{range.setStart(change.first.node,change.start-change.first.start);range.setEnd(change.last.node,change.end-change.last.start);}range.deleteContents();var template=document.createElement('template');template.innerHTML=change.html;range.insertNode(template.content);}
    root.querySelectorAll('sub:empty,sup:empty').forEach(function(node){node.remove();});
    return {html:root.innerHTML,count:changes.length};
  }
  window.MebiChemicalWriting={normalize:normalize,labelHTML:labelHTML,fixHTML:fixHTML};
})(window);
