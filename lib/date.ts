
export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

export function shamsi(d = new Date()) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year:"numeric", month:"2-digit", day:"2-digit"
  }).format(d);
}
