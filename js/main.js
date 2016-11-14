
d3.json('beers.json', function (error, data) {
  cleanUp(data);
  defineCharts(data);
  registerHandlers();
  drawCharts();
});

/* normalize/parse data so dc can correctly sort & bin them */
function cleanUp(data) {
  var fullDateFormat = d3.time.format('%a, %d %b %Y %X %Z');
  var yearFormat = d3.time.format('%Y');
  var monthFormat = d3.time.format('%b');
  var dayOfWeekFormat = d3.time.format('%a');

  // I like to think of each "d" as a row in a spreadsheet
  data.beers.forEach(function(d) {
    d.count = +d.count; // + casts string to float
    // round to nearest 0.25 to force binning (makes it look nice)
    d.rating_score = Math.round(+d.rating_score * 4) / 4;
    d.beer.rating_score = Math.round(+d.beer.rating_score * 4) / 4;
    d.beer.beer_abv = Math.round(+d.beer.beer_abv * 2) / 2;
    d.beer.beer_ibu = Math.floor(+d.beer.beer_ibu / 10) * 10;
    d.first_had_dt = fullDateFormat.parse(d.first_had);
    d.first_had_year = +yearFormat(d.first_had_dt);
    d.first_had_month = monthFormat(d.first_had_dt);
    d.first_had_day = dayOfWeekFormat(d.first_had_dt);
  });
}

function registerHandlers() {
  d3.selectAll('a#all').on('click', function () {
    dc.filterAll();
    dc.renderAll();
  });
}

function defineCharts(data) {
  var ndx = crossfilter(data.beers);

  // create dimensions (x-axis values)
  var yearDim = ndx.dimension(function(d) {return d.first_had_year;}),
      // dc.pluck: short-hand for same kind of anon. function we used for yearDim
      monthDim  = ndx.dimension(dc.pluck('first_had_month')),
      dayOfWeekDim = ndx.dimension(dc.pluck('first_had_day')),
      ratingDim = ndx.dimension(dc.pluck('rating_score')),
      commRatingDim = ndx.dimension(function(d) {return d.beer.rating_score;}),
      abvDim = ndx.dimension(function(d) {return d.beer.beer_abv;}),
      ibuDim = ndx.dimension(function(d) {return d.beer.beer_ibu;}),
      allDim = ndx.dimension(function(d) {return d;});

  // create groups (y-axis values)
  var all = ndx.groupAll();
  var countPerYear = yearDim.group().reduceCount(),
      countPerMonth = monthDim.group().reduceCount(),
      countPerDay = dayOfWeekDim.group().reduceCount(),
      countPerRating = ratingDim.group().reduceCount(),
      countPerABV = abvDim.group().reduceCount(),
      countPerIBU = ibuDim.group().reduceCount();

  // specify charts
  var yearChart   = dc.pieChart('#years'),
      monthChart   = dc.pieChart('#months'),
      dayChart   = dc.pieChart('#days'),
      ratingChart  = dc.barChart('#ratings'),
      abvChart  = dc.barChart('#abvs'),
      ibuChart  = dc.barChart('#ibus'),
      dataCount = dc.dataCount('#data-count')
      dataTable = dc.dataTable('#data-table');

  var pieSize = 200;
  var chartWidth = 330;
  var chartHeight = 200;

  yearChart
    .height(pieSize)
    .width(pieSize)
    .dimension(yearDim)
    .group(countPerYear)
    .innerRadius(20);

  monthChart
    .height(pieSize)
    .width(pieSize)
    .dimension(monthDim)
    .group(countPerMonth)
    .innerRadius(20)
    .ordering(function (d) {
      var order = {
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
        'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
        'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
      };
      return order[d.key];
    });

  dayChart
    .height(pieSize)
    .width(pieSize)
    .dimension(dayOfWeekDim)
    .group(countPerDay)
    .innerRadius(20)
    .ordering(function (d) {
      var order = {
        'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3,
        'Fri': 4, 'Sat': 5, 'Sun': 6
      }
      return order[d.key];
    }
   );

  ratingChart
    .width(chartWidth)
    .height(chartHeight)
    .dimension(ratingDim)
    .group(countPerRating)
    .x(d3.scale.linear().domain([0,5.2]))
    .elasticY(true)
    .centerBar(true)
    .barPadding(5)
    .xAxisLabel('My rating')
    .yAxisLabel('Count')
    .margins({top: 10, right: 20, bottom: 50, left: 50});
  ratingChart.xAxis().tickValues([0, 1, 2, 3, 4, 5]);

  abvChart
    .width(chartWidth)
    .height(chartHeight)
    .dimension(abvDim)
    .group(countPerABV)
    .x(d3.scale.linear().domain([-0.2, d3.max(data.beers, function (d) { return d.beer.beer_abv; }) + 0.2]))
    .elasticY(true)
    .centerBar(true)
    .barPadding(2)
    .xAxisLabel('Alcohol By Volume (%)')
    .yAxisLabel('Count')
    .margins({top: 10, right: 20, bottom: 50, left: 50});

  ibuChart
    .width(chartWidth)
    .height(chartHeight)
    .dimension(ibuDim)
    .group(countPerIBU)
    .x(d3.scale.linear().domain([-2, d3.max(data.beers, function (d) { return d.beer.beer_ibu; }) + 2]))
    .elasticY(true)
    .centerBar(true)
    .barPadding(5)
    .xAxisLabel('International Bitterness Units')
    .yAxisLabel('Count')
    .xUnits(function (d) { return 5;})
    .margins({top: 10, right: 20, bottom: 50, left: 50});

    dataTable
   .dimension(allDim)
   .group(function (d) { return 'dc.js insists on putting a row here so I remove it using JS'; })
   .columns([
     function (d) { return d.brewery.brewery_name; },
     function (d) { return d.beer.beer_name; },
     function (d) { return d.beer.beer_style; },
     function (d) { return d.rating_score; },
     function (d) { return d.beer.rating_score; },
     function (d) { return d.beer.beer_abv; },
     function (d) { return d.beer.beer_ibu; }
   ])
   .sortBy(dc.pluck('rating_score'))
   .order(d3.descending)
   .size(Infinity)
   .on('renderlet', function (table) {
     // each time table is rendered remove nasty extra row dc.js insists on adding
     table.select('tr.dc-table-group').remove();
   });

  dataCount
    .dimension(ndx)
    .group(all);
}

function drawCharts() {
  dc.renderAll();
}
