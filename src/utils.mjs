export function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function degToDMS(deg) {
  const d = Math.trunc(deg);
  const m = Math.trunc((deg - d) * 60);

  return { d, m, s: ((deg - d) * 60 - m) * 60 };
}

export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

export function firstLetterUp(string) {
  return string[0].toUpperCase() + string.slice(1);
}

export function getDistance(oldLa, oldLo, newLa, newLo) {
  const ola = degToRad(oldLa);
  const nla = degToRad(newLa);

  return (
    6371 *
    Math.acos(
      Math.sin(ola) * Math.sin(nla) + Math.cos(ola) * Math.cos(nla) * Math.cos(degToRad(oldLo) - degToRad(newLo))
    )
  );
}
