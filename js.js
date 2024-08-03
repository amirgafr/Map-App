
const form = document.querySelector('.form');
const form__input__type = document.querySelector('.form__input--type');
const form__input__cadence = document.querySelector('.form__input--cadence');
const form__input__Elev = document.querySelector('.form__input--Elev');
const form__input__duration = document.querySelector('.form__input--duration');
const form__input__distance = document.querySelector('.form__input--distance');
const workouts_btn = document.querySelector('.workouts-btn');
const slider = document.querySelector('.slider');



const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August','September', 'October', 'November', 'December']
class Workout {
  date = new Date();
  id = (Date.now()+'').slice(-10)
  constructor(coords, distance, duration){
    this.coords = coords; //[at,lng]
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends Workout{
  type = 'running'
  constructor(coords, distance, duration,cadence){
    super(coords, distance, duration)
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();

  }
  calcPace(){
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout{
  type = 'cycling'
  constructor(coords, distance, duration,elevationGain){
    super(coords, distance, duration)
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();

  }
  calcSpeed(){
    this.speed =  this.distance / (this.duration / 60);
    return this.speed;
  }
}



class App{
  #map;
  #mapEvent;
  #workouts = [];
  constructor(){
    this._getPosition();
    this._getLocalStorage()
    form.addEventListener('submit',this._newWorkout.bind(this))
    form__input__type.addEventListener('change',this._toggleElvationField)
  }
  _getPosition(){
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this));
    } else {
      // Geolocation is not supported by the browser
      console.error("Geolocation is not supported by this browser.");
    }
  }
  _loadMap(position){
    
      // Get our latitude and longitude coordinates
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const coords = [latitude,longitude]
      // Do something with the location data, e.g. display on a map
      console.log(this);
       this.#map = L.map('map').setView(coords, 13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.#map);
            this.#map.on('click',this._showForm.bind(this));
            this.#workouts.forEach(work=>{
            this._renderWorkoutMarker(work)
          })
  }
  _showForm(mapE){
    this.#mapEvent = mapE;
    form.classList.remove('hidden')
  }
  _toggleElvationField(){
    form__input__Elev.closest('.form__row').classList.toggle('input__hidden')
    form__input__cadence.closest('.form__row').classList.toggle('input__hidden')
  }
  _hideForm(){
    form__input__duration.value = form__input__distance.value = form__input__cadence.value = form__input__Elev.value = '';
    form.classList.add('hidden');
  }
  _newWorkout(e){
        e.preventDefault();
        // get data from form 
        const type = form__input__type.value;
        const distance = +form__input__distance.value;
        const duration = +form__input__duration.value;
        const {lat , lng} = this.#mapEvent.latlng;
        let workout;

        const validInputs = (...inputs)=> inputs.every(inp => Number.isFinite(inp))
        const allPostive = (...inputs)=> inputs.every(inp => inp > 0)

        // if type running 
        if(type === 'running'){
          const cadence = +form__input__cadence.value;
          // cheak if data is valid 
          if(!validInputs(distance,duration,cadence) || !allPostive(distance,duration,cadence)) return alert('Inputs must be postive');
           workout = new Running([lat,lng],distance,duration,cadence);
        }
        // if type cycling 
        if(type === 'cycling'){
          const elevation = +form__input__Elev.value;
          if(!validInputs(distance,duration,elevation) || !allPostive(distance,duration,elevation)) return alert('Inputs must be postive');
          workout = new Cycling([lat,lng],distance,duration,elevation);
        }
        // add new object to worjout array 
        this.#workouts.push(workout)
        this._hideForm();
        this._renderWorkoutMarker(workout);
        this._rederWorkOut(workout)
        this._setLocalStorage()
        
  }
  _renderWorkoutMarker(workout){
    L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
          maxWidth:250,
          minWidth:100,
          autoClose: false,
          closeOnClick: false,
          className:`${workout.type}-popup`
        })
        )
        .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
        .openPopup();
  }
  _rederWorkOut(workout){
    let html = `
      <li class="workout workout--${workout.type}" data-id=${workout.id}>
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
      </div>
      `;
  
  if (workout.type === 'running')
    html += `

      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
      </div>
      </li>`;

  if (workout.type === 'cycling')
    html += `
    <div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.speed.toFixed(1)}</span>
    <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
    <span class="workout__icon">⛰</span>
    <span class="workout__value">${workout.elevationGain}</span>
    <span class="workout__unit">m</span>
    </div>
    </li>

`;
  form.insertAdjacentHTML('afterend', html);

  }
  _setLocalStorage(){
    localStorage.setItem('workouts',JSON.stringify(this.#workouts))
  }
  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workouts'));
    this.#workouts = data
    this.#workouts.forEach(work=>{
      this._rederWorkOut(work);
    })
    
  }

}


  const app = new App()

