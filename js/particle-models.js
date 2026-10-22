/* Qualitative, balanced teaching models. Water and particle sizes are not to scale.
 * Net ionic conventions: OpenStax Chemistry 2e, 4.1–4.2, 15.1.
 * Iodide/copper catalysis retains the catalyst; intermediate pathways are omitted.
 */
export const COLORS={H:'#FFFFFF',O:'#FF0D0D',N:'#3050F8',C:'#333333',Na:'#AB5CF2',K:'#8F40D4',Cl:'#1FF01F',Ca:'#00E676',Ag:'#C0C0C0',Pb:'#575961',Cu:'#C88033',I:'#940094'};
const atomicRadii={H:.0090,O:.0165,N:.0170,C:.0175,Cu:.0195,Na:.0240,Cl:.0250,Ca:.0255,Ag:.0288,Pb:.0305,K:.0315,I:.0340};
export const CHARGES={H3O:1,Na:1,K:1,Cl:-1,I:-1,Ca:2,Ag:1,Pb:2,Cu:2,OH:-1,NO3:-1,HCO3:-1,CO3:-2,NH4:1,HO2:-1,CuCl4:-2,AgNH3:1,CuNH3:2};
const FORMULAS={AgNH3:'AgN2H6',CuNH3:'CuN4H16O2',CuCl4:'CuCl4',malachite:'Cu2CO5H2',AgMetal:'Ag'};
export const LABELS={H2O:'H₂O',H3O:'H₃O⁺',H2O2:'H₂O₂',Na:'Na⁺',K:'K⁺',Cl:'Cl⁻',I:'I⁻',Ca:'Ca²⁺',Ag:'Ag⁺',Pb:'Pb²⁺',Cu:'Cu²⁺',OH:'OH⁻',NO3:'NO₃⁻',HCO3:'HCO₃⁻',CO3:'CO₃²⁻',NH3:'NH₃',NH4:'NH₄⁺',HO2:'HO₂⁻',CO2:'CO₂',O2:'O₂',Cl2:'Cl₂',I2:'I₂',AgMetal:'Ag',AgCl:'AgCl',AgI:'AgI',PbI2:'PbI₂',PbCl2:'PbCl₂',CaCO3:'CaCO₃',NaHCO3:'NaHCO₃',Na2CO3:'Na₂CO₃',PbCO3:'PbCO₃','Pb(OH)2':'Pb(OH)₂','Ca(OH)2':'Ca(OH)₂','Cu(OH)2':'Cu(OH)₂',Ag2O:'Ag₂O',Ag2CO3:'Ag₂CO₃',CuI:'CuI',malachite:'Cu₂CO₃(OH)₂',CuCl4:'[CuCl₄]²⁻',AgNH3:'[Ag(NH₃)₂]⁺',CuNH3:'[Cu(NH₃)₄]²⁺'};
const molecule=(atoms,bonds)=>({atoms:atoms.map(([element,x,y,z=0])=>({element,position:[x,y,z],radius:atomicRadii[element]})),bonds});
const TRIGON_N=[['O',0,.0210],['O',-.0182,-.0105],['O',.0182,-.0105]];
const TRIGON_C=[['O',0,.0215],['O',-.0186,-.0108],['O',.0186,-.0108]];
const T={
 H2O:molecule([['O',0,0],['H',-.0126,.0098],['H',.0126,.0098]],[[0,1],[0,2]]),
 H3O:molecule([['O',0,.003,0],['H',.0150,-.005,0],['H',-.0075,-.005,.0130],['H',-.0075,-.005,-.0130]],[[0,1],[0,2],[0,3]]),
 H2O2:molecule([['O',-.0110,0,0],['O',.0110,0,0],['H',-.0215,.0120,.0040],['H',.0215,-.0040,.0120]],[[0,1],[0,2],[1,3]]),
 NH3:molecule([['N',0,.003,0],['H',.0150,-.005,0],['H',-.0075,-.005,.0130],['H',-.0075,-.005,-.0130]],[[0,1],[0,2],[0,3]]),
 NH4:molecule([['N',0,0],['H',.0095,.0095,.0095],['H',-.0095,-.0095,.0095],['H',-.0095,.0095,-.0095],['H',.0095,-.0095,-.0095]],[[0,1],[0,2],[0,3],[0,4]]),
 NO3:molecule([['N',0,0],...TRIGON_N],[[0,1],[0,2],[0,3]]),
 CO3:molecule([['C',0,0],...TRIGON_C],[[0,1],[0,2],[0,3]]),
 HCO3:molecule([['C',0,0],...TRIGON_C,['H',.0330,-.0040,0]],[[0,1],[0,2],[0,3],[3,4]]),
 OH:molecule([['O',-.003,0,0],['H',.0125,0,0]],[[0,1]]),
 HO2:molecule([['O',-.0110,0,0],['O',.0110,0,0],['H',-.0215,.0120,0]],[[0,1],[0,2]]),
 CO2:molecule([['C',0,0],['O',-.0210,0],['O',.0210,0]],[[0,1],[0,2]]),
 O2:molecule([['O',-.0110,0],['O',.0110,0]],[[0,1]]),
 Cl2:molecule([['Cl',-.0160,0],['Cl',.0160,0]],[[0,1]]),
 I2:molecule([['I',-.0220,0],['I',.0220,0]],[[0,1]])
};
const IONIC={NaHCO3:['Na','HCO3'],Na2CO3:['Na','Na','CO3'],CaCO3:['Ca','CO3'],AgCl:['Ag','Cl'],AgI:['Ag','I'],PbI2:['Pb','I','I'],PbCl2:['Pb','Cl','Cl'],PbCO3:['Pb','CO3'],'Pb(OH)2':['Pb','OH','OH'],'Ca(OH)2':['Ca','OH','OH'],'Cu(OH)2':['Cu','OH','OH'],Ag2O:['Ag','Ag','O'],Ag2CO3:['Ag','Ag','CO3'],CuI:['Cu','I'],malachite:['Cu','Cu','CO3','OH','OH']};
const REAGENTS={NaHCO3:{parts:['NaHCO3'],solid:true,soluble:true},Na2CO3:{parts:['Na2CO3'],solid:true,soluble:true},CaCO3:{parts:['CaCO3'],solid:true},HCl:{parts:['H3O','Cl'],acid:true},H2O2:{parts:['H2O2']},KI:{parts:['K','I']},'Pb(NO3)2':{parts:['Pb','NO3','NO3']},CaCl2:{parts:['Ca','Cl','Cl']},NaOH:{parts:['Na','OH']},NH3:{parts:['NH3']},AgNO3:{parts:['Ag','NO3']},'Cu(NO3)2':{parts:['Cu','NO3','NO3']}};
function combine(parts){const atoms=[],bonds=[];parts.forEach(([name,offset])=>{const t=template(name),base=atoms.length;t.atoms.forEach(a=>atoms.push({...a,position:a.position.map((n,i)=>n+offset[i])}));t.bonds.forEach(([a,b,order=1])=>bonds.push([a+base,b+base,order]))});return{atoms,bonds}}
export function template(name){
 if(T[name])return T[name];
 if(name==='AgMetal')return T[name]=molecule([['Ag',0,0]],[]);
 if(name==='PbI2')return T[name]=combine([['Pb',[0,0,0]],['I',[.025,.018,.010]],['I',[-.025,-.018,-.010]]]);
 if(name==='PbCl2')return T[name]=combine([['Pb',[0,0,0]],['Cl',[.022,.016,.010]],['Cl',[-.022,-.016,-.010]]]);
 if(name==='Pb(OH)2')return T[name]=combine([['Pb',[0,0,0]],['OH',[.025,0,0]],['OH',[-.025,0,0]]]);
 if(name==='Ca(OH)2')return T[name]=combine([['Ca',[0,0,0]],['OH',[.024,0,0]],['OH',[-.024,0,0]]]);
 if(name==='Cu(OH)2')return T[name]=combine([['Cu',[0,0,0]],['OH',[.023,0,0]],['OH',[-.023,0,0]]]);
 if(name==='Ag2O')return T[name]=combine([['O',[0,0,0]],['Ag',[.025,0,0]],['Ag',[-.025,0,0]]]);
 if(name==='Ag2CO3')return T[name]=combine([['CO3',[0,0,0]],['Ag',[.030,0,0]],['Ag',[-.030,0,0]]]);
 if(name==='malachite')return T[name]=combine([['CO3',[0,0,0]],['Cu',[.028,0,0]],['Cu',[-.028,0,0]],['OH',[.050,0,0]],['OH',[-.050,0,0]]]);
 if(name==='CuCl4')return T[name]=combine([['Cu',[0,0,0]],...[[.030,.020,.020],[-.030,.020,.020],[0,-.028,.028],[0,-.012,-.032]].map(p=>['Cl',p])]);
 if(name==='AgNH3'){const centers=[[-.038,0,0],[.038,0,0]],result=combine([['Ag',[0,0,0]],...centers.map(p=>['NH3',p])]);centers.forEach((_,i)=>result.bonds.push([0,1+i*4]));return T[name]=result}
 if(name==='CuNH3'){const eq=[[.036,0,0],[-.036,0,0],[0,0,.036],[0,0,-.036]],result=combine([['Cu',[0,0,0]],...eq.map(p=>['NH3',p]),['H2O',[0,.046,0]],['H2O',[0,-.046,0]]]);eq.forEach((_,i)=>result.bonds.push([0,1+i*4]));result.bonds.push([0,17],[0,20]);return T[name]=result}
 if(IONIC[name]){const ions=IONIC[name],positions=ions.length===2?[[-.024,0,0],[.024,0,0]]:ions.map((_,i)=>[Math.cos(i/ions.length*Math.PI*2)*.030,Math.sin(i/ions.length*Math.PI*2)*.024,0]);return T[name]=combine(ions.map((n,i)=>[n,positions[i]]))}
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
reaction('H2O2','KI',{H2O2:2},[['H2O',2,aq],['O2',1,gas]],{catalyst:'I',condition:'İyodür (I⁻) hidrojen peroksidin parçalanmasını katalizler; I⁻ net tepkimede tükenmez ve çözeltide korunur (oluşan geçici sarı/kahverengi renk ara ürün iyottan kaynaklanır).'});
reaction('H2O2','Cu(NO3)2',{H2O2:2},[['H2O',2,aq],['O2',1,gas]],{catalyst:'Cu',condition:'Bakır(II) iyonları H₂O₂ parçalanmasını katalizler; Cu²⁺ katalizör olarak çözeltide korunur.'});
reaction('H2O2','HCl',{H2O2:1,H3O:2,Cl:2},[['Cl2',1,gas],['H2O',4,aq]],{condition:'Klor oluşumu bu uygulamanın asitli ortam senaryosudur; gerçek hız ve verim modellenmez.'});
reaction('H2O2','NaOH',{H2O2:1,OH:1},[['HO2',1,aq],['H2O',1,aq]],{fraction:.75,equilibrium:true});
reaction('H2O2','AgNO3',{H2O2:1,Ag:2,H2O:2},[['AgMetal',2,solid],['H3O',2,aq],['O2',1,gas]]);
reaction('KI','Pb(NO3)2',{Pb:1,I:2},[['PbI2',1,solid]]);
reaction('KI','AgNO3',{Ag:1,I:1},[['AgI',1,solid]]);
reaction('KI','Cu(NO3)2',{Cu:2,I:4},[['CuI',2,solid],['I2',1,aq]],{condition:'Bakır(II)-iyodür redoks tepkimesinde Cu²⁺ iyonları Cu⁺ katyonuna indirgenir; çöken beyaz-krem CuI katısında bakırın yükseltgenme basamağı +1\'dir (Cu⁺ : I⁻ = 1:1).'});
reaction('Pb(NO3)2','HCl',{Pb:1,Cl:2},[['PbCl2',1,solid]],{fraction:.65});
reaction('Pb(NO3)2','CaCl2',{Pb:1,Cl:2},[['PbCl2',1,solid]],{fraction:.65});
reaction('Pb(NO3)2','NaOH',{Pb:1,OH:2},[['Pb(OH)2',1,solid]]);
reaction('Pb(NO3)2','NH3',{Pb:1,NH3:2,H2O:2},[['Pb(OH)2',1,solid],['NH4',2,aq]]);
reaction('Pb(NO3)2','Na2CO3',{Pb:1,CO3:1},[['PbCO3',1,solid]]);
reaction('CaCO3','HCl',{CaCO3:1,H3O:2},[['Ca',1,aq],['CO2',1,gas],['H2O',3,aq]]);
reaction('CaCO3','AgNO3',{CaCO3:1,Ag:2},[['Ag2CO3',1,solid],['Ca',1,aq]],{condition:'Kalsiyum karbonat yüzeyinde gümüş karbonat oluşumu heterojen yüzey tepkimesi varsayımına dayanır; katı tanecikler üzerinde ince Ag₂CO₃ tabakası oluşur.'});
reaction('CaCO3','Cu(NO3)2',{CaCO3:2,Cu:2,H2O:1},[['malachite',1,solid],['Ca',2,aq],['CO2',1,gas]],{condition:'Kalsiyum karbonat yüzeyinde bazik bakır karbonat (malakit) oluşumu ve hafif CO₂ çıkışı heterojen yüzey tepkimesi varsayımına dayanır.'});
reaction('HCl','NaOH',{H3O:1,OH:1},[['H2O',2,aq]]);
reaction('HCl','NH3',{H3O:1,NH3:1},[['NH4',1,aq],['H2O',1,aq]]);
reaction('HCl','AgNO3',{Ag:1,Cl:1},[['AgCl',1,solid]]);
reaction('HCl','Cu(NO3)2',{Cu:1,Cl:4},[['CuCl4',1,aq]],{fraction:.6,equilibrium:true,condition:'Klorokompleks görünümü yüksek klorür derişimi varsayımına aittir; 0,10 M çözeltiler için nicel denge hesabı değildir.'});
reaction('HCl','Na2CO3',{CO3:1,H3O:2},[['CO2',1,gas],['H2O',3,aq]]);
reaction('CaCl2','NaOH',{Ca:1,OH:2},[['Ca(OH)2',1,solid]],{fraction:.8,condition:'Kalsiyum hidroksit çökelti oluşumu yeterli derişim varsayımına dayanır; seyreltik çözeltilerde tam çözünme görülebilir.'});
reaction('CaCl2','AgNO3',{Ag:1,Cl:1},[['AgCl',1,solid]]);
reaction('CaCl2','Na2CO3',{Ca:1,CO3:1},[['CaCO3',1,solid]]);
reaction('NaOH','AgNO3',{Ag:2,OH:2},[['Ag2O',1,solid],['H2O',1,aq]]);
reaction('NaOH','Cu(NO3)2',{Cu:1,OH:2},[['Cu(OH)2',1,solid]]);
reaction('NH3','AgNO3',{Ag:1,NH3:2},[['AgNH3',1,aq]],{equilibrium:true});
reaction('NH3','Cu(NO3)2',{Cu:1,NH3:4,H2O:2},[['CuNH3',1,aq]],{equilibrium:true,condition:'Fazla NH₃ varlığında [Cu(NH₃)₄(H₂O)₂]²⁺ kompleksi oluşur (az NH₃ ortamında geçici Cu(OH)₂ çökeleği oluşabilir). Lise düzeyinde [Cu(NH₃)₄]²⁺ şeklinde kısaltılır; 3B gerçek yapıda Cu²⁺ çevresinde 4 ekvatoryal NH₃ ve 2 eksenel H₂O içeren uzamış oktahedral geometri sergilenir.'});
reaction('Na2CO3','AgNO3',{Ag:2,CO3:1},[['Ag2CO3',1,solid]]);
reaction('Na2CO3','Cu(NO3)2',{Cu:2,CO3:2,H2O:1},[['malachite',1,solid],['CO2',1,gas]]);
export function inventory(items){const result={charge:0,atoms:{}};for(const item of items){result.charge+=CHARGES[item.kind]||0;for(const atom of template(item.kind).atoms)result.atoms[atom.element]=(result.atoms[atom.element]||0)+1}return result}
function add(list,kind,count,source,phase='aqueous',extra={}){for(let i=0;i<count;i++)list.push({id:list.length,kind,source,phase,...extra})}
export function buildModel(first,second,amounts){
 const definitions=[REAGENTS[first],REAGENTS[second]];if(definitions.some(x=>!x))throw new Error('Unsupported reagent');
 if(!Array.isArray(amounts)||amounts.length!==2||amounts.some(a=>!Number.isFinite(a.moles)||a.moles<=0))throw new Error('Two explicit starting sample amounts are required');
 const mols=amounts.map(a=>a.moles),quantum=Math.max(...mols)/12,units=mols.map(m=>Math.max(2,Math.round(m/quantum)));
 const initial=[],dissolved=[];let virtualID=0;
 definitions.forEach((d,source)=>{const waters=d.solid?0:(d.acid?28:20);d.parts.forEach(name=>add(initial,name,units[source],source,d.solid?'solid':'aqueous',{reagent:true}));add(initial,'H2O',waters-(d.acid?units[source]:0),source,'aqueous',{solvent:true})});
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
 return{pair:[first,second],amounts,mols,initial,dissolved,spectators,products,events,recipe,units,wet,balanced,startInventory,endInventory,notes:[recipe?.condition,recipe?.catalyst?'Katalizörün net miktarı korunur; ara basamaklar sadeleştirilmiştir.':'',first==='NH3'||second==='NH3'?'Amonyağın sulu çözeltisinde çoğunlukla nötr NH₃ molekülleri ve su bulunur; az miktarda NH₄⁺ ve OH⁻ iyonu denge hâlindedir.':'',definitions.some(d=>d.solid)?'Tanecikler alan dolduran (CPK / space-filling) modelle gösterilir; çubuk şeklinde mekanik bağ bulunmaz, elektron bulutları birbirine temas eder. Katı maddelerde kutu biçimli kafes temsili kristal örgüdür.':'',wet?'Sulu çözeltide çözücü su molekülleri ve ayrı hidratlanmış iyonlar gösterilir.':''].filter(Boolean)};
}
export function symbol(kind){return LABELS[kind]||kind}
export function unique(items){return [...new Map(items.map(item=>[item.kind,item])).values()]}
