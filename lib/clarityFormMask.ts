/** Attribute Clarity treats as a strict mask (privacy level that hides typed values). */
export const CLARITY_MASK_ATTR = "data-clarity-mask";
export const CLARITY_MASK_VALUE = "True";
export const CLARITY_MASK_SELECTOR = "input, textarea, select";

/**
 * Inline masker injected before the Clarity tag. Sets data-clarity-mask="True"
 * on every form field already in the document, then watches for fields the
 * shared estimator and intake render later. The shared estimator file is not
 * edited; this covers those inputs at runtime.
 */
export const clarityFormMaskScript = `(function(){
  var SELECTOR=${JSON.stringify(CLARITY_MASK_SELECTOR)};
  var ATTR=${JSON.stringify(CLARITY_MASK_ATTR)};
  var VALUE=${JSON.stringify(CLARITY_MASK_VALUE)};
  function mask(root){
    if(!root||typeof root.querySelectorAll!=="function") return;
    var nodes=root.querySelectorAll(SELECTOR);
    for(var i=0;i<nodes.length;i++){
      if(nodes[i]&&typeof nodes[i].setAttribute==="function") nodes[i].setAttribute(ATTR, VALUE);
    }
  }
  function start(){
    mask(document);
    if(typeof MutationObserver!=="function"||!document.documentElement) return;
    new MutationObserver(function(){ mask(document); }).observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();`;
