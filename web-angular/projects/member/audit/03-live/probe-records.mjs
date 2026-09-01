const API='http://localhost:4000/api';
const r=await fetch(`${API}/auth/login`,{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({email:'shivam@gmail.com',password:'12345678'})});
const cookie=(r.headers.getSetCookie?.()??[]).map(c=>c.split(';')[0]).join('; ');
for (const path of ['member/digital-prescriptions','member/prescriptions']) {
  const res=await fetch(`${API}/${path}`,{headers:{cookie}});
  const j=await res.json().catch(()=>null);
  const rows=j?.data??j;
  console.log(path, res.status, Array.isArray(rows)?`${rows.length} rows`:JSON.stringify(j).slice(0,200));
  if (Array.isArray(rows)) rows.slice(0,3).forEach(d=>console.log('   _id',d._id,'| prescriptionId',d.prescriptionId,'| patient',d.patientName));
}
