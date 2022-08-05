const pad = (n) => n.toString().padStart(2, "0");

const printStop = (s) => {
  const a = s.arrivalTime;
  const pa = s.plannedArrivalTime;
  const d = s.departureTime;
  const pd = s.plannedDepartureTime;
  const aas = a ? `${pad(a.hour)}:${pad(a.minute)}` : "--:--";
  const pas = pa ? `${pad(pa.hour)}:${pad(pa.minute)}` : "--:--";
  const ads = d ? `${pad(d.hour)}:${pad(d.minute)}` : "--:--";
  const pds = pd ? `${pad(pd.hour)}:${pad(pd.minute)}` : "--:--";

  const as = `${pas}->${aas}`;
  const ds = `${pds}->${ads}`;
  console.log(s.category, s.line || s.number, as, ds, s.name);
};

export default printStop;
