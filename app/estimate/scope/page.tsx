import {withBrandPageMetadata} from '@/lib/brand-page-metadata';
import {ContractorCredential} from "@/components/ContractorCredential";
import {P5Estimator} from "@/components/P5Estimator";
export const metadata=withBrandPageMetadata(({title:"Upload or describe your project",robots:{index:false,follow:false}}), "/estimate/scope");
export default function ScopeEstimator(){return <main style={{minWidth:0}}><P5Estimator layout="page"/><p className="px-4 py-3 text-center text-xs text-muted-foreground"><ContractorCredential showVerifyLink={false} /></p></main>;}
