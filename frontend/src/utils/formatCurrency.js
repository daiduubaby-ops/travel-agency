// helper to format amounts in Mongolian Tögrög (₮)
export default function formatMNT(value){
  // normalize input to number
  const n = Number(value) || 0
  try{
    // Use Intl when available to get proper grouping and currency symbol
    return new Intl.NumberFormat('mn-MN', { style: 'currency', currency: 'MNT', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(n)
  }catch(e){
    // fallback: simple grouping with space as thousands separator and trailing ₮
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₮'
  }
}
