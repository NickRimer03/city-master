import { getRandom, degToDMS, firstLetterUp, getDistance } from "./utils";

export default class Game {
  constructor({ cityList }) {
    this.timeout = null;
    this.TIMEOUT = 20000;
    this.totalDistance = { bot: 0, hero: 0 };
    this.cityList = cityList;
    this.startCity = this.getRandomCity();
    this.currentCity = this.startCity;
    this.currentCoords = { la: this.startCity.la, lo: this.startCity.lo };
    this.nextStartLetter = this.getStartLetter(this.getNameRu(this.startCity));
    this.namedCities = [this.startCity];
    this.isBotTurn = false;
  }

  getRandomCity() {
    return this.cityList[getRandom(0, this.cityList.length - 1)];
  }

  getCity(cityname) {
    return this.cityList.filter(({ a }) => a.includes(cityname));
  }

  getCurrentCoords() {
    const { la, lo } = this.currentCoords;
    const laText = la >= 0 ? "с.ш." : "ю.ш.";
    const loText = lo >= 0 ? "в.д." : "з.д.";
    const { d: dla, m: mla, s: sla } = degToDMS(Math.abs(la));
    const { d: dlo, m: mlo, s: slo } = degToDMS(Math.abs(lo));

    return `${dla}°${mla}′${Math.round(sla)}″ ${laText}, ${dlo}°${mlo}′${Math.round(slo)}″ ${loText}`;
  }

  getNameRu(city) {
    return firstLetterUp(city.a[0]);
  }

  getStartLetter(cityname) {
    const forbidden = ["ь", "ъ", "ы", " ", "-", "'"];
    let i = 1;
    let lastLetter = "";
    do {
      lastLetter = cityname[cityname.length - i++];
    } while (forbidden.includes(lastLetter));

    return lastLetter.toUpperCase();
  }

  checkCity({ usercity }) {
    if (usercity[0] === this.nextStartLetter.toLowerCase()) {
      const cities = this.getCity(usercity);
      if (cities.length) {
        if (!this.namedCities.includes(usercity)) {
          this.namedCities.push(usercity);
          const distances = [];
          cities.forEach(city => {
            distances.push(getDistance(this.currentCoords.la, this.currentCoords.lo, city.la, city.lo));
          });
          const rootDistance = Math.min(...distances);
          const rootCity = cities[distances.indexOf(rootDistance)];
          this.totalDistance.hero += rootDistance;
          this.nextStartLetter = this.getStartLetter(usercity);
          this.currentCoords = { la: rootCity.la, lo: rootCity.lo };
          this.currentCity = rootCity;
          return { result: "ok", cities: cities.length, dist: rootDistance };
        } else {
          return { result: "already-named" };
        }
      } else {
        return { result: "city-not-found" };
      }
    } else {
      return { result: "first-letter-error" };
    }
  }

  botTurn() {
    this.isBotTurn = true;

    let cityname = "";
    let city = null;
    do {
      city = this.getRandomCity();
      cityname = city.a[0];
    } while (cityname[0] !== this.nextStartLetter.toLowerCase() || this.namedCities.includes(cityname));
    const distance = getDistance(this.currentCoords.la, this.currentCoords.lo, city.la, city.lo);
    this.namedCities.push(cityname);
    this.totalDistance.bot += distance;
    this.nextStartLetter = this.getStartLetter(cityname);
    this.currentCoords = { la: city.la, lo: city.lo };
    this.currentCity = city;

    return { cityname, distance };
  }
}
