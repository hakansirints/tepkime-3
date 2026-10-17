/* Qualitative, balanced teaching models. Water and particle sizes are not to scale.
 * Net ionic conventions: OpenStax Chemistry 2e, 4.1–4.2, 15.1.
 * Iodide/copper catalysis retains the catalyst; intermediate pathways are omitted.
 */
export const COLORS={H:'#fffaf0',O:'#ed342f',N:'#5079d9',C:'#666a70',Na:'#9761da',K:'#a75adb',Cl:'#35b94e',Ca:'#bec6d2',Ag:'#c5c9d5',Pb:'#68798a',Cu:'#cb8b57',I:'#9652b3'};
const atomicRadii={H:.011,O:.019,N:.018,C:.018,Na:.026,K:.029,Cl:.027,Ca:.027,Ag:.026,Pb:.029,Cu:.025,I:.031};
export const CHARGES={H3O:1,Na:1,K:1,Cl:-1,I:-1,Ca:2,Ag:1,Pb:2,Cu:2,OH:-1,NO3:-1,HCO3:-1,CO3:-2,NH4:1,HO2:-1,CuCl4:-2,AgNH3:1,CuNH3:2};
const FORMULAS={AgNH3:'AgN2H6',CuNH3:'CuN4H12',CuCl4:'CuCl4',malachite:'Cu2CO5H2',AgMetal:'Ag'};
export const LABELS={H2O:'H₂O',H3O:'H₃O⁺',H2O2:'H₂O₂',Na:'Na⁺',K:'K⁺',Cl:'Cl⁻',I:'I⁻',Ca:'Ca²⁺',Ag:'Ag⁺',Pb:'Pb²⁺',Cu:'Cu²⁺',OH:'OH⁻',NO3:'NO₃⁻',HCO3:'HCO₃⁻',CO3:'CO₃²⁻',NH3:'NH₃',NH4:'NH₄⁺',HO2:'HO₂⁻',CO2:'CO₂',O2:'O₂',Cl2:'Cl₂',I2:'I₂',AgMetal:'Ag',AgCl:'AgCl',AgI:'AgI',PbI2:'PbI₂',PbCl2:'PbCl₂',CaCO3:'CaCO₃',NaHCO3:'NaHCO₃',Na2CO3:'Na₂CO₃',PbCO3:'PbCO₃','Pb(OH)2':'Pb(OH)₂','Ca(OH)2':'Ca(OH)₂','Cu(OH)2':'Cu(OH)₂',Ag2O:'Ag₂O',Ag2CO3:'Ag₂CO₃',CuI:'CuI',malachite:'Cu₂CO₃(OH)₂',CuCl4:'[CuCl₄]²⁻',AgNH3:'[Ag(NH₃)₂]⁺',CuNH3:'[Cu(NH₃)₄]²⁺'};
const molecule=(atoms,bonds)=>({atoms:atoms.map(([element,x,y,z=0])=>({element,position:[x,y,z],radius:atomicRadii[element]})),bonds});
const TRIGON=[['O',0,.050],['O',-.0433,-.025],['O',.0433,-.025]];
const T={
 H2O:molecule([['O',0,0],['H',-.029,.022],['H',.029,.022]],[[0,1],[0,2]]),
 H3O:molecule([['O',0,.008],['H',-.030,-.010,.016],['H',.030,-.010,.016],['H',0,-.010,-.033]],[[0,1],[0,2],[0,3]]),
 H2O2:molecule([['O',-.025,0,0],['O',.025,0,0],['H',-.048,.025,.015],['H',.048,-.025,.015]],[[0,1],[0,2],[1,3]]),
 NH3:molecule([['N',0,.009],['H',-.028,-.014,.016],['H',.028,-.014,.016],['H',0,-.014,-.032]],[[0,1],[0,2],[0,3]]),
 NH4:molecule([['N',0,0],['H',.024,.024,.024],['H',-.024,-.024,.024],['H',-.024,.024,-.024],['H',.024,-.024,-.024]],[[0,1],[0,2],[0,3],[0,4]]),
 NO3:molecule([['N',0,0],...TRIGON],[[0,1],[0,2],[0,3]]),
 CO3:molecule([['C',0,0],...TRIGON],[[0,1],[0,2],[0,3]]),
 HCO3:molecule([['C',0,0],...TRIGON,['H',.068,-.007]],[[0,1],[0,2],[0,3],[3,4]]),
 OH:molecule([['O',0,0],['H',.035,0]],[[0,1]]),
 HO2:molecule([['O',-.025,0],['O',.025,0],['H',-.046,.025]],[[0,1],[0,2]]),
 CO2:molecule([['C',0,0],['O',-.047,0],['O',.047,0]],[[0,1,2],[0,2,2]]),
 O2:molecule([['O',-.021,0],['O',.021,0]],[[0,1,2]]),
 Cl2:molecule([['Cl',-.030,0],['Cl',.030,0]],[[0,1]]),
 I2:molecule([['I',-.034,0],['I',.034,0]],[[0,1]])
};
const IONIC={NaHCO3:['Na','HCO3'],Na2CO3:['Na','Na','CO3'],CaCO3:['Ca','CO3'],AgCl:['Ag','Cl'],AgI:['Ag','I'],PbI2:['Pb','I','I'],PbCl2:['Pb','Cl','Cl'],PbCO3:['Pb','CO3'],'Pb(OH)2':['Pb','OH','OH'],'Ca(OH)2':['Ca','OH','OH'],'Cu(OH)2':['Cu','OH','OH'],Ag2O:['Ag','Ag','O'],Ag2CO3:['Ag','Ag','CO3'],CuI:['Cu','I'],malachite:['Cu','Cu','CO3','OH','OH']};
const REAGENTS={NaHCO3:{parts:['NaHCO3'],solid:true,mass:84.01,soluble:true},Na2CO3:{parts:['Na2CO3'],solid:true,mass:105.99,soluble:true},CaCO3:{parts:['CaCO3'],solid:true,mass:100.09},HCl:{parts:['H3O','Cl'],acid:true},H2O2:{parts:['H2O2']},KI:{parts:['K','I']},'Pb(NO3)2':{parts:['Pb','NO3','NO3']},CaCl2:{parts:['Ca','Cl','Cl']},NaOH:{parts:['Na','OH']},NH3:{parts:['NH3']},AgNO3:{parts:['Ag','NO3']},'Cu(NO3)2':{parts:['Cu','NO3','NO3']}};
function combine(parts){const atoms=[],bonds=[];parts.forEach(([name,offset])=>{const t=template(name),base=atoms.length;t.atoms.forEach(a=>atoms.push({...a,position:a.position.map((n,i)=>n+offset[i])}));t.bonds.forEach(([a,b,order=1])=>bonds.push([a+base,b+base,order]))});return{atoms,bonds}}
export function template(name){
 if(T[name])return T[name];
 if(name==='AgMetal')return T[name]=molecule([['Ag',0,0]],[]);
 if(name==='PbI2')return T[name]=combine([['Pb',[0,0,0]],['I',[.03,.055,.018]],['I',[-.03,-.055,-.018]]]);
 if(name==='CuCl4')return T[name]=combine([['Cu',[0,0,0]],...[[.065,.045,.045],[-.065,.045,.045],[0,-.06,.06],[0,-.025,-.075]].map(p=>['Cl',p])]);
 if(name==='AgNH3'||name==='CuNH3'){const centers=name==='AgNH3'?[[-.075,0,0],[.075,0,0]]:[[.075,0,0],[-.075,0,0],[0,.075,0],[0,-.075,0]],result=combine([[name==='AgNH3'?'Ag':'Cu',[0,0,0]],...centers.map(p=>['NH3',p])]);centers.forEach((_,i)=>result.bonds.push([0,1+i*4]));return T[name]=result}
 if(IONIC[name]){const ions=IONIC[name],positions=ions.length===2?[[-.043,0,0],[.043,0,0]]:ions.map((_,i)=>[Math.cos(i/ions.length*Math.PI*2)*.057,Math.sin(i/ions.length*Math.PI*2)*.045,0]);return T[name]=combine(ions.map((n,i)=>[n,positions[i]]))}
 if(atomicRadii[name])return T[name]=molecule([[name,0,0]],[]);
 throw new Error('Unknown particle species: '+name);
}
const key=(a,b)=>[a,b].sort().join('|');
const recipes={};
function reaction(a,b,consume,produce,options={}){recipes[key(a,b)]={consume,produce,...options}}
const solid='solid',gas='gas',aq='aqueous';
reaction('NaHCO3','Pb(NO3)2',{Pb:1,HCO3:2},[['PbCO3',1,solid],['CO2',1,gas],['H2O',1,aq]]);
reaction('NaHCO3','HCl',{H3O:1,HCO3:1},[['CO2',1,gas],['H2O',2,aq]]);
reaction('NaHCO3','CaCl2',{Ca:1,HCO3:2},[['CaCO3',1,solid],['CO2',1,gas],['H2O',1,aq]]);
reaction('NaHCO3','NaOH',{OH:1,HCO3:1},[['CO3',1,aq],['H2O',1,aq]]);
reaction('NaHCO3','AgNO3',{Ag:2,HCO3:2},[['Ag2CO3',1,solid],['CO2',1,gas],['H2O',1,aq]]);
reaction('NaHCO3','Cu(NO3)2',{Cu:2,HCO3:4},[['malachite',1,solid],['CO2',3,gas],['H2O',1,aq]]);
reaction('H2O2','KI',{H2O2:2},[['H2O',2,aq],['O2',1,gas]],{catalyst:'I'});
reaction('H2O2','Cu(NO3)2',{H2O2:2},[['H2O',2,aq],['O2',1,gas]],{catalyst:'Cu'});
reaction('H2O2','HCl',{H2O2:1,H3O:2,Cl:2},[['Cl2',1,gas],['H2O',4,aq]],{condition:'Klor oluşumu bu uygulamanın asitli ortam senaryosudur; gerçek hız ve verim modellenmez.'});
reaction('H2O2','NaOH',{H2O2:1,OH:1},[['HO2',1,aq],['H2O',1,aq]],{fraction:.75,equilibrium:true});
reaction('H2O2','AgNO3',{H2O2:1,Ag:2,H2O:2},[['AgMetal',2,solid],['H3O',2,aq],['O2',1,gas]]);
reaction('KI','Pb(NO3)2',{Pb:1,I:2},[['PbI2',1,solid]]);
reaction('KI','AgNO3',{Ag:1,I:1},[['AgI',1,solid]]);
reaction('KI','Cu(NO3)2',{Cu:2,I:4},[['CuI',2,solid],['I2',1,aq]]);
reaction('Pb(NO3)2','HCl',{Pb:1,Cl:2},[['PbCl2',1,solid]],{fraction:.65});
reaction('Pb(NO3)2','CaCl2',{Pb:1,Cl:2},[['PbCl2',1,solid]],{fraction:.65});
reaction('Pb(NO3)2','NaOH',{Pb:1,OH:2},[['Pb(OH)2',1,solid]]);
reaction('Pb(NO3)2','NH3',{Pb:1,NH3:2,H2O:2},[['Pb(OH)2',1,solid],['NH4',2,aq]]);
reaction('Pb(NO3)2','Na2CO3',{Pb:1,CO3:1},[['PbCO3',1,solid]]);
reaction('CaCO3','HCl',{CaCO3:1,H3O:2},[['Ca',1,aq],['CO2',1,gas],['H2O',3,aq]]);
reaction('CaCO3','AgNO3',{CaCO3:1,Ag:2},[['Ag2CO3',1,solid],['Ca',1,aq]]);
reaction('CaCO3','Cu(NO3)2',{CaCO3:2,Cu:2,H2O:1},[['malachite',1,solid],['Ca',2,aq],['CO2',1,gas]]);
reaction('HCl','NaOH',{H3O:1,OH:1},[['H2O',2,aq]]);
reaction('HCl','NH3',{H3O:1,NH3:1},[['NH4',1,aq],['H2O',1,aq]]);
reaction('HCl','AgNO3',{Ag:1,Cl:1},[['AgCl',1,solid]]);
reaction('HCl','Cu(NO3)2',{Cu:1,Cl:4},[['CuCl4',1,aq]],{fraction:.6,equilibrium:true,condition:'Klorokompleks görünümü yüksek klorür derişimi varsayımına aittir; 0,10 M çözeltiler için nicel denge hesabı değildir.'});
reaction('HCl','Na2CO3',{CO3:1,H3O:2},[['CO2',1,gas],['H2O',3,aq]]);
reaction('CaCl2','NaOH',{Ca:1,OH:2},[['Ca(OH)2',1,solid]],{fraction:.8});
reaction('CaCl2','AgNO3',{Ag:1,Cl:1},[['AgCl',1,solid]]);
reaction('CaCl2','Na2CO3',{Ca:1,CO3:1},[['CaCO3',1,solid]]);
reaction('NaOH','AgNO3',{Ag:2,OH:2},[['Ag2O',1,solid],['H2O',1,aq]]);
reaction('NaOH','Cu(NO3)2',{Cu:1,OH:2},[['Cu(OH)2',1,solid]]);
reaction('NH3','AgNO3',{Ag:1,NH3:2},[['AgNH3',1,aq]],{equilibrium:true});
reaction('NH3','Cu(NO3)2',{Cu:1,NH3:4},[['CuNH3',1,aq]],{equilibrium:true,condition:'Bu model uygulamadaki fazla amonyak senaryosunu temsil eder. Kompleksin eksenel su molekülleri çizilmemiştir.'});
reaction('Na2CO3','AgNO3',{Ag:2,CO3:1},[['Ag2CO3',1,solid]]);
reaction('Na2CO3','Cu(NO3)2',{Cu:2,CO3:2,H2O:1},[['malachite',1,solid],['CO2',1,gas]]);
export function inventory(items){const result={charge:0,atoms:{}};for(const item of items){result.charge+=CHARGES[item.kind]||0;for(const atom of template(item.kind).atoms)result.atoms[atom.element]=(result.atoms[atom.element]||0)+1}return result}
function add(list,kind,count,source,phase='aqueous',extra={}){for(let i=0;i<count;i++)list.push({id:list.length,kind,source,phase,...extra})}
export function buildModel(first,second){
 const definitions=[REAGENTS[first],REAGENTS[second]];if(definitions.some(x=>!x))throw new Error('Unsupported reagent');
 const mols=definitions.map(d=>d.solid?1/d.mass:.004),quantum=Math.max(...mols)/12,units=mols.map(m=>Math.max(2,Math.round(m/quantum)));
 const initial=[],dissolved=[];let virtualID=0;
 definitions.forEach((d,source)=>{const waters=d.solid?0:32;d.parts.forEach(name=>add(initial,name,units[source],source,d.solid?'solid':'aqueous',{reagent:true}));add(initial,'H2O',waters-(d.acid?units[source]:0),source,'aqueous',{solvent:true})});
 const wet=definitions.some(d=>!d.solid);
 for(const item of initial){const d=definitions[item.source];if(item.phase==='solid'&&d.soluble&&wet){for(const name of IONIC[item.kind])dissolved.push({...item,id:virtualID++,parent:item.id,kind:name,phase:'aqueous',dissolving:true})}else dissolved.push({...item,id:virtualID++,parent:item.id})}
 const recipe=recipes[key(first,second)]||null,available={};for(const item of dissolved)(available[item.kind]??=[]).push(item);
 let cycles=recipe?Math.min(...Object.entries(recipe.consume).map(([name,count])=>Math.floor((available[name]?.length||0)/count))):0;
 if(recipe?.fraction&&cycles>0)cycles=Math.max(1,Math.floor(cycles*recipe.fraction));
 const events=[],used=new Set(),products=[];
 for(let index=0;index<cycles;index++){
   const reactants=[];for(const[name,count]of Object.entries(recipe.consume))for(let i=0;i<count;i++){const item=available[name].shift();used.add(item.id);reactants.push(item)}
   const generated=[];for(const[name,count,phase]of recipe.produce)for(let i=0;i<count;i++){const item={id:virtualID++,kind:name,phase,source:0,product:true,event:index};generated.push(item);products.push(item)}
   events.push({index,reactants,products:generated});
 }
 const spectators=dissolved.filter(item=>!used.has(item.id)),final=[...spectators,...products],startInventory=inventory(initial),endInventory=inventory(final);
 const atoms=new Set([...Object.keys(startInventory.atoms),...Object.keys(endInventory.atoms)]),balanced=startInventory.charge===endInventory.charge&&Array.from(atoms).every(atom=>startInventory.atoms[atom]===endInventory.atoms[atom]);
 if(!balanced)throw new Error('Unbalanced particle model '+key(first,second));
 return{pair:[first,second],initial,dissolved,spectators,products,events,recipe,units,wet,balanced,startInventory,endInventory,notes:[recipe?.condition,recipe?.catalyst?'Katalizörün net miktarı korunur; ara basamaklar sadeleştirilmiştir.':'',first==='NH3'||second==='NH3'?'Amonyağın sudaki düşük orandaki iyonlaşması başlangıç görünümünde sadeleştirilmiştir.':''].filter(Boolean)};
}
export function symbol(kind){return LABELS[kind]||kind}
export function unique(items){return [...new Map(items.map(item=>[item.kind,item])).values()]}
