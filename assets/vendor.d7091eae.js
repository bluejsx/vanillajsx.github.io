var e=Object.defineProperty,t=Object.prototype.hasOwnProperty,n=Object.getOwnPropertySymbols,r=Object.prototype.propertyIsEnumerable,o=(t,n,r)=>n in t?e(t,n,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[n]=r,a=(e,a)=>{for(var i in a||(a={}))t.call(a,i)&&o(e,i,a[i]);if(n)for(var i of n(a))r.call(a,i)&&o(e,i,a[i]);return e};const i=["altGlyph","altGlyphDef","altGlyphItem","animate","animateColor","animateMotion","animateTransform","animation","audio","circle","clipPath","color-profile","cursor","defs","desc","discard","ellipse","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","filter","font","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignObject","g","glyph","glyphRef","handler","hkern","image","line","linearGradient","listener","marker","mask","metadata","missing-glyph","mpath","path","pattern","polygon","polyline","prefetch","radialGradient","rect","set","solidColor","stop","svg","switch","symbol","tbreak","text","textArea","textPath","tref","tspan","unknown","use","view","vkern"];function f(e,t,n){var r;null!=(r=e._vf)[t]||(r[t]=[]),e._vf[t].value=n,Object.defineProperty(e,t,{get:()=>e._vf[t].value,set(n){e._vf[t].value=n,e._vf[t].forEach((e=>e(n)))}}),e[t]=n}Object.defineProperties(Element.prototype,{_vf:{value:{}},watch:{value:function(e,t){const n=this._vf[e];var r;n?(n.push(t),(0===(r=n.value)||r)&&t(n.value)):this._vf[e]=[t]}}}),Object.defineProperty(EventTarget.prototype,"on",{value:EventTarget.prototype.addEventListener});let l=0;const s=(e,t)=>{if(t instanceof Function){e.append("");const r=e.childNodes[e.childNodes.length-1];n=e,Object.defineProperties(n,{innerHTML:{set(){}},innerText:{set(){}}});t((e=>{r.data=e.toString()}),e)}else if(t instanceof Array)for(const r of t)s(e,r);else e.append(t);var n};const c={r:function(e,t,...n){null!=t||(t={});let r,o=!1;if("string"==typeof e)i.includes(e)?(r=document.createElementNS("http://www.w3.org/2000/svg",e),o=!0):r=document.createElement(e);else{if("function"!=typeof e)throw new Error("using invalid thing used as element tag.");if((null==e?void 0:e.prototype)instanceof Element)try{r=new e}catch(c){customElements.define("default"===(f=e.name)?`custom-elem-${(l++).toString(36)}`:f.replace(/[A-Z]/g,"-$&").substring(1).toLowerCase(),e),r=new e}else r=e(a(a({},t),{children:[...n]})),n.length=0}var f;if(t)for(const a in t){const e=t[a];"class"===a?r.classList.value=e:o?r.setAttribute(a,e):r[a]=e}return s(r,n),r},Fragment:({children:e})=>e};export{c as V,f as u};