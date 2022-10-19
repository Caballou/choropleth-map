async function main() {
  /*URLs de las API*/
  const mapURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json'
  const dataURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json'
  /*Request de info de mapa y datos*/
  const responses = await Promise.all([fetch(mapURL), fetch(dataURL)])

  /*Definición de variables referidas a las requests*/
  const us = await responses[0].json() /*Map info*/
  const data = await responses[1].json(); /*Education info*/

  /*Counties ordenados por ID para que concidan con la key fips de la variable data*/
  const counties = topojson.feature(us, us.objects.counties).features
    .sort( (a, b) => {
    if (a.id > b.id) {
      return 1
    }
    if (a.id < b.id) {
      return -1
    }
    return 0 
  });
 
  const stateBorders = topojson.mesh(us, us.objects.states, (a,b) => a !==b);

  /*Función de graficado*/
  graph(data, counties, stateBorders)
}

const graph = (data, counties, stateBorders) => {

  const w = 960;
  const h = 650;

  /*Escala de colores*/
  const colorScale = d3.scaleThreshold()
  .domain([3,12,21,30,39,48,57,66]) /*Porcentajes en donde cambia el color*/
  .range(["#fff7f3","#fde0dd","#fcc5c0","#fa9fb5","#f768a1","#dd3497","#ae017e","#7a0177"])

  /*Título y descripción*/
  d3.select('#title')
    .text('United States Educational Attainment')

  d3.select('#description')
    .text("Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)")

  /*Geopath*/
  const path = d3.geoPath();

  /*Tooltip*/
  const tooltip = d3.select('.grafico')
    .append('div')
    .attr('id','tooltip')
    .style("position", "absolute")
    .style("visibility", "hidden")

  /*Canvas*/
  const svg = d3.select('.grafico')
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .attr("viewBox", [0, 0, w, h])
    .attr("style", "width: 100%; height: auto; height: intrinsic;");

  /*Fuente de información*/
   svg.append('text')
    .attr('x', 585)
    .attr('y', 630)
    .attr('class', 'info')
    .html('Source: <a href="https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx" target="blank_">USDA Economic Research Service</a>')

  /*Graficado de counties + tooltip*/
  svg.append("g")
    .selectAll("path")
    .data(counties)
    .join("path")
    .attr('county-id', c => c.id)
    .attr('class', 'county')
    .attr("d", path)
    .data(data)
    .attr('data-fips', d => d.fips)
    .attr('data-education', d => d.bachelorsOrHigher)
    .attr('fill', d => colorScale(d.bachelorsOrHigher))
    .on('mouseover', d => {
      tooltip.attr('data-education', d.target.__data__.bachelorsOrHigher)
        .style('visibility', 'visible')
        .html(d.target.__data__.area_name + ', ' + d.target.__data__.state +
        ': ' + d.target.__data__.bachelorsOrHigher + '%')
    })
    .on("mousemove", (d) => {
      tooltip.style("top", (d.pageY-20)+"px").style("left",(d.pageX+30)+"px");
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
  });

  /*Legend*/
  const legendScale = d3.scaleLinear()
    .domain([3,66])
    .range([0, 250]);

  const legendAxis = d3.axisBottom(legendScale)
    .tickSize(10)
    .tickValues(colorScale.domain())
    .tickFormat(d => d + '%')

  svg.append("g")
    .attr('id', 'legend')
    .attr('transform', `translate(590,35)`)
    .call(legendAxis);

  svg.select('#legend').selectAll("rect")
    .data(colorScale.range().map((color) => {
      const d = colorScale.invertExtent(color);
      if (d[0] == null) {
        d[0] = legendScale.domain()[0]
      }
      if (d[1] == null) {
        d[1] =  legendScale.domain()[1];
      }
      return d;
    }))
    .enter().insert('rect', '.tick')
    .attr('height', 10)
    .attr('x', (d) => legendScale(d[0]))
    .attr('width', (d) => legendScale(d[1]) - legendScale(d[0]))
    .attr('fill', (d) => colorScale(d[0]));

  console.log(stateBorders)

  /*State Borders*/
  svg.append('g')
    .append('path')
    .attr('class', 'state-borders')
    .attr('d', path(stateBorders))
}