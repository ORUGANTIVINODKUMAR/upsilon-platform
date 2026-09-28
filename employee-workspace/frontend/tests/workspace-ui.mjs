import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { createServer } from 'vite';
import React, { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';

// Isolated component tests: no backend connections, credentials or business records.
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
const load = async path => (await server.ssrLoadModule(`/src/${path}`)).default;
const h = React.createElement;
let checks = 0;
const check = (name, fn) => { fn(); checks += 1; console.log(`PASS ${name}`); };
try {
 const { ROLE_PAGES, PAGE_META } = await server.ssrLoadModule('/src/components/workspace/navigation.js');
 const Navigation = await load('components/workspace/WorkspaceNavigation.jsx');
 const Overview = await load('components/workspace/WorkspaceOverview.jsx');
 const StatusBadge = await load('components/ui/StatusBadge.jsx');
 const FormField = await load('components/ui/FormField.jsx');
 const ModalFrame = await load('components/ui/ModalFrame.jsx');
 const AuthContext = await load('context/auth-context.js');
 const ConfirmContext = await load('components/ui/confirm-context.js');
 const TableRegion = await load('components/ui/TableRegion.jsx');
 const Avatar = await load('components/ui/UserAvatar.jsx');
 const ProtectedRoute = await load('components/ProtectedRoute.jsx');
 const { MemoryRouter } = await import('react-router-dom');
 const userFor = role => ({ name: 'UI verification', role, isActive: true });
 const wrap = (child, role = 'Admin') => h(AuthContext.Provider, {value: {user: userFor(role), updateUser: () => {}, logout: () => {}}}, h(ConfirmContext.Provider, {value: async () => false}, h(MemoryRouter, null, child)));
 const doc = html => new JSDOM(html).window.document;
 const expected = {
  Admin: 'dashboard attendance departments teams users managerApprovals leaveReports reimbursementReports leaveCalendar holidays editProfile',
  Employee: 'dashboard notifications attendance leave myLeaveBalance reimbursements holidays editProfile',
  TeamLeader: 'dashboard notifications attendance leave myLeaveBalance reimbursements tlApprovals managerApprovals reimbursementApprovals leaveCalendar holidays editProfile',
  Manager: 'dashboard notifications attendance leave myLeaveBalance hrLeaveBalances managerApprovals reimbursementApprovals leaveCalendar holidays editProfile',
  HR: 'dashboard notifications attendance leave myLeaveBalance hrLeaveBalances managerApprovals reimbursementApprovals leaveCalendar holidays editProfile',
  Finance: 'dashboard notifications attendance leaveCalendar financeLeaves financeReimbursements holidays editProfile',
 };
 for(const [role, pages] of Object.entries(expected)) {
  check(`${role}: existing permissions and navigation retained`, () => {
   assert.deepEqual([...ROLE_PAGES[role]].sort(), pages.split(' ').sort());
   const dom = doc(renderToStaticMarkup(h(Navigation, {allowedPages: ROLE_PAGES[role], activePage:'dashboard', onNavigate:()=>{}})));
   const names = [...dom.querySelectorAll('button')].map(b=>b.getAttribute('aria-label')).sort();
   assert.deepEqual(names, ROLE_PAGES[role].map(p=>PAGE_META[p].title).sort());
   assert.equal(dom.querySelectorAll('[aria-current="page"]').length,1);
  });
  check(`${role}: overview renders honest empty states and authorized shortcuts`, () => {
   const html = renderToStaticMarkup(wrap(h(Overview,{user:userFor(role),stats:{},loading:false,error:'',onRetry:()=>{},onNavigate:()=>{},allowedPages:ROLE_PAGES[role],notifications:[]}),role));
   assert.match(html,/No upcoming holidays/);
   assert.doesNotMatch(html,/NaN|undefined|Invalid Date/);
   // The workspace shell renders the page h1 ("Welcome back, …"); the overview adds none.
   const dom=doc(html);assert.equal(dom.querySelectorAll('h1').length,0);
   if(role!=='Admin') assert.doesNotMatch(html,/>Manage employees</);
   if(role==='Finance') assert.doesNotMatch(html,/My leave activity|My leave balance/);
  });
 }
 for(const [status,tone] of [['Pending Final Approval','warning'],['Pending Payment','warning'],['Inactive','danger'],['Unpaid Leave','danger'],['Rejected by HR','danger'],['Approved by Manager','success'],['Paid by Finance','success'],['Active','success']]) {
  check(`Status semantics: ${status}`,()=>assert.match(renderToStaticMarkup(h(StatusBadge,{status})),new RegExp(`ui-status--${tone}`)));
 }
 check('Overview failure never presents zero metrics',()=>{
  const html=renderToStaticMarkup(wrap(h(Overview,{user:userFor('Admin'),stats:{},loading:false,error:'Cannot load',onRetry:()=>{},onNavigate:()=>{},allowedPages:ROLE_PAGES.Admin,notifications:[]})));
  assert.match(html,/Overview unavailable/);assert.doesNotMatch(html,/overview-metrics/);assert.match(html,/Try again/);
 });
 for (const role of Object.keys(expected)) {
  check(`${role}: protected route allows own role and rejects other roles`, () => {
   const allowed = renderToStaticMarkup(wrap(h(ProtectedRoute,{allowedRoles:[role]},h('p',null,'Protected content')),role));
   const denied = renderToStaticMarkup(wrap(h(ProtectedRoute,{allowedRoles:[role==='Admin'?'Employee':'Admin']},h('p',null,'Protected content')),role));
   assert.match(allowed,/Protected content/);assert.doesNotMatch(denied,/Protected content/);
  });
 }
 check('Missing avatar names render safely',()=>assert.match(renderToStaticMarkup(h(Avatar,{name:null})),/>U</));
 check('Table overflow region remains keyboard accessible',()=>{
  const dom=doc(renderToStaticMarkup(h(TableRegion,{label:'Employees'},h('table',null,h('tbody',null,h('tr',null,h('td',null,'No records')))))));
  assert.equal(dom.querySelector('[role="region"]').getAttribute('tabindex'),'0');
 });
 check('Form labels connect to unique controls and preserve explicit IDs',()=>{
  const dom=doc(renderToStaticMarkup(h('form',null,h(FormField,null,h('label',null,'Name'),h('input',{defaultValue:''})),h(FormField,null,h('label',null,'Email'),h('input',{id:'email',type:'email'})))));
  const labels=[...dom.querySelectorAll('label')];assert.notEqual(labels[0].htmlFor,labels[1].htmlFor);
  for(const label of labels) assert.ok(dom.getElementById(label.htmlFor));
  assert.equal(labels[1].htmlFor,'email');
 });
 for(const file of (await readdir('src/pages')).filter(name=>name.endsWith('.jsx')&&!['Dashboard.jsx','Login.jsx'].includes(name))) {
  const Page=await load(`pages/${file}`);
  const props=file==='Notifications.jsx'?{notifications:[],setNotifications:()=>{},loading:false,loadError:'',onReload:()=>{}}:{};
  const role=file.startsWith('Finance')?'Finance':file.startsWith('TL')?'TeamLeader':file.includes('Reimbursement')?'Employee':'HR';
  check(`Initial render: ${file}`,()=>assert.ok(renderToStaticMarkup(wrap(h(Page,props),role)).length>0));
 }
 // React DOM + jsdom checks focus behavior, not browser layout or pixel rendering.
 const dom = new JSDOM('<!doctype html><button id="opener">Open</button><div id="root"></div>',{url:'http://localhost/'});
 globalThis.window=dom.window;globalThis.document=dom.window.document;
 globalThis.HTMLElement=dom.window.HTMLElement;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const {createRoot}=await import('react-dom/client');
 // jsdom has no layout; visible focus targets are supplied for keyboard unit tests.
 dom.window.HTMLElement.prototype.getClientRects=function(){return this.hidden?[]:[{width:10,height:10}];};
 const root=createRoot(document.getElementById('root'));
 const opener=document.getElementById('opener');opener.focus();
 let closed=0, submitted=0;
 await act(async()=>{root.render(h(ModalFrame,{as:'form',onClose:()=>closed++,onSubmit:event=>{event.preventDefault();submitted++;}},h('h2',null,'Edit record'),h('input',{'aria-label':'Name'}),h('button',{type:'submit'},'Save')));});
 await act(async()=>{await new Promise(resolve=>setTimeout(resolve,5));});
 check('Dialog receives an accessible name and initial focus',()=>{
  const dialog=document.querySelector('[role="dialog"]');assert.equal(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent,'Edit record');
  assert.equal(document.activeElement.tagName,'INPUT');assert.equal(document.body.style.overflow,'hidden');
 });
 check('Dialog wraps Tab and Shift+Tab inside its controls',()=>{
  const input=document.querySelector('input'),button=document.querySelector('form button');button.focus();
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));assert.equal(document.activeElement,input);
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));assert.equal(document.activeElement,button);
 });
 check('Dialog Escape invokes existing dismiss handler',()=>{document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(closed,1);});
 await act(async()=>document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
 check('Dialog preserves form submission',()=>assert.equal(submitted,1));
 await act(async()=>root.unmount());
 check('Dialog restores opener focus and page scrolling',()=>{assert.equal(document.activeElement,opener);assert.equal(document.body.style.overflow,'');});
 const navRoot=createRoot(document.getElementById('root'));
 let destination='';
 await act(async()=>navRoot.render(h(Navigation,{allowedPages:ROLE_PAGES.Employee,activePage:'dashboard',onNavigate:page=>{destination=page;}})));
 await act(async()=>document.querySelector('button[aria-label="My leaves"]').click());
 check('Navigation buttons preserve destination keys',()=>assert.equal(destination,'leave'));
 await act(async()=>navRoot.unmount());
 // Theme selection must apply immediately and survive a component remount.
 globalThis.localStorage=dom.window.localStorage;
 const ThemePicker=await load('components/WorkspaceThemePicker.jsx');
 const themeRoot=createRoot(document.getElementById('root'));
 await act(async()=>themeRoot.render(h(ThemePicker)));
 await act(async()=>document.querySelector('.workspace-theme-trigger').click());
 check('Theme picker keeps all existing themes and offers ChatGPT',()=>{
  assert.equal(document.querySelectorAll('[role="radio"]').length,9);
  assert.ok(document.querySelector('[role="radio"][aria-label^="ChatGPT:"]'));
 });
 await act(async()=>document.querySelector('[role="radio"][aria-label^="ChatGPT:"]').click());
 check('ChatGPT theme applies immediately and saves on this device',()=>{
  assert.equal(document.documentElement.dataset.workspaceTheme,'chatgpt');
  assert.equal(localStorage.getItem('workspace-color-theme'),'chatgpt');
  assert.equal(document.querySelector('.workspace-theme-panel'),null);
 });
 await act(async()=>themeRoot.render(null));
 await act(async()=>themeRoot.render(h(ThemePicker)));
 check('Theme picker restores ChatGPT after remount',()=>{
  assert.match(document.querySelector('.workspace-theme-trigger').getAttribute('aria-label'),/Current theme: ChatGPT/);
  assert.equal(document.documentElement.dataset.workspaceTheme,'chatgpt');
 });
 await act(async()=>themeRoot.unmount());
 console.log(`\n${checks} UI regression checks passed. Browser visual and live API workflow checks remain separate.`);
} finally { await server.close(); }
