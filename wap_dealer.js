/**
 * Created by zd on 2014/5/5 0005.
 */

var recoType = 0;
var allType = 0;
var recoNextPage = 0;
var allNextPage = 0;
//��ͼ-------------start
(function (win) {
    var map,
        dPos,
        oPos,
        _flag = 1,//1-bus search,2-car search
        _initialize = function (cfg) {
            var _cfg = {};
            _cfg.x = cfg.x || 0;
            _cfg.y = cfg.y || 0;
            _cfg.tit = cfg.tit|| "";
            _cfg.z = cfg.zoom || 15;
            var myLatlng = new sogou.maps.Point(parseFloat(_cfg.x), parseFloat(_cfg.y));
            var myOptions = {
                'zoom': _cfg.z,
                'center': myLatlng,
                'mapTypeId': sogou.maps.MapTypeId.ROADMAP
            }
            map = new sogou.maps.Map(document.getElementById("shop-map"), myOptions);
            var marker = new sogou.maps.Marker({'position': myLatlng,map: map,title:_cfg.tit});
            dPos = myLatlng;
            $('body').removeAttr('style');
        },
    /*������ѯ�ص�function */
        _busCallback = function (a){
            var option={
                'map':map,
                'busResult':a
            };
            map.clearAll();
            var bRender=new sogou.maps.BusRenderer(option);
        },
    /*������ѯ */
        _setBusLine = function (start, dest, maxDist) {
            var request={
                'map':map,        //Map
                'destination':dest,//Ŀ��λ�á�Ҫ���е�ַ�������ַ����� LatLng����Ϊ�ѹ���ͼ���ꡣ���
                'origin':start,        //ԭ���λ�á�Ҫ���е�ַ�������ַ����� LatLng����Ϊ�ѹ���ͼ���ꡣ���
                'maxDist':maxDist//���Ĳ��о��롣��ѡ
            }

            var bus = new sogou.maps.Bus();

            bus.route(request, _busCallback);
        },
    /*�ݳ���ѯ����ʾ��� */
        _setCarLine = function (start, dest, tactic) {
            var request={
                'map':map,
                'destination':dest,
                'origin':start,
                'tactic':tactic       //�ݳ����ԡ� 0�� ����̣�1 ��ʱ��� Ĭ�ϲ��� ����ѡΪ1����2 �����߸���
            }
            var nav=new sogou.maps.Driving();
            nav.route(request);
            map.clearAll();
            //���
            nav.setRenderer(new sogou.maps.DrivingRenderer());
        },
    //ѡbus��ѯ
        _busSelected = function (e) {
            var self = $(this),
                $carSelectBtn = $('#carSelectBtn'),
                $busWrap = $('#busWrap'),
                $carWrap = $('#carWrap');
            if (self.hasClass('cur')) {
                return;
            }
            _flag = 1;
            $carSelectBtn.removeClass('cur');
            self.addClass('cur');
            $busWrap.css('display','block');
            $carWrap.css('display','none');
        },
    //ѡcar��ѯ
        _carSelected = function (e) {
            var self = $(this),
                $busSelectBtn = $('#busSelectBtn'),
                $busWrap = $('#busWrap'),
                $carWrap = $('#carWrap');
            if (self.hasClass('cur')) {
                return;
            }
            _flag = 2;
            $busSelectBtn.removeClass('cur');
            self.addClass('cur');
            $carWrap.css('display','block');
            $busWrap.css('display','none');
        },
    //��ʼbus��ѯ
        _startBusSearch = function (e) {
            var $s = $('#busStart'),
                sval = $s.val();
            //console.log(sval+'  '+eval);
            if (!sval) {
                alert('��������ʼ�ص㣡');
                $s[0].focus();
                return;
            }
            _setBusLine(oPos,dPos,1000);
        },
    //��ʼcar��ѯ
        _startCarSearch = function (e) {
            var $s = $('#carStart'),
                sval = $s.val();
            //console.log(sval+'  '+eval);
            if (!sval) {
                alert('��������ʼ�ص㣡');
                $s[0].focus();
                return;
            }
            _setCarLine(oPos,dPos,2);
        },
    //��ַ�����ص�
        _geocoderCallback = function (a){
            if(_flag === 1){
                $('#busSearchBtn').removeAttr('disabled');
            }else {
                $('#carSearchBtn').removeAttr('disabled');
            }
            if(a.status == 'ok'){
                var geometry=a.data[0];
                oPos = geometry.location;
            } else {
                alert('��������ʼ��ַ����');
            }
        },
    //��ַ����
        _geocoderFunc = function (cfg) {
            if(!cfg){
                return;
            }
            if(_flag === 1){
                $('#busSearchBtn').attr('disabled',true);
            }else {
                $('#carSearchBtn').attr('disabled',true);
            }
            var geo=new sogou.maps.Geocoder();
            geo.geocode(cfg,_geocoderCallback);
        },

        _busStartPos = function (e) {
            var v, cfg;
            v = $('#busStart').val();
            if(!v){
                return;
            }
            cfg= {
                address:{
                    addr:v,
                    city:mapSetting.city
                }
            };
            _geocoderFunc(cfg);
        },
        _carStartPos = function (e) {
            var v, cfg;
            v = $('#busStart').val();
            if(!v){
                return;
            }
            cfg= {
                address:{
                    addr:v,
                    city:mapSetting.city
                }
            };
            _geocoderFunc(cfg);
        },
        _initEvent = function () {
            $('#busSelectBtn').click(_busSelected);
            $('#carSelectBtn').click(_carSelected);
            $('#busSearchBtn').click(_startBusSearch);
            $('#carSearchBtn').click(_startCarSearch);
            $('#busStart').blur(_busStartPos);
            $('#carStart').blur(_carStartPos);
        };

    win['mapFunc'] = {
        initialize : _initialize,
        initEvent : _initEvent,
        busStartPos : _busStartPos
    }

})(window);

function addShopHistory()
{
    var index = indexOfArr(historyShopArr, location.href);
    if(index === -1)
    {
        historyShopArr.push({
            'type':'shop',
            'name':$('.shopName').text(),
            'url':location.href
        });
        if(historyShopArr.length > 5)
        {
            historyShopArr.shift();
        }
        localStorage.setItem('historyShopArr', JSON.stringify(historyShopArr));
    }
}

$(function() {

		var $collectItems = $("#collect-record-list").find('li');
    var carItem = $collectItems[0], shopItem = $collectItems[1];
    //�����ʷ���ղ�����
    if(window.localStorage)
    {
        addShopHistory();
        clearBtnHandler();
        initCollect(collectObj, carItem, shopItem);
        initHistory(historyCarArr, historyShopArr, carItem, shopItem);
    }
    else
    {
        $("#collect-record").html('<p>�����������֧���ղ�</p>');
        $("#browsing-record").html('<p>�����������֧�ֲ鿴��ʷ��¼</p>');
    }

    $("#shop-cars").tabs();

    initComponent(carItem, shopItem);

    initSuggestDialog();
    

    var $body = $('body');
    if(mapSetting){
        mapFunc.initialize({x:mapSetting.mapX,y:mapSetting.mapY,tit:mapSetting.title});
        mapFunc.busStartPos();
        if($body[0].style.overflow == 'hidden'){
            $body[0].style.overflow = 'auto';
        }
    }
    
    $("#tabReco").click(function(){
    	recoType = 0;
    	recoNextPage = getRecoCars(1, 0, 1, 6, false);
    });
    $("#recoDefa").click(function(){
    	$('#recommendCar').find('.tab-nav').find('li').removeClass('ui-state-active');
    	$(this).parent().addClass('ui-state-active');
    	recoType = 0;
    	recoNextPage = getRecoCars(1, 0, 1, 6, false);
    });
    $("#recoPrice").click(function(){
    	$('#recommendCar').find('.tab-nav').find('li').removeClass('ui-state-active');
    	$(this).parent().addClass('ui-state-active');
    	recoType = 2;
    	recoNextPage = getRecoCars(1, 2, 1, 6, false);
    });
    $("#recoMile").click(function(){
    	$('#recommendCar').find('.tab-nav').find('li').removeClass('ui-state-active');
    	$(this).parent().addClass('ui-state-active');
    	recoType = 1;
    	recoNextPage = getRecoCars(1, 1, 1, 6, false);
    });
    
    
    
    $("#tabAll").click(function(){
    	allType = 0;
    	allNextPage = getAllCars(-1, 0, 1, 6, false);
    });
    $("#allDefa").click(function(){
    	$('#allCar').find('.tab-nav').find('li').removeClass('ui-state-active');
    	$(this).parent().addClass('ui-state-active');
    	allType = 0;
    	allNextPage = getAllCars(-1, 0, 1, 6, false);
    });
    $("#allPrice").click(function(){
    	$('#allCar').find('.tab-nav').find('li').removeClass('ui-state-active');
    	$(this).parent().addClass('ui-state-active');
    	allType = 2;
    	allNextPage = getAllCars(-1, 2, 1, 6, false);
    });
    $("#allMile").click(function(){
    	$('#allCar').find('.tab-nav').find('li').removeClass('ui-state-active');
    	$(this).parent().addClass('ui-state-active');
    	allType = 1;
    	allNextPage = getAllCars(-1, 1, 1, 6, false);
    });
    
    $("#moreReco").live('click', function(){
    	if(recoNextPage > 0) {
    		recoNextPage = getRecoCars(1, recoType, recoNextPage, 6, true);
    	} else {
    		
    		// û�и�����
    		$("#moreReco").html("û�и�����");
    	}
    });
    
    $("#moreAll").live('click', function(){
    	if(allNextPage > 0) {
    		allNextPage = getAllCars(-1, allType, allNextPage, 6, true);
    	} else {
    		
    		// û�и�����
    		$("#moreAll").html("û�и�����");
    	}
    });
    
    // ��ʼ��
    recoType = 0;
	recoNextPage = getRecoCars(1, 0, 1, 6, false);
});

function getRecoCars(type, orderBy, page, pageSize, append){
	return getCars(type, orderBy, page, pageSize, $("#carList"), append);
}
function getAllCars(type, orderBy, page, pageSize, append){
	return getCars(type, orderBy, page, pageSize, $("#carList2"), append);
}

function getCars(type, orderBy, page, pageSize, obj, append){
	var nextPage = 0;
	var dealerId = $("#dealerId").val();
	var url = "/wap/getCars/?dealerId=" + dealerId + "&recommendType=" + type + "&orderBy=" + orderBy + "&page=" + page + "&pageSize=" + pageSize;
	$.ajax({url:url, type:"get", async:false, success:function (data) {
		if(data == undefined || data == "undefined"){
			return;
		}
		var msg = "";
		if(data.dealerInfo.currentCars != null) {
			nextPage = data.nextPage;
			$.each(data.dealerInfo.currentCars, function(i, item){
				msg += "<li class=\"car-item\">";
				msg += "<a href=\"" + data.dealerInfo.currentLinks[i] + "\" class=\"car-tit\">" + item.scCarWithPics.enterTrimmName + "</a>";
				if(item.scCarWithPics.flag3 == 1) {
					msg += "<span class=\"authentication\">��</span>";
				}
				msg += "<div class=\"description\">";
				msg += "<div class=\"left-des\">";
				msg += "<p class=\"promise\">" + data.dealerInfo.currentTitles[i] + "</p>";
				msg += "<p class=\"car-info\">" + data.dealerInfo.currentDates[i] + "����&nbsp;&nbsp;" + data.dealerInfo.currentMiles[i] + "</p>";
				msg += "</div>";
				msg += "<div class=\"right-des\">";
				if(item.scCarWithPics.flag6 == 1 && data.dealerInfo.currentDate < item.scCarWithPics.specialDatetime) {
					var spPrice = item.scCarWithPics.specialPrice;
					if(hasZero(spPrice)) {
						spPrice = (spPrice + "").replace(".0", "");
					}
					msg += "<p class=\"car-price\">" + spPrice + "��</p>";
				} else {
					var salePrice = item.scCarWithPics.salePrice;
					if(hasZero(salePrice)) {
						salePrice = (salePrice + "").replace(".0", "");
					}
					msg += "<p class=\"car-price\">" + salePrice + "��</p>";
				}
				msg += "<p class=\"release-date\">" + data.dealerInfo.currentTimes[i] + "</p>";
				msg += "</div>";
				msg += "</div>";
				msg += "</li>";
			});
			var moreText = "";
			if(type == 1) {
				$("#moreReco").remove();
				if(nextPage != 0) {
					moreText = "<div id=\"moreReco\" class=\"see-more\">�鿴����</div>";
				} else {
					moreText = "<div class=\"see-more\">û�и�����</div>";
				}
			} else {
				$("#moreAll").remove();
				if(nextPage != 0) {
					moreText = "<div id=\"moreAll\" class=\"see-more\">�鿴����</div>";
				} else {
					moreText = "<div class=\"see-more\">û�и�����</div>";
				}
			}
			var result = "";
			var rowText = "";
			if(!append) {
				if(type == 1) {
					msg = "<ul class=\"carList\" id=\"carListUl\">" + msg + "</ul>" + moreText;
				} else {
					msg = "<ul class=\"carList\" id=\"carListUl2\">" + msg + "</ul>" + moreText;
				}
				$(obj).empty();
				result = msg;
			} else {
				if(type == 1){
					rowText = $("#carListUl").append(msg);
				} else {
					rowText = $("#carListUl2").append(msg);
				}
				result +=  moreText;
			}
			$(obj).append(result);
			$("#shop-cars").tabs("refresh");
		} else {
			var moreText = "<div class=\"see-more\">û�и�����</div>";
			$(obj).html(moreText);
			$("#shop-cars").tabs("refresh");
		}
		
	}});
	return nextPage;
}

function hasZero(text) {
	var reg = new RegExp(".0$");
	if(reg.test(text)) {
		return true;
	}
	return false;
}