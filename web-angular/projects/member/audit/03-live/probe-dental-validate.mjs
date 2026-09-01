const API='http://localhost:4000/api';
const r=await fetch(`${API}/auth/login`,{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({email:'shivam@gmail.com',password:'12345678'})});
const cookie=(r.headers.getSetCookie?.()??[]).map(c=>c.split(';')[0]).join('; ');
const clinics=await (await fetch(`${API}/dental-bookings/clinics?serviceCode=DENTAL_CONSULTATION`,{headers:{cookie}})).json();
const c0=(clinics.clinics??clinics.data??[])[0];
console.log('clinic:', c0 && (c0.clinicId||c0._id), c0 && c0.servicePrice);
const res=await fetch(`${API}/dental-bookings/validate`,{method:'POST',
  headers:{cookie,'content-type':'application/json'},
  body:JSON.stringify({serviceCode:'DENTAL_CONSULTATION',clinicId:c0?.clinicId,price:c0?.servicePrice??1000})});
console.log('validate ->',res.status);
console.log(JSON.stringify(await res.json().catch(()=>null)).slice(0,500));
