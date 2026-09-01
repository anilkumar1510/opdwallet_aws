/**
 * Does the bookings LIST response carry what a row needs to show an outstanding
 * amount — without an additional request?
 *
 * Twelve of the fourteen accumulated copays are consultations, so the
 * appointments source is the one that matters most; its Angular DTO declares
 * only `consultationFee`, which may or may not reflect what the API sends.
 */
const API='http://localhost:4000/api';
const r=await fetch(`${API}/auth/login`,{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({email:'shivam@gmail.com',password:'12345678'})});
const cookie=(r.headers.getSetCookie?.()??[]).map(c=>c.split(';')[0]).join('; ');
const me=await (await fetch(`${API}/auth/me`,{headers:{cookie}})).json();
const uid=me.id??me.user?.id??me._id??me.user?._id??'6a34c98e4e45325c5a7c06b5';
const MONEY=/amount|fee|copay|wallet|payment|paid|price|total|outstanding|due/i;
for (const path of [`appointments/user/${uid}`,`dental-bookings/user/${uid}`,`vision-bookings/user/${uid}`]) {
  const res=await fetch(`${API}/${path}`,{headers:{cookie}});
  const j=await res.json().catch(()=>null);
  const rows=Array.isArray(j)?j:(j?.data??j?.appointments??j?.bookings??[]);
  console.log(`\n=== ${path} -> ${res.status}, ${Array.isArray(rows)?rows.length:'?'} rows`);
  if(Array.isArray(rows)&&rows.length){
    const row=rows[0];
    const keys=Object.keys(row).filter(k=>MONEY.test(k));
    console.log('   money-ish keys:', keys.join(', ')||'NONE');
    keys.forEach(k=>console.log(`      ${k} =`, JSON.stringify(row[k])));
  }
}
