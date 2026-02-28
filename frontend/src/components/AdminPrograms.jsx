import React, { useEffect, useState } from 'react'

const emptyForm = { title:'', time:'', location:'', price:'', age:'', days: [] }

function api(path, options={}){
  const token = localStorage.getItem('token')
  const headers = options.headers || {}
  if(token) headers.Authorization = `Bearer ${token}`
  headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  return fetch(`/api/programs${path}`, { ...options, headers })
}

export default function AdminPrograms(){
  const [programs, setPrograms] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load(){
      try{
        const res = await api('/')
        if(!res.ok){
          // fallback to localStorage
          const raw = localStorage.getItem('programs')
          setPrograms(raw ? JSON.parse(raw) : [])
          return
        }
        const data = await res.json()
        if(!mounted) return
        setPrograms(data)
      }catch(e){
        const raw = localStorage.getItem('programs')
        setPrograms(raw ? JSON.parse(raw) : [])
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function setLocal(programs){
    try{ localStorage.setItem('programs', JSON.stringify(programs)) }catch(e){}
    setPrograms(programs)
  }

  function handleEdit(p){ setEditing(p.id); setForm({ title:p.title||'', time:p.time||'', location:p.location||'', price:p.price||'', age:p.age||'', days: p.days || [] }); setMessage('') }

  async function handleDelete(id){
    if(!confirm('Энэхүү хөтөлбөрийг устгах уу?')) return
    setLoading(true)
    try{
      const res = await api(`/${id}`, { method: 'DELETE' })
      if(res.ok){
        const next = programs.filter(p => p.id !== id)
        setLocal(next)
        setMessage('Хөтөлбөр устгалаа')
      } else {
        const d = await res.json().catch(()=>({}))
        setMessage(d.message || 'Устгах үед алдаа')
      }
    }catch(e){ setMessage('Сүлжээний алдаа') }
    setLoading(false)
  }

  function handleChange(e){ const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })) }

  // days editor
  function addDay(){ setForm(prev => ({ ...prev, days: [...(prev.days||[]), { date:'', title:'', body:'' }] })) }
  function updateDay(i, key, value){ setForm(prev => { const days = (prev.days||[]).slice(); days[i] = { ...days[i], [key]: value }; return { ...prev, days } }) }
  function removeDay(i){ setForm(prev => { const days = (prev.days||[]).slice(); days.splice(i,1); return { ...prev, days } }) }

  async function handleCreate(e){ e.preventDefault(); setLoading(true); setMessage('')
    try{
      const res = await api('/', { method: 'POST', body: JSON.stringify(form) })
      if(!res.ok){ const d = await res.json().catch(()=>({})); setMessage(d.message || 'Create failed'); setLoading(false); return }
      const created = await res.json()
      const next = [...programs, created]
      setLocal(next)
      setForm(emptyForm)
      setMessage('Шинэ хөтөлбөр нэмэгдлээ')
    }catch(e){ setMessage('Network error') }
    setLoading(false)
  }

  async function handleUpdate(e){ e.preventDefault(); setLoading(true); setMessage('')
    try{
      const res = await api(`/${editing}`, { method: 'PUT', body: JSON.stringify(form) })
      if(!res.ok){ const d = await res.json().catch(()=>({})); setMessage(d.message || 'Update failed'); setLoading(false); return }
      const updated = await res.json()
      const next = programs.map(p => p.id === updated.id ? updated : p)
      setLocal(next)
      setEditing(null)
      setForm(emptyForm)
      setMessage('Хөтөлбөр шинэчлэгдлээ')
    }catch(e){ setMessage('Network error') }
    setLoading(false)
  }

  return (
    <div className="container" style={{paddingTop:12}}>
      <h2>Admin — Programs</h2>
      {message && <div style={{margin:'8px 0',color:'#0b8457'}}>{message}</div>}

      <section style={{display:'flex',gap:20}}>
        <div style={{flex:1}}>
          <h3>Бүх хөтөлбөрүүд</h3>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{textAlign:'left'}}><th>Id</th><th>Нэр</th><th>Цаг</th><th>Байршил</th><th>Үнэ</th><th>Нас</th><th></th></tr>
            </thead>
            <tbody>
              {programs.map(p => (
                <tr key={p.id} style={{borderTop:'1px solid #eee'}}>
                  <td style={{padding:8}}>{p.id}</td>
                  <td style={{padding:8}}>{p.title}</td>
                  <td style={{padding:8}}>{p.time}</td>
                  <td style={{padding:8}}>{p.location}</td>
                  <td style={{padding:8}}>{p.price}</td>
                  <td style={{padding:8}}>{p.age}</td>
                  <td style={{padding:8}}>
                    <button className="btn btn-ghost" onClick={() => handleEdit(p)}>Засах</button>
                    <button className="btn" onClick={() => handleDelete(p.id)} style={{marginLeft:8}} disabled={loading}>Устгах</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{width:420}}>
          <h3>{editing ? 'Хөтөлбөр засварлах' : 'Шинэ хөтөлбөр нэмэх'}</h3>
          <form onSubmit={editing ? handleUpdate : handleCreate}>
            <label style={{display:'block',marginBottom:8}}>Нэр<input name="title" value={form.title} onChange={handleChange} required /></label>
            <label style={{display:'block',marginBottom:8}}>Цаг<input name="time" value={form.time} onChange={handleChange} /></label>
            <label style={{display:'block',marginBottom:8}}>Байршил<input name="location" value={form.location} onChange={handleChange} /></label>
            <label style={{display:'block',marginBottom:8}}>Үнэ<input name="price" value={form.price} onChange={handleChange} /></label>
            <label style={{display:'block',marginBottom:8}}>Нас<input name="age" value={form.age} onChange={handleChange} /></label>

            <div style={{marginTop:12}}>
              <h4>Өдөрүүд / маршрут</h4>
              {(form.days||[]).map((d,i) => (
                <div key={i} style={{border:'1px solid #eee',padding:8,borderRadius:8,marginBottom:8}}>
                  <div style={{display:'flex',gap:8}}>
                    <input type="date" value={d.date||''} onChange={e => updateDay(i,'date', e.target.value)} style={{flex:0}} />
                    <input placeholder="Гарчиг" value={d.title||''} onChange={e => updateDay(i,'title', e.target.value)} style={{flex:1}} />
                    <button type="button" className="btn btn-ghost" onClick={() => removeDay(i)}>X</button>
                  </div>
                  <textarea placeholder="Тайлбар/үйл явдал" value={d.body||''} onChange={e => updateDay(i,'body', e.target.value)} style={{width:'100%',marginTop:8}} />
                </div>
              ))}
              <div style={{marginTop:6}}><button type="button" className="btn" onClick={addDay}>Өдөр нэмэх</button></div>
            </div>

            <div style={{display:'flex',justifyContent:'flex-end',gap:8, marginTop:12}}>
              {editing && <button type="button" className="btn btn-ghost" onClick={() => { setEditing(null); setForm(emptyForm) }}>Болих</button>}
              <button className="btn" type="submit" disabled={loading}>{editing ? 'Хадгалах' : 'Нэмэх'}</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
