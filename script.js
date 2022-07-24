'use strict';
//not needed
// let map,mapEvent;

//refactoring architecture
class Workout{
    date = new Date();
    id = (Date.now()+'').slice(-10);
    clickCounter=0;
    constructor(coords,distance,duration)
    {
        this.coords = coords;// [lat,lng]
        this.distance = distance;//km
        this.duration = duration;//min
    }
    _dateForm()
    {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July','August', 'September', 'October', 'November', 'December'];
        
        this.displayDate = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
            months[this.date.getMonth()]
          } ${this.date.getDate()}`;
    }
    clicks()
    {
        this.clickCounter++;
    }
}

class Running extends Workout{
    type = 'running';
    constructor(coords,distance,duration,cadence)
    {
        super(coords,distance,duration);
        this.cadence = cadence;
        this.calcPace();
        this._dateForm();
    }
    calcPace()
    {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout{
    type = 'cycling';
    constructor(coords,distance,duration,elevationGain)
    {
        super(coords,distance,duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._dateForm();
    }
    calcSpeed()
    {
        // km/min
        this.speed = this.distance / (this.duration/60);
        return this.speed;
    }
}
// const run = new Running([39 , -12] , 5.2 , 24 , 178);
// const cycle = new Cycling([39 , -12] , 27 , 95 , 523);
// console.log(run , cycle);
/*==================================================================================== */

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let chooseInput;
let icon;
/*Application Architecture */
//class App contain main method of app
class App{
    #map;
    #mapEvent;
    #workout = [];
    #zoomLevel=13;
    //note that constructor called with create of instance
    //executed with page load
    constructor(){
        //get user's position
        this._getPosition();
        //get data from local storage
        this._getLocalStorage();
        //event handler
        form.addEventListener('submit',this._newWorkout.bind(this));
        inputType.addEventListener('change',this._toggleEventElevation);
        containerWorkouts.addEventListener('click',this._moveToclickedWorkout.bind(this));
    }
    /*PUBLIC INTERFACE*/
    _getPosition(){
        //get your location latitude
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
            //lose function
            function () {
              alert(`couldn't get your location`);
            }
          );
    }
    _loadMap(position){
           //success function
            //   console.log(position);
              const { latitude } = position.coords;
              const { longitude } = position.coords;
            //   console.log(latitude, longitude);
            //   console.log(
            //     `https://www.google.com.eg/maps/@${latitude},${longitude},13z?hl=en&authuser=0`
            //   );
        
              //leaflet fn to map
              this.#map = L.map("map").setView([latitude, longitude], this.#zoomLevel);
            //   console.log(map);
              L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
                attribution:
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              }).addTo(this.#map);
              
              //marker clicked position by on()
              this.#map.on('click',this._showForm.bind(this));   
              //render marker on loading page
              this.#workout.forEach((workout)=>
              {
                  //using refactor
                  this._renderWorkoutMarker(workout);
                  //you won't need to dispaly workouts div on loading because its render before loading
                  //this._renderWorkout(workout);
              });
    }
    _showForm(mapE){
        this.#mapEvent = mapE
        form.classList.remove('hidden');
        inputDistance.focus();
        // console.log(this.#mapEvent);
    }
    _toggleEventElevation(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e){
        e.preventDefault();
        //get data from form 
        const validInputs = (...inputs)=>
        inputs.every(input=>Number.isFinite(input));
        const isPositive = (...inputs) =>
        inputs.every(input => input>0);

        const typeValue = inputType.value;
        const distanceValue = +inputDistance.value;
        const durationValue = +inputDuration.value;
        const {lat,lng} =this.#mapEvent.latlng;
        let workout;
        //if workout running ,create running object
        if(typeValue === 'running')
        {
            const cadenceValue = +inputCadence.value;
            //check data is valid //!Number.isFinite(distanceValue) ||!Number.isFinite(durationValue) ||!Number.isFinite(cadenceValue)
             if(!validInputs(distanceValue,durationValue,cadenceValue)
              ||!isPositive(distanceValue,durationValue,cadenceValue) )
                {
                    return alert('Input have to positive number');
                }
                workout = new Running([lat,lng],distanceValue,durationValue,cadenceValue)
        }
        //if workout cycling ,create cycling object
        if(typeValue === 'cycling')
        {
            const elevationValue = +inputElevation.value;
               //check data is valid
               if(!validInputs(distanceValue,durationValue,elevationValue)
                    ||!isPositive(distanceValue,durationValue))
               {
                   return alert('Input have to positive number');
               }
               workout = new Cycling([lat,lng],distanceValue,durationValue,elevationValue);
        }

        //add new object to workout array
        this.#workout.push(workout);
        // console.log(this.#workout);

        //render workout marker on map
        this._renderWorkoutMarker(workout);

        //render workout on list
       this._renderWorkout(workout);

       //clear values + hide form
       this._hideForm();
       //set local storage to all workouts
       this._setLocalStorage();
    }

    _renderWorkoutMarker(workout)
    {
        L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth:250,
            minWidth:100,
            autoClose:false,
            closeOnClick:false,
            className:`${workout.type}-popup`
        }))
        .setPopupContent(`${workout.type === 'running'?'🏃‍♂️':'🚴‍♀️'} ${workout.displayDate}`)
        .openPopup();
    }
    _renderWorkout(workout)
    {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            
            <h2 class="workout__title">${workout.displayDate}</h2>
            <i class="fa fa-angle-double-down icon" style="font-size:24px"></i>
            <div class="choose__input form__row--hidden">
            <div class="edit">Edit</div>
            <div class="delete">Delete</div>
            </div>
            <div class="workout__details">
              <span class="workout__icon">${workout.type === 'running'?'🏃‍♂️':'🚴‍♀️'}</span>
              <span class="workout__value">${workout.distance}</span>
              <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
            `;
        if(workout.type === 'running')
        {
            html+=
            `  <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
            </li>
            `
        }
        if(workout.type === 'cycling')
        {
            html+=
            `  <div class="workout__details">
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
            `
        }
        form.insertAdjacentHTML('afterend',html);
         chooseInput = document.querySelector('.choose__input');
         icon = document.querySelector('.icon');
         icon.addEventListener('click',this._renderEditList);
    }
    _renderEditList(e)
    {
        const clickedWorkout = e.target.closest('.workout');
        console.log(clickedWorkout.querySelector('.choose__input'));
        clickedWorkout.querySelector('.choose__input').classList.toggle('form__row--hidden');  
    }
    _hideForm()
    {
        inputCadence.value = inputDistance.value=inputDuration.value=inputElevation.value='';
        // form.style.display='none';
        form.classList.add('hidden');
        // setTimeout(()=>form.style.display='grid',1000);
    }
    _moveToclickedWorkout(e)
    {
        const clickedWorkout = e.target.closest('.workout');
        //  console.log(clickedWorkout);
        //  console.log(e.target);
        if(!clickedWorkout) return;
        const workout = this.#workout.find(
            work=> work.id === clickedWorkout.dataset.id
        );
        // console.log(workout);
        this.#map.setView(workout.coords , this.#zoomLevel , 
            {
                animation:true,
                pin:{
                    duration:1,
                },
            });
            /*comment this method because lost when data returned 
            from localStorage becuase of prototype chain lost*/
        // workout.clicks();
    }
    _setLocalStorage()
    {
        localStorage['workouts'] = JSON.stringify(this.#workout);
    }
    _getLocalStorage()
    {
        const data = JSON.parse(localStorage.getItem('workouts'));
        //if condition => in first time load page
        if(!data) return;
        this.#workout = data;
        this.#workout.forEach((workout)=>
        {
            //using refactor
            this._renderWorkout(workout);
            //you can't render marker before page loaded its error(async behavior)
            // this._renderWorkoutMarker(workout);
        });
    }
    //remove data from local storage => will used with instance in console
    _removeLocalStorage()
    {
        localStorage.removeItem('workouts');
        location.reload();
    }

}
const app = new App();
