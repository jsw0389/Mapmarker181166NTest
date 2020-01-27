/**************************** 변수 선언 ****************************/
var rABS = true; // T : 바이너리, F : 어레이 버퍼
var searchjuso = 0;
var markOverlay = [];
//var cellidentify = [];
var aColumn = [];
var bColumn = [];
var cColumn = [];
var jusoNotFound = [];
var coords = [];
var bounds;
var chkBackground = 0;
var fileClassBoolean = 0;
var mylocationCircle = 0;
var mylocationMark = 0;
var customMarkButtonBackground = 0;

// 지도를 표시할 div와  지도 옵션으로  지도를 생성합니다
var mapOptions = {
		zoomControl: true,
		zoomControlOptions: {
				style: naver.maps.ZoomControlStyle.LARGE,
				position: naver.maps.Position.TOP_RIGHT
		},
		mapTypeControl: true,
		mapTypeControlOptions: {
				style: naver.maps.MapTypeControlStyle.BUTTON,
				position: naver.maps.Position.TOP_RIGHT
		},
		scaleControl: true,
		scaleControlOptions: {
				position: naver.maps.Position.BOTTOM_LEFT
		},
		center: new naver.maps.LatLng(37.290212, 127.0094235),
		useStyleMap: true,
    zoom: 16
};
var map = new naver.maps.Map(document.getElementById('map'), mapOptions);
/**************************** 변수 선언 ****************************/



/****************************** 함수 ******************************/
//주소 검색 함수
function searchAddress() {
	var temp = document.getElementById("inputAddress").value;
	var tempCoords = 0;
	searchjuso = temp;
	naver.maps.Service.geocode({query: searchjuso}, function(status, response) {
		if (status !== naver.maps.Service.Status.OK) {
				return alert("주소 검색 실패");
		}

		var result = response.v2; // 검색 결과의 컨테이너
				items = result.addresses[0]; // 검색 결과의 배열

    var tempX = items.x, tempY = items.y;
    var position = new naver.maps.LatLng(tempY, tempX);
    customOverlaydraw(map, position,temp);
		map.setCenter(position);
		});
}


//엑셀 로드 함수
function fixdata(data) {
	var o = "",
		l = 0,
		w = 10240;
	for (; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
	o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
	return o;
}

function getConvertDataToBin($data) {
	var arraybuffer = $data;
	var data = new Uint8Array(arraybuffer);
	var arr = new Array();
	for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
	var bstr = arr.join("");

	return bstr;
}

function handleFile(e) {
	document.getElementById('endHidden').style.display = 'none';
	var files = e.target.files;
	var i, f;
	for (i = 0; i != files.length; ++i) {
		f = files[i];
		var reader = new FileReader();
		var name = f.name;
		reader.onload = function(e) {
			var data = e.target.result;
			var workbook;
			if (rABS) {
				/* if binary string, read with type 'binary' */
				workbook = XLSX.read(data, {
					type: 'binary'
				});
			} else {
				/* if array buffer, convert to base64 */
				var arr = fixdata(data);
				workbook = XLSX.read(btoa(arr), {
					type: 'base64'
				});
			} //end. if

			/* 워크북 처리 */
			workbook.SheetNames.forEach(function(item, index, array) {
				// CSV
				var csv = XLSX.utils.sheet_to_csv(workbook.Sheets[item]); // default : ","
				// json
				var json = XLSX.utils.sheet_to_json(workbook.Sheets[item]);
				var worksheet = workbook.Sheets[item];
				var range = XLSX.utils.decode_range(worksheet['!ref']);
				for (var j = 1; range.e.r+1 >= j; j++) {
					aColumn[j] = (worksheet["A" + j] ? worksheet["A" + j].v : undefined);
					bColumn[j] = (worksheet["B" + j] ? worksheet["B" + j].v : undefined);
					cColumn[j] = (worksheet["C" + j] ? worksheet["C" + j].v : undefined);
				}

				if (fileClassBoolean == 0){
					var notFoundCount = 0;
					aColumn.forEach(function(addr, index) {
						naver.maps.Service.geocode({query: addr}, function(status, response) {
							if (status !== naver.maps.Service.Status.OK) {
									return alert("주소 검색 실패");
							}
							var result = response.v2; // 검색 결과의 컨테이너
									items = result.addresses[0]; // 검색 결과의 배열
							coords[index] = items;
							if (coords[index] !== undefined) {
								if (bColumn[index] == undefined) {bColumn[index] = "V";}
								var tempContent = bColumn[index];
								var tempX = coords[index].x, tempY = coords[index].y;
								var position = new naver.maps.LatLng(tempY, tempX);
								customOverlaydraw(map, position, tempContent);
								map.setCenter(position);
							} else {
								if (aColumn[index]){
									jusoNotFound[notFoundCount++] = aColumn[index];
								}
							var tempDiv = document.getElementById('chkNotFound');
							tempDiv.style.display = 'block';
							}
						});
					}); //end. forEach
				}
			});
		}; //end onload
		if (rABS) reader.readAsBinaryString(f);
		else reader.readAsArrayBuffer(f);
    var tempDiv = document.getElementById('noneBackgroundMenu');
    tempDiv.style.display = 'block';
	} //end. for
}

//커스텀오버레이 함수
function customOverlaydraw(map,position,content) {
  var CustomOverlay = function(options) {
    var tempContent = content;
      this._element = $('<div class="customMarkButton">' +
                          tempContent +
                          '</div>')
      this.setPosition(options.position);
      this.setMap(options.map || null);
  };
  CustomOverlay.prototype = new naver.maps.OverlayView();
  CustomOverlay.prototype.constructor = CustomOverlay;
  CustomOverlay.prototype.setPosition = function(position) {
      this._position = position;
      this.draw();
  };
  CustomOverlay.prototype.getPosition = function() {
      return this._position;
  };
  CustomOverlay.prototype.onAdd = function() {
      var overlayLayer = this.getPanes().overlayLayer;
      this._element.appendTo(overlayLayer);
  };
  CustomOverlay.prototype.draw = function() {
      if (!this.getMap()) {
          return;
      }
      var projection = this.getProjection(),
          position = this.getPosition(),
          pixelPosition = projection.fromCoordToOffset(position);
      this._element.css('left', pixelPosition.x);
      this._element.css('top', pixelPosition.y);
  };
  CustomOverlay.prototype.onRemove = function() {
      var overlayLayer = this.getPanes().overlayLayer;
      this._element.remove();
      this._element.off();
  };
  var overlay = new CustomOverlay({
      map: map,
      position: position
  });
}

//설명서 표시하는 함수
function alertHelp() {
	var alertHelpString =     "-----Address Excel-----"+"<br>"
											+			"A열 : 검색 주소 값"+"<br>"
											+			"B열 : 표시 값"+"<br>"
											+			"C열 : Category2"+"<br>"
											+			"ex) : A열 : 영화동 338-1, B열 : 338-1, C열 : 일반주택"+"<br>"
											+			"<br>"
											+			"-----GPS Excel-----"+"<br>"
											+			"A열 : No."+"<br>"
											+			"B열 : 위도"+"<br>"
											+			"C열 : 경도"+"<br>"
											+			"ex) : A열 : 0, B열 : 37.290208, C열 : 127.011734"+"<br>"
											+			"<br>"
											+			"-----추가 기능-----"+"<br>"
											+			"지도 클릭시 번지,위도,경도 자동 복사"+"<br>"
											+			"내 위치 및 오차 반경 표시"+"<br>"
											+			"<br>"
											+			"-----Category Color-----"+"<br>"
											+			"Green : 일반주택, 상가주택"+"<br>"
											+			"Gold : 농사용"+"<br>"
											+			"Puple : 휴게음식점, 일반음식점"+"<br>"
											+			"Red : 노래연습장업, 기타주점, 유흥주점, 단란주점"+"<br>"
											+			"Blue : 이동통신 중계기"+"<br>"
											+			"Brown : 광업, 하수폐기청소업, 제조업"+"<br>"
											+			"Black : Default"+"<br>";
	document.getElementById("alertTitle").innerHTML = "사용 설명서";
	document.getElementById("alertContent").innerHTML = alertHelpString;
	goDetail()
}

//레이어 팝업 기능
function wrapWindowByMask() {
	//화면의 높이와 너비를 구한다.
	var maskHeight = $(document).height();
	var maskWidth = $(window).width();

	//문서영역의 크기
	console.log("document 사이즈:" + $(document).width() + "*" + $(document).height());
	//브라우저에서 문서가 보여지는 영역의 크기
	console.log("window 사이즈:" + $(window).width() + "*" + $(window).height());

	//마스크의 높이와 너비를 화면 것으로 만들어 전체 화면을 채운다.
	$('#mask').css({
		'width': maskWidth,
		'height': maskHeight
	});

	//애니메이션 효과
	//$('#mask').fadeIn(1000);
	$('#mask').fadeTo("slow", 0.5);
}
function popupOpen() {
	$('.layerpop').css("position", "absolute");
	//영역 가운에데 레이어를 뛰우기 위해 위치 계산
	$('.layerpop').css("top", (($(window).height() - $('.layerpop').outerHeight()) / 2) + $(window).scrollTop());
	$('.layerpop').css("left", (($(window).width() - $('.layerpop').outerWidth()) / 2) + $(window).scrollLeft());
	//$('.layerpop').draggable();
	$('#layerbox').show();
}
function popupClose() {
	$('#layerbox').hide();
	$('#mask').hide();
}
function goDetail() {
	popupOpen(); //레이어 팝업창 오픈
	wrapWindowByMask(); //화면 마스크 효과
}

function fileClass(e) {
	fileClassBoolean = e;
}

//검색 실패 항목 표시하는 함수
function alertNotFound() {
	var alertNotFoundString = jusoNotFound.join("<br>");
	document.getElementById("alertTitle").innerHTML = "검색 실패 항목";
	document.getElementById("alertContent").innerHTML = alertNotFoundString;
	goDetail()
}
/****************************** 함수 ******************************/

var input_dom_element;
$(function() {
	input_dom_element = document.getElementById('my_file_input');
	if (input_dom_element.addEventListener) {
		input_dom_element.addEventListener('change', handleFile, false);
	}
});

naver.maps.Event.addListener(map, 'click', function(e) { //클릭한 위치에 오버레이를 추가합니다.
    //customOverlaydraw(map,e.coord);
});
