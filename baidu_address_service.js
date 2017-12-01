var baiduMap={
  test:function(){
    console.log('引入正确')
  },
  //参数设置与获取-----------------------------------------------------------------------
  args:{ //地图初始设置UI区域的id值
    mapid:'' ,//地图id
    auto_omplete_id:'',//输入地址提示功能模块的input的id
  },
  inner:{ //地图实例生成后的各个功能模块所需属性
    map:null, //地图实例
    ac:null,  //autoComplete输入提示对象
    localSearch:null,//本地搜索poi对象
    POI:['房产','公司','购物','餐饮','教育培训','旅游景点','交通','休闲娱乐'],
    pageCapacity:4,
    addressList:[], //地址列表
    initialip:[0,0],//记住初始ip
    ip:'',//当前IP
    city:'深圳市',//当前城市
    address:'', //地址全程，打印观看
    refresh:false,//是否需要刷新，确定滚动部分是否要滚动到最顶端
    loading:true,
    nextpage:1,//下页页数
    maxpagenum:0,//最大分页
    ismaxpage:false,//是否到达最大分页
  },
  setArgs:function(args){  //初始化必要参数
    for(var i in args) {
      this.args[i] = args[i]
    }
  },
  getArgs:function(arg){
    if(!this.args[arg]) return console.log(arg+'参数未设置初始值')
    return this.args[arg]
  },
  getInner:function(arg){
    return this.inner[arg]
  },
  //辅助函数-----------------------------------------------------------------------

  updateIpAndMarket:function(ip,notclear){
    var that=this;
    that.inner.ip=ip  //更新IP
    if(notclear){
    }else{
      that.setMarketByIp() //更新标注
    }
    that.getCityByIp()  //更新城市
    that.setSearchLocationByIp() //更新搜索城市的范围
    that.setMapCenterByIp() //地图中心设置为当前ip
    that.search({
      nearby:true,
      center:ip
    })
  },

  //多次运行-----------------------

  setMarketByIp:function(ip){ //设置地图中心位置标注
    var that=this
    var ip=ip||that.inner.ip
    that.inner.map.clearOverlays()
    var myIcon = new BMap.Icon("../images/market.png", new BMap.Size(52,12));
    var mk = new BMap.Marker(ip,{icon:myIcon});
    that.inner.map.addOverlay(mk);
  },


  setSearchLocationByIp:function(){ //设置搜索地址所属的城市范围
    var that=this
    that.inner.localSearch.setLocation(that.inner.ip)
  },

  setMapCenterByIp:function(){ //设置地图中心
    var that=this
    that.inner.map.centerAndZoom(that.inner.ip,17)
  },
  //-----------------------


  // 策略集合-------------------------------
  addressStrategy:{
    getcomplete:function(adress){
      function p(arg){
        return arg||''
      }
      return adress.province +  adress.city +  adress.district +  p(adress.street) +  p(adress.business)
    }
  },
  search:function(obj){
    var that=this
    that.inner.loading=true
    if(obj.nearby){
      that.inner.localSearch.setPageCapacity(that.inner.pageCapacity)
      that.inner.localSearch.searchNearby(that.inner.POI,obj.center,300)
    }else{
      that.inner.localSearch.setPageCapacity(20)
      that.inner.localSearch.search(obj.keyword)
    }
  },

  //初始加载-----------------------------------------------------------------------
  initMap:function(callback){ //初始加载script
    var that=this
    initMap=function(){
      if(that.getArgs('mapid')){
        that.inner.map=new BMap.Map(that.getArgs('mapid'));
      }
      callback&&callback() //功能模块插入
    }
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://api.map.baidu.com/api?v=2.0&ak=7y4NWqEWQGO5g6moQB6DjZwwpvy0isWM&callback=initMap";
    document.body.appendChild(script);
    return this
  },
  //功能模块-----------------------------------------------------------------------
  addAutoComplete:function(callback){ //输入地址提示功能模块
    var that=this
    // that.inner.ac = new BMap.Autocomplete(
    //   {
    //     "input" : that.getArgs('auto_omplete_id'),
    //     "location" : that.inner.map,
    //     'onSearchComplete':function(result){
    //       that.inner.addressList=[]
    //       var nums=result.getNumPois()
    //       for(var i=0;i<nums;i++){
    //         if(result.getPoi(i)){
    //           that.inner.addressList.push(result.getPoi(i))
    //         }
    //       }
    //       callback&&callback()
    //       console.log(that.inner.addressList)
    //     }
    //   });
    // that.inner.ac.setInputValue('查找小区 / 大厦 / 学校等')

    //自定义重置控件------------------
    function ZoomControl(type){
      // 默认停靠位置和偏移量
      this.defaultAnchor =  type;
      this.defaultOffset = new BMap.Size(10, 10);
    }
    ZoomControl.prototype = new BMap.Control();
    ZoomControl.prototype.initialize = function(map){
      // 创建一个DOM元素
      var me=this;
      var div = document.createElement("div");
      // 添加文字说明
      //div.appendChild(document.createTextNode("DDDD"));
      // 设置样式
      div.style.cursor = "pointer";
      //div.style.backgroundColor = "white";
      // 绑定事件
      div.onclick = function(e){
        if(me.defaultAnchor==2){
          that.updateIpAndMarket(that.inner.initialip)
        }
      }
      // 添加DOM元素到地图中
      map.getContainer().appendChild(div);
      // 将DOM元素返回
      return div;
    }
    // 创建控件
    var myZoomCtrl = new ZoomControl(BMAP_ANCHOR_BOTTOM_LEFT);
    var myZoomCtrl2 = new ZoomControl(BMAP_ANCHOR_TOP_RIGHT);
    // 添加到地图当中
    that.inner.map.addControl(myZoomCtrl);
    that.inner.map.addControl(myZoomCtrl2);


    //搜索服务------------------------------
    
    that.inner.localSearch = new BMap.LocalSearch(that.inner.map,{
      onSearchComplete: function(results){
        console.log('关键字搜索的结果',results)
        that.inner.loading=false
        if(!results){
          console.log('已经是最大页啦'+that.inner.nextpage)
          that.inner.ismaxpage=true
          callback&callback()
          return;
        }
        //强制results成为数组，关键字搜索与多关键字统一
        if(!results.slice){
          results=[results]
        }

        //--------------------获取最大页数
        var maxpage=0;
        results.map(function(item){
          if(item.getNumPages()>maxpage) maxpage=item.getNumPages()
        })
        that.inner.maxpagenum=maxpage
        console.log('最大页码'+that.inner.maxpagenum)
        //-------------------------

        //--------------------判断结果是不是搜索结果增加还是清空重来
        var resettype=results.every(function(item){
          return item.getPageIndex()==0
        })
        if(resettype) that.inner.addressList=[]
        //--------------------判断下一页页码，及是否到达最大页
        if(resettype){
          that.inner.ismaxpage=false
          that.inner.refresh=true
          that.inner.nextpage=1
        }else{
          that.inner.refresh=false
          that.inner.nextpage+=1
        }
        if(that.inner.nextpage>maxpage){
          console.log('已经是最大页啦'+maxpage)
          that.inner.ismaxpage=true
        }else{
          console.log('下一页'+that.inner.nextpage)
        }
        //--------------------
        //-----------------------

        for(var i=0;i<results.length;i++){
          var result=results[i]
          if(result){
            console.log(result)
            console.log(result.getNumPages())
            for(var j=0;j<result.getCurrentNumPois();j++){
              if(result.getPoi(j)){
                that.inner.addressList.push(result.getPoi(j))
              }
            }
          }
        }
        console.log('处理后的数组长度----------------------'+that.inner.addressList.length)
        callback&&callback(that.inner.refresh)
      }
    })

    function getMapCenter(){
      var center=that.inner.map.getCenter()
      return center
    }

    that.inner.map.addEventListener('dragend',(function(){
      return function(){
        var center=getMapCenter()
        that.updateIpAndMarket(center,true)
        console.log('地图中心位置ip：'+center.lng+','+center.lat);
      }
    })())

    return this
  },

  getUserIp:function(callback){ //获取浏览器ip模块
    var that=this
    var geolocation = new BMap.Geolocation();
    geolocation.getCurrentPosition(function(r){
      if(this.getStatus() == BMAP_STATUS_SUCCESS){
        var center=r.point
        that.inner.initialip=center
        that.updateIpAndMarket(center)
        callback&&callback()
        console.log('您的位置ip：'+r.point.lng+','+r.point.lat);
      } else {
        return alert('定位failed'+this.getStatus());
      }
    },{enableHighAccuracy: true})
    return this
  },
  getCityByIp:function(callback){ //逆地址解析模块(通过ip获取城市)
    var that=this
    var geoc = new BMap.Geocoder();
    function howtoshow(searchresult){
      var district=searchresult.district
      var city=searchresult.city
      // console.log( that.inner.city)
      // console.log(city+district)
      if(that.inner.city==district||that.inner.city+'县'==district||that.inner.city+'市'==district){
        that.inner.city=district
      }else if(that.inner.city==city||that.inner.city+'县'==city||that.inner.city+'市'==city){
        that.inner.city=city
      }else{
        that.inner.city=city
      }
    }

    geoc.getLocation(that.inner.ip, function(rs){
      var addComp = rs.addressComponents;
      howtoshow(addComp)
      //that.inner.city=addComp.district||addComp.city
      that.inner.address=  that.addressStrategy.getcomplete(addComp)
      callback&&callback()
      console.log('当前城市： '+that.inner.city)
      console.log('地址全称： '+that.inner.address);
    });
    return this
  },

  getIpByCity:function(city,callback){ //逆地址解析模块(通过城市获取ip)
    var that=this
    var myGeo = new BMap.Geocoder();
    myGeo.getPoint(city, function(ip){
      if (ip) {
        that.inner.city=city;
        callback&&callback(ip)
        console.log(city+'的位置ip：'+ip.lng+','+ip.lat);
      }else{
        alert("您选择地址没有解析到结果!");
      }
    }, city);
  },
  getAddressByIP:function(ip,callback){
    //点击地址后获取具体的区，这个更加具体，确定有district
    var that=this
    var myGeo = new BMap.Geocoder();
    myGeo.getLocation(ip, function(result){
      callback&&callback(result)
    });
  },
  getAddressByUser:function(callback){
    var that=this
    var geolocation = new BMap.Geolocation();
    geolocation.getCurrentPosition(function(r){
      if(r.point){
        that.getAddressByIP(r.point,function(result){
          callback&&callback(result)
        })
      }else{
        callback&&callback({})
      }
    })
  }
}
