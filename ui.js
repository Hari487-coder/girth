import {icons} from './icons.js';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money = value => (Number(value)<0?'−₹':'₹') + Math.abs(Number(value || 0)).toLocaleString('en-IN', {maximumFractionDigits:0});
export const number = value => Number(value || 0).toLocaleString('en-IN');
export const icon = (name,cls='') => `<span class="icon ${esc(cls)}" aria-hidden="true">${icons[name] || icons.leaf}</span>`;
export const badge = (text,tone='green') => `<span class="badge badge-${esc(tone)}">${esc(text)}</span>`;
export const date = value => new Date(value).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
export function downloadFile(name,content,type='text/plain;charset=utf-8') {const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
