const PRIVATE_COST_WITH_UNIT=/\s*(?:at\s+)?\$[\d,]+(?:\.\d{1,4})?\s*\/\s*[A-Za-z0-9²^.-]+\s*\(\s*\$[\d,]+(?:\.\d{1,4})?\s+direct\s+(?:project\s+)?cost\s*\)/gi;
const PRIVATE_COST_NAME=/\bdirect(?:[\s-]+project)?[\s-]+costs?\b/i;
const CURRENCY_AMOUNT=/\$[\d,]+(?:\.\d{1,4})?(?:\s*(?:\/|\bper\b)\s*[A-Za-z0-9²^.-]+)?/gi;

/** Remove confidential cost-basis phrases without changing scope, quantity, or customer selling totals. */
export function customerSafeText(value:string):string{
  let withoutCostBasis=value.replace(PRIVATE_COST_WITH_UNIT,'');
  let label=PRIVATE_COST_NAME.exec(withoutCostBasis);
  while(label){
    const separators=[...withoutCostBasis.matchAll(/[.!?](?=\s|$)|[;\n]/g)].map(match=>match.index||0);
    const clauseStart=(separators.filter(index=>index<label!.index).at(-1)??-1)+1;
    const clauseEnd=separators.find(index=>index>label!.index)??withoutCostBasis.length;
    const amounts=[...withoutCostBasis.matchAll(CURRENCY_AMOUNT)];
    const nearest=amounts
      .map(match=>({match,distance:Math.min(Math.abs((match.index||0)-label!.index),Math.abs((match.index||0)+match[0].length-(label!.index+label![0].length)))}))
      .filter(item=>(item.match.index||0)>=clauseStart&&(item.match.index||0)<clauseEnd)
      .sort((a,b)=>a.distance-b.distance)[0]?.match;
    if(nearest){
      const at=nearest.index||0;
      withoutCostBasis=withoutCostBasis.slice(0,at)+withoutCostBasis.slice(at+nearest[0].length);
      label=PRIVATE_COST_NAME.exec(withoutCostBasis);
      if(!label)break;
    }
    withoutCostBasis=withoutCostBasis.slice(0,label.index)+withoutCostBasis.slice(label.index+label[0].length);
    label=PRIVATE_COST_NAME.exec(withoutCostBasis);
  }
  return withoutCostBasis
    .replace(/[ \t]{2,}/g,' ')
    .replace(/\(\s*\)/g,'')
    .replace(/\s+(?:is|was|were|are)\s*([.;:])/gi,'$1')
    .replace(/\s+([,.;:])/g,'$1')
    .trim();
}

/** Defense in depth for saved results rendered by the page, customer PDF, or customer email. */
export function customerSafeValue<T>(value:T):T{
  if(typeof value==='string')return customerSafeText(value) as T;
  if(Array.isArray(value))return value.map(customerSafeValue) as T;
  if(value&&typeof value==='object'){
    return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([key,item])=>[key,customerSafeValue(item)])) as T;
  }
  return value;
}