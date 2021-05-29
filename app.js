document.addEventListener('DOMContentLoaded', () => {
    let educData, countyData;
    fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json')
        .then(res => res.json())
        .then(data => {
            educData = data;
            fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json')
                .then(res => res.json())
                .then(data => {
                    countyData = data;
                    createViz(educData, countyData);
                })
        });
});

function createViz(educData, countyData) {
    console.log(educData, countyData);

    const colors = ["#bcdff5", "#a2d3f2", "#80c6f2", "#68bdf2", "#4eb0ed", "#189bed", "#0a7dc4", "#00619e"];
    const values = [3, 12, 21, 30, 39, 48, 57, 66];

    const container = d3.select('#container');

    const width = 960;
    const height = 600;

    const path = d3.geoPath();

    const svg = container.append('svg')
                         .attr('width', width)
                         .attr('height', height);

    const tooltip = container.append('div')
                             .attr('id', 'tooltip')
                             .style('opacity', 0);

    const colorScale = d3.scaleQuantize()
                         .range(colors);
    
    colorScale.domain([0, d3.max(educData.map(obj => obj.bachelorsOrHigher))]);

    const legendBoxWidth = 28;
    const legendScale = d3.scaleBand().domain([...values, 100]).rangeRound([0, legendBoxWidth * (colors.length + 1)]);
    const legendAxis = d3.axisBottom(legendScale).tickSizeOuter(0).tickFormat(d => d + "%");

    const legend = svg.append('g')
                      .attr('id', 'legend')
                      .call(legendAxis)
                      .attr('transform', 'translate(600, 50)');

    legend.selectAll('rect')
          .data(values)
          .enter()
          .append('rect')
          .attr('width', legendBoxWidth + 'px')
          .attr('height', legendBoxWidth + 'px')
          .attr('x', (d, i) => i * legendBoxWidth + 13)
          .attr('y', "-" + legendBoxWidth)
          .attr('fill', (d, i) => colors[i]);
    let topojsonData = topojson.feature(countyData, countyData.objects.counties).features;
    svg.selectAll('path')
       .data([topojsonData[0], ...topojsonData])
       .enter()
       .append('path')
       .attr('d', path)
       .attr('class', 'county')
       .attr('fill', (d, i) => {
           let res = educData.filter(obj => obj.fips === d.id);
           return colorScale(res[0].bachelorsOrHigher);
       })
       .attr("data-fips", d => d.id)
       .attr("data-education", d => {
         let res = educData.filter(obj => obj.fips === d.id);
         if (res[0]) {
           return res[0].bachelorsOrHigher;
         }
         return 0;
       })
       .on('mouseover', (d, i) => {
           tooltip.style('opacity', 0.9)
                  .attr('data-education', () => {
                        let res = educData.filter(obj => obj.fips === d.id);
                        if (res[0]) {
                          return res[0].bachelorsOrHigher;
                        }
                        return 0;
                  })
                  .text(() => {
                      let res = educData.filter(obj => obj.fips === d.id);
                      if (res[0]) {
                        return `${res[0].area_name}, ${res[0].state}: ${res[0].bachelorsOrHigher}%`
                      }
                      return 0;
                  })
                  .style('left', d3.event.pageX + 15 + 'px')
                  .style('top', d3.event.pageY - 30 + 'px');
       })
       .on('mouseout', () => {
           tooltip.style('opacity', 0);
       })

    svg.append('path')
       .datum(
            topojson.mesh(countyData, countyData.objects.states, (a, b) => a !== b))
       .attr('class', 'states')
       .attr('d', path);
}
