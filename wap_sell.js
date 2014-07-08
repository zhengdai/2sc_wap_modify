/**
 * Created by Administrator on 2014/5/12.
 */
var CarMasterSelect = {
    masterId: 0,
    masterName: "",
    key: false,
    outclick: null,
    data: {}, //保存请求过的主品牌数据
    //绑定主品牌点击事件
    BindMasterTap: function () {
        var mbLogo = document.getElementById("m-car-logo");
        var liList = mbLogo.getElementsByTagName("li");
        var self = this;
        for (var i = 0; i < liList.length; i++) {
            if (liList[i].id && liList[i].id.indexOf("mb_") != -1) {
                $(liList[i]).on('tap', function()
                {
                    self.MasterTapEvent(this);
                });
            }
        }
    },
    //滚动动画效果
    scrollAnimate: function (currentY, scrollY) {
        var begin = +new Date();
        var from = scrollY;
        var to = currentY;
        var duration = currentY - scrollY;
        var easing = function (time, duration) {
            return -(time /= duration) * (time - 2);
        };
        var timer = setInterval(function () {
            var time = new Date() - begin;
            var pos, now;
            if (time > duration) {
                clearInterval(timer);
                now = to;
            }
            else {
                pos = easing(time, duration);
                now = pos * (to - from) + from;
            }
            if (typeof document.compatMode != 'undefined' && document.compatMode === 'CSS1Compat') {
                document.body.scrollTop = now;
            } else {
                document.documentElement.scrollTop = now;
            }
        }, 20);
    },
    //获取当前元素距顶高度
    getNodeTop: function (curNode) {
        var top = 0;
        if (!curNode)
            return top;
        while (curNode) {
            top += curNode.offsetTop;
            curNode = curNode.offsetParent;
        }
        return top;
    },
    //设置滚动高度
    setPosition: function (currNode) {
        var top = document.body.scrollTop || document.documentElement.scrollTop;
        var height = document.body.scrollHeight || document.documentElement.scrollHeight;
        var currNodeTop = parseInt(this.getNodeTop(currNode)) - 10; //10 是li paddingTop值
        if (top == currNodeTop) return;
        this.scrollAnimate(currNodeTop, top);
        //		if (document.body.scrollTop) {
        //			document.body.scrollTop = currNodeTop;
        //		} else {
        //			document.documentElement.scrollTop = currNodeTop;
        //		}
    },
    //主品牌点击事件
    MasterTapEvent: function (node) {
        var currNode = node;
        var self = CarMasterSelect;
        var mbId = currNode.id.replace("mb_", "");
        var popupItem = document.getElementById("popupitem" + mbId);
        //二次点击打开关闭
        if (popupItem) {
            var b = currNode.getElementsByTagName("b");
            if (!self.key) {
                popupItem.style.display = "block";
                if (b.length > 0) {
                    b[0].style.display = "block";
                }
                self.key = true;
                return;
            } else {
                popupItem.style.display = "none";
                if (b.length > 0) {
                    b[0].style.display = "none";
                }
                self.key = false;
                return;
            }
        }
        self.key = true;
        self.ChangeMaster(currNode, false);
        if (self.outclick != null) {
            self.outclick();
            return;
        }
        //如果此主品牌有数据直接加载
        if (self.data[self.masterId]) {
            self.setCallBack(self.data[self.masterId]);
            return;
        }
    },
    //创建弹出层节点元素
    CreateElementNode: function (loadInfo) {
        //创建元素
        var popupItem = document.createElement("li");
        popupItem.className = "m-popup-item";
        popupItem.id = "popupitem" + this.masterId;

        var popupBox = document.createElement("div");
        popupBox.className = "m-popup-box";
        popupBox.innerHTML = loadInfo;
        popupBox.id = "popupbox" + this.masterId;
        popupItem.appendChild(popupBox);
        return popupItem;
    },
    //改变主品牌弹出层位置
    ChangeMaster: function (currNode, isorientationchange) {
        var loadInfo = "正在加载...";
        var tempCurrNode = currNode;
        if (isorientationchange) {
            if (this.masterId <= 0) return;
            var tempPopupBoxObj = document.getElementById("popupbox" + this.masterId);
            loadInfo = tempPopupBoxObj.innerHTML;
        }
        //删除之前弹出节点
        if (this.masterId > 0) {
            var popupItem = document.getElementById("popupitem" + this.masterId);
            if (popupItem) {
                popupItem.parentNode.removeChild(popupItem);
                var masterLi = document.getElementById("mb_" + this.masterId);
                masterLi.removeChild(masterLi.getElementsByTagName("b")[0]);
            }
        }
        this.setPosition(tempCurrNode); //定位
        this.masterId = tempCurrNode.id.replace("mb_", "");
        this.masterName = tempCurrNode.childNodes[1].innerHTML;
        var popupItem = this.CreateElementNode(loadInfo);

        var b = document.createElement("b");
        tempCurrNode.appendChild(b);
        //转屏显示判断
        if (this.key) {
            popupItem.style.display = "block";
            tempCurrNode.getElementsByTagName("b")[0].style.display = "block";
        }
        else {
            popupItem.style.display = "none";
            tempCurrNode.getElementsByTagName("b")[0].style.display = "none";
        }
        var leftNode = this.getMasterLeft(currNode);
        while (currNode) {
            var tempNode = currNode.nextSibling;
            if (!tempNode) {
                currNode.parentNode.appendChild(popupItem);
                break;
            }
            currNode = tempNode;
            var currLeftNode = this.getMasterLeft(currNode);
            //alert(currLeftNode + "|" + currNode.id);
            if (currLeftNode <= leftNode) {
                var appandNode = currNode.previousSibling;
                appandNode.parentNode.insertBefore(popupItem, appandNode.nextSibling);
                break;
            }
        }
    },
    //获取主品牌居左距离
    getMasterLeft: function (curNode) {
        var left = 0;
        if (!curNode)
            return left;
        while (curNode && curNode.tagName != "UL") {
            left += curNode.offsetLeft;
            curNode = curNode.offsetParent;
        }
        return left;
    },
    //设置回调数据
    setCallBack: function (strHtml) {
        var popupBoxObj = document.getElementById("popupbox" + this.masterId);
        if (popupBoxObj) {
            popupBoxObj.innerHTML = strHtml;
            $(popupBoxObj).find('dd').on('tap', function()
            {
                var modelid = $(this).data('model');
                $('#selBrandValue').val($(this).data('brand'));
                $('#selModelValue').val(modelid);
                $('#selectBrand').text($(this).data('name'));
                $("#main-page").show();
                $("#brand-page").hide();
                window.scrollTo(0,0);
                $.getJSON('http://m.2sc.sohu.com/util/getTrimmModelListJson.jsp',
                    {
                        'modelid':modelid
                    },
                    function(json)
                    {
                        var $container = $('#year-page').find('.static-part').empty();
                        var data=json.l;
                        data=data.sort(function(a,b){
                            return b.y-a.y;
                        });
                        var len = data.length;
                        for(var i = 0; i < len; ++i)
                        {
                            var year = data[i];
                            var yearHtml = '<div class="yearPart">';
                            yearHtml += '<h4>' + year.y + '</h4>';
                            yearHtml += '<ul class="yearList">';
                            var trims = year.t;
                            var trimLen = trims.length;
                            for(var j = 0; j < trimLen; ++j)
                            {
                                yearHtml += '<li data-year="' + year.y +
                                    '" data-trim="' + trims[j].i + '" data-name="' + year.y + '款 ' + trims[j].n + '">' + trims[j].n + '</li>';
                            }
                            yearHtml += '</ul></div>';
                            $container.append(yearHtml);
                        }

                        $container.find('li').on('tap', function()
                        {
                            $container.find('li').removeClass('on');
                            $(this).addClass('on');
                            $('#yearValue').val($(this).data('year'));
                            $('#infoValue').val($(this).data('trim'));
                            $('#selectYear').text($(this).data('name'));
                            $("#main-page").show();
                            $("#year-page").hide();
                            window.scrollTo(0,0);
                        });

                        $('#selectYear').on('tap', function()
                        {
                            $("#main-page").hide();
                            $("#year-page").show();
                            window.scrollTo(0,0);
                        });
                    }
                );
            });
        }
    }
};

function SetJsonToData(bsid, data) {
    var popupBox = "";
    if (bsid > 0 && data) {
        popupBox += "<div class=\"m-popup m-cars\">";
        for (var i = 0; i < data.length; i++) {
            var brand = data[i];
            popupBox += "<dl>";
            var brandName = brand.n;
            popupBox += '<dt>' + brandName + '</dt>';
            for (var j = 0; j < brand.b.length; j++) {
                var serial = brand.b[j];
                popupBox += '<dd data-brand="'+ bsid + '" data-model="' + serial.i + '" data-name="' + brandName + ' ' + serial.n + '">' + serial.n + '</dd>';
            }
            popupBox += "</dl>";
        }
        popupBox += "<div class=\"clear\"></div>";
        popupBox += "</div>";
        CarMasterSelect.data[bsid] = popupBox;
    }
    return popupBox;
}

//屏幕旋转事件
function orientationChange() {
    var master = document.getElementById("mb_" + CarMasterSelect.masterId);
    switch (window.orientation) {
        case 0:
        case 180:
        case -90:
        case 90:
            if (CarMasterSelect.masterId > 0) {
                CarMasterSelect.ChangeMaster(master, true);
            }
            break;
    }
}
//window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize", orientationChange, false);
window.onorientationchange = orientationChange;

var sWidth = getWinWidth();
function resizePosition() {
    var resizeWidth = getWinWidth();
    if (sWidth != resizeWidth) {
        sWidth = resizeWidth;
        var master = document.getElementById("mb_" + CarMasterSelect.masterId);
        if (CarMasterSelect.masterId > 0) {
            CarMasterSelect.ChangeMaster(master, true);
        }
    }
}
addEvent(window, "resize", resizePosition, false);

function addEvent(elm, type, fn, useCapture) {
    if (!elm) return;
    if (elm.addEventListener) {
        elm.addEventListener(type, fn, useCapture);
        return true;
    } else if (elm.attachEvent) {
        var r = elm.attachEvent('on' + type, fn);
        return r;
    } else {
        elm['on' + type] = fn;
    }
}
function getWinWidth() {
    var winW = 0;
    if (window.innerHeight) {
        winW = Math.min(window.innerWidth, document.documentElement.clientWidth);
    } else if (document.documentElement && document.documentElement.clientWidth) {
        winW = document.documentElement.clientWidth;
    } else if (document.body) {
        winW = document.body.clientWidth;
    }
    return winW;
}

$(function()
{
    CarMasterSelect.BindMasterTap();
    try {
        if (typeof (brandMods) != "undefined") {
            var len = brandMods.length;
            for (var i = 0; i <= len; i++) {
                SetJsonToData(brandMods[i].i, brandMods[i].s);
            }
        }
    }
    catch (err) { }
    var $collectItems = $("#collect-record-list").find('li');
    var carItem = $collectItems[0], shopItem = $collectItems[1];

    //填充历史与收藏数据
    if(window.localStorage)
    {
        initCollect(collectObj, carItem, shopItem);
        initHistory(historyCarArr, historyShopArr, carItem, shopItem);
        clearBtnHandler();
    }
    else
    {
        $("#collect-record").html('<p>您的浏览器不支持收藏</p>');
        $("#browsing-record").html('<p>您的浏览器不支持查看历史记录</p>');
    }

    initComponent(carItem, shopItem);

    initSuggestDialog();

    new SA.app.areaSelect({
        p:'#carProvince',
        c:'#carCity',
        onChange:function(type,data){
            if( type=='province' ){
                $('#cpvalue').val(data);
            }else{
                $('#ccvalue').val(data);
            }
        }
    });

    new SA.app.dateSelect($('#firstTimeYear'),$('#firstTimeMonth'),{ minYear:"2006",maxYear:"2014",currentYear:"2014",currentMonth:"3" },function(id,data){
        $('#firstTime'+id+'Value').val( data.val() );
        if( id=='Year' ){ $('#firstTimeMonthValue').val(''); }
    });

    $('#selectBrand').on('tap', function()
    {
        $("#main-page").hide();
        $("#brand-page").show();
        window.scrollTo(0,0);
    });

    $(".goBack").on("tap", function()
    {
        $("#main-page").show();
        $("#brand-page").hide();
		$("#year-page").hide();
        window.scrollTo(0,0);
    });

    $('#submit').on('tap', function(){
    	var r = /^[0-9]*[1-9][0-9]*$/;
		var rp = /^\d*(\.\d{1,2})?$/;
		if ($("#cpvalue").val() == "" || $("#cpvalue").val() == "-1") {
			
			$('#dialog1').dialog({
                autoOpen: true,
                closeBtn: false,
                content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>请选择地区</p><p>&nbsp;</p>",
                buttons: {
                    '确定': function(){
                        this.close();
                        this.destroy();
                        $("#carProvince").focus();
                    }
                }
            });
			
			return false;
		}
		
		if ($("#cpvalue").val() != "110000" 
				&& $("#cpvalue").val() != "120000" 
				&& $("#cpvalue").val() != "310000" 
				&& $("#cpvalue").val() != "500000") {
			if ($("#cpvalue").val() != "" && $("#cpvalue").val() != "-1" && ($("#ccvalue").val() == "" || $("#ccvalue").val() == "-1")) {
    			$('#dialog1').dialog({
                    autoOpen: true,
                    closeBtn: false,
                    content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>请选择城市</p><p>&nbsp;</p>",
                    buttons: {
                        '确定': function(){
                            this.close();
                            this.destroy();
                            $("#carCity").focus();
                        }
                    }
                });
    			return false;
    		}
		} else {
			$("#ccvalue").val("-1");
		}
		
		if ($("#selBrandValue").val() == "") {
			$('#dialog1').dialog({
                autoOpen: true,
                closeBtn: false,
                content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>请选择车型品牌</p><p>&nbsp;</p>",
                buttons: {
                    '确定': function(){
                        this.close();
                        this.destroy();
                        $("#selectBrand").trigger("tap");
                    }
                }
            });
			return false;
		} else {
			if ($("#infoValue").val() == "") {
    			$('#dialog1').dialog({
                    autoOpen: true,
                    closeBtn: false,
                    content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>请选择车款</p><p>&nbsp;</p>",
                    buttons: {
                        '确定': function(){
                            this.close();
                            this.destroy();
                            $("#selectYear").trigger("tap");
                        }
                    }
                });
    			return;
    		}
		}
		
		if ($("#mileage").val() == "") {
			$('#dialog1').dialog({
                autoOpen: true,
                closeBtn: false,
                content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>请输入表显里程</p><p>&nbsp;</p>",
                buttons: {
                    '确定': function(){
                        this.close();
                        this.destroy();
                        $("#mileage").focus();
                    }
                }
            });
			return false;
		} else if (!r.test($("#mileage").val())) {
			$('#dialog1').dialog({
                autoOpen: true,
                closeBtn: false,
                content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>表显里程不正确</p><p>&nbsp;</p>",
                buttons: {
                    '确定': function(){
                        this.close();
                        this.destroy();
                        $("#mileage").focus();
                    }
                }
            });
			return false;
		}
		
		if ($("#price").val() == "") {
			$('#dialog1').dialog({
                autoOpen: true,
                closeBtn: false,
                content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>请输入价格</p><p>&nbsp;</p>",
                buttons: {
                    '确定': function(){
                        this.close();
                        this.destroy();
                        $("#price").focus();
                    }
                }
            });
			return false;
		} else if (!rp.test($("#price").val())) {
			$('#dialog1').dialog({
                autoOpen: true,
                closeBtn: false,
                content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>价格不正确<br/>6位整数，2位小数。</p><p>&nbsp;</p>",
                buttons: {
                    '确定': function(){
                        this.close();
                        this.destroy();
                        $("#price").focus();
                    }
                }
            });
			return false;
		}
		
		if ($("#firstTimeYearValue").val() == "" || $("#firstTimeYearValue").val() == "-1") {
			$('#dialog1').dialog({
                autoOpen: true,
                closeBtn: false,
                content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>请选择上牌日期年份</p><p>&nbsp;</p>",
                buttons: {
                    '确定': function(){
                        this.close();
                        this.destroy();
                        $("#firstTimeYear").focus();
                    }
                }
            });
			return false;
		}
		if ($("#firstTimeMonthValue").val() == "" || $("#firstTimeMonthValue").val() == "-1") {
			$('#dialog1').dialog({
                autoOpen: true,
                closeBtn: false,
                content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>请选择上牌日期月份</p><p>&nbsp;</p>",
                buttons: {
                    '确定': function(){
                        this.close();
                        this.destroy();
                        $("#firstTimeMonth").focus();
                    }
                }
            });
			return false;
		}
		
		if ($("#customerName").val() == "") {
			$('#dialog1').dialog({
                autoOpen: true,
                closeBtn: false,
                content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>请输入您的姓名</p><p>&nbsp;</p>",
                buttons: {
                    '确定': function(){
                        this.close();
                        this.destroy();
                        $("#customerName").focus();
                    }
                }
            });
			return false;
		}
		
		if ($("#phone").val() == "") {
			$('#dialog1').dialog({
                autoOpen: true,
                closeBtn: false,
                content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>请输入手机号码</p><p>&nbsp;</p>",
                buttons: {
                    '确定': function(){
                        this.close();
                        this.destroy();
                        $("#phone").focus();
                    }
                }
            });
			return false;
		} else if (!isMobil($("#phone").val())) {
			$('#dialog1').dialog({
                autoOpen: true,
                closeBtn: false,
                content: "<p>&nbsp;</p><p style='font-size: 18pt;text-align:center;'>请输入正确的手机号码</p><p>&nbsp;</p>",
                buttons: {
                    '确定': function(){
                        this.close();
                        this.destroy();
                        $("#phone").focus();
                    }
                }
            });
			return false;
		}
		
		$("form[name='sform']").submit();
    });
});