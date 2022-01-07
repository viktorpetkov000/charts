var loginFormData = [
  {type:"settings",position:"label-left", labelWidth:60, inputWidth:150},
  {type:"combo", name:'user', label:'User:', readonly:"true", options:[]},
  {type:"password", name:"pass", label:"Password:"},
  {type:"combo", name:"domain", label:"Domain:", readonly:"true", options:[]},
  {type:"button", name:"login", value:"Login"}
]
var chart1Data = [
    {nav:"51.65",fv:"50.71",var:"6.28"},
];

var chart2Data = [
  {percent:"6.9%", type:"Option on Share", color:"#00CC00"},
  {percent:"13.6%", type:"Contract for Diff...", color:"#66FFFF"},
  {percent:"23.6%", type:"FX-Outright", color:"#66B2FF"},
  {percent:"38.7%", type:"Komplex_R", color:"#000099"},
]

var configFormData = [
  {type:"block", offsetTop:15, list:[
    {type: "label", label: "Dashboard Settings", labelWidth:220, offsetLeft: 80},
    {type:"settings", position:"label-left", inputWidth:220, labelWidth:50},
    {type:"combo", name:"portfolio", label:"Portfolio:", readonly:"true", options:[]},
    {type:"combo", name:"cube", label:"Cube:", readonly:"true", options:[]},
    {type:"calendar", name:"date", label:"Date:", readonly:"true"},
    // {type:"button", name:"loadcube", value:"Load Cube", position:"absolute", inputLeft:65, inputTop:100, width:80},
    // {type:"button", name:"calculate", value:"Calculate", position:"absolute", inputLeft:170, inputTop:100, width:80}
  ]},
]

var chartConfigFormData = [
  {type:"combo", name:"data", label:"Chart Data:", readonly:"true", options:[]},
  {type:"combo", name:"label", label:"Chart Label:", readonly:"true", options:[]},
  {type: "checkbox", name:"groupcheck", label: "Chart Group:", checked: false, list:[
    {type:"combo", name:"group", label:"Group by:", readonly:"true", options:[]},
    {type:"combo", name:"func", label:"Function:", readonly:"true", options:[
      {text:"Sum", value:"sum"},
      {text:"Avg", value:"avg"},
      {text:"Min", value:"min"},
      {text:"Max", value:"max"}
    ]},
  ]},
]

var treeForm1 = {
  id:0,
  item:[
    {id:"area",text:"Area Chart"},
    {id:"bar",text:"Bar Chart"},
    //{id:"stackedBar",text:"Stacked Bar Chart"},
    {id:"barH",text:"Horizontal Bar Chart"},
    //{id:"stackedBarH",text:"Stacked Horizontal Bar Chart"},
    {id:"line",text:"Line Chart"},
    //{id:"spline",text:"Spline Chart"},
    {id:"pie",text:"Pie Chart"},
    {id:"pie3D",text:"3D Pie Chart"},
    {id:"donut",text:"Donut Chart"},
    //{id:"radar",text:"Radar Chart"},
    //{id:"scatter",text:"Scatter Chart"},
    {id:"pivot", text:"Pivot Table"}
  ]
}

var treeForm2 = {
  id:0,
  item:[]
}

// var treeForm4 = {
//   id:0,
//   item:[
//     {id:1, text:"Chart Data"},
//     {id:2, text:"Chart Labels"},
//     {id:3, text:"Group"},
//   ]
// }

var treeData =
'<tree id="0">\
  <item text="1" id="1">\
    <item text="1-1" id="1-1">\
      <item text="1-1-1" id="1-1-1"/>\
      </item>\
    <item text="1-2" id="1-2"/>\
    </item>\
  <item text="2" id="2"/>\
</tree>'
