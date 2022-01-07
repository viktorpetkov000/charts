var shouldCancel = false;
var names = [];
var dataset = [];
var datasetL = [];
var divID = "";
function create(view, colId, datasetF, namesF, filtersF) {
  names = [];
  dataset = [];
  // Pivot tables
  if (view == 'pivot') {
    if (server) {
      dataset = datasetF;
      var name = {};
      for (i = 0; i < namesF.length; i++) {
      	name.id = namesF[i];
      	name.label = namesF[i];
      	names.push(name);
      	name = {};
      }
    }
    if (!server) {
      datasetL = encodeURIComponent(JSON.stringify(datasetF));
      namesF = encodeURIComponent(namesF);
    }
    var tableID = table.length+1;
    var newTable = "table" + (table.length+1);
    table.push(newTable);
    $("#dashboard").append('\
    <div id="'+ newTable + '" class="ui-widget-content pivot">\
      <div id="drag-' + newTable + '" class="drag"></div>\
      <iframe class="ui-widget-content" src="data/pivot.html?dataset=' + datasetL + '&id=' + namesF + '" frameborder="no"></iframe>\
    </div>');
    $("#" + newTable).insertBefore("#add");
    $("#" + newTable).draggable({
      containment: $(".dhx_cell_cont_tabbar"),
      handle:'#drag-' + newTable,
      start: function(event, ui) {
        $('.dhx_chart, .pivot').not(this).css('z-index', '100');
        $(this).css('z-index', '1000');
        $('.dhx_chart, .pivot').css('pointer-events','none');
      },
      stop: function(event, ui) {
        $('.dhx_chart, .pivot').css('pointer-events','auto');
      },
      revert: function(){
        if (shouldCancel) {
          shouldCancel = false;
          return true;
        } else {
          return false;
        }
      }
    });
    $('.dhx_chart, .pivot').droppable({
      over: function(){
        shouldCancel = true;
      },
      out: function(){
        shouldCancel = false;
      }
    });
    $("#" + newTable).resizable({
      start: function(event, ui) {
        $('.dhx_chart, .pivot').css('pointer-events','none');
      },
      stop: function(event, ui) {
        $('.dhx_chart, .pivot').css('pointer-events','auto');
      }
    });
    $("#drag-" + newTable).append('<span class="delete">Delete</span>');
    $('#drag-' + newTable).on('click', '.delete', function() {
      removeTable(tableID);
    });
    noOverlap();
    createWin.close();
    return;
  }

  // Charts
  // Append a new chart element to the dashboard
  if (divID)
    if (chart.join())
      divID = (chart[chart.length-1].config.divID+1);
    else
      divID = 1;
  else
    divID = 1;
  var name = $('#chartTitleInput').val();
  $("#dashboard").append('<div id="chart' + divID + '" class="ui-widget-content"></div>');
  // Insert the chart before add element
  $("#chart" + divID).insertBefore("#add");
  // Chart title
  // Add edit button and functionality
  $("#chart" + divID).append('<b class="delete">Delete</b><b class="edit">Edit</b><div class="center"><b class="title">' + name + '</b></div>');
  $('#chart' + divID).on('click', '.edit', function() {
    edit(chartID);
  });
  $('#chart' + divID).on('click', '.delete', function() {
    remove(chartID);
  });
  $('canvas').on('click', function() {
    window.location = $('#edit' + chartID).attr('href');
    window.location = $('#delete' + chartID).attr('href');
  });
  // Create the chart
  var chartData = datasetF;
  var val = chartDataCombo.getActualValue();
  var label = chartLabelCombo.getActualValue();
  var group = chartGroupCombo.getActualValue();
  var groupFunc = chartGroupFuncCombo.getActualValue();
  var temp = chartLabelCombo.getActualValue();
  var check = $('#groupCheck').is(":checked");
  if (check && (group && groupFunc)) {
    temp = "id";
  }
  if (view == "bar" || view == "area" || view == "line") {
    chart[chart.length] = new dhtmlXChart({
      view:view,
      value:"#" + val + "#",
      container:"chart"+divID,
      xAxis:{
        template: "#" + temp + "#"
      },
      yAxis:{}
    });
  } else if (view == "barH") {
    chart[chart.length] = new dhtmlXChart({
      view:view,
      value:"#" + val + "#",
      container:"chart"+divID,
      xAxis:{},
      yAxis:{
        template: "#" + temp + "#"
      }
    });
  } else if (view == "pie" || view == "pie3D" || view == "donut") {
    chart[chart.length] = new dhtmlXChart({
      view:view,
      value:"#" + val + "#",
      container:"chart"+divID,
      legend:{
        width: 125,
        align: "right",
        valign: "middle",
        marker:{
          type: "round",
          width: 15
        },
        template: "#" + temp + "#"
      }
    });
  }
  // ChartID counting starts from 0
  // Chart name counting start from 1
  let chartID = chart.length-1;
  // Parse the chart data
  var random = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  chart[chartID].parse(chartData,"json");
  // chart[chartID].define("color", function(obj) {
  //   return random;
  // });
  chart[chartID].config.divID = divID;
  chart[chartID].config.columns = colId;
  chart[chartID].config.dataCombo = chartDataCombo.getIndexByValue(val);
  chart[chartID].config.labelCombo = chartLabelCombo.getIndexByValue(label);
  chart[chartID].config.groupCombo = chartGroupCombo.getIndexByValue(group);
  chart[chartID].config.groupFuncCombo = chartGroupFuncCombo.getIndexByValue(groupFunc);
  chart[chartID].config.check = check;
  chart[chartID].config.filters = filtersF;
  chart[chartID].config.name = name;

  if (check && (group && groupFunc)) {
    if (groupFunc == "avg") {
      chart[chartID].group({
        by:"#" + group + "#",
        map:{
          [val]:["#" + val + "#",avg]
        }
      });
    } else {
      chart[chartID].group({
        by:"#" + group + "#",
        map:{
          [val]:["#" + val + "#",groupFunc]
        }
      });
    }
  }
  noOverlap();
  createWin.close();
}

//Edit a dashboard element
function edit(id) {
  // Check the element's view type in the tree
  createTree1.setCheck(chart[id].config.view,true);
  // Get currently checked columns in tree and uncheck them
  var checked = createTree2.getAllChecked().split(",")
  for (var i = 0; i < checked.length; i++) {
    createTree2.setCheck(checked[i],false);
  }
  // Clear the filters
  for (i = 1; i < filter.length; i++) {
    for (j = 0; j < filter[i].getOptionsCount(); j++) {
      filter[i].setChecked(j, false);
    }
    filter[i].disable();
    filter[i].unSelectOption();
  }
  // Load the saved filters
  var filters = chart[id].config.filters;
  for (i = 0; i < filters.length; i++) {
    for (j = 0; j < filters[i].values.length; j++) {
      filter[filters[i].id].setChecked(filters[i].values[j], true);
    }
  }
  chartDataCombo.clearAll();
  chartLabelCombo.clearAll();
  chartGroupCombo.clearAll();
  for (var i = 0; i < chart[id].config.columns.length; i++) {
    var idC = chart[id].config.columns[i];
    createTree2.setCheck(idC,true);
    var type = createTree2.getAttribute(idC, "type");
    var name = createTree2.getAttribute(idC, "text");
    var val = createTree2.getAttribute(idC, "value");
    if (type.indexOf('number') >= 0) {
      chartDataCombo.addOption([
        [val,name]
      ])
    } else if (type.indexOf('varchar') || type.indexOf('date')) {
      chartLabelCombo.addOption([
        [val,name]
      ])
    }
    chartGroupCombo.addOption([
      [val,name]
    ])
    filter[idC].enable();
  }
  $('#chartTitleInput').val(chart[id].config.name);
  chartDataCombo.selectOption(chart[id].config.dataCombo);
  chartLabelCombo.selectOption(chart[id].config.labelCombo);
  chartGroupCombo.selectOption(chart[id].config.groupCombo);
  chartGroupFuncCombo.selectOption(chart[id].config.groupFuncCombo);
  if (chart[id].config.check){
    $('#groupCheck').prop('checked', true);
    $("#chartGroupComboDiv").css("display", "block");
    $("#chartGroupFuncComboDiv").css("display", "block");
  } else {
    $('#groupCheck').prop('checked', false);
    $("#chartGroupComboDiv").css("display", "none");
    $("#chartGroupFuncComboDiv").css("display", "none");
  }
  createWin.show();
  createWin.setModal(true);
  createWin.setText("Editing");
  $("#done").off('click');
  $('#done').on('click', function() {
    getColumnData(id);
  });
}

//Save a dashboard element
function save(view, colId, datasetF, id, filtersF) {
  var val = chartDataCombo.getActualValue();
  var label = chartLabelCombo.getActualValue();
  var group = chartGroupCombo.getActualValue();
  var groupFunc = chartGroupFuncCombo.getActualValue();
  var temp = chartLabelCombo.getActualValue();
  var name = $('#chartTitleInput').val();
  var check = $('#groupCheck').is(":checked");
  if (check && (group && groupFunc)) {
    temp = "id";
  }
  if (view == "bar" || view == "area" || view == "line") {
    chart[id].define("xAxis", {
      template: "#" + temp + "#"
    });
    chart[id].define("value", "#" + val + "#");
    chart[id].define("yAxis", {});
    chart[id].define("label",);
    chart[id].define("legend", {
      width: 0,
      align: "right",
      valign: "middle",
      marker:{
        type: "round",
        width: 15
      },
    });
  } else if (view == "barH") {
      chart[id].define("value", "#" + val + "#");
      chart[id].define("xAxis", {});
      chart[id].define("yAxis", {
        template: "#" + temp + "#"
      });
      chart[id].define("label",);
      chart[id].define("legend", {
        width: 0,
        align: "right",
        valign: "middle",
        marker:{
          type: "round",
          width: 15
        },
      });
  } else if (view == "pie" || view == "pie3D" || view == "donut") {
    chart[id].define("value", "#" + val + "#");
    chart[id].define("legend", {
      width: 125,
      align: "right",
      valign: "top",
      marker:{
        type: "round",
        width: 15
      },
      template: "#" + temp + "#"
    });
    $("options-" + divID).css("margin-right","10px");
    chart[id].define("yAxis", {});
    chart[id].define("xAxis", {});
  }
  // var random = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  // chart[id].define("color", function(obj) {
  //   return random;
  // });
  chart[id].define("view", view);
  $("#chart" + (id+1) + " .title").text(name);
  chart[id].clearAll();
  chart[id].parse(datasetF,"json");
  chart[id].config.columns = colId;
  chart[id].config.dataCombo = chartDataCombo.getIndexByValue(val);
  chart[id].config.labelCombo = chartLabelCombo.getIndexByValue(label);
  chart[id].config.groupCombo = chartGroupCombo.getIndexByValue(group);
  chart[id].config.groupFuncCombo = chartGroupFuncCombo.getIndexByValue(groupFunc);
  chart[id].config.check = check;
  chart[id].config.filters = filtersF;
  chart[id].config.name = name;
  if (check && (group && groupFunc)) {
    if (groupFunc == "avg") {
      chart[id].group({
        by:"#" + group + "#",
        map:{
          [val]:["#" + val + "#",avg]
        }
      });
    } else {
      chart[id].group({
        by:"#" + group + "#",
        map:{
          [val]:["#" + val + "#",groupFunc]
        }
      });
    }
  }
  chart[id].refresh();
  $("#done").off('click');
  $('#done').on('click', function() {
    getColumnData();
  });
  createWin.close();
}

function remove(id) {
  if (confirm("Are you sure you want to delete this chart?")) {
    $("#chart" + (id+1)).remove();
    chart.splice(id, 1);
  }
}

function removeTable(id) {
  if (confirm("Are you sure you want to delete this table?")) {
    $("#table" + id).remove();
    table.splice(id, 1);
  }
}

// Resize the charts
function resizeCharts() {
  for (var i = 0; i < chart.length; i++) {
    var height = chart[i].$view.clientHeight;
    var width = chart[i].$view.clientWidth;
    var canvas = chart[i].$view.getElementsByTagName("canvas");
    for (var j = 0; j < canvas.length; j++) {
      canvas[j].height = height;
      canvas[j].width = width;
      canvas[j].style.height = height + "px";
      canvas[j].style.width = width + "px";
    }
    chart[i].refresh();
  }
}

function avg(prop,data){
  var val = prop.slice(1, -1);
  var count = data.length;
  var summ = 0;
  for(var i = 0; i < count; i++){
    summ += parseFloat(data[i][val]);
  }
  return summ/count;
}

// Open create window and load in the function
function openCreate() {
  if (!configForm.getItemValue("cube")) {
    alert("You must first load a cube");
    return;
  }
  chartDataCombo.clearAll();
  chartDataCombo.unSelectOption();
  chartLabelCombo.clearAll();
  chartLabelCombo.unSelectOption();
  $('#groupCheck').prop('checked', false);
  $("#chartGroupComboDiv").css("display", "none");
  $("#chartGroupFuncComboDiv").css("display", "none");
  $("#chartTitleInput").val("");
  chartGroupCombo.clearAll();
  chartGroupCombo.unSelectOption();
  chartGroupFuncCombo.unSelectOption();
  createTree1.setCheck(createTree1.getAllChecked(),false);
  var checked = createTree2.getAllChecked().split(",")
  for (var i = 0; i < checked.length; i++) {
    createTree2.setCheck(checked[i],false);
  }
  createTree1.clearSelection(createTree1.getSelectedItemId());
  createWin.setText("Creating chart");
  createWin.show();
  createWin.setModal(true);
  for (i = 1; i < filter.length; i++) {
    for (j = 0; j < filter[i].getOptionsCount(); j++) {
      filter[i].setChecked(j, false);
    }
    filter[i].disable();
    filter[i].unSelectOption();
  }
  $("#done").off('click');
  $('#done').on('click', function() {
    getColumnData();
  });
}

// Resize charts on window resize
if (window.attachEvent)
  window.attachEvent("onresize",resizeCharts);
else
  window.addEventListener("resize",resizeCharts,false);

// Round numbers
function round(value, exp) {
  if (typeof exp === 'undefined' || +exp === 0)
    return Math.round(value);
  value = +value;
  exp = +exp;
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
    return "";
  value = value.toString().split('e');
  value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}

// Loading image
function loading(status) {
  if (status) {
    loginWin.setModal(true);
    document.getElementById("loading-image").style.display="block";
    document.getElementById("loading-text").style.fontSize="36px";
  } else {
    loginWin.setModal(false);
    document.getElementById("loading-image").style.display="none";
    document.getElementById("loading-text").style.fontSize="0px";
  }
}

// Make add button draggable and resizable
$(function() {
  $('#load').on('click', function() {
    if (loadCombo.getSelected())
      getDashboardConfig();
  });
  $('#groupCheck').on('click', function() {
    if ($('#groupCheck').is(":checked")) {
      $("#chartGroupComboDiv").css("display", "block");
      $("#chartGroupFuncComboDiv").css("display", "block");
    } else {
      $("#chartGroupComboDiv").css("display", "none");
      $("#chartGroupFuncComboDiv").css("display", "none");
    }
  });
  noOverlap();
});

function resizeIframe(obj) {
  obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
}

function noOverlap() {
  $('.dhx_chart').draggable({
    containment: $(".dhx_cell_cont_tabbar"),
    start: function(){
      $('.dhx_chart, .pivot').not(this).css('z-index', '100');
      $(this).css('z-index', '1000');
      $('.dhx_chart, .pivot').css('pointer-events','none');
    },
    stop: function(event, ui) {
      $('.dhx_chart, .pivot').css('pointer-events','auto');
    },
    revert: function(){
      if (shouldCancel) {
        shouldCancel = false;
        return true;
      } else {
        return false;
      }
    }
  });
  $('.dhx_chart, .pivot').droppable({
    over: function(){
      shouldCancel = true;
    },
    out: function(){
      shouldCancel = false;
    }
  });
  // Make chart resizeable
  $(".dhx_chart").resizable({
    start: function(){
      $('#dashboard').not(this).css('z-index', '100');
      $(this).css('z-index', '1000');
      $('.dhx_chart, .pivot').css('pointer-events','none');
    },
    stop: function(event, ui) {
      $('.dhx_chart, .pivot').css('pointer-events','auto');
    },
   resize: resizeCharts
  });
}

function today() {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1;
	var yyyy = today.getFullYear();
	if(dd < 10){
		dd='0'+dd;
	}
	if(mm < 10){
		mm='0'+mm;
	}
	today = yyyy+'-'+mm+'-'+dd;
	return today;
}

function dateISO() {
	var dateISO = new Date();
	var dd = dateISO.getDate();
	var mm = dateISO.getMonth()+1;
	var yyyy = dateISO.getFullYear();
	if(dd < 10){
		dd='0'+dd;
	}
	if (mm < 10){
		mm='0'+mm;
	}
	if (configForm.getCalendar("date").getFormatedDate() == today()) {
		dateISO = yyyy+"-"+mm+"-"+dd + "T00:00:00.000Z";
	} else {
		dateISO = configForm.getCalendar("date").getFormatedDate() + "T00:00:00.000Z";
	}
	return dateISO;
}

function check(id) {
  var type = createTree2.getAttribute(id, "type");
  var name = createTree2.getAttribute(id, "text");
  var val = createTree2.getAttribute(id, "value");
  if (type.indexOf('number') >= 0) {
    chartDataCombo.addOption([
      [val,name]
    ])
  } else if (type.indexOf('varchar') || type.indexOf('date')) {
    chartLabelCombo.addOption([
      [val,name]
    ])
  }
  chartGroupCombo.addOption([
    [val,name]
  ])
  filter[id].enable();
}

function uncheck(id) {
  var type = createTree2.getAttribute(id, "type");
  var name = createTree2.getAttribute(id, "text");
  var val = createTree2.getAttribute(id, "value");
  if (type.indexOf('number') >= 0) {
    chartDataCombo.deleteOption(val);
    if (chartDataCombo.getActualValue() == val)
      chartDataCombo.unSelectOption();
  } else if (type.indexOf('varchar') || type.indexOf('date')) {
    chartLabelCombo.deleteOption(val);
    if (chartLabelCombo.getActualValue() == val)
      chartLabelCombo.unSelectOption();
  }
  chartGroupCombo.deleteOption(val);
  for (i = 0; i < filter[id].getOptionsCount(); i++) {
    filter[id].setChecked(i, false);
  }
  filter[id].disable();
  filter[id].unSelectOption();
}
