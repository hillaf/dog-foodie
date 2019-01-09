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

	handleChange(event) {
    this.setState({
    	[event.target.name]: event.target.value
    });
  }

  handleSubmit(event) {
    event.preventDefault();
  }

  renderInfo(){
  	this.calculateDailyNeeds();
  	return(
  		<div>
    		<ul>Metabolic weight: {this.state.metabolic_weight} kg</ul>
    		<div className="needs">
    			Daily need for:
	    		<ul>Energy: {this.state.energy_kcals} kcal </ul>
	    		<ul>Protein: {this.state.protein} g </ul>
	    		<ul>Calcium: {this.state.calcium} mg </ul>
	    		<ul>Vitamin D: {this.state.vit_d} µg </ul>
    		</div>
  		</div>
  	);
  }

  render() {
    return (
    	<div className="dog-info">
				<form onSubmit={this.handleSubmit}>
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

  calculateDailyNeeds(){
  	if (this.state.activity == null) this.state.activity = 1
  	const met_weight = Math.pow(this.state.weight, 0.75).toFixed(2)
  	const energy = ((met_weight * 500)*this.state.activity).toFixed(2)
  	console.log(energy)
  	console.log(this.state.activity)

  	this.state = {
  		metabolic_weight: met_weight,
  		energy_joules: energy,
  		energy_kcals: (energy * 0.238).toFixed(2),
  		calcium: (met_weight * 130).toFixed(2), 
  		protein: (met_weight * 5).toFixed(2),
  		vit_d: (this.state.weight * 0.3).toFixed(2),
  	}
  }
}


class FoodPlan extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			items: [],
			initial_items: [],
			planned_items: [],
			food_components: [],
		}
		this.handleSubmit = this.handleSubmit.bind(this);
		this.filterList = this.filterList.bind(this);
	}

	filterList(event) {
		var updatedList = this.state.initial_items;
		updatedList = updatedList.filter(function(item)	{
      return (!item.props.name.search(event.target.value.toLowerCase()) 
      	|| !item.props.type.search(event.target.value.toLowerCase()));
    });
    this.setState({items: updatedList});
	}

	componentDidMount(){
		const API_KEY = process.env.REACT_APP_GOOGLESHEETS_APIKEY;
		var API = "https://sheets.googleapis.com/v4/spreadsheets/1PajSCxiGVECg6KlGLYyITT3_yT-XWJxzS_rWCHernb4/values:batchGet?ranges=food&majorDimension=ROWS&key="+API_KEY
		fetch(API).then(response => response.json()).then(data => {
			let batchRowValues = data.valueRanges[0].values;

			const rows = [];
			for (let i = 1; i < batchRowValues.length; i++) {
				let rowObject = {};
				for (let j = 0; j < batchRowValues[i].length; j++) {
					rowObject[batchRowValues[0][j]] = batchRowValues[i][j];
				}
				rows.push(<FoodItem id={rowObject.FOODID} name={rowObject.FOODNAME.toLowerCase()} type={rowObject.FOODTYPE.toLowerCase()} handleSubmit={this.handleSubmit} />);
			}
			this.setState({initial_items: rows});
		});

		API = "https://sheets.googleapis.com/v4/spreadsheets/1Ms7DM2qGxfu5r0GSe6zmG0r_wxFQvigPZrxcnU0ZsI4/values:batchGet?ranges=component_value&majorDimension=ROWS&key="+API_KEY
		fetch(API).then(response => response.json()).then(data => {
			let batchRowValues = data.valueRanges[0].values;

			const rows = [];
			for (let i = 1; i < batchRowValues.length; i++) {
				let rowObject = {};
				for (let j = 0; j < batchRowValues[i].length; j++) {
					rowObject[batchRowValues[0][j]] = batchRowValues[i][j];
					rows.push(rowObject);
				}
			}
			this.setState({food_components: rows});
			console.log(this.state.food_components)
		});

	}

	getFoodComponents(id){
		var components = this.state.food_components;
		components = components.filter(function(item)	{
      return (!item.FOODID.search(id));
    });
    // TODO: pull relevant components from the rows found
    return 100
	}

	handleSubmit(food, event){
    var new_plan = this.state.planned_items.slice();
    // TODO: fetch other components too
    const energy = this.getFoodComponents(food.id)
    console.log(energy)
    new_plan.push(<FoodItem id={food.id} name={food.name} type={food.type} handleSubmit={this.handleSubmit} energy={energy}/>);
    this.setState({planned_items: new_plan})
	}

	render() {
		const planned = this.state.planned_items.map((item) =>
			<ul>{item.props.id}, {item.props.name}, {item.props.type}, {item.props.energy} kcal/100 g</ul>
		);

    return (
			<div className="food-items">
				<div className="food-plan">
					Planned foods:
					<ul>{planned}</ul>
				</div>
				<div className="search">
					<input type="text" placeholder="Search" onChange={this.filterList}/>
					<ul>{this.state.items}</ul>
				</div>
	     </div>
    );
	}
}


class FoodItem extends React.Component {
	render() {
		return(
			<div>
				<button onClick={(event) => this.props.handleSubmit(this.props, event)}>
					{this.props.id}, {this.props.name}, {this.props.type}
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
