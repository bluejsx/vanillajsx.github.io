var d=Object.defineProperty,p=Object.defineProperties;var m=Object.getOwnPropertyDescriptors;var l=Object.getOwnPropertySymbols;var h=Object.prototype.hasOwnProperty,v=Object.prototype.propertyIsEnumerable;var r=(n,e,t)=>e in n?d(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t,a=(n,e)=>{for(var t in e||(e={}))h.call(e,t)&&r(n,t,e[t]);if(l)for(var t of l(e))v.call(e,t)&&r(n,t,e[t]);return n},c=(n,e)=>p(n,m(e));import{w as s,M as b}from"./vendor.ee5cca48.js";const f=[["View the Source Code of This Page","https://github.com/bluejsx/bluejsx.github.io"],["Document","./docs/"],["GitHub Repository","https://github.com/bluejsx/BlueJSX"],["Join Discussions","https://github.com/bluejsx/BlueJSX/discussions"]],_=()=>{const n={},e=s.r("div",{class:"menu_list_container hidden"},s.r("div",{ref:[n,"toggleButton"],id:"h-menu-button"},s.r("span",null),s.r("span",null)),s.r("div",{class:"menu-list"},f.map(o=>{const i=s.r("p",null,o[0]);return i.onclick=()=>window.open(o[1]),i})),s.r("div",{ref:[n,"backField"],id:"backfield"})),{toggleButton:t,backField:u}=n;return b(e,"open",!1),e.watch("open",o=>{o?e.classList.remove("hidden"):e.classList.add("hidden")}),u.onclick=()=>e.open=!1,t.onclick=()=>e.open=!e.open,e},g="_title_jpaf6_14";const k=()=>s.r("header",null,s.r("div",{class:g},"BlueJSX"),s.r(_,null));var w=k;const x="_main_8b2wh_1";var J=({Component:n,pageProps:e})=>s.r("div",null,s.r(w,null),s.r(n,c(a({},e),{class:`container markdown-body ${x}`})));export{J as default};
