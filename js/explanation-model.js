import {buildModel, template, COLORS, CHARGES, LABELS, symbol, unique} from './particle-models.js?v=e8aaf3d3a426';

// Share the laboratory's chemical model; never infer spectators from leftover quantity.
function build(state) {
  const amounts = [state.selectedSlot1, state.selectedSlot2].map(id =>
    window.MebiExperiment.initialAmount(window.MebiData.getReagent(id)));
  const model = buildModel(state.selectedSlot1, state.selectedSlot2, amounts);
  const consumed = model.recipe?.consume || {};
  const species = unique([...model.dissolved.filter(p => !p.solvent || consumed[p.kind]), ...model.products]);
  return {model, species:species.map(p => {
    const product = model.products.find(item => item.kind === p.kind);
    const role = consumed[p.kind] ? 'reactant' : product ?
      (product.phase === 'solid' ? 'solid' : product.phase === 'gas' ? 'gas' : p.kind === 'H2O' ? 'water' : 'other') :
      model.recipe?.catalyst === p.kind ? 'catalyst' : CHARGES[p.kind] && p.phase === 'aqueous' ? 'spectator' : 'unchanged';
    return {kind:p.kind, label:symbol(p.kind), role, phase:p.phase,
      coefficient:consumed[p.kind] || model.recipe?.produce.find(([name]) => name === p.kind)?.[1] || null};
  })};
}

// A schematic projection of the exact same atom templates used inside the 3D beakers.
function thumbnail(kind) {
  const t = template(kind), points = t.atoms.map(a => [a.position[0], a.position[1]]);
  const scale = Math.min(320, 50 / Math.max(.08, ...points.map(p => Math.abs(p[0]) * 2)), 34 / Math.max(.08, ...points.map(p => Math.abs(p[1]) * 2)));
  const xy = i => [36 + points[i][0] * scale, 23 - points[i][1] * scale];
  const atoms = t.atoms.map((a,i) => {
    const [x,y]=xy(i), r = a.element === 'H' ? 6.5 : Math.max(7.5, Math.min(13, a.radius * 360));
    const textFill = ['C','Pb','I','N','O'].includes(a.element) ? '#ffffff' : '#15222e';
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${COLORS[a.element]}" stroke="#4b575d" stroke-width=".7"/><text x="${x}" y="${y+2.7}" text-anchor="middle" fill="${textFill}" font-size="8" font-weight="700">${a.element}</text>`;
  }).join('');
  return `<svg viewBox="0 0 72 46" aria-hidden="true" focusable="false">${atoms}</svg>`;
}
function notationAliases(){
  const aliases=Object.create(null),normalize=window.MebiChemicalWriting.normalize;
  for(const [kind,label]of Object.entries(LABELS)){
    const base=label.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+$/g,''),plain=normalize(base),charge=CHARGES[kind];
    aliases[plain]=base;
    if(charge){const sign=charge>0?'+':'-',amount=String(Math.abs(charge));for(const suffix of[(amount==='1'?'':amount)+sign,sign+(amount==='1'?'':amount),amount+sign,sign+amount])aliases[plain+suffix]=label;}
    aliases[normalize(label)]=label;
  }
  for(const reagent of window.MebiData.REAGENTS)aliases[normalize(reagent.f)]=reagent.f;
  aliases['H+']='H⁺';
  return aliases;
}
window.MebiExplanationModel = {build, thumbnail, notationAliases, template, CHARGES, LABELS, symbol, COLORS};
if (['card','model'].includes(window.TepkimeArenasi?.state.screen)) window.TepkimeArenasi.render(false);
