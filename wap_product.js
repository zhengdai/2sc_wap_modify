/**
 * Created by zd on 2014/5/11 0011.
 */
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


/* ��ʾ������ϵ��״̬�� */
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
    //�ղع���
    if(collectObj[location.href])
    {
        $('#collectBtn').addClass('active').text('ȡ���ղ�');
    }
    $('#collectBtn').on('tap', function()
    {
        if($(this).hasClass('active'))
        {
            $(this).removeClass('active').text('�ղش˳�');
            collectObj[location.href] = null;
            --collectObj.length;
            localStorage.setItem('collectObj', JSON.stringify(collectObj));
        }
        else
        {
            $(this).addClass('active').text('ȡ���ղ�');
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
    //�����ʷ���ղ�����
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
        $("#collect-record").html('<p>�����������֧���ղ�</p>');
        $("#browsing-record").html('<p>�����������֧�ֲ鿴��ʷ��¼</p>');
    }

    initComponent(carItem, shopItem);

    initSuggestDialog();

    initReportDialog();

    initMessageDialog();

    //��Դtab��
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
    	msg += "<p>���ŵ㡿</p><p>" + good + "</p>";
    } else {
    	msg += "<p>���ŵ㡿</p><p>����</p>";
    }
    if(bad.length > 0) {
    	msg += "<p>��ȱ�㡿</p><p>" + bad + "</p>";
    } else {
    	msg += "<p>��ȱ�㡿</p><p>����</p>";
    }
    $(".car-comment-con").html(msg);
});
