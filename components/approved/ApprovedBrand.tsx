import {approvedBrand} from './brand';
/** Original logo geometry in the confirmed terracotta, with a neutral endorsement. */
export function ApprovedBrand({dark=true}:{dark?:boolean}){
 return <span className="approved-brand" role="img" aria-label={`${approvedBrand.name}, a P5 Home Company`}>
  <img className="approved-brand-icon" src="/brand/boise-handyman-mark-cb633b.svg" width={48} height={48} alt="" aria-hidden="true"/>
  <span className="approved-brand-type"><img src={dark?approvedBrand.wordmarkLight:approvedBrand.wordmarkDark} className="approved-original-wordmark" alt="" width={270} height={28} aria-hidden="true"/><span className="approved-endorsement">A P5 Home Company</span></span>
 </span>;
}
