var chartArea = d3.select("#chart_area");
var frame = chartArea.append("svg");
var canvas = frame.append("g");

//by ben to test
var yearDisplay = document.getElementById("current_year");

var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5};
var frame_width = 960;
var frame_height = 350;
var canvas_width = frame_width - margin.left - margin.right;
var canvas_height = frame_height - margin.top - margin.bottom;

frame.attr("width", frame_width);
frame.attr("height", frame_height);

canvas.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//map canvas
var map_canvas = frame.append("g");
var map_width = 300;
var map_height = 150;

var upper_x = canvas_width - map_width;
var upper_y = canvas_height - map_height;
map_canvas.attr("transform", "translate(" + upper_x + "," + upper_y + ")" ); 

map_canvas.append("rect")
	.style("fill", "lightcyan")
    .style("stroke", "black")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", map_width)
    .attr("height", map_height);


//x axis code
var xScale = d3.scale.log();
xScale.domain([250, 1e5]).range([0, canvas_width]);

//create x axis
var xAxis = d3.svg.axis().orient("bottom").scale(xScale);

// Add x-axis to canvas
canvas.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + canvas_height + ")")
	.call(xAxis);

// add x-axis label
canvas.append("text")
	.attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", canvas_width)
    .attr("y", canvas_height - 6)
    .text("income per capita, inflation-adjusted (dollars)");

//y axis code
var yScale = d3.scale.linear();
yScale.domain([10, 85]).range([canvas_height, 0]);

var yAxis = d3.svg.axis().orient("left").scale(yScale);

canvas.append("g")
	.attr("class", "y axis")
	.call(yAxis);

// Add a y-axis label.
canvas.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("life expectancy (years)");

// data point code
var dataScale = d3.scale.sqrt();
dataScale.domain([0, 5e8]).range([0, 40]);

var colorScale = d3.scale.category10();

// now add data!

var accessor = function(row){
        return {
                country: row.country,
                year: +row.year,
                pop: +row.pop,
                continent: row.continent,
                lifeExp: +row.lifeExp,
                gdpPercap: +row.gdpPercap
        };
}

d3.csv("http://emilydolson.github.io/D3-visualising-data/resources/nations.csv", accessor, function(nations) {
	var year = parseInt(document.getElementById("year_slider").value);

	var filtered_nations = nations.filter(
		function(nation) { return nation.year == 1977 }
	);

	var data_canvas = canvas.append("g")
		.attr("class", "data_canvas");

	var tooltip = d3.select("body")
		.append("div")
		.style("position", "absolute")
		.style("visibility", "hidden");

	function update() {
		var circles = data_canvas.selectAll("circle")
			.data(filtered_nations, function(d){return d.country});

		circles.enter().append("circle").attr("class", "data_point")
			.style("fill", function(d) { return colorScale(d.continent); })
			.on("mouseover", function(d){ return tooltip.style("visibility", "visible").text(d.country); })
			.on("mousemove", function(){ return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px"); })
            .on("mouseout", function(){ return tooltip.style("visibility", "hidden"); });

		circles.exit().remove();

		circles.transition().ease("linear").duration(200)
			.attr("cx", function(d) { return xScale(d.gdpPercap); })
			.attr("cy", function(d) { return yScale(d.lifeExp); })
			.attr("r", function(d) { return dataScale(d.pop); } );
		
		bind_path_events();
	}

	update();

	// check boxes
	d3.selectAll(".region_cb").on("change", function() {
		var continent = this.value;
		if (this.checked) {
			var new_nations = nations.filter(function(nation){ return nation.continent == continent;});
			filtered_nations = filtered_nations.concat(new_nations);
		} else {
			filtered_nations = filtered_nations.filter(function(nation){ return nation.continent != continent; });
		}
		update();
	});

	// slider
	d3.select("#year_slider").on("input", function () {
		year = parseInt(this.value);
		filtered_nations = nations.filter(function (nation) {

			var continent = d3.selectAll(".continent").filter(
				function(c){return c.name == nation.continent});

			if (continent.classed("unselected")){
				return(false)
			} else {
				return(nation.year == year)
			}


//			var checkbox = d3.selectAll(".region_cb")[0].filter(
//				function(cb) { return cb.value == nation.continent})[0];

//			if (checkbox.checked) {
//				return(nation.year == year);
//			} else {
//				return(false)
//			}
		})
		
		yearDisplay.innerHTML = year;

		update();
	});

	// paths
	
	function bind_path_events(){
		var line_maker = d3.svg.line();
		line_maker.x(function(d) {return (xScale(d.gdpPercap)) })
		line_maker.y(function(d) {return (yScale(d.lifeExp)) })

		data_canvas.selectAll("circle").on("click", function(nation) {
	    	if (d3.select(this).classed("clicked")){
				d3.select(this).classed("clicked", false);
				data_canvas.selectAll("path")
			    	.filter(function(d){return d[0].country==nation.country})
		    		.data([]).exit().remove();
	    	} else {
				d3.select(this).classed("clicked", true);
				var data = nations.filter(function(d){
		    		return d.country==nation.country
				});
				data = data.sort(function(a, b) {return d3.ascending(a.year, b.year)})
				data_canvas.selectAll("path")
		    		.filter(function(d){return d[0].country==nation.country})
		    		.data([data])
		    		.enter()
		    		.append("path")
		    		.attr("d", line_maker)
		    		.style("stroke", "black")
		    		.style("fill", "none")
		    		.style("stroke-width", 3);
	    	}
		});
    }

	// map

	var projection = d3.geo.equirectangular()
		.translate([(map_width/2), (map_height/2)])
		.scale( map_width / 2 / Math.PI);
    
	var path = d3.geo.path().projection(projection);

    d3.json("http://emilydolson.github.io/D3-visualising-data/resources/continents.json", function(outlines) {
    
		var continents = map_canvas.selectAll(".continent").data(outlines);
    
		continents.enter().append("path")
		    .attr("class", "continent")
		    .attr("d", path)
		    .attr("name", function(d) { return d.name; })
		    .style("fill", function(d) { return colorScale(d.name); });

		map_canvas.selectAll(".continent").on("click", function(d){
    
			if (d3.select(this).classed("unselected")){
       			//We're adding data points
       			d3.select(this).classed("unselected", false)
       
				var new_nations = nations.filter(function(nation){
           		return nation.continent == d.name && nation.year==year;});
       			filtered_nations = filtered_nations.concat(new_nations);
    		} else {
        		//we're removing data points
    			d3.select(this).classed("unselected", true)
    			filtered_nations = filtered_nations.filter(function(nation){
        		return nation.continent != d.name;});
    		};
    		
			update();
		});
	});
});
