/**
 * Created by zd on 2014/5/11 0011.
 */
//地图-------------start
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
    /*公交查询回调function */
        _busCallback = function (a){
            var option={
                'map':map,
                'busResult':a
            };
            map.clearAll();
            var bRender=new sogou.maps.BusRenderer(option);
        },
    /*公交查询 */
        _setBusLine = function (start, dest, maxDist) {
            var request={
                'map':map,        //Map
                'destination':dest,//目标位置。要进行地址解析的字符串或 LatLng或者为搜狗地图坐标。必填。
                'origin':start,        //原点的位置。要进行地址解析的字符串或 LatLng或者为搜狗地图坐标。必填。
                'maxDist':maxDist//最大的步行距离。可选
            }

            var bus = new sogou.maps.Bus();

            bus.route(request, _busCallback);
        },
    /*驾车查询并显示结果 */
        _setCarLine = function (start, dest, tactic) {
            var request={
                'map':map,
                'destination':dest,
                'origin':start,
                'tactic':tactic       //驾车策略。 0： 距离短；1 ：时间短 默认策略 （不选为1）；2 ：不走高速
            }
            var nav=new sogou.maps.Driving();
            nav.route(request);
            map.clearAll();
            //面板
            nav.setRenderer(new sogou.maps.DrivingRenderer());
        },
    //选bus查询
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
    //选car查询
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
    //开始bus查询
        _startBusSearch = function (e) {
            var $s = $('#busStart'),
                sval = $s.val();
            //console.log(sval+'  '+eval);
            if (!sval) {
                alert('请输入起始地点！');
                $s[0].focus();
                return;
            }
            _setBusLine(oPos,dPos,1000);
        },
    //开始car查询
        _startCarSearch = function (e) {
            var $s = $('#carStart'),
                sval = $s.val();
            //console.log(sval+'  '+eval);
            if (!sval) {
                alert('请输入起始地点！');
                $s[0].focus();
                return;
            }
            _setCarLine(oPos,dPos,2);
        },
    //地址解析回调
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
                alert('您输入起始地址有误！');
            }
        },
    //地址解析
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


/* 显示隐藏联系人状态条 */
function closeLinkInfo(type) {
    if (type == 1) {
        $('#LinkInfo').hide();
        $('#openLinkInfo').show();
    } else {
        $('#LinkInfo').show();
        $('#openLinkInfo').hide();
    }
}

function addCarHistory()
{
    var index = indexOfArr(historyCarArr, location.href);
    if(index === -1)
    {
        historyCarArr.push({
            'type':'car',
            'price':$('.car-price-con').find('.left').text() + $('.car-price-con').find('.right').text(),
            'name':$('.car-tit-con').find('h4').text(),
            'url':location.href
        });
        if(historyCarArr.length > 5)
        {
            historyCarArr.shift();
        }
        localStorage.setItem('historyCarArr', JSON.stringify(historyCarArr));
    }
}

function addCarCollect()
{
    //收藏功能
    if(collectObj[location.href])
    {
        $('#collectBtn').addClass('active').text('取消收藏');
    }
    $('#collectBtn').on('tap', function()
    {
        if($(this).hasClass('active'))
        {
            $(this).removeClass('active').text('收藏此车');
            collectObj[location.href] = null;
            --collectObj.length;
            localStorage.setItem('collectObj', JSON.stringify(collectObj));
        }
        else
        {
            $(this).addClass('active').text('取消收藏');
            collectObj[location.href] =
            {
                'type':'car',
                'price':$('.car-price-con').find('.left').text() + $('.car-price-con').find('.right').text(),
                'name':$('.car-tit-con').find('h4').text(),
                'url':location.href
            };
            ++collectObj.length;
            localStorage.setItem('collectObj', JSON.stringify(collectObj));
        }
    });
}

$(function() {

		var $collectItems = $("#collect-record-list").find('li');
    var carItem = $collectItems[0], shopItem = $collectItems[1];
    //填充历史与收藏数据
    if(window.localStorage)
    {
        addCarHistory();
        initCollect(collectObj, carItem, shopItem);
        initHistory(historyCarArr, historyShopArr, carItem, shopItem);
        clearBtnHandler();

        addCarCollect();
    }
    else
    {
        $("#collect-record").html('<p>您的浏览器不支持收藏</p>');
        $("#browsing-record").html('<p>您的浏览器不支持查看历史记录</p>');
    }

    initComponent(carItem, shopItem);

    initSuggestDialog();

    initReportDialog();

    initMessageDialog();

    //车源tab栏
    $('#recommend-cars').tabs();

    var $body = $('body');
    if(mapSetting){
        mapFunc.initialize({x:mapSetting.mapX,y:mapSetting.mapY,tit:mapSetting.title});
        mapFunc.busStartPos();
        if($body[0].style.overflow == 'hidden'){
            $body[0].style.overflow = 'auto';
        }
    }
    var comm = evaJson;
    var good = comm.zdyd;
    var bad = comm.zdqd;
    var msg = "";
    if(good.length > 0) {
    	msg += "<p>【优点】</p><p>" + good + "</p>";
    } else {
    	msg += "<p>【优点】</p><p>暂无</p>";
    }
    if(bad.length > 0) {
    	msg += "<p>【缺点】</p><p>" + bad + "</p>";
    } else {
    	msg += "<p>【缺点】</p><p>暂无</p>";
    }
    $(".car-comment-con").html(msg);
});
