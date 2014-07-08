/**
 * Created by zd on 2014/5/11 0011.
 */
/*生成品牌选择表
function createBrandList()
{
    var $container = $('#m-car-logo').children('ul').empty();
    var brand_len = brandMods.length;
    var curCh = '';
    var $curChCon;
    var $curChUl;
    for(var i = 0; i < brand_len; ++i)
    {
        var brand = brandMods[i];
        if(curCh !== brand.n[0])
        {
            curCh = brand.n[0];
            if($curChCon)
            {
                $container.append($curChCon);
            }
            $curChCon = $('<li id="char_nav_'+ curCh + '" class="m-root m-popup-arrow"><strong>'+ curCh + '</strong><ul class="m-root-item clearfix"></ul></li>');
            $curChUl = $curChCon.children('ul');
        }
        $curChUl.append('<li id="mb_'+ brand.i + '"><a href="javascript:;" class="m-brand m_'+ brand.i + '_b"></a><a href="javascript:;" class="m-car-name">' + brand.n.substring(2) + '</a></li>');
    }
    $container.append($curChCon);
}*/
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
        }
    }
};

function SetJsonToData(bsid, data) {
    var popupBox = "";


    if (bsid > 0 && data) {
        popupBox += "<div class=\"m-popup m-cars\">";
        popupBox += '<dd class="select-all"><a href="' + _baseLink.replace('{p}',"auto-" + data.e) + '">不限</a></dd>';
        for (var i = 0; i < data.s.length; i++) {
            var brand = data.s[i];
            popupBox += "<dl>";
            var brandName = brand.n;
            popupBox += '<dt>' + brandName + '</dt>';
            for (var j = 0; j < brand.b.length; j++) {
                var serial = brand.b[j];
                popupBox += '<dd><a href="' + _baseLink.replace('{p}',"auto1-" + serial.e) + '">' + serial.n + '</a></dd>';
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

function scrollShow()
{
    var offset = $('#shop-cars').offset();
    if($(window).scrollTop() <= 82)
    {
        $('#page-head').show();
        $('#toolbar').hide();
    }
    else if((offset.top > $(window).scrollTop() && offset.top < $(window).scrollTop() + window.screen.availHeight)
        || (offset.top + offset.height > $(window).scrollTop() && offset.top + offset.height < $(window).scrollTop() + window.screen.availHeight)
        || (offset.top < $(window).scrollTop() && offset.top + offset.height > $(window).scrollTop() + window.screen.availHeight))
    {
        $('#page-head').hide();
        $('#toolbar').show();
    }
    else
    {
        $('#page-head').show();
        $('#toolbar').hide();
    }
}


$(function() {
    CarMasterSelect.BindMasterTap();
    try {
        if (typeof (brandMods) != "undefined") {
            var len = brandMods.length;
            for (var i = 0; i <= len; i++) {
                SetJsonToData(brandMods[i].i, brandMods[i]);
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

    initMessageDialog();

    initSuggestDialog();
    
    $(".tab-car").tabs();
    $("#shop-cars").tabs();



    $(window).on('scroll', scrollShow);

    //筛选品牌
    $('#selectBrand').on('tap', function()
    {
        $('#toolbar').children('.option').removeClass('active');
        $("#price-page").hide();
        $("#year-page").hide();
        $("#more-page").hide();
        $("#level-page").hide();
        $("#mile-page").hide();
        $("#displacement-page").hide();
        $("#gearbox-page").hide();
        $("#color-page").hide();
        $("#main-page").hide();
        $("#brand-page").show();
        window.scrollTo(0,0);
    });
    $(".goBack").on("tap", function()
    {
        $("#main-page").show();
        $("#brand-page").hide();
        window.scrollTo(0,0);
    });

    //筛选
    $("#selectPrice").on('tap', function()
    {
        //其他正在显示且需要显示
        if(!$(this).hasClass('active'))
        {
            $('#toolbar').children('.option').removeClass('active');
            $(this).toggleClass('active');
            $("#year-page").hide();
            $("#more-page").hide();
            $("#level-page").hide();
            $("#mile-page").hide();
            $("#displacement-page").hide();
            $("#gearbox-page").hide();
            $("#color-page").hide();

            $(window).off('scroll');
            $("#main-page").hide();
            $("#price-page").show();
        }
        //需要隐藏
        else
        {
            $(this).toggleClass('active');
            $(window).on('scroll', scrollShow);
            $("#main-page").show();
            $("#price-page").hide();
        }
        isShow = !isShow;
    });

    $("#selectYear").on('tap', function()
    {
        if(!$(this).hasClass('active'))
        {
            $('#toolbar').children('.option').removeClass('active');
            $(this).toggleClass('active');
            $("#price-page").hide();
            $("#more-page").hide();
            $("#level-page").hide();
            $("#mile-page").hide();
            $("#displacement-page").hide();
            $("#gearbox-page").hide();
            $("#color-page").hide();

            $(window).off('scroll');
            $("#main-page").hide();
            $("#year-page").show();
        }
        else
        {
            $(this).toggleClass('active');
            $(window).on('scroll', scrollShow);
            $("#main-page").show();
            $("#year-page").hide();
        }
    });

    $("#selectMore").on('tap', function()
    {
        if(!$(this).hasClass('active'))
        {
            $('#toolbar').children('.option').removeClass('active');
            $(this).toggleClass('active');
            $("#year-page").hide();
            $("#price-page").hide();
            $("#level-page").hide();
            $("#mile-page").hide();
            $("#displacement-page").hide();
            $("#gearbox-page").hide();
            $("#color-page").hide();

            $(window).off('scroll');
            $("#main-page").hide();
            $("#more-page").show();
        }
        else
        {
            $(this).toggleClass('active');
            $(window).on('scroll', scrollShow);
            $("#main-page").show();
            $("#more-page").hide();
            $("#level-page").hide();
            $("#mile-page").hide();
            $("#displacement-page").hide();
            $("#gearbox-page").hide();
            $("#color-page").hide();
        }
    });

    $('#more-page').find('li').on("tap", function()
    {
        var target = '#' + $(this).attr('id').split('-')[0] + '-page';
        $('#more-page').hide();
        $(target).show();
    });

    $('.page-head').find('span').on('tap', function()
    {
        $(this).parent().parent().hide();
        $("#more-page").show();
    });

});

//首页推荐商户展示
if(typeof(advertRecommentDealer) != 'undefined' && advertRecommentDealer  != '' && typeof(advertRecommentDealer.data) != 'undefined'){
	var advert = advertRecommentDealer.data;
	var tuijianDealerHtml = "";
	var tArray = [];
	var startIndex = Math.floor(Math.random()*advert.length);
	var length = advert.length;
	for(var i=0,j=5;i<j;i++){
		if(startIndex == length){
			startIndex = 0;
		}
		tArray.push(startIndex);
		startIndex ++;
	}
	tArray.sort(function(a,b){return a>b?1:-1});
	for(var i=0,j=tArray.length;i<j;i++){
		var index = tArray[i];
		var temp = advert[index];
		var url = temp.dealerUrl;
		var dealerId = url.split("/")[2];
		tuijianDealerHtml += "<li class='shop-item' data-id='" + dealerId + "'>";
		tuijianDealerHtml += "<a href='"+temp.dealerUrl+"' class='shop-tit'>"+temp.shortName+"</a>";
		tuijianDealerHtml += "<div class='shop-info'>";
		tuijianDealerHtml += "<div class='info-left'>";
		tuijianDealerHtml += "<p class='car-num'>共有 "+temp.onSaleNumDesc+"</p>";
		tuijianDealerHtml += "<p class='shop-phone'>电话："+temp.tel+"</p>";
		tuijianDealerHtml += "</div>";
		tuijianDealerHtml += " <div class='info-right'>";
		tuijianDealerHtml += "<a href='javascript:void(0);' class='message'></a>";
		tuijianDealerHtml += "<a href='tel:"+temp.tel+"' class='call'></a>";
		tuijianDealerHtml += "</div></div></li>";
	}
	document.getElementById("tuijianDealer").innerHTML = tuijianDealerHtml;
	document.getElementById("tuijianDealer").style.display = "block";
}

//异步加载车源列表页
function searchCarList(typeIndex,sortIndex) {
	currentPage = 1;
	$("#currentPageVal").val(currentPage);
	var province = _cprovinceEN;
	var city = _ccityEN;
	var price = _price;
	var brand = brandEN;
	var model = modelEN;
	var color = _color;
	var usedYear = _usedYear;
	var mileage = _mileage;
	var carType = 0;
	var bargain = 0;
	if(typeIndex == 2){ //商家
		carType = 2;
		bargain = 0;
	}else if(typeIndex == 3){ //个人
		carType = 1;
		bargain = 0;
	}else if(typeIndex == 4){//认证车
		carType = 3;
		bargain = 0;
	}else if(typeIndex == 5){//一口价
		bargain = 1;
		carType = 0;
	}
	
	var paixu = 0;
	if(sortIndex == 1){
		paixu = 0;
	}else if(sortIndex == 2){
		paixu = 2;
	}else if(sortIndex == 3){
		paixu = 4;
	}
	//var url = "/usedcarweb/wap/searchCarList.action?price="+price+"&brand="+brand+"&model="+model+"&currentPage="+currentPage+"&carType="+carType
	var url = "/wap/searchCarList/?price="+price+"&brand="+brand+"&model="+model+"&currentPage="+currentPage+"&carType="+carType
	+"&bargain="+bargain+"&paixu="+paixu+"&color="+color+"&mileage="+mileage+"&usedYear="+usedYear+"&province="+province+"&city="+city+"&type="+type;
	var s = 'carList'+typeIndex+'-'+sortIndex;
	$.ajax({url:url, type:"get", success:function (json) {
		var carListHtml = "";
		carListHtml += '<ul class=\"carList\">';
		var objData = eval('('+json+')');
		$("#totalPageVal").val(objData.totalPages);
		for (var i = 0; i < objData.Item.length; i++) {
			var item = objData.Item[i];
			var yishou = '';
			if(item.flag1 != '1'){
				yishou = '[已售出]';
			}
			carListHtml += '<li class=\"car-item\">';
			carListHtml += '<a href=\"'+item.carLink+'\" class=\"car-tit\">'+item.title+yishou+'</a>';
			if(item.flag3 == '1'){
				carListHtml += '<span class=\"authentication\">认</span>';
			}
			carListHtml += '<div class=\"description\">';
			carListHtml += '<div class=\"left-des\">';
			carListHtml += '<p class=\"promise\">'+item.adTitle+'</p>';
			var buyDate = item.dateYear;
			if(buyDate != '未上牌'){
				buyDate += "购买"; 
			}
			carListHtml += '<p class=\"car-info\">'+buyDate+'&nbsp;&nbsp;'+item.mileage+'万公里</p>';
			carListHtml += '</div>';
			carListHtml += '<div class=\"right-des\">';
			carListHtml += '<p class=\"car-price\">'+item.price+'万</p>';
			var carType = "";
			if(item.carSource == 2 || item.carSource == 3 || item.carSource == 5){
				carType = "商家";
			}else{
				carType = "个人";
			}
			carListHtml += '<p class=\"release-date\">'+carType+"&nbsp;"+item.createDate+'</p>';
			carListHtml += '</div></div></li>';
		}
		carListHtml += '</ul>';
		if(objData.totalNum != 0){
			$("#"+s).html(carListHtml);
			$("#"+s).append("<a href='javascript:searchCarListOfPage("+typeIndex+","+sortIndex+");'><div id='see-more-button_"+typeIndex+"_"+sortIndex + "' class='see-more'>查看更多</div></a>");
		}else{
			$("#"+s).html("<div style=\"text-align: center; margin-top:25px;\">抱歉根据您的搜索条件没有搜索到车源，您可以放宽您的条件重新搜索。</div>");
		}
		$("#"+s).parent().parent().tabs('refresh');
        
	},error: function (msg) {
    	
	}});
	return;
}

//拼接分页数据
function searchCarListOfPage(typeIndex,sortIndex){
	currentPage = $("#currentPageVal").val();
	currentPage ++;
	var totalPages = $("#totalPageVal").val();
	var s = 'carList'+typeIndex+'-'+sortIndex;
	if(currentPage > totalPages){
		var obj = "#"+s+" .carList";
		$(obj).append("<div style=\"text-align: center; margin-top:25px;\">抱歉根据您的搜索条件没有搜索到车源，您可以放宽您的条件重新搜索。</div>");
		$("#see-more-button_"+typeIndex+"_"+sortIndex).hide();
		return;
	}
	
	$("#currentPageVal").val(currentPage);
	var province = _cprovinceEN;
	var city = _ccityEN;
	var price = _price;
	var brand = brandEN;
	var model = modelEN;
	var color = _color;
	var usedYear = _usedYear;
	var mileage = _mileage;
	var carType = 0;
	var bargain = 0;
	if(typeIndex == 2){ //商家
		carType = 2;
		bargain = 0;
	}else if(typeIndex == 3){ //个人
		carType = 1;
		bargain = 0;
	}else if(typeIndex == 4){//认证车
		carType = 3;
		bargain = 0;
	}else if(typeIndex == 5){//一口价
		bargain = 1;
		carType = 0;
	}
	var paixu = 0;
	if(sortIndex == 1){
		paixu = 0;
	}else if(sortIndex == 2){
		paixu = 2;
	}else if(sortIndex == 3){
		paixu = 4;
	}
	//var url = "/usedcarweb/wap/searchCarList.action?price="+price+"&brand="+brand+"&model="+model+"&currentPage="+currentPage+"&carType="+carType
	var url = "/wap/searchCarList/?price="+price+"&brand="+brand+"&model="+model+"&currentPage="+currentPage+"&carType="+carType
	+"&bargain="+bargain+"&paixu="+paixu+"&color="+color+"&mileage="+mileage+"&usedYear="+usedYear+"&province="+province+"&city="+city+"&type="+type;;
	$.ajax({url:url, type:"get", success:function (json) {
		var carListHtml = "";
		var objData = eval('('+json+')');
		for (var i = 0; i < objData.Item.length; i++) {
			var item = objData.Item[i];
			var yishou = '';
			if(item.flag1 != '1'){
				yishou = '[已售出]';
			}
			carListHtml += '<li class=\"car-item\">';
			carListHtml += '<a href=\"'+item.carLink+'\" class=\"car-tit\">'+item.title+yishou+'</a>';
			if(item.flag3 == '1'){
				carListHtml += '<span class=\"authentication\">认</span>';
			}
			carListHtml += '<div class=\"description\">';
			carListHtml += '<div class=\"left-des\">';
			carListHtml += '<p class=\"promise\">'+item.adTitle+'</p>';
			carListHtml += '<p class=\"car-info\">'+item.dateYear+'购买&nbsp;&nbsp;'+item.mileage+'万公里</p>';
			carListHtml += '</div>';
			carListHtml += '<div class=\"right-des\">';
			carListHtml += '<p class=\"car-price\">'+item.price+'万</p>';
			var carType = "";
			if(item.carSource == 2 || item.carSource == 3 || item.carSource == 5){
				carType = "商家";
			}else{
				carType = "个人";
			}
			carListHtml += '<p class=\"release-date\">'+carType+"&nbsp;"+item.createDate+'</p>';
			carListHtml += '</div></div></li>';
		}
		var obj = "#"+s+" .carList";
		$(obj).append(carListHtml);
		$(obj).parent().parent().parent().tabs('refresh');
	},error: function (msg) {
    	
	}});
	return;
}

function doSubmitsss(dealerId){
	var isSuccess = false;
	var consulte = document.getElementById("message-content").value;
	var username = document.getElementById("message-name").value;
	var phone = document.getElementById("message-phone").value;
	if(!consulte.trim()){
		alert("请输入咨询内容");
		return false;
	}else{
		if(consulte.trim().length > 500){
			alert("您输入的咨询内容过长");
			return false;
		}
	}
	if(consulte == "亲，可以通过留言预约看车、咨询底价、联系卖家；请留下您的姓名和联系方式，商家收到您的信息将在第一时间联系您。"){
		alert("请输入留言内容");
		return false;
	}
	if(!username.trim()){
		alert("请输入您的姓名");
		return false;
	}else{
		if(username.trim().length > 50){
			alert("您输入的姓名过长");
			return false;
		}
	}
	if(!isMobel(phone)){
		alert("请输入正确的手机号码");
		return false;
	}
	
	var type = 0;
	var param = "message.consulte="+consulte+"&message.consulteName="+username+"&message.consultePhone="+phone+"&message.flag="+type+"&message.dealerId=" + dealerId;
	var url = "/sccar/leaveMessage/?"+param;
	url=encodeURI(url);
	url=encodeURI(url);
	$.ajax({url:url, type:"post", async:false, success:function (data) {
		var dataObj = eval("(" + data.result + ")");
		if(dataObj == 1){
			isSuccess = true;
			alert("您的留言已给提交给了商户。请您耐心等待回复。");
			document.getElementById("message-content").value = "";
			document.getElementById("message-name").value = "";
			document.getElementById("message-phone").value = "";
		}
	}});
	return isSuccess;
}

function isMobel(value){  
	if(/^13\d{9}$/g.test(value)||(/^15[0-9]\d{8}$/g.test(value))||  
	(/^18[0-9]\d{8}$/g.test(value))){    
	            return true;  
	}else{  
	            return false;  
	}  
}

/**
 * 提提意见
 * @returns {Boolean}
 */
function doSuggest(){
	var isSuccess = false;
	var content = document.getElementById("suggest-content").value;
	var username = document.getElementById("suggest-name").value;
	var leaveSign = document.getElementById("suggest-leaveSign").value;
	if(!content.trim()){
		alert("请输入咨询内容");
		return false;
	}else{
		if(content.trim().length > 500){
			alert("您输入的咨询内容过长");
			return false;
		}
	}
	if(!username.trim()){
		alert("请输入您的姓名");
		return false;
	}else{
		if(username.trim().length > 50){
			alert("您输入的姓名过长");
			return false;
		}
	}
	
	if(!isMobel(leaveSign) && !isEmail(leaveSign)){
		alert("请输入正确的手机号码或邮箱");
		return false;
	}
	
	var type = 0;
	var param = "content="+content+"&name="+username+"&leaveSign="+leaveSign;
	var url = "/sccar/suggest/?"+param;
	url=encodeURI(url);
	url=encodeURI(url);
	$.ajax({url:url, type:"post", async:false, success:function (data) {
		var dataObj = eval("(" + data.result + ")");
		if(dataObj.result == "success"){
			isSuccess = true;
			alert("您的意见已给提交。请您耐心等待回复。");
			document.getElementById("suggest-content").value = "";
			document.getElementById("suggest-name").value = "";
			document.getElementById("suggest-leaveSign").value = "";
		} else {
			alert(data.result.msg);
		}
		
	}});
	return isSuccess;
}