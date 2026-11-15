// One owner for page state, shared across quick/grouped/individual display modes.
const MATCH_PAGE_SIZE = 6;
let matchPage = 1, matchPageSignature = '', matchPageCollection = null;
function resetMatchPage() { matchPage = 1; }
function matchFilterSignature(mode) {
  return JSON.stringify([mode,state.mq,state.mMin,state.mBuyer,state.mCat,state.mTier,state.mCombo,state.mRegion,state.mOwner,state.mPhones,state.mOnlyArea,state.mHideDone,state.mNewOnly,state.mSort,fastF]);
}
function setMatchCollection(items, renderItem, mode) {
  const signature = matchFilterSignature(mode);
  if (signature !== matchPageSignature) { matchPageSignature = signature; resetMatchPage(); }
  matchPageCollection = {items,renderItem,mode};
  drawMatchPage();
}
function matchPageState() {
  return {...AQMPagination.getState(matchPageCollection?.items.length || 0,matchPage,MATCH_PAGE_SIZE),view:'matches'};
}
function drawMatchPage() {
  if (!matchPageCollection) return;
  const info=matchPageState(); matchPage=info.page;
  const visible=matchPageCollection.items.slice(info.from ? info.from-1 : 0,info.to);
  if (matchPageCollection.mode==='fast') {
    fastRowsNow=visible;
    if (!visible.some(row=>row.B.key===fastCur)) fastCur=visible[0]?.B.key || '';
  }
  setMatchList(visible.map(matchPageCollection.renderItem).join(''));
  AQMPagination.mount($('mPagination'),info,goMatchPage);
  window.dispatchEvent(new CustomEvent('aqm:pagination',{detail:info}));
}
function clearMatchCollection(html) {
  matchPageCollection=null; matchPage=1; fastRowsNow=[];
  setMatchList(html);
  const info=matchPageState(); AQMPagination.mount($('mPagination'),info,goMatchPage);
  window.dispatchEvent(new CustomEvent('aqm:pagination',{detail:info}));
}
function goMatchPage(page) {
  if (!matchPageCollection || state.view!=='matches' || !Number.isInteger(page)) return;
  const next=AQMPagination.getState(matchPageCollection.items.length,page,MATCH_PAGE_SIZE).page;
  if (next===matchPage) return;
  matchPage=next; drawMatchPage();
  $('mList').scrollIntoView({block:'start',behavior:'instant'});
}
window.AQMMatchesPagination = {go:goMatchPage,state:matchPageState};
AQMPagedViews.register('matches',window.AQMMatchesPagination);
window.addEventListener('aqm:view',event=>{
  if(event.detail?.view!=='matches') { matchPageCollection=null; fastRowsNow=[]; }
});
