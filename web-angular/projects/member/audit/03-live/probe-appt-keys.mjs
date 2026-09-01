const API='http://localhost:4000/api';
const r=await fetch(`${API}/auth/login`,{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({email:'shivam@gmail.com',password:'12345678'})});
const cookie=(r.headers.getSetCookie?.()??[]).map(c=>c.split(';')[0]).join('; ');
const rows=await (await fetch(`${API}/appointments/user/6a34c98e4e45325c5a7c06b5`,{headers:{cookie}})).json();
const list=Array.isArray(rows)?rows:(rows.data??[]);
// Print the union of keys across ALL rows — one row may omit what another carries.
const keys=new Set(); list.forEach(r=>Object.keys(r).forEach(k=>keys.add(k)));
console.log('rows:',list.length);
console.log('union of keys:\n ', [...keys].sort().join(', '));
const withPay=list.find(r=>r.paymentId||r.paymentStatus||r.copayAmount);
console.log('\nany row carrying payment fields?', withPay? JSON.stringify(withPay).slice(0,300) : 'NO');
