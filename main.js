/**
 * Created by Administrator on 2014/4/21.
 */

//首页推荐车源展示
if(typeof(advertRecommentCar) != 'undefined' && advertRecommentCar  != '' && typeof(advertRecommentCar.data) != 'undefined'){
	var advert = advertRecommentCar.data;
	var tuijianCarHtml = "";
	var startIndex = Math.floor(Math.random()*advert.length);
	var length = advert.length;
	var tArray = [];
	for(var i=0,j=5;i<j;i++){
		if(startIndex == length){
			startIndex = 0;
		}
		tArray.push(startIndex);
		startIndex ++;
	}
	tArray.sort(function(a,b){return a>b?1:-1});
	
	for(var i=0,j=5;i<j;i++){
		var index = tArray[i];
		var temp = advert[index];
		tuijianCarHtml += "<li class='car-item'>";
		tuijianCarHtml += "<a href='"+temp.url+"' class='car-tit'>"+temp.name+"</a>";
		if(typeof(temp.flag3) != 'undefined' && temp.flag3 == '1'){
			tuijianCarHtml += "<span class='authentication'>认</span>";
		}
		tuijianCarHtml += "<div class='description'>";
		tuijianCarHtml += "<div class='left-des'>";
		if(typeof(temp.title) != 'undefined'){
			tuijianCarHtml += "<p class='promise'>"+temp.title+"</p>";
		}
		var buyDate = temp.date;
		if(buyDate != '未上牌'){
			buyDate = buyDate + "购买";
		}
		tuijianCarHtml += "<p class='car-info'>"+buyDate+"&nbsp;&nbsp;"+temp.mileAge+"</p>";
		tuijianCarHtml += "</div>";
		tuijianCarHtml += "<div class='right-des'>";
		tuijianCarHtml += "<p class='car-price'>"+temp.price+"万</p>";
		tuijianCarHtml += "<p class='release-date'>商家&nbsp;&nbsp;5-20</p>";
		tuijianCarHtml += "</div></div></li>";
	}
	document.getElementById("tuijianCar").innerHTML = tuijianCarHtml;
	document.getElementById("tuijianCar").style.display = "block";
}

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

$(function()
{
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

    //轮播
    $('#news-slider').slider({loop:true});
    $('#focusSlider').slider();

});