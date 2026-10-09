
export function absenceLevel(count:number){
  if(count>=5) return "high";
  if(count>=3) return "medium";
  return "low";
}
export function absenceLabel(count:number){
  if(count>=5) return "هشدار";
  if(count>=3) return "نیاز به توجه";
  return "عادی";
}
