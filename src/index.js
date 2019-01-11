import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';


class Dog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			weight: '',
			metabolic_weight: '',
			activity: '',
			energy_joules: '',
			energy_kcals: '',
			protein: '',
			calcium: '',
			vit_d: '',
		};

		this.handleChange = this.handleChange.bind(this);
	}

	calculateDailyNeeds() {
		if (!this.state.activity) this.state.activity = 1
		const met_weight = Math.pow(this.state.weight, 0.75)
		const energy = ((met_weight * 500)*this.state.activity)

		this.state = {
			metabolic_weight: met_weight,
			energy_joules: energy,
			energy_kcals: (energy * 0.238),
			calcium: (met_weight * 130),
			protein: (met_weight * 5),
			vit_d: (this.state.weight * 0.3),
		}
  }

	handleChange(event) {
    this.setState({
    	[event.target.name]: event.target.value
    });
  }

  renderInfo(){
  	return(
  		<div>
				<ul>Metabolic weight: {this.state.metabolic_weight.toFixed(2)} kg</ul>
    		<div className="needs">
    			Daily need for:
					<ul>Energy: {this.state.energy_kcals.toFixed(2)} kcal </ul>
					<ul>Protein: {this.state.protein.toFixed(2)} g </ul>
					<ul>Calcium: {this.state.calcium.toFixed(2)} mg </ul>
					<ul>Vitamin D: {this.state.vit_d.toFixed(2)} µg </ul>
    		</div>
  		</div>
  	);
  }

  render() {
		this.calculateDailyNeeds();

    return (
    	<div className="dog-info">
				<form>
	        <label>
	          Dog weight:
	        </label>
	        <input name="weight" type="number" value={this.state.weight} onChange={this.handleChange} />
	        <br />
	        <label>
	        	Activity:
	        </label>
        	<select name="activity" value={this.state.activity} onChange={this.handleChange}>
  					<option value="1">Average</option>
  					<option value="0.8">Low</option>
  					<option value="1.5">High</option>
  					<option value="2">Very high</option>
  				</select>
	      </form>

	      {this.renderInfo()}
	    </div>
    );
  }
}


class FoodPlan extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			filtered_items: [],
			initial_items: [],
			planned_items: [],
			food_components: [],
			ENERC: 0,
			PROT: 0,
			CA: 0,
			VITD: 0,
		}
		this.handleSubmit = this.handleSubmit.bind(this);
		this.filterList = this.filterList.bind(this);
	}

	fetchData(URL, array_name) {
		const API_KEY = process.env.REACT_APP_GOOGLESHEETS_APIKEY;
		URL = URL + API_KEY;
		fetch(URL).then(response => response.json()).then(data => {
			let batchRowValues = data.valueRanges[0].values;

			const rows = [];
			for (let i = 1; i < batchRowValues.length; i++) {
				let rowObject = {};
				for (let j = 0; j < batchRowValues[i].length; j++) {
					rowObject[batchRowValues[0][j]] = batchRowValues[i][j];
				}
				rows.push(rowObject);
			}
			this.setState({[array_name]: rows});
		});
	}

	componentDidMount() {
		let URL_items = "https://sheets.googleapis.com/v4/spreadsheets/1PajSCxiGVECg6KlGLYyITT3_yT-XWJxzS_rWCHernb4/values:batchGet?ranges=food&majorDimension=ROWS&key="
		this.fetchData(URL_items, "initial_items");

		let URL_components = "https://sheets.googleapis.com/v4/spreadsheets/1Ms7DM2qGxfu5r0GSe6zmG0r_wxFQvigPZrxcnU0ZsI4/values:batchGet?ranges=component_value&majorDimension=ROWS&key="
		this.fetchData(URL_components, "food_components");
	}

	filterList(event) {
		let updatedList = this.state.initial_items
		updatedList = updatedList.filter(function(item)	{
      return (!item.FOODNAME.toLowerCase().search(event.target.value.toLowerCase()) 
      	|| !item.FOODTYPE.toLowerCase().search(event.target.value.toLowerCase()));
    });
    this.setState({filtered_items: updatedList});
	}

	updateNutrient(components, nutrient){
		let nutrient_value = components.find((item) => (item.EUFDNAME === nutrient));
		let new_value = parseFloat(nutrient_value.BESTLOC.replace(",", ".")) + this.state[nutrient];
		this.setState({[nutrient]: new_value});
	}

	updateFoodComponents(id) {
		let components = this.state.food_components.filter((item)	=> (item.FOODID === id));
		let nutrients = ["ENERC", "PROT", "CA", "VITD"]
		nutrients.forEach((nutrient) => this.updateNutrient(components, nutrient));
	}

	handleSubmit(food, event) {
    let new_plan = this.state.planned_items.slice();
    new_plan.push(this.state.initial_items.find((item) => item.FOODID === food.id));
    this.updateFoodComponents(food.id);
    this.setState({planned_items: new_plan});
	}

	render() {
    return (
			<div className="food-items">
				<div className="food-plan">
					Planned foods:
					{this.state.planned_items.map((item) => 
						<ul><PlannedItem id={item.FOODID} name={item.FOODNAME} type={item.FOODTYPE} /></ul>
					)}
					<br />
					Total nutrients planned:
					<ul>Energy: {this.state.ENERC.toFixed(2)} kcal</ul>
					<ul>Protein: {this.state.PROT.toFixed(2)} g</ul>
					<ul>Calcium: {this.state.CA.toFixed(2)} mg</ul>
					<ul>Vitamin D: {this.state.VITD.toFixed(2)} ug</ul>
				</div>

				<div className="search">
					<input type="text" placeholder="Search" onChange={this.filterList}/>
					{this.state.filtered_items.map((item) =>
						<ul><FoodItem id={item.FOODID} name={item.FOODNAME} type={item.FOODTYPE} handleSubmit={this.handleSubmit} /></ul>
					)}
				</div>
	     </div>
    );
	}
}


class PlannedItem extends React.Component {
	render() {
		return(
			<div>{this.props.name.toLowerCase()}, {this.props.type.toLowerCase()}, 100g</div>
		)
	}
}

class FoodItem extends React.Component {
	render() {
		return(
			<div>
				<button onClick={(event) => this.props.handleSubmit(this.props, event)}>
					{this.props.id}, {this.props.name.toLowerCase()}, {this.props.type.toLowerCase()}
				</button>
			</div>
		);
	}
}

class Calculator extends React.Component {
  render() {
    return (
    	<div className="calculator">
        <Dog />
      	<FoodPlan />
      </div>
    )
  }
}


// ========================================

ReactDOM.render(
  <Calculator />,
  document.getElementById('root')
)
