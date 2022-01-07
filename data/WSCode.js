function soapCall(handler, soapFunction, soapBody) {
	try {
		var xmlhttp = new XMLHttpRequest();
		var endpoint = "http://www.eurorisksystems.com:8080/PMSWS/PMSWS11?wsdl"
		xmlhttp.open("POST", endpoint, true);
		xmlhttp.onreadystatechange = function () {
			if (this.readyState == 4) {
				var xml = xmlhttp.responseXML;
				if (this.status != 200) {
					 alert("Parse error: " + xml.parseError.reason);
				} else{
					if (xml.getElementsByTagName("responseCode").length > 0){
						var responseCode = xml.getElementsByTagName("responseCode")[0].textContent;
						if (responseCode == "OK") {
							handler(xml);
						} else if (responseCode == 'INVALID_TOKEN' || responseCode == 'EXECUTION_NODE_IS_NOT_AVAILABLE'|| responseCode == 'EXPIRED_TOKEN'){
							token = "";
							alert("Expired session!");
							pause = true;
							loading(false);
						} else if (responseCode == 'INVALID_LOGIN') {
							alert("Invalid Login");
							loading(false);
							loginForm.enableItem("login");
							loginWin.setModal(true);
						} else {
							alert("Bussiness exception: " + responseCode);
							console.log(xml);
							toolbar.enableItem("logout");
							loginForm.enableItem("login");
							pause = true;
							loading(false);
						}
					} else {
						alert("Proxy Exception: responseCode not found");
						pause = true;
						loading(false);
					}
				}
			}
		}
		xmlhttp.setRequestHeader("Content-Type", "text/xml");
		xmlhttp.setRequestHeader("SOAPAction", endpoint + "/" + soapFunction);
		var header = "<soapenv:Header/>";
		var body = "<soapenv:Body>" + soapBody + "</soapenv:Body></soapenv:Envelope>";
		xmlhttp.send("<?xml version='1.0' encoding='UTF-8'?><soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/' xmlns:ers='http://ers.bg'>" + header + body);
	} catch (e) {
		console.log("EVERYTHING IS BROKEN");
		console.log(e.message)
		loading(false);
		pause = false;
		return;
	}
}

function getAvailableDomains() {
	soapCall(
		function(xml) {
			try {
				domains = xml.getElementsByTagName("domains");
				for (var i=0; i < domains.length; i++) {
					loginForm.getCombo("domain").addOption([
						[domains[i].textContent,domains[i].textContent]
					]);
				}
				loginForm.getCombo("domain").selectOption(4);
		    } catch (e) {
				alert("An error has occured.\nPlease refresh your page.")
			}
		},
		"getAvailableDomains",
		"<ers:getAvailableDomains/>",
	);
}

function getUsersForDomain() {
	soapCall(
		function(xml) {
			loginForm.getCombo("user").clearAll();
			var usersXML = xml.getElementsByTagName("users");
			var usersTemp = [];
			var users = [];
			for (i = 0; i < usersXML.length; i++) {
				for (j = 0; j < usersXML[i].childNodes.length; j++) {
					usersTemp.push(usersXML[i].childNodes[j].textContent)
				}
				users.push(usersTemp);
				usersTemp = [];
			}
			var names = [];
			for (i = 0; i < users.length; i++) {
				if (users[i].length == 4) {
					users[i].shift();
				} else if (users[i].length == 5) {
					users[i].shift();
					users[i].shift();
				}
				loginForm.getCombo("user").addOption([
					[users[i][0],users[i][1] + ", " + users[i][2]]
				]);
			}
			loginForm.getCombo("user").selectOption(0);
		},
		"getUsersForDomain",
		"<ers:getUsersForDomain>" +
			"<domain>" + loginForm.getCombo("domain").getActualValue() + "</domain>" +
		"</ers:getUsersForDomain>",
	);
}

function login() {
	soapCall(
		function(xml) {
			token = xml.getElementsByTagName("token")[0].textContent;
			userName = loginForm.getCombo("user").getActualValue();
			document.getElementById("usertext").innerHTML = "User: " + userName;
			loginWin.hide();
			loginForm.enableItem("login");
			getPortfolios();
			getCubes();
			getDashboards();
		},
		"login",
		"<ers:login>" +
			"<userName>" + loginForm.getCombo("user").getActualValue() + "</userName>" +
			"<password>" + loginForm.getItemValue("pass") + "</password>" +
			"<domain>" + loginForm.getItemValue("domain") + "</domain>" +
		"</ers:login>"
	);
}

function logout() {
	if (actionMode) {
		soapCall(
			function(xml) {
				actionMode = false;
				logoutA();
			},
			"endActionMode",
			"<ers:endActionMode><token>" + token + "</token></ers:endActionMode>",
		)
	} else logoutA();
	function logoutA() {
		if (!actionMode) {
			soapCall(
				function(xml) {
					loginWin.show();
					document.getElementById("usertext").innerHTML = "Not logged in"
					loginForm.setItemValue("user", "");
					loginForm.setItemValue("pass", "");
					loading(false);
					token = "";
					username = "";
					loginWin.setModal(true);
					actionMode = false;
					loadCombo.clearAll();
				},
				"shutDown",
				"<ers:shutDown><token>" + token + "</token></ers:shutDown>",
			)
		}
	}
}

function getPortfolios() {
	soapCall(
		function(xml) {
			analyses = xml.getElementsByTagName("nomValues")[0].textContent;
			analyses += ";Export";
		},
		"getListItemsWithNom",
		"<ers:getListItemsWithNom><token>" + token + "</token><listName>AnalysisList</listName></ers:getListItemsWithNom>",
	);
	soapCall(
		function(xml) {
			var portTemp = xml.getElementsByTagName("nomValues")[0].textContent;
			portfolios = portTemp.split(";");
			for (var i = 0; i < portfolios.length; i++) {
				configForm.getCombo("portfolio").addOption([
					[portfolios[i],portfolios[i]]
				])
      }
			loading(false);
		},
		"getListItemsWithNom",
		"<ers:getListItemsWithNom><token>" + token + "</token><listName>Portfolios</listName></ers:getListItemsWithNom>",
	);
	soapCall(
		function(xml) {
			scenarios = xml.getElementsByTagName("nomValues")[0].textContent;
		},
		"getListItemsWithNom",
		"<ers:getListItemsWithNom><token>" + token + "</token><listName>Scenarios</listName></ers:getListItemsWithNom>",
	);
}

function beginPortfolio() {
	if (actionMode) {
		soapCall(
			function(xml) {
				$("#loading-text").text("Loading portfolio: " + configForm.getItemValue("portfolio"));
				actionMode = false;
				startPortfolio();
			},
			"endActionMode",
			"<ers:endActionMode><token>" + token + "</token></ers:endActionMode>",
		)
	} else startPortfolio();
	function startPortfolio() {
		if (!actionMode) {
			soapCall(
				function(xml) {
					soapCall(
						function(xml) {
							actionMode = true;
							loading(true);
							$("#loading-text").text("Loading portfolio: " + configForm.getItemValue("portfolio"));
							checkStatus();
							portfolio = configForm.getItemValue("portfolio");
							configForm.enableItem("cube");
						},
						'startActionAsync',
						'<ers:startActionAsync>\
							<token>' + token + '</token>\
							<scenarioID>Standard</scenarioID>\
							<outputType>Standard</outputType>\
							<analysisDate>' + dateISO() + '</analysisDate>\
							<analyses>\
								<name>Recalc</name>\
							</analyses>\
						</ers:startActionAsync>',
					)
				},
				"beginActionMode",
				"<ers:beginActionMode>" +
					"<token>" + token + "</token>" +
					"<positionSelectorType>" + "Portfolio" + "</positionSelectorType>" +
					"<selectorID>" + configForm.getItemValue("portfolio") + "</selectorID>" +
				"</ers:beginActionMode>",
			)
		}
	}
}

function checkStatus() {
	soapCall(
		function(xml) {
			var statusCode = "NOK";
			try {
  			statusCode = xml.getElementsByTagName("return")[0].getElementsByTagName("statusCode")[0].textContent;
				if (statusCode == "IDLE") {
					return;
				} if (statusCode == "ANOTHER_ACTION_IN_PROCESS") {
					alert("Another action is in process.");
				} if (statusCode == "IDLE_IN_ACTION_MODE") {
					loading(false);
				} else {
					checkStatus();
				}
			} catch(e) {
				endActionMode();
			}
		},
  	"getCurrentStatus",
  	"<ers:getCurrentStatus><token>" + token + "</token></ers:getCurrentStatus>",
 	);
}

function getCubes() {
	soapCall(
		function(xml) {
			var namesTemp = xml.getElementsByTagName("names")
			var names = [];
			for (i = 0; i < namesTemp.length; i++) {
				names.push(namesTemp[i].textContent);
				configForm.getCombo("cube").addOption([
					[names[i],names[i]]
				])
			}
		},
		"getOLAPCubes",
		'<ers:getOLAPCubes><token>' + token + '</token></ers:getOLAPCubes>'
	)
}

function getColumns() {
	soapCall(
		function(xml) {
			treeForm2.item = [];
			var columnsTemp = xml.getElementsByTagName("columnNames");
			var columnsValTemp = xml.getElementsByTagName("columnDBnames");
			var columnsTypesTemp = xml.getElementsByTagName("columnTypes");
			var columns = [];
			var columnsVal = [];
			var columnsTypes = [];
			for (i = 0; i < columnsTemp.length; i++) {
				columns.push(columnsTemp[i].textContent);
				columnsVal.push(columnsValTemp[i].textContent);
				columnsTypes.push(columnsTypesTemp[i].textContent);
				treeForm2.item.push({id:i+1,text:columns[i],value:columnsVal[i], type:columnsTypes[i]});
			}
			$("#filters").empty();
			createTree2.deleteChildItems(0);
			createTree2.parse(treeForm2,"json");
			cube = configForm.getItemValue("cube");
			var tree = createTree2.getAllLeafs().split(",");
			var combo = [];
			for (i = 1; i <= tree.length; i++) {
				$("#filters").append('<div id="filter' + i + '" class="filter"></div>');
				combo[i] = new dhtmlXCombo("filter" + i,"filter" + i,"200px","checkbox");
				combo[i].selectOption(0);
				combo[i].allowFreeText(false);
				combo[i].disable();
				addFilterData(i, columnsVal[i-1]);
			}
			filter = combo;
		},
		'getCubeMetaData',
		'<ers:getCubeMetaData>' +
			 '<token>' + token + '</token>' +
			 '<cubeName>' + configForm.getItemValue("cube") + '</cubeName>' +
		'</ers:getCubeMetaData>'
	)
}

function getColumnData(id) {
	var columnsID = createTree2.getAllChecked().split(',');
	var view = createTree1.getAllChecked();
	var columns = [];
	var columnsStr = "";
	var filtersStr = "";
	var dataset = [];
	var values = "(";
	var filtersTemp = {};
	var filtersSave = [];
	var tempValues = [];
	for (i = 0; i < columnsID.length; i++) {
		columns.push(createTree2.getAttribute(columnsID[i], "value"));
		columnsStr += "<columns>" + columns[i] + "</columns>";
		if (filter[columnsID[i]].getChecked().join()) {
			values += filter[columnsID[i]].getChecked().join("|") + ")";
			filtersStr += "<filter><name>" + columns[i] + "</name><value>" + values + "</value></filter>";
			values = "(";
			filtersTemp.values = [];
			filtersTemp.id = columnsID[i];
			tempValues = filter[columnsID[i]].getChecked();
			for (j = 0; j < tempValues.length; j++)
				filtersTemp.values.push(filter[columnsID[i]].getOption(tempValues[j]).index);
			filtersSave.push(filtersTemp);
			filtersTemp = {};
		}
	}
	soapCall(
		function(xml) {
			var rowsTemp = xml.getElementsByTagName("rows");
			var data = {};
			for (i = 0; i < rowsTemp.length; i++) {
				for (j = 0; j < columnsID.length; j++) {
					var name = createTree2.getAttribute(columnsID[j], "value");
					var value = rowsTemp[i].getElementsByTagName("cols")[j].textContent;
					data[name] = value;
				}
				dataset.push(data);
				data = {};
			}
			if (id || id==0)
				save(view, columnsID, dataset, id, filtersSave);
			else
				create(view, columnsID, dataset, columns, filtersSave);
		},
		'getCubeDataByColumnsAndFilteredr',
		'<ers:getCubeDataByColumnsAndFiltered>' +
			'<token>' + token + '</token>' +
			'<cubeName>' + configForm.getItemValue("cube") + '</cubeName>' +
			columnsStr + filtersStr +
			"<distinct>true</distinct>" +
		'</ers:getCubeDataByColumnsAndFiltered>'
	)
}

function addFilterData(colID, colName) {
	soapCall(
		function(xml) {
			var rows = xml.getElementsByTagName("rows");
			var data = [];
			for (i = 0; i < rows.length; i++) {
				data.push(rows[i].getElementsByTagName("cols")[0].textContent);
				filter[colID].addOption([
					[data[i], data[i]]
				])
			}
		},
		"getCubeDataByColumns",
		"<ers:getCubeDataByColumns>" +
			'<token>' + token + '</token>' +
			'<cubeName>' + configForm.getItemValue("cube") + '</cubeName>' +
			'<columns>' + colName + '</columns>' +
			'<distinct>true</distinct>' +
		'</ers:getCubeDataByColumns>'
	)
}

function getDashboards() {
	soapCall(
		function(xml) {
			checkStatus();
		},
		'startResultsBuildAsync',
		'<ers:startResultsBuildAsync>' +
		'<token>' + token + '</token>' +
		'<tableName>DASHBOARD_DEF</tableName>' +
		'<selectParams>' +
			'<name>DASH_USER</name>' +
			'<value>' + userName + '</value>' +
		'</selectParams>' +
	 '</ers:startResultsBuildAsync>'
 )

 function checkStatus() {
	 soapCall(
		 function(xml) {
			 var statusCode = 'NOK';
			 statusCode = xml.getElementsByTagName("return")[0].getElementsByTagName("statusCode")[0].textContent;
			 if (statusCode == "IDLE") {
				 importData();
			 } else {
				 checkStatus();
			 }
		 },
		 'getCurrentStatus',
		 '<ers:getCurrentStatus><token>' + token + '</token></ers:getCurrentStatus>',
	 );
 }

 function importData() {
	 soapCall(
 		function(xml) {
			var data = Base64.decode(xml.getElementsByTagName("return")[0].getElementsByTagName("data")[0].textContent).replace(/,/g, '.').replace(/;/g, ',').replace(/\n/g, '');
			var dataArray = [];
			var dataArrayTemp = data.split(",");
			var dataArrayTemp2 = [];
			for (i = 0; i < dataArrayTemp.length; i++) {
				if (i % 5 == 0 && i != 0) {
					dataArrayTemp2.push(dataArrayTemp[i-5], dataArrayTemp[i-4], dataArrayTemp[i-3], dataArrayTemp[i-2], dataArrayTemp[i-1]);
					dataArray.push(dataArrayTemp2);
					dataArrayTemp2 = [];
				}
			}
			for (i = 0; i < dataArray.length; i++) {
				loadCombo.addOption([
				    [dataArray[i],dataArray[i][0]],
				]);
			}
 		},
 		'getCurrentResultsWithColDef',
 		'<ers:getCurrentResultsWithColDef><token>' + token + '</token></ers:getCurrentResultsWithColDef>',
 	);
 }
}

function getDashboardConfig() {
	if (actionMode) {
		soapCall(
			function(xml) {
				actionMode = false;
				getData();
			},
			"endActionMode",
			"<ers:endActionMode><token>" + token + "</token></ers:endActionMode>",
		)
	} else getData();

	function getData() {
		soapCall(
			function(xml) {
				checkStatus();
			},
			'startResultsBuildAsync',
			'<ers:startResultsBuildAsync>' +
			'<token>' + token + '</token>' +
			'<tableName>DASHBOARD_CHARTS</tableName>' +
			'<selectParams>' +
				'<name>DASH_ID_PAR</name>' +
				'<value>' + loadCombo.getSelected()[0] + '</value>' +
			'</selectParams>' +
		 '</ers:startResultsBuildAsync>'
	 )
	}

	function checkStatus() {
	 soapCall(
		 function(xml) {
			 var statusCode = 'NOK';
			 statusCode = xml.getElementsByTagName("return")[0].getElementsByTagName("statusCode")[0].textContent;
			 if (statusCode == "IDLE") {
				 importData();
			 } else {
				 checkStatus();
			 }
		 },
		 'getCurrentStatus',
		 '<ers:getCurrentStatus><token>' + token + '</token></ers:getCurrentStatus>',
	 );
	}

 function importData() {
	 soapCall(
		function(xml) {
			var data = Base64.decode(xml.getElementsByTagName("return")[0].getElementsByTagName("data")[0].textContent).replace(/,/g, '.').replace(/;/g, ',').replace(/\n/g, '');
			var dataArray = [];
			var dataArrayTemp = data.split(",");
			var dataArrayTemp2 = [];
			for (i = 0; i < dataArrayTemp.length; i++) {
				if (i % 13 == 0 && i != 0) {
					dataArrayTemp2.push(dataArrayTemp[i-13], dataArrayTemp[i-12], dataArrayTemp[i-11], dataArrayTemp[i-10], dataArrayTemp[i-9],
					dataArrayTemp[i-8], dataArrayTemp[i-7], dataArrayTemp[i-6], dataArrayTemp[i-5], dataArrayTemp[i-4],
					dataArrayTemp[i-3], dataArrayTemp[i-2], dataArrayTemp[i-1]);
					dataArray.push(dataArrayTemp2);
					dataArrayTemp2 = [];
				}
			}
			for (i = 0; i < dataArray.length; i++) {
				var id = dataArray[i][0];
				var dashID = dataArray[i][1];
				var cols = dataArray[i][2].split(",");
				var dataCombo = dataArray[i][3];
				var labelCombo = dataArray[i][4];
				var groupCombo = dataArray[i][5];
				var groupFuncCombo = dataArray[i][6];
				var check = dataArray[i][7];
				var filters = dataArray[i][8];
				var view = dataArray[i][9];
				var pos = dataArray[i][10];
				var size = dataArray[i][11];
				var title = dataArray[i][12];
				var columns = [];
				var columnsStr = "";
				var filtersStr = "";
				var dataset = [];
				var values = "(";
				var filtersTemp = {};
				var filtersSave = [];
				var tempValues = [];
				console.log(filters);
				// for (i = 0; i < columnsID.length; i++) {
				// 	columns.push(createTree2.getAttribute(cols[i], "value"));
				// 	columnsStr += "<columns>" + columns[i] + "</columns>";
			// 		if (filters) {
			// 			values += filter[columnsID[i]].getChecked().join("|") + ")";
			// 			filtersStr += "<filter><name>" + columns[i] + "</name><value>" + values + "</value></filter>";
			// 			values = "(";
			// 			filtersTemp.values = [];
			// 			filtersTemp.id = columnsID[i];
			// 			tempValues = filter[columnsID[i]].getChecked();
			// 			for (j = 0; j < tempValues.length; j++)
			// 				filtersTemp.values.push(filter[columnsID[i]].getOption(tempValues[j]).index);
			// 			filtersSave.push(filtersTemp);
			// 			filtersTemp = {};
			// 		}
			// 	}
			// 	soapCall(
			// 		function(xml) {
			// 			var rowsTemp = xml.getElementsByTagName("rows");
			// 			var data = {};
			// 			for (i = 0; i < rowsTemp.length; i++) {
			// 				for (j = 0; j < columnsID.length; j++) {
			// 					var name = createTree2.getAttribute(columnsID[j], "value");
			// 					var value = rowsTemp[i].getElementsByTagName("cols")[j].textContent;
			// 					data[name] = value;
			// 				}
			// 				dataset.push(data);
			// 				data = {};
			// 			}
			// 			if (id || id==0)
			// 				save(view, columnsID, dataset, id, filtersSave);
			// 			else
			// 				create(view, columnsID, dataset, columns, filtersSave);
			// 		},
			// 		'getCubeDataByColumnsAndFilteredr',
			// 		'<ers:getCubeDataByColumnsAndFiltered>' +
			// 			'<token>' + token + '</token>' +
			// 			'<cubeName>' + configForm.getItemValue("cube") + '</cubeName>' +
			// 			columnsStr + filtersStr +
			// 			"<distinct>true</distinct>" +
			// 		'</ers:getCubeDataByColumnsAndFiltered>'
			// 	)
			// }
			// }
		}
		},
		'getCurrentResultsWithColDef',
		'<ers:getCurrentResultsWithColDef><token>' + token + '</token></ers:getCurrentResultsWithColDef>',
	);
 }
}

var Base64 = {
	_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	encode: function(input) {
		var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    input = Base64._utf8_encode(input);
    while (i < input.length) {
			chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
      	enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
    },
	decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    _utf8_decode: function(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }
}
